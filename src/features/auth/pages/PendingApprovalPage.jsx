import { Clock } from 'lucide-react';
import AuthShell from '../../../components/AuthShell.jsx';
import { useLogout } from '../hooks.js';

export default function PendingApprovalPage() {
  const logout = useLogout();
  return (
    <AuthShell
      title="Profile under review"
      subtitle="Thank you for submitting your profile. Our team is reviewing it and you will be notified once it is approved."
      footer={
        <button type="button" onClick={() => logout.mutate()} className="font-semibold text-ilc-purple hover:underline">
          Sign out
        </button>
      }
    >
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <Clock className="h-5 w-5 shrink-0" aria-hidden="true" />
        Waiting for approval. You can sign back in at any time to check.
      </div>
    </AuthShell>
  );
}
