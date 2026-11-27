import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Film, FileText, ImageIcon, MessageSquare } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import { api, getErrorMessage } from '../../lib/api-client.js';
import { sizeText } from '../../lib/uploads.js';
import { toast } from '../../store/toast-store.js';

const KINDS = {
  image: { label: 'Pictures', note: 'Photos, event pictures, Glimpses, covers (public)', Icon: ImageIcon },
  document: { label: 'Documents', note: 'Files on Resources (private)', Icon: FileText },
  video: { label: 'Videos', note: 'Uploaded videos on Resources (private)', Icon: Film },
  chat: { label: 'Chat files', note: 'Files sent between members (private)', Icon: MessageSquare },
};

// How much is stored in S3, for Admins. File names are never shown.
export default function AdminStoragePage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['storage'],
    queryFn: async () => (await api.get('/uploads/storage/summary')).data,
  });
  const sweep = useMutation({
    mutationFn: async () => (await api.post('/uploads/storage/sweep')).data,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['storage'] });
      toast.success(r.removed ? `${r.removed} unused file${r.removed === 1 ? '' : 's'} removed` : 'Nothing to remove');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const totalBytes = data?.kinds.reduce((n, k) => n + k.bytes, 0) ?? 0;
  const totalFiles = data?.kinds.reduce((n, k) => n + k.files, 0) ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {isError && <Alert>{getErrorMessage(error)}</Alert>}
      {data && !data.enabled && (
        <Alert tone="warning">
          File upload is switched off. Nothing can be uploaded until it is switched on in the server settings.
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-3xl tabular-nums font-bold text-ilc-ink">{isLoading ? '–' : totalFiles}</p>
          <p className="mt-1 text-xs font-bold tracking-widest text-gray-700 uppercase">Files stored</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-3xl tabular-nums font-bold text-ilc-ink">{isLoading ? '–' : sizeText(totalBytes)}</p>
          <p className="mt-1 text-xs font-bold tracking-widest text-gray-700 uppercase">Space used</p>
        </div>
      </div>

      <ul className="space-y-3">
        {(data?.kinds ?? []).map((k) => {
          const { label, note, Icon } = KINDS[k.kind];
          return (
            <li key={k.kind} className="glass-card flex items-center gap-4 rounded-2xl p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ilc-purple/10 text-ilc-purple">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ilc-ink">{label}</span>
                <span className="block text-xs text-gray-600">{note}</span>
              </span>
              <span className="text-right text-sm">
                <b className="text-ilc-ink">{k.files}</b> file{k.files === 1 ? '' : 's'}
                <span className="block text-xs text-gray-600">{sizeText(k.bytes)}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <section className="glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div>
          <p className="font-semibold text-ilc-ink">Unused uploads: {data?.waiting ?? 0}</p>
          <p className="text-xs text-gray-600">
            Files uploaded but never saved anywhere. They are removed automatically after a day.
          </p>
        </div>
        <Button variant="ghost" className="border border-gray-200 sm:w-auto" loading={sweep.isPending} onClick={() => sweep.mutate()}>
          Clean up now
        </Button>
      </section>
    </div>
  );
}
