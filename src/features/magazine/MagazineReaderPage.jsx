import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PageFlip } from 'page-flip';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuthStore } from '../../store/auth-store.js';
import { fetchPdf, saveProgress, useDownload, useIssue } from './hooks.js';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const PAGE_WIDTH = 900; // pixels each page is drawn at: sharp enough to zoom, light enough for a phone
const ZOOMS = [1, 1.4, 1.8, 2.4];

const FIRST_BATCH = 4; // pages drawn before the book opens; the rest are drawn while the member reads

// A faint diagonal line with the reader's name across the page, and a small one at the bottom: a page that is
// photographed or screenshotted still shows whose copy it was.
function drawWatermark(ctx, w, h, text) {
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#360e4a';
  ctx.font = `bold ${Math.round(w / 26)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 6);
  for (const dy of [-h / 3, 0, h / 3]) ctx.fillText(text, 0, dy);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#444';
  ctx.font = `${Math.round(w / 70)}px sans-serif`;
  ctx.fillText(text, 16, h - 12);
  ctx.restore();
}

// Draws one PDF page into a picture and returns its address.
async function drawPage(doc, n, mark) {
  const page = await doc.getPage(n);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: PAGE_WIDTH / base.width });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await page.render({ canvasContext: canvas.getContext('2d'), canvas, viewport }).promise;
  if (mark) drawWatermark(canvas.getContext('2d'), canvas.width, canvas.height, mark);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  page.cleanup();
  return URL.createObjectURL(blob);
}

// A plain page shown until the real one is drawn.
function placeholderPage(ratio) {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = Math.round(300 * ratio);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#9ca3af';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Loading page…', canvas.width / 2, canvas.height / 2);
  return canvas.toDataURL('image/png');
}

// The order to draw pages in: from where the member opens to the end, then the pages before it.
function drawOrder(total, start) {
  const order = [];
  for (let n = start; n <= total; n += 1) order.push(n);
  for (let n = 1; n < start; n += 1) order.push(n);
  return order;
}

// Reads one issue as a flip book: two pages side by side on a computer, one on a phone, with zoom and a remembered place.
export default function MagazineReaderPage() {
  const { id } = useParams();
  const isMember = useAuthStore((s) => s.user.role) === 'CEO';
  const readerName = useAuthStore((s) => s.user.name);
  const mark = `${readerName} · ILC member copy · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  const { data: issue, isError: issueError } = useIssue(id);
  const download = useDownload(id);
  const stage = useRef(null);
  const book = useRef(null);
  const saveTimer = useRef(null);
  const [state, setState] = useState({ phase: 'loading', done: 0, total: 0, error: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [zoom, setZoom] = useState(0);
  const startPage = issue?.last_page ?? 1;
  const ready = Boolean(issue);

  useEffect(() => {
    if (!ready) return undefined;
    let dead = false;
    let urls = [];
    let task = null;
    (async () => {
      try {
        const buffer = await fetchPdf(id);
        task = pdfjs.getDocument({ data: new Uint8Array(buffer) });
        const doc = await task.promise;
        if (dead) return;
        const total = doc.numPages;
        const first = Math.min(Math.max(startPage, 1), total);
        const firstView = (await doc.getPage(1)).getViewport({ scale: 1 });
        const ratio = firstView.height / firstView.width;
        const blank = placeholderPage(ratio);
        urls = Array(total).fill(blank);
        const order = drawOrder(total, first);
        const batch = Math.min(FIRST_BATCH, total);

        // 1. Draw the first few pages, then open the book straight away.
        for (let i = 0; i < batch; i += 1) {
          if (dead) return;
          urls[order[i] - 1] = await drawPage(doc, order[i], mark);
          setState({ phase: 'preparing', done: i + 1, total: batch, error: '' });
        }
        if (dead) return;
        const width = PAGE_WIDTH;
        const flip = new PageFlip(stage.current, {
          width,
          height: Math.round(width * ratio),
          size: 'stretch',
          minWidth: 260,
          maxWidth: 1100,
          minHeight: 340,
          maxHeight: 1600,
          showCover: true,
          usePortrait: true, // one page on a narrow screen
          mobileScrollSupport: false,
          maxShadowOpacity: 0.45,
        });
        flip.loadFromImages([...urls]);
        flip.on('flip', (e) => {
          const n = e.data + 1;
          setPage(n);
          if (isMember) {
            clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => saveProgress(id, n), 800);
          }
        });
        book.current = flip;
        setPages(total);
        if (first > 1) flip.turnToPage(first - 1);
        setPage(first);
        setState({ phase: 'ready', done: batch, total, error: '' });

        // 2. Draw the rest in the background and swap them in (only while no page is turning).
        let changed = false;
        const swapIn = () => {
          if (!changed || dead || !book.current) return;
          if (book.current.getState() !== 'read') return;
          changed = false;
          book.current.updateFromImages([...urls]);
        };
        flip.on('changeState', (e) => e.data === 'read' && swapIn());
        for (let i = batch; i < order.length; i += 1) {
          if (dead) return;
          urls[order[i] - 1] = await drawPage(doc, order[i], mark);
          changed = true;
          setState((st) => ({ ...st, done: i + 1 }));
          if ((i + 1 - batch) % 6 === 0 || i === order.length - 1) swapIn();
        }
      } catch (err) {
        console.error('Magazine reader failed:', err?.message);
        if (!dead) setState({ phase: 'error', done: 0, total: 0, error: err?.response?.data?.error || 'This issue could not be opened. Please try again.' });
      }
    })();
    return () => {
      dead = true;
      clearTimeout(saveTimer.current);
      try {
        book.current?.destroy();
      } catch {
        /* the reader is already gone */
      }
      book.current = null;
      task?.destroy();
      for (const u of urls) if (u.startsWith('blob:')) URL.revokeObjectURL(u);
    };
    // The reader is built once per issue. Where it opens (startPage) is only read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, ready]);

  const turn = useCallback((dir) => (dir > 0 ? book.current?.flipNext() : book.current?.flipPrev()), []);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') turn(1);
      if (e.key === 'ArrowLeft') turn(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [turn]);

  // After zooming, the book must measure itself again.
  useEffect(() => {
    const timer = setTimeout(() => book.current?.update(), 60);
    return () => clearTimeout(timer);
  }, [zoom]);

  const loading = state.phase === 'loading' || state.phase === 'preparing';

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Link to="/magazine" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ilc-purple hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All issues
      </Link>
      <div className="glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div className="min-w-0">
          <h2 className="truncate font-serif text-xl font-semibold text-ilc-purple">{issue?.title ?? 'Magazine'}</h2>
          {state.phase === 'ready' && (
            <p className="text-sm text-gray-700" aria-live="polite">
              Page {page} of {pages}
              {state.done < state.total && <span className="ml-2 text-xs text-gray-600">(still loading pages {state.done} of {state.total})</span>}
            </p>
          )}
        </div>
        {state.phase === 'ready' && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" className="w-auto border border-gray-300" aria-label="Previous page" onClick={() => turn(-1)}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
            </Button>
            <Button variant="ghost" className="w-auto border border-gray-300" aria-label="Next page" onClick={() => turn(1)}>
              Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="ghost" className="w-auto border border-gray-300" aria-label="Zoom out" disabled={zoom === 0} onClick={() => setZoom((z) => Math.max(0, z - 1))}>
              <ZoomOut className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="ghost" className="w-auto border border-gray-300" aria-label="Zoom in" disabled={zoom === ZOOMS.length - 1} onClick={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))}>
              <ZoomIn className="h-4 w-4" aria-hidden="true" />
            </Button>
            {issue?.allow_download && (
              <Button className="w-auto" loading={download.isPending} onClick={() => download.mutate()}>
                <Download className="h-4 w-4" aria-hidden="true" /> Download
              </Button>
            )}
          </div>
        )}
      </div>

      {(issueError || state.phase === 'error') && <Alert>{state.error || 'This issue was not found.'}</Alert>}
      {loading && !issueError && (
        <div className="glass-card rounded-2xl p-10 text-center" role="status" aria-live="polite">
          <p className="font-serif text-lg font-bold text-ilc-purple">Getting the pages ready…</p>
          <p className="mt-1 text-sm text-gray-700">{state.total ? 'Almost there' : 'Opening the issue'}</p>
          {state.total > 0 && (
            <div className="mx-auto mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-ilc-gold transition-all" style={{ width: `${(state.done / state.total) * 100}%` }} />
            </div>
          )}
        </div>
      )}

      <div className={`overflow-auto rounded-2xl bg-gray-100 p-2 sm:p-4 ${state.phase === 'ready' ? '' : 'hidden'}`}>
        <div style={{ width: `${ZOOMS[zoom] * 100}%`, minWidth: '100%' }}>
          <div ref={stage} />
        </div>
      </div>
      {state.phase === 'ready' && <p className="text-center text-xs text-gray-700">Click or drag a page corner, or use the arrow keys, to turn pages.</p>}
    </div>
  );
}
