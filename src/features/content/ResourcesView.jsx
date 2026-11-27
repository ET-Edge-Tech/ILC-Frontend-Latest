import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, ExternalLink, FileText, Play } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDate } from '../../lib/format.js';
import { openPrivateFile, privateFileUrl } from '../../lib/uploads.js';
import { toast } from '../../store/toast-store.js';
import { useResources } from './hooks.js';

// Only these two players are ever embedded. The server already checks this; we check again.
const SAFE_EMBED =
  /^https:\/\/(www\.youtube-nocookie\.com\/embed\/[\w-]{11}|player\.vimeo\.com\/video\/\d+)/;

function HeroVideo({ resource }) {
  if (!SAFE_EMBED.test(resource.embed_url)) return null;
  return (
    <section aria-label="Featured video" className="glass-card overflow-hidden rounded-2xl">
      <div className="aspect-video w-full bg-black">
        <iframe
          title={resource.title}
          src={resource.embed_url}
          allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
          className="h-full w-full border-0"
        />
      </div>
      <div className="p-5">
        <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">
          <Play className="h-3 w-3" aria-hidden="true" /> Featured video
        </p>
        <h2 className="mt-1 font-serif text-2xl font-semibold text-ilc-purple">{resource.title}</h2>
        {resource.description && (
          <p className="mt-1 text-sm text-gray-600">{resource.description}</p>
        )}
      </div>
    </section>
  );
}

// An uploaded video, played in the page. The video is private: we ask for a link that works for a few minutes.
function UploadedVideo({ resource }) {
  const { data: url, isError } = useQuery({
    queryKey: ['private-file', resource.video.id],
    queryFn: () => privateFileUrl(resource.video.id),
    staleTime: 4 * 60 * 1000, // the link lasts 5 minutes
  });
  return (
    <section aria-label="Featured video" className="glass-card overflow-hidden rounded-2xl">
      <div className="aspect-video w-full bg-black">
        {url ? (
          <video
            src={url}
            controls
            controlsList="nodownload"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            preload="metadata"
            className="h-full w-full"
          />
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-white/70">
            {isError ? 'The video could not be loaded.' : 'Loading the video…'}
          </p>
        )}
      </div>
      <div className="p-5">
        <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">
          <Play className="h-3 w-3" aria-hidden="true" /> Featured video
        </p>
        <h2 className="mt-1 font-serif text-2xl font-semibold text-ilc-purple">{resource.title}</h2>
        {resource.description && <p className="mt-1 text-sm text-gray-600">{resource.description}</p>}
      </div>
    </section>
  );
}

const btnClass =
  'inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-ilc-purple px-4 text-xs font-bold tracking-widest text-white uppercase hover:bg-ilc-ink';

function ResourceCard({ resource, hero }) {
  // Opening a private file asks the server for a short-lived link first.
  const open = (id, options) => () =>
    openPrivateFile(id, options).catch((e) => toast.error(getErrorMessage(e) || e.message));
  const [imgBroken, setImgBroken] = useState(false); // a broken picture link falls back to the plain tile
  const buttons = [
    resource.link && {
      href: resource.link,
      label: resource.embed_url ? 'Watch' : 'Open',
      Icon: ExternalLink,
    },
    resource.file_url && { href: resource.file_url, label: 'Download', Icon: FileText },
  ].filter(Boolean);

  return (
    <li className="glass-card flex flex-col overflow-hidden rounded-2xl">
      {resource.image_url && !imgBroken ? (
        <img
          src={resource.image_url}
          alt=""
          loading="lazy"
          onError={() => setImgBroken(true)}
          className="aspect-video w-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-ilc-sidebar to-ilc-purple"
        >
          <FileText className="h-8 w-8 text-ilc-gold" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="w-fit rounded-full bg-ilc-purple/10 px-2.5 py-0.5 text-xs font-bold tracking-wider text-ilc-purple uppercase">
          {resource.category}
        </span>
        <h3 className="font-serif text-xl font-bold leading-snug text-ilc-purple">{resource.title}</h3>
        {resource.description && (
          <p className="line-clamp-3 text-sm text-gray-600">{resource.description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          {resource.document && (
            <>
              <button type="button" onClick={open(resource.document.id)} className={btnClass}>
                <FileText className="h-3.5 w-3.5" aria-hidden="true" /> Read
                <span className="sr-only"> {resource.title} (opens in a new tab)</span>
              </button>
              {!resource.view_only && (
                <button type="button" onClick={open(resource.document.id, { download: true })} className={btnClass}>
                  <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download
                  <span className="sr-only"> {resource.title}</span>
                </button>
              )}
            </>
          )}
          {resource.video && !(hero && hero.id === resource.id) && (
            <button type="button" onClick={open(resource.video.id)} className={btnClass}>
              <Play className="h-3.5 w-3.5" aria-hidden="true" /> Watch
              <span className="sr-only"> {resource.title} (opens in a new tab)</span>
            </button>
          )}
          {buttons.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-ilc-purple px-4 text-xs font-bold tracking-widest text-white uppercase hover:bg-ilc-ink"
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
              <span className="sr-only"> {resource.title} (opens in a new tab)</span>
            </a>
          ))}
          <span className="ml-auto text-xs text-gray-600">
            {formatDate(resource.created_at)}
          </span>
        </div>
      </div>
    </li>
  );
}

// Knowledge: the featured video, category filters and the resource cards.
export default function ResourcesView() {
  const { data: resources = [], isLoading, isError, error } = useResources();
  const [category, setCategory] = useState('All');

  // The featured video: the first YouTube or Vimeo link, otherwise the first uploaded video.
  const hero = resources.find((r) => r.embed_url) ?? resources.find((r) => r.video);
  const categories = useMemo(
    () => ['All', ...new Set(resources.map((r) => r.category))],
    [resources],
  );
  const shown = resources.filter((r) => category === 'All' || r.category === category);

  if (isLoading)
    return <p className="py-10 text-center text-sm text-gray-600">Loading resources…</p>;
  if (isError) return <Alert>{getErrorMessage(error)}</Alert>;

  return (
    <div className="space-y-6">
      {hero && (hero.embed_url ? <HeroVideo resource={hero} /> : <UploadedVideo resource={hero} />)}

      {resources.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-xl font-bold text-ilc-purple">No resources yet</p>
          <p className="mt-1 text-sm text-gray-600">
            New articles, reports and videos will appear here.
          </p>
        </div>
      ) : (
        <>
          <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={`min-h-9 rounded-full border px-4 text-xs font-bold tracking-widest uppercase transition ${
                  category === c
                    ? 'border-ilc-purple bg-ilc-purple text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-ilc-purple hover:text-ilc-purple'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((r) => (
              <ResourceCard key={r.id} resource={r} hero={hero} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
