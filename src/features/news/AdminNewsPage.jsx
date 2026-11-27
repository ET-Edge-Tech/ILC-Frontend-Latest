import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Switch from '../../components/ui/Switch.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { timeAgo } from '../../lib/format.js';
import { useNewsSettings, useNewsStatus, useSyncNews } from './hooks.js';

// Admin: how the news works. Articles are read from ET Insights every 30 minutes; this page shows when, and lets you
// read now or choose whether articles open in full inside the portal or as a summary with a link.
export default function AdminNewsPage() {
  const { data, isLoading, isError, error } = useNewsStatus();
  const settings = useNewsSettings();
  const sync = useSyncNews();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-lg font-bold text-ilc-ink">News from ET Insights</h2>
        <p className="mt-1 text-sm text-gray-700">
          The portal reads new articles every 30 minutes and keeps the last six months. Members can save and share them. You can remove any comment on its article page.{' '}
          <Link to="/news" className="font-bold text-ilc-purple hover:underline">
            Open the news
          </Link>
        </p>
      </div>
      {isError && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading && <div className="glass-card rounded-2xl p-10 text-center text-sm font-medium text-gray-700">Loading…</div>}
      {data && (
        <>
          <section className="glass-card space-y-3 rounded-2xl p-5" aria-label="Feed">
            <p className="text-sm text-ilc-ink">
              <strong>{data.articles}</strong> articles are in the portal. Last read: <strong>{data.synced_at ? timeAgo(data.synced_at) : 'not yet'}</strong>.
            </p>
            {data.sources && (
              <ul className="space-y-1 text-sm text-ilc-ink">
                <li>
                  ET Insights: <strong>{data.sources.etinsights}</strong>
                </li>
                <li>
                  CIO&amp;Leader: <strong>{data.sources.cioandleader}</strong>
                  {data.cio_synced_at ? ` (last read ${timeAgo(data.cio_synced_at)})` : ''}
                </li>
              </ul>
            )}
            <Button className="w-auto" loading={sync.isPending} onClick={() => sync.mutate()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Read new articles now
            </Button>
          </section>
          <section className="glass-card rounded-2xl p-5" aria-label="Full articles">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-ilc-ink">Show full articles inside the portal</p>
                <p className="mt-0.5 text-xs text-gray-700">When off, members see only the headline, picture, summary and a link to read on ET Insights. Use this if ET asks you to.</p>
              </div>
              <Switch checked={data.full_text} disabled={settings.isPending} onChange={(v) => settings.mutate({ full_text: v })} label="Show full articles inside the portal" />
            </div>
          </section>
          <section className="glass-card rounded-2xl p-5" aria-label="AI summaries">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-ilc-ink">AI summaries and topics</p>
                <p className="mt-0.5 text-xs text-gray-700">
                  The AI writes a 2 to 3 line &quot;In short&quot; for each new article and picks up to 3 topics, so &quot;My interests&quot; finds better articles. Only the public article text is sent to the AI, never anything about members.
                </p>
                <p className="mt-2 text-xs font-semibold text-gray-700">
                  {data.ai_configured ? `${data.ai_summarised} of ${data.articles} articles have a summary.` : 'No AI key is set on the server yet, so nothing is summarised.'}
                </p>
              </div>
              <Switch checked={data.ai_enabled} disabled={settings.isPending} onChange={(v) => settings.mutate({ ai_enabled: v })} label="AI summaries and topics" />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
