import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { FILE_RULES, shrinkImage, toDataUrl, uploadFile } from '../../lib/uploads.js';

// A picture picker with a preview, Replace and Remove, and a progress note.
//  mode="upload":  sends the picture to S3 and reports { fileId, previewUrl }   (events, Glimpses, Resources)
//  mode="dataUrl": reports { dataUrl } for the profile-photo style forms         (members, SPOCs)
//  Removing reports { remove: true }. Nothing is saved until the form's own Save button is pressed.
export default function ImageUploadField({
  label,
  value, // the picture address already saved, or empty
  onChange,
  mode = 'upload',
  round = false,
  maxSide,
  aspect, // width / height to trim the picture to, for example 3 / 4 for a tall poster
  hint,
  disabled = false,
}) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null); // shown right after choosing, before the form is saved
  const shown = preview ?? value ?? '';
  const side = maxSide ?? (mode === 'dataUrl' ? 512 : 1600);

  const choose = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // so choosing the same file again still works
    if (!file) return;
    setError('');
    setBusy(true);
    setPercent(0);
    try {
      if (!file.type.startsWith('image/')) throw new Error('Please choose a picture (JPG, PNG, GIF or WebP).');
      const small = await shrinkImage(file, side, 0.85, aspect);
      if (mode === 'dataUrl') {
        const dataUrl = await toDataUrl(small);
        setPreview(dataUrl);
        onChange({ dataUrl });
      } else {
        const fileId = await uploadFile('image', small, setPercent);
        const previewUrl = URL.createObjectURL(small);
        setPreview(previewUrl);
        onChange({ fileId, previewUrl });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    setPreview('');
    setError('');
    onChange({ remove: true });
  };

  return (
    <div>
      {label && (
        <p className="mb-1.5 text-xs font-bold tracking-widest text-gray-700 uppercase">{label}</p>
      )}
      <div className="flex items-center gap-4">
        <div
          style={aspect ? { aspectRatio: String(aspect) } : undefined}
          className={`flex shrink-0 items-center justify-center overflow-hidden border border-gray-200 bg-gray-50 ${aspect ? 'h-32' : 'h-20 w-20'} ${round ? 'rounded-full' : 'rounded-xl'}`}
        >
          {shown ? (
            <img src={shown} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-gray-300" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={busy || disabled}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:bg-ilc-purple/5 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}
              {busy ? (mode === 'upload' ? `Uploading ${percent}%` : 'Preparing…') : shown ? 'Replace' : 'Choose picture'}
            </button>
            {shown && !busy && (
              <button
                type="button"
                onClick={remove}
                disabled={disabled}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-bold tracking-widest text-red-600 uppercase hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove
              </button>
            )}
          </div>
          <p className="text-xs text-gray-600">{hint ?? 'JPG, PNG, GIF or WebP. It is shrunk before sending.'}</p>
          {error && (
            <p role="alert" className="text-xs text-red-600">
              {error}
            </p>
          )}
        </div>
        <input ref={input} type="file" accept={FILE_RULES.image.accept} onChange={choose} className="sr-only" tabIndex={-1} />
      </div>
    </div>
  );
}
