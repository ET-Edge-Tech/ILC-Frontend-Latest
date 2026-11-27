import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, X } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { LOGO_URL } from '../../lib/constants.js';
import { useAuthStore } from '../../store/auth-store.js';
import { useLogout } from '../../features/auth/hooks.js';
import { useUnread } from '../../features/chat/hooks.js';
import { groupHasActive, isActive, navFor } from './nav.js';

const ROLE_LABEL = { CEO: 'Member', ADMIN: 'Admin', SUPER_ADMIN: 'Super Admin', SPOC: 'Relationship Manager' };

// One clickable menu link. `child` makes it smaller and indented under a group.
function Leaf({ item, active, child, onClose, badge = 0 }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.search ? `${item.to}?${item.search}` : item.to}
      onClick={onClose}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-2.5 rounded-md font-semibold tracking-[0.12em] uppercase transition-colors ${
        child ? 'min-h-9 pr-2 pl-3 text-[10px]' : 'min-h-10 px-3 text-[10.5px]'
      } ${active ? 'bg-white/[0.06] text-white' : 'text-gray-500 hover:bg-white/[0.03] hover:text-gray-300'}`}
    >
      {Icon && <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-ilc-gold' : ''}`} aria-hidden="true" />}
      <span className="flex-1">{item.label}</span>
      {badge > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
          {badge > 9 ? '9+' : badge}
          <span className="sr-only"> unread messages</span>
        </span>
      )}
      {active && <span className="h-1.5 w-1.5 rounded-full bg-ilc-gold shadow-[0_0_8px_var(--color-ilc-gold)]" />}
    </NavLink>
  );
}

// Dark sidebar. A fixed column on wide screens, a slide-in drawer on phones.
export default function Sidebar({ open, onClose }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { pathname, search } = useLocation();
  const { section, items } = navFor(user);
  const closeRef = useRef(null);
  // The red number next to "The Council" (members only).
  const { data: unread = 0 } = useUnread(user.role === 'CEO');
  // Groups open by themselves when you are on one of their pages; clicking overrides that.
  const [toggled, setToggled] = useState({});

  // Escape closes the drawer; focus moves into it when it opens.
  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} aria-hidden="true" />}

      <aside
        id="sidebar"
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-x-hidden overflow-y-auto bg-ilc-sidebar transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-ilc-gold opacity-[0.03] blur-3xl" />

        <div className="relative flex items-center justify-between px-5 pt-6 pb-4">
          <div>
            <img src={LOGO_URL} alt="India Leadership Council" className="h-auto w-40 object-contain" />
            <div className="mt-3 h-px w-10 bg-ilc-gold" />
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label={section} className="relative flex-1 px-3 pb-4">
          <p className="mb-2 px-3 text-[9px] font-bold tracking-[0.4em] text-gray-500 uppercase">{section}</p>
          <ul className="space-y-0.5">
            {items.map((item) => {
              if (!item.children) {
                return (
                  <li key={item.label}>
                    <Leaf
                      item={item}
                      active={isActive(item, pathname, search)}
                      onClose={onClose}
                      badge={item.to === '/council' ? unread : 0}
                    />
                  </li>
                );
              }

              const Icon = item.icon;
              const hasActive = groupHasActive(item, pathname, search);
              const expanded = toggled[item.label] ?? hasActive;
              const panelId = `group-${item.label.replace(/\s+/g, '-').toLowerCase()}`;
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => setToggled((t) => ({ ...t, [item.label]: !expanded }))}
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    className={`flex min-h-10 w-full items-center gap-2.5 rounded-md px-3 text-[10.5px] font-semibold tracking-[0.12em] uppercase transition-colors ${
                      hasActive ? 'text-white' : 'text-gray-500 hover:bg-white/[0.03] hover:text-gray-300'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${hasActive ? 'text-ilc-gold' : ''}`} aria-hidden="true" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  {expanded && (
                    <ul id={panelId} className="mt-0.5 mb-1 ml-[1.15rem] space-y-0.5 border-l border-white/10 pl-2">
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <Leaf item={child} child active={isActive(child, pathname, search)} onClose={onClose} />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="relative border-t border-white/10 p-3">
          <NavLink
            to="/profile"
            onClick={onClose}
            aria-label="My profile"
            className="mb-2 flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-white/[0.05]"
          >
            <Avatar name={user.name} initials={user.initials} src={user.photo_url} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">{user.name}</p>
              <p className="truncate text-[9px] font-bold tracking-widest text-ilc-gold uppercase">
                {user.title || ROLE_LABEL[user.role]}
              </p>
            </div>
          </NavLink>
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="flex min-h-10 w-full items-center gap-2.5 rounded-md px-3 text-[10.5px] font-semibold tracking-[0.12em] text-red-400 uppercase hover:bg-red-500/10 disabled:opacity-60"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
