import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/auth-store.js';
import { can } from '../auth/routing.js';

// The relationship manager's menu is short; related pages show as tabs at the top of one page instead.
const GROUPS = {
  day: [
    { label: 'Today', to: '/spoc/today', perm: 'spoc.members' },
    { label: 'Calendar', to: '/spoc/calendar', perm: 'spoc.members' },
    { label: 'Alerts', to: '/spoc/signals', perm: 'spoc.members' },
    { label: 'Member Photos', to: '/spoc/photos', perm: 'photos.review' },
  ],
  events: [
    { label: 'Upcoming events', to: '/events' },
    { label: 'After an Event', to: '/spoc/after-event', perm: 'spoc.members' },
    { label: 'ET Edge Requests', to: '/spoc/et-edge', perm: 'spoc.members' },
  ],
};

// Shown only to a relationship manager (the same pages are separate menu items for Admins).
export default function SpocTabs({ group }) {
  const user = useAuthStore((s) => s.user);
  if (user?.role !== 'SPOC') return null;
  const tabs = GROUPS[group].filter((t) => !t.perm || can(user, t.perm));
  if (tabs.length < 2) return null;
  return (
    <nav aria-label="Sections" className="flex gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-1">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end
          className={({ isActive }) =>
            `inline-flex min-h-11 shrink-0 items-center rounded-xl px-4 text-sm font-bold whitespace-nowrap transition ${
              isActive ? 'bg-ilc-purple text-white shadow-sm' : 'text-gray-700 hover:bg-ilc-purple/5 hover:text-ilc-purple'
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
