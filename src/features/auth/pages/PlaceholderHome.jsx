import { LogOut } from 'lucide-react';
import Button from '../../../components/ui/Button.jsx';
import { useAuthStore } from '../../../store/auth-store.js';
import { useLogout } from '../hooks.js';

const ROLE_LABEL = {
  CEO: 'Member',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
  SPOC: 'Relationship Manager',
};

// Temporary landing page for each role. The real dashboards come with the layout step.
export default function PlaceholderHome({ note = 'Your dashboard is being built.' }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <main className="flex min-h-full items-center justify-center bg-ilc-page px-4">
      <section className="glass-card w-full max-w-md rounded-2xl p-8 text-center">
        <p className="text-[10px] font-bold tracking-[0.3em] text-ilc-gold-deep uppercase">{ROLE_LABEL[user.role]}</p>
        <h1 className="mt-2 font-serif font-semibold text-3xl text-ilc-purple">Welcome, {user.name}</h1>
        <p className="mt-3 text-sm text-gray-500">{note}</p>
        <Button variant="ghost" className="mt-6" onClick={() => logout.mutate()} loading={logout.isPending}>
          <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
        </Button>
      </section>
    </main>
  );
}
