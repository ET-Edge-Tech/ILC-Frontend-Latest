import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, UserRound } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { useAuthStore } from '../../store/auth-store.js';
import { useLogout } from '../../features/auth/hooks.js';

const ROLE_LABEL = { CEO: 'Member', ADMIN: 'Admin', SUPER_ADMIN: 'Super Admin', SPOC: 'Relationship Manager' };

// The round photo at the top right. Opens a small menu: your name, My profile, Sign out.
export default function ProfileMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // Click outside or Escape closes the menu.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => !boxRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Your profile menu"
        aria-expanded={open}
        aria-haspopup="true"
        className="flex h-11 w-11 items-center justify-center rounded-full ring-2 ring-transparent transition hover:ring-ilc-gold/60 focus-visible:ring-ilc-gold"
      >
        <Avatar name={user.name} initials={user.initials} src={user.photo_url} size="sm" />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-100 bg-white text-ilc-ink shadow-xl">
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
            <Avatar name={user.name} initials={user.initials} src={user.photo_url} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs font-bold tracking-widest text-ilc-gold-deep uppercase">
                {ROLE_LABEL[user.role]}
              </p>
            </div>
          </div>
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center gap-2.5 px-4 text-sm hover:bg-gray-50"
          >
            <UserRound className="h-4 w-4 text-gray-600" aria-hidden="true" /> My profile
          </Link>
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="flex min-h-11 w-full items-center gap-2.5 border-t border-gray-100 px-4 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
