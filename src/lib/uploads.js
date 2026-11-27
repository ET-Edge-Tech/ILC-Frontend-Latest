import { api } from './api-client.js';

// File uploads, step by step: ask the server for a one-time upload link, send the file straight to S3 (with a
// progress callback), then tell the server it arrived so it can check the file. The server decides what is allowed.
// These limits only give a friendly message before anything is sent.
const MB = 1024 * 1024;
export const FILE_RULES = {
  image: { label: 'picture', max: 8 * MB, accept: 'image/jpeg,image/png,image/gif,image/webp' },
  document: { label: 'document', max: 25 * MB, accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv' },
  event_photo: { label: 'photo', max: 8 * MB, accept: 'image/jpeg,image/png,image/gif,image/webp' },
  chat: { label: 'file', max: 14 * MB, accept: 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv' },
  video: { label: 'video', max: 500 * MB, accept: 'video/mp4,video/webm' },
};

// Browsers do not always know the type of an Office file, so it is worked out from the ending when needed.
const BY_ENDING = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  mp4: 'video/mp4',
  webm: 'video/webm',
};
export function typeOf(file) {
  const ending = file.name.split('.').pop().toLowerCase();
  if (file.type && file.type !== 'application/octet-stream' && !(file.type === 'application/vnd.ms-excel' && ending === 'csv'))
    return file.type;
  return BY_ENDING[ending] ?? file.type;
}

export const sizeText = (bytes) =>
  bytes >= MB ? `${(bytes / MB).toFixed(bytes >= 10 * MB ? 0 : 1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// ---- pictures: shrunk in the browser first (no library) ---------------------------------------------------------

// Returns a smaller JPEG copy of a picture (longest side at most maxSide). Throws if it is not a picture.
// `aspect` (width divided by height, for example 3/4 for a tall poster) trims the picture from the centre to that shape.
export async function shrinkImage(file, maxSide = 1600, quality = 0.85, aspect = null) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('That file is not a picture we can read.');
  }
  let sw = bitmap.width;
  let sh = bitmap.height;
  if (aspect) {
    if (sw / sh > aspect) sw = Math.round(sh * aspect);
    else sh = Math.round(sw / aspect);
  }
  const sx = Math.round((bitmap.width - sw) / 2);
  const sy = Math.round((bitmap.height - sh) / 2);
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // a transparent picture gets a white background in a JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) throw new Error('That picture could not be prepared.');
  const base = file.name.replace(/\.[^.]+$/, '') || 'picture';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
}

// A small picture as text (a "data URL"), the way the profile photo is sent.
export function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('That picture could not be read.'));
    reader.readAsDataURL(file);
  });
}

// ---- the upload itself ------------------------------------------------------------------------------------------------

function putToS3(url, file, type, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('The upload failed. Please try again.')));
    xhr.onerror = () => reject(new Error('The upload could not reach the file store. Check your connection and try again.'));
    xhr.send(file);
  });
}

// Uploads one file. Resolves with the file id to send when saving the form. Throws an Error with a plain message.
export async function uploadFile(kind, file, onProgress) {
  const rule = FILE_RULES[kind];
  if (file.size > rule.max) throw new Error(`That ${rule.label} is too large. The limit is ${sizeText(rule.max)}.`);
  const type = typeOf(file);
  let ticket;
  try {
    ticket = (await api.post('/uploads/request', { kind, filename: file.name, content_type: type, size: file.size })).data;
  } catch (e) {
    throw new Error(e?.response?.data?.error || 'The upload could not start. Please try again.', { cause: e });
  }
  if (ticket.via === 'server') {
    // Pictures, documents and chat files go through the portal's own server.
    try {
      await api.put(ticket.content_path, file, {
        headers: { 'Content-Type': type },
        transformRequest: [(data) => data], // send the file as it is
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      });
    } catch (e) {
      throw new Error(e?.response?.data?.error || 'The upload failed. Please try again.', { cause: e });
    }
  } else {
    // Large videos go straight to S3 (this needs the CORS setting on the bucket).
    await putToS3(ticket.upload_url, file, ticket.headers['Content-Type'], onProgress);
  }
  try {
    await api.post(`/uploads/${ticket.id}/confirm`);
  } catch (e) {
    throw new Error(e?.response?.data?.error || 'The file could not be checked. Please try again.', { cause: e });
  }
  return ticket.id;
}

// A short-lived link to a private file. `download` asks the browser to save it instead of showing it.
export async function privateFileUrl(id, { download = false } = {}) {
  const { data } = await api.get(`/uploads/${id}/url`, { params: download ? { download: 1 } : {} });
  return data.url;
}

// Opens a private file in a new tab. The tab is opened first (a browser only allows that from a click), then pointed
// at the link once we have it.
export async function openPrivateFile(id, options) {
  const tab = window.open('', '_blank');
  try {
    const url = await privateFileUrl(id, options);
    if (tab) tab.location.href = url;
    else window.location.href = url;
  } catch (e) {
    tab?.close();
    throw e;
  }
}
