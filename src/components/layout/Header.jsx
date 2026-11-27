import { Menu } from 'lucide-react';
import { LOGO_URL } from '../../lib/constants.js';
import NotificationBell from './NotificationBell.jsx';
import ProfileMenu from './ProfileMenu.jsx';

export default function Header({ title, onMenu }) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 bg-ilc-sidebar px-4 text-white lg:h-24 lg:bg-ilc-page lg:px-16 lg:text-ilc-ink">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open menu"
        aria-controls="sidebar"
        className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10 lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Phone: logo in the bar. Desktop: page title and strapline. */}
      <img src={LOGO_URL} alt="India Leadership Council" className="h-11 object-contain lg:hidden" />

      <div className="hidden min-w-0 flex-1 lg:block">
        <p className="flex items-center gap-2 text-xs font-bold tracking-[0.3em] text-gray-700 uppercase">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
          Secure Executive Network
        </p>
        <h1 className="mt-1 truncate font-serif text-3xl font-semibold text-ilc-purple">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
}
