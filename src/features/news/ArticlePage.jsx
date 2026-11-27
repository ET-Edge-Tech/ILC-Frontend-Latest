import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookmarkCheck, Clock, ExternalLink, Link2, Send, Sparkles, Trash2 } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDate } from '../../lib/format.js';
import { toast } from '../../store/toast-store.js';
import { useAuthStore } from '../../store/auth-store.js';
import { useDirectory } from '../chat/hooks.js';
import { useArticle, useSaveArticle, useShareArticle } from './hooks.js';

// The article text was cleaned on the server. These rules only make it look right.
const BODY =
  'space-y-4 text-base leading-relaxed text-gray-800 [&_a]:font-semibold [&_a]:text-ilc-purple [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-ilc-gold [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-6 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:text-xl [&_h3]:font-bold [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_li]:ml-5 [&_ol]:list-decimal [&_table]:w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_ul]:list-disc';

function ShareDialog({ article, onClose }) {
  const [search, setSearch] = useState('');
  const { data: members = [] } = useDirectory(search);
  const share = useShareArticle(article);
  const me = useAuthStore((s) => s.user.id);
  const link = `${window.location.origin}/news/${article.id}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy. Select the link and copy it by hand.');
    }
  };
  return (
    <Modal title="Share this article" subtitle={article.title} onClose={onClose}>
      <div className="flex gap-2">
        <input readOnly value={link} aria-label="Link to this article" onFocus={(e) => e.target.select()} className="min-h-11 min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 text-xs" />
        <Button className="w-auto" onClick={copy}>
          <Link2 className="h-4 w-4" aria-hidden="true" /> Copy
        </Button>
      </div>
      <div>
        <label htmlFor="share-search" className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase">
          Or send it to a member in chat
        </label>
        <input id="share-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name" className="min-h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none" />
        <ul className="mt-2 max-h-64 divide-y divide-gray-100 overflow-y-auto">
          {members.filter((m) => m.id !== me).slice(0, 30).map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2">
              <Avatar name={m.name} initials={m.initials} src={m.photo_url} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ilc-ink">{m.name}</span>
              <Button variant="ghost" className="w-auto border border-gray-300" loading={share.isPending && share.variables === m.id} disabled={share.isPending} onClick={() => share.mutate(m.id)}>
                <Send className="h-4 w-4" aria-hidden="true" /> Send
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}

export default function ArticlePage() {
  const { id } = useParams();
  const isMember = useAuthStore((s) => s.user.role) === 'CEO';
  const { data: a, isLoading, isError, error } = useArticle(id);
  const save = useSaveArticle(id);
  const [sharing, setSharing] = useState(false);

  if (isLoading) return <div className="glass-card mx-auto max-w-3xl rounded-2xl p-10 text-center text-sm font-medium text-gray-700">Loading…</div>;
  if (isError)
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert>{getErrorMessage(error)}</Alert>
        <Link to="/news" className="text-sm font-bold text-ilc-purple hover:underline">
          Back to the news
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/news" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ilc-purple hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All news
      </Link>
      <article className="glass-card overflow-hidden rounded-2xl">
        {a.image_url && <img src={a.image_url} alt="" className="max-h-96 w-full object-cover" />}
        <div className="space-y-4 p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {a.industry_names.map((n) => (
              <span key={n} className="rounded-full bg-ilc-purple/10 px-2.5 py-0.5 font-bold text-ilc-purple">
                {n}
              </span>
            ))}
            {a.themes.map((n) => (
              <span key={n} className="rounded-full bg-gray-100 px-2.5 py-0.5 font-semibold text-gray-700">
                {n}
              </span>
            ))}
          </div>
          <h1 className="font-serif text-3xl leading-tight font-semibold text-ilc-purple">{a.title}</h1>
          <p className="flex flex-wrap items-center gap-x-4 text-sm text-gray-600">
            <span>{formatDate(a.published_at)}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden="true" /> {a.reading_minutes} min read
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {isMember && (
              <Button variant={a.saved ? 'primary' : 'ghost'} className={a.saved ? 'w-auto' : 'w-auto border border-gray-300'} loading={save.isPending} onClick={() => save.mutate(a.saved)}>
                {a.saved ? <BookmarkCheck className="h-4 w-4" aria-hidden="true" /> : <Bookmark className="h-4 w-4" aria-hidden="true" />} {a.saved ? 'Saved' : 'Save'}
              </Button>
            )}
            <Button variant="ghost" className="w-auto border border-gray-300" onClick={() => setSharing(true)}>
              <Send className="h-4 w-4" aria-hidden="true" /> Share
            </Button>
          </div>

          {a.ai_summary && (
            <aside className="rounded-xl border border-ilc-gold/40 bg-ilc-gold/10 p-4" aria-label="In short">
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-ilc-gold-deep uppercase">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> In short
                <span className="font-semibold tracking-normal text-gray-600 normal-case">· Summary by AI</span>
              </p>
              <p className="mt-1 text-base leading-relaxed text-ilc-ink">{a.ai_summary}</p>
              {a.ai_tags?.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {a.ai_tags.map((t) => (
                    <li key={t} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-ilc-purple">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          )}

          {a.full_text && a.content_html ? (
            <div className={BODY} dangerouslySetInnerHTML={{ __html: a.content_html }} />
          ) : (
            <>
              {a.excerpt && <p className="text-base leading-relaxed text-gray-800">{a.excerpt}</p>}
              <p className="text-sm text-gray-700">This is a summary. Open the full article with the button below.</p>
            </>
          )}

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-600">The article belongs to its publisher.</p>
            <a href={a.source_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-bold text-ilc-purple hover:bg-ilc-purple/5">
              Read the full article <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </article>

      {sharing && <ShareDialog article={a} onClose={() => setSharing(false)} />}
    </div>
  );
}
