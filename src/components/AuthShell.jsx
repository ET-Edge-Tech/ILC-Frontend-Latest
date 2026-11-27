import { LOGO_URL } from '../lib/constants.js';

// Shared frame for every signed-out / gate screen: brand panel on wide screens, brand bar on phones.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="relative flex items-center justify-center overflow-hidden bg-ilc-sidebar px-6 py-8 lg:w-5/12 lg:py-0">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-ilc-gold opacity-[0.06] blur-3xl" />
        <div className="relative text-center">
          <img src={LOGO_URL} alt="India Leadership Council" className="mx-auto h-14 object-contain lg:h-auto lg:w-72" />
          <div className="mx-auto my-4 hidden h-px w-12 bg-ilc-gold lg:block" />
          <p className="hidden text-xs font-bold tracking-[0.3em] text-gray-700 uppercase lg:block">
            Secure Executive Network
          </p>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center bg-ilc-page px-4 py-10">
        <div className="w-full max-w-md">
          <h1 className="font-serif text-3xl font-semibold text-ilc-purple lg:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-center text-xs text-gray-600">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
