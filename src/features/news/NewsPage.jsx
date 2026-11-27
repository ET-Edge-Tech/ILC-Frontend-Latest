import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Clock } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDate } from '../../lib/format.js';
import { useNews, useThemes } from './hooks.js';

const PILLS = [
  { key: 'foryou', label: 'My interests' },
  { key: 'all', label: 'All' },
  { key: 'saved', label: 'Saved' },
];

const pill = (on) => `min-h-10 rounded-full border px-4 text-sm font-bold transition ${on ? 'border-ilc-purple bg-ilc-purple text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-ilc-purple/5'}`;

function Card({ a }) {
  return (
    <li>
      <Link to={`/news/${a.id}`} className="glass-card flex h-full flex-col overflow-hidden rounded-2xl transition hover:shadow-md">
        <div className="aspect-[16/9] bg-gray-100">{a.image_url && <img src={a.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />}</div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {a.industry_names[0] && <span className="rounded-full bg-ilc-purple/10 px-2.5 py-0.5 font-bold text-ilc-purple">{a.industry_names[0]}</span>}
          </div>
          <h3 className="font-serif text-lg leading-snug font-semibold text-ilc-ink">{a.title}</h3>
          {a.ai_summary ? (
            <p className="line-clamp-4 text-sm text-gray-700">
              <span className="mr-1 text-xs font-bold tracking-wide text-ilc-gold-deep uppercase">In short:</span>
              {a.ai_summary}
            </p>
          ) : (
            a.excerpt && <p className="line-clamp-3 text-sm text-gray-700">{a.excerpt}</p>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-gray-600">
            <span>{formatDate(a.published_at)}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {a.reading_minutes} min read
            </span>
            {a.saved && (
              <span className="inline-flex items-center gap-1 font-bold text-ilc-purple">
                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" /> Saved
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}

// Business news. "My interests" puts what matches the member's interests and industry first.
export default function NewsPage() {
  const [filter, setFilter] = useState('foryou');
  const [theme, setTheme] = useState('');
  const { data: themes = [] } = useThemes();
  const q = useNews(filter, theme);
  const articles = q.data?.pages.flatMap((p) => p.articles) ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-lg font-bold text-ilc-ink">Business news</h2>
        <p className="mt-1 text-sm text-gray-700">Business articles from the last six months. Save what you want to keep and talk about it with other members.</p>
      </div>

      <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
        {PILLS.map((p) => (
          <button key={p.key} type="button" aria-pressed={filter === p.key} onClick={() => { setFilter(p.key); setTheme(''); }} className={pill(filter === p.key)}>
            {p.label}
          </button>
        ))}
        {themes.map((t) => (
          <button key={t.name} type="button" aria-pressed={filter === 'theme' && theme === t.name} onClick={() => { setFilter('theme'); setTheme(t.name); }} className={pill(filter === 'theme' && theme === t.name)}>
            {t.name}
          </button>
        ))}
      </div>

      {q.isError && <Alert>{getErrorMessage(q.error)}</Alert>}
      {q.isLoading && <div className="glass-card rounded-2xl p-10 text-center text-sm font-medium text-gray-700">Loading…</div>}
      {!q.isLoading && articles.length === 0 && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-xl font-bold text-ilc-purple">{filter === 'saved' ? 'Nothing saved yet' : 'No articles here'}</p>
          <p className="mt-1 text-sm text-gray-700">{filter === 'saved' ? 'Press Save on an article to keep it here.' : 'Try another filter. New articles are read every 30 minutes.'}</p>
        </div>
      )}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <Card key={a.id} a={a} />
        ))}
      </ul>
      {q.hasNextPage && (
        <div className="text-center">
          <Button variant="ghost" className="w-auto border border-gray-300" loading={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>
            Show more
          </Button>
        </div>
      )}
    </div>
  );
}
