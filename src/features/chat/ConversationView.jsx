import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, Paperclip, Send, X } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { dayLabel, formatClock } from '../../lib/format.js';
import { FILE_RULES, openPrivateFile, privateFileUrl, sizeText, uploadFile } from '../../lib/uploads.js';
import { toast } from '../../store/toast-store.js';
import { useAuthStore } from '../../store/auth-store.js';
import { useChatStore } from '../../store/chat-store.js';
import { useConversation, useLoadOlder, useMarkRead, useSendMessage } from './hooks.js';

const MAX_LENGTH = 5000;

// Splits the messages into days so a "Today" / "Yesterday" label can sit between them.
function groupByDay(messages) {
  const groups = [];
  for (const m of messages) {
    const label = dayLabel(m.created_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(m);
    else groups.push({ label, items: [m] });
  }
  return groups;
}

// An attached file, shown as a chip. Pictures show a small preview. Opening asks for a short-lived link first.
function Attachment({ attachment, mine }) {
  const isImage = attachment.content_type.startsWith('image/');
  const { data: preview } = useQuery({
    queryKey: ['private-file', attachment.id],
    queryFn: () => privateFileUrl(attachment.id),
    enabled: isImage,
    staleTime: 4 * 60 * 1000,
  });
  const open = () => openPrivateFile(attachment.id).catch((e) => toast.error(getErrorMessage(e) || e.message));
  return (
    <div className="mb-1.5">
      {isImage && preview && (
        <button type="button" onClick={open} aria-label={`Open picture ${attachment.name}`} className="block">
          <img src={preview} alt={attachment.name} className="max-h-48 rounded-lg object-cover" />
        </button>
      )}
      <button
        type="button"
        onClick={open}
        className={`mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left ${mine ? 'bg-white/15 hover:bg-white/25' : 'bg-gray-50 hover:bg-gray-100'}`}
      >
        <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold">{attachment.name}</span>
          <span className={`block text-xs ${mine ? 'text-white/60' : 'text-gray-600'}`}>
            {sizeText(attachment.size)} · tap to open
          </span>
        </span>
      </button>
    </div>
  );
}

function Bubble({ message, mine }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[75%] ${
          mine
            ? 'rounded-br-md bg-ilc-purple text-white'
            : 'rounded-bl-md border border-gray-100 bg-white text-ilc-ink'
        }`}
      >
        {message.attachment && <Attachment attachment={message.attachment} mine={mine} />}
        {/* Shown as plain text, never as HTML, so nothing a member types can run as code. */}
        {message.message && <p className="break-words whitespace-pre-wrap">{message.message}</p>}
        <p className={`mt-1 text-right text-xs ${mine ? 'text-white/60' : 'text-gray-600'}`}>
          {formatClock(message.created_at)}
        </p>
      </div>
    </div>
  );
}

// One open conversation: messages, and the box to write a new one.
export default function ConversationView({ partnerId, onBack }) {
  const me = useAuthStore((s) => s.user);
  const setActivePartner = useChatStore((s) => s.setActivePartner);
  const { data, isLoading, isError, error } = useConversation(partnerId);
  const send = useSendMessage(partnerId);
  const markRead = useMarkRead(partnerId);
  const loadOlder = useLoadOlder(partnerId);
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const boxRef = useRef(null);
  const lastCount = useRef(0);

  // Tell the app which conversation is open (so no pop-up shows for it), and clear it on the way out.
  useEffect(() => {
    setActivePartner(partnerId);
    return () => setActivePartner(null);
  }, [partnerId, setActivePartner]);

  const messages = useMemo(() => data?.messages ?? [], [data]);
  const unreadIds = messages.filter((m) => m.sender_id === partnerId && !m.is_read).map((m) => m.id).join(',');
  const { mutate: markAsRead } = markRead;
  const askedFor = useRef('');

  // Opening the conversation (and any new message while it is open) marks their messages as read.
  // It asks once for each set of unread messages, so it can never loop, whatever the server answers.
  useEffect(() => {
    if (unreadIds && unreadIds !== askedFor.current) {
      askedFor.current = unreadIds;
      markAsRead();
    }
  }, [unreadIds, markAsRead]);

  // Stay at the bottom for new messages, but not when older ones are loaded at the top.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const grew = messages.length > lastCount.current;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    const lastIsMine = messages[messages.length - 1]?.sender_id === me.id;
    if (lastCount.current === 0 || (grew && (nearBottom || lastIsMine)))
      el.scrollTop = el.scrollHeight;
    lastCount.current = messages.length;
  }, [messages, me.id]);

  // The box grows with the text, up to about five lines.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    box.style.height = 'auto';
    box.style.height = `${Math.min(box.scrollHeight, 128)}px`;
  }, [text]);

  // A file chosen with the paperclip: uploaded straight away, sent with the next message.
  const fileInput = useRef(null);
  const [file, setFile] = useState(null); // { name, size, percent, fileId?, error? }

  const chooseFile = async (e) => {
    const chosen = e.target.files?.[0];
    e.target.value = '';
    if (!chosen) return;
    setFile({ name: chosen.name, size: chosen.size, percent: 0 });
    try {
      const fileId = await uploadFile('chat', chosen, (percent) => setFile((f) => f && { ...f, percent }));
      setFile((f) => f && { ...f, fileId });
    } catch (err) {
      setFile((f) => f && { ...f, error: err.message });
    }
  };

  const fileReady = Boolean(file?.fileId);
  const fileBusy = Boolean(file && !file.fileId && !file.error);

  const submit = () => {
    const message = text.trim();
    if ((!message && !fileReady) || fileBusy || send.isPending) return;
    send.mutate(
      { message, attachmentFileId: fileReady ? file.fileId : undefined },
      {
        onSuccess: () => {
          setText('');
          setFile(null);
        },
      },
    );
  };

  const onKeyDown = (e) => {
    // Enter sends; Shift+Enter starts a new line.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  if (isError) {
    return (
      <div className="space-y-3 p-5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ilc-purple hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </button>
        )}
        <Alert>{getErrorMessage(error)}</Alert>
      </div>
    );
  }

  const partner = data?.partner;
  const groups = groupByDay(messages);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-gray-100 bg-white/80 px-3 py-3 sm:px-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to conversations"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ilc-ink hover:bg-gray-100 lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        {partner && (
          <>
            <Avatar name={partner.name} initials={partner.initials} src={partner.photo_url} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ilc-ink">{partner.name}</p>
              <p className="truncate text-xs text-gray-600">
                {[partner.title, partner.organisation].filter(Boolean).join(' · ')}
              </p>
            </div>
          </>
        )}
      </header>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-gray-50/60 px-3 py-4 sm:px-5"
        aria-live="polite"
      >
        {isLoading ? (
          <p className="py-10 text-center text-sm text-gray-600">Loading conversation…</p>
        ) : (
          <>
            {data.has_more && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => loadOlder.mutate(messages[0].created_at)}
                  disabled={loadOlder.isPending}
                  className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-ilc-purple hover:bg-ilc-purple/5 disabled:opacity-60"
                >
                  {loadOlder.isPending ? 'Loading…' : 'Show earlier messages'}
                </button>
              </div>
            )}
            {messages.length === 0 && (
              <p className="py-10 text-center text-sm text-gray-600">
                No messages yet. Say hello to {partner?.name?.split(' ')[0]}.
              </p>
            )}
            {groups.map((g) => (
              <section key={g.label} aria-label={g.label} className="space-y-2">
                <p className="text-center text-xs font-bold tracking-widest text-gray-700 uppercase">
                  {g.label}
                </p>
                {g.items.map((m) => (
                  <Bubble key={m.id} message={m} mine={m.sender_id === me.id} />
                ))}
              </section>
            ))}
          </>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-wrap items-end gap-2 border-t border-gray-100 bg-white p-3 sm:p-4"
      >
        {file && (
          <div className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs" role="status">
            <FileText className="h-4 w-4 shrink-0 text-ilc-purple" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ilc-ink">{file.name}</span>
              <span className={file.error ? 'text-red-600' : 'text-gray-600'}>
                {file.error ?? (file.fileId ? `${sizeText(file.size)} · ready to send` : `Uploading… ${file.percent}%`)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setFile(null)}
              aria-label="Remove the attached file"
              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-600 hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={fileBusy}
          aria-label="Attach a file"
          title="Attach a file (up to 14 MB)"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ilc-purple hover:bg-ilc-purple/5 disabled:opacity-40"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input ref={fileInput} type="file" accept={FILE_RULES.chat.accept} onChange={chooseFile} className="sr-only" tabIndex={-1} />
        <div className="min-w-0 flex-1">
          <label htmlFor="chat-box" className="sr-only">
            Write a message
          </label>
          <textarea
            id="chat-box"
            ref={boxRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={onKeyDown}
            placeholder="Message…"
            className="max-h-32 min-h-11 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
          />
          {text.length > MAX_LENGTH - 500 && (
            <p className="mt-1 text-right text-xs text-gray-600">
              {text.length}/{MAX_LENGTH}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={(!text.trim() && !fileReady) || fileBusy || send.isPending}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ilc-purple text-white transition hover:bg-ilc-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
