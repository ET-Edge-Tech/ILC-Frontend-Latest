import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth-store.js';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import Toaster from '../ui/Toaster.jsx';
import { EXTRA_TITLES, flattenNav, isActive, navFor } from './nav.js';

// The app shell. Pages never wrap themselves in this: the router renders them through <Outlet />.
export default function DashboardLayout() {
  const user = useAuthStore((s) => s.user);
  const { pathname, search } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // <main> is the only scrolling area, so scroll it (not window) to the top on every page change.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname, search]);

  const { items } = navFor(user);
  const current = flattenNav(items).find((item) => isActive(item, pathname, search));
  const title = EXTRA_TITLES[pathname] ?? current?.label ?? 'ILC Member Portal';

  // Browser tab title follows the page.
  useEffect(() => {
    document.title = `${title} · ILC Member Portal`;
  }, [title]);

  return (
    <div className="flex h-screen overflow-hidden bg-ilc-page">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-ilc-gold focus:px-4 focus:py-2 focus:text-xs focus:font-bold"
      >
        Skip to content
      </a>

      <Sidebar open={menuOpen} onClose={closeMenu} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} onMenu={() => setMenuOpen(true)} />
        <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 overflow-y-auto px-4 py-6 focus:outline-none lg:px-16 lg:py-10">
          <h1 className="mb-6 font-serif text-2xl font-semibold text-ilc-purple lg:hidden">{title}</h1>
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
