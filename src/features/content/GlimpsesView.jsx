import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, X } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { useAuthStore } from '../../store/auth-store.js';
import { useGlimpses, useToggleBookmark } from './hooks.js';

function BookmarkButton({ glimpse, onToggle, className = '' }) {
  return (
    <button
      type="button"
      aria-pressed={glimpse.is_bookmarked}
      aria-label={glimpse.is_bookmarked ? 'Remove bookmark' : 'Bookmark this photo'}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(glimpse);
      }}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60 ${className}`}
    >
      <Star className={`h-5 w-5 ${glimpse.is_bookmarked ? 'fill-ilc-gold text-ilc-gold' : ''}`} />
    </button>
  );
}

// Full-screen viewer. Left and right arrows move between photos, Escape closes.
function Lightbox({ items, index, onIndex, onClose, canBookmark, onToggle }) {
  const item = items[index];
  const prev = useCallback(
    () => onIndex((index - 1 + items.length) % items.length),
    [index, items.length, onIndex],
  );
  const next = useCallback(
    () => onIndex((index + 1) % items.length),
    [index, items.length, onIndex],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  if (!item) return null;
  const navBtn =
    'absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex items-center justify-between p-3">
        <p className="text-xs text-white/60" aria-live="polite">
          {index + 1} of {items.length}
        </p>
        <div className="flex items-center gap-2">
          {canBookmark && <BookmarkButton glimpse={item} onToggle={onToggle} />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-12 sm:px-16"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className={`${navBtn} left-2 sm:left-4`}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className={`${navBtn} right-2 sm:right-4`}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
        <img
          src={item.photo_url}
          alt={item.caption || item.event_name || 'Event photo'}
          className="max-h-full max-w-full rounded-lg object-contain"
        />
      </div>
      {(item.caption || item.event_name) && (
        <div className="p-4 text-center text-white">
          {item.event_name && (
            <p className="text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">
              {item.event_name}
            </p>
          )}
          {item.caption && <p className="mt-1 text-sm text-white/80">{item.caption}</p>}
        </div>
      )}
    </div>,
    document.body,
  );
}

// Glimpses: a photo grid, a lightbox, bookmarks and a "My Bookmarks" filter.
export default function GlimpsesView() {
  const role = useAuthStore((s) => s.user.role);
  const canBookmark = role !== 'SPOC'; // a SPOC has no member record to attach a bookmark to
  const { data: glimpses = [], isLoading, isError, error } = useGlimpses();
  const toggle = useToggleBookmark();
  const [params, setParams] = useSearchParams();
  const onlyMine = params.get('saved') === '1'; // "Saved photos" in the menu opens this view directly
  const setOnlyMine = (saved) =>
    setParams(saved ? { section: 'glimpses', saved: '1' } : { section: 'glimpses' }, { replace: true });
  const [category, setCategory] = useState('All');
  const [openIndex, setOpenIndex] = useState(null);

  const categories = useMemo(
    () => ['All', ...new Set(glimpses.map((g) => g.category).filter(Boolean))],
    [glimpses],
  );
  // If the chosen category disappears (its last photo was deleted), fall back to All.
  const activeCategory = categories.includes(category) ? category : 'All';
  const shown = glimpses.filter(
    (g) => (!onlyMine || g.is_bookmarked) && (activeCategory === 'All' || g.category === activeCategory),
  );
  const onToggle = (g) => toggle.mutate({ id: g.id, on: !g.is_bookmarked });

  // Un-bookmarking the open photo while viewing "My Bookmarks" can shrink the list under the viewer.
  const safeIndex = openIndex !== null && openIndex < shown.length ? openIndex : null;

  if (isLoading) return <p className="py-10 text-center text-sm text-gray-600">Loading photos…</p>;
  if (isError) return <Alert>{getErrorMessage(error)}</Alert>;

  return (
    <div className="space-y-5">
      {canBookmark && (
        <div
          role="group"
          aria-label="Show photos"
          className="inline-flex rounded-lg border border-gray-200 bg-white p-1"
        >
          {[
            { value: false, label: 'All photos' },
            { value: true, label: `Saved (${glimpses.filter((g) => g.is_bookmarked).length})`, star: true },
          ].map((t) => (
            <button
              key={t.label}
              type="button"
              aria-pressed={onlyMine === t.value}
              onClick={() => setOnlyMine(t.value)}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-4 text-xs font-bold tracking-widest uppercase transition ${onlyMine === t.value ? 'bg-ilc-purple text-white' : 'text-gray-700 hover:text-ilc-purple'}`}
            >
              {t.star && <Star className={`h-3.5 w-3.5 ${onlyMine === t.value ? 'fill-ilc-gold text-ilc-gold' : ''}`} aria-hidden="true" />}
              {t.label}
            </button>
          ))}
        </div>
      )}

      {categories.length > 2 && (
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={activeCategory === c}
              onClick={() => setCategory(c)}
              className={`min-h-9 rounded-full border px-4 text-xs font-bold tracking-widest uppercase transition ${
                activeCategory === c
                  ? 'border-ilc-purple bg-ilc-purple text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-ilc-purple hover:text-ilc-purple'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-xl font-bold text-ilc-purple">
            {onlyMine ? 'No saved photos yet' : 'No photos yet'}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {onlyMine
              ? 'Tap the star on any photo to save it here.'
              : activeCategory !== 'All'
                ? 'There are no photos in this category.'
                : 'Photos from our events will appear here.'}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((g, i) => (
            <li key={g.id} className="group relative overflow-hidden rounded-xl bg-gray-100">
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={`Open photo${g.caption ? `: ${g.caption}` : ''}`}
                className="block w-full"
              >
                <img
                  src={g.photo_url}
                  alt={g.caption || g.event_name || 'Event photo'}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </button>
              {canBookmark && (
                <BookmarkButton
                  glimpse={g}
                  onToggle={onToggle}
                  className="absolute top-2 right-2"
                />
              )}
              {g.event_name && (
                <p className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-3 pt-6 pb-2 text-xs font-bold tracking-widest text-white uppercase">
                  {g.event_name}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {safeIndex !== null && (
        <Lightbox
          items={shown}
          index={safeIndex}
          onIndex={setOpenIndex}
          onClose={() => setOpenIndex(null)}
          canBookmark={canBookmark}
          onToggle={onToggle}
        />
      )}
    </div>
  );
}
