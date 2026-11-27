import {
  Activity,
  Bell,
  Briefcase,
  Camera,
  Handshake,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarHeart,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  HardDrive,
  KeyRound,
  Image,
  LayoutDashboard,
  Library,
  Mail,
  Newspaper,
  Megaphone,
  Route,
  ScrollText,
  SlidersHorizontal,
  UserCog,
  Wrench,
  Users,
  UsersRound,
  UserPlus,
} from 'lucide-react';
import { can } from '../../features/auth/routing.js';

// Sidebar menus per role. An item with `children` becomes a dropdown group.
// `search` / `notSearch` let two items share one path (Knowledge and Glimpses).
const ceo = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Events', to: '/events', icon: CalendarDays },
  { label: 'My Schedule', to: '/meetings', icon: CalendarCheck },
  { label: 'News', to: '/news', icon: Newspaper },
  { label: 'Magazine', to: '/magazine', icon: Library },
  { label: 'The Council', to: '/council', icon: UsersRound },
  {
    label: 'Knowledge',
    icon: BookOpen,
    children: [
      { label: 'Resources', to: '/resources', notSearch: 'section=glimpses' },
      { label: 'Glimpses', to: '/resources', search: 'section=glimpses', notSearch: 'saved=1' },
      { label: 'Saved photos', to: '/resources', search: 'section=glimpses&saved=1' },
    ],
  },
  { label: 'Announcements', to: '/announcements', icon: Megaphone },
];

// What the relationship manager workspace shows. Each item needs the matching permission.
// Kept short on purpose: related pages are tabs inside one item (see features/ops/SpocTabs.jsx), and `also` keeps the
// item lit on those tab pages.
const spocBase = [
  { label: 'Overview', to: '/spoc', icon: LayoutDashboard, end: true, perm: 'spoc.members' },
  { label: 'My Day', to: '/spoc/today', icon: CalendarClock, perm: 'spoc.members', also: ['/spoc/calendar', '/spoc/signals', '/spoc/photos'] },
  { label: 'My Members', to: '/spoc/members', icon: Users, perm: 'spoc.members' },
  { label: 'Year Plans', to: '/spoc/journey', icon: Route, perm: 'spoc.members' },
  { label: 'Events', to: '/events', icon: CalendarDays, also: ['/spoc/after-event', '/spoc/et-edge'] },
  {
    label: 'Reading',
    icon: BookOpen,
    children: [
      { label: 'Knowledge', to: '/resources', icon: BookOpen },
      { label: 'Announcements', to: '/announcements', icon: Megaphone },
    ],
  },
];

// Every staff page, with the permission it needs. The same list builds the Admin menu, and the extra tools
// a relationship manager may have been given. (The server checks every request too: a hidden item is never the protection.)
const staff = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true, adminOnly: true },
  { label: 'Events', staffLabel: 'Manage Events', to: '/admin/events', icon: CalendarDays, perm: 'events.manage' },
  { label: 'ET Edge Requests', to: '/admin/et-edge', icon: Handshake, perm: 'events.manage' },
  { label: 'Member Photos', to: '/admin/photos', icon: Camera, perm: 'photos.review' },
  {
    label: 'Members',
    icon: Users,
    children: [
      { label: 'All Members', to: '/admin/members', icon: Users, perm: 'members.manage' },
      { label: 'Pending Invites', to: '/admin/pending-invites', icon: UserPlus, perm: 'members.manage' },
      { label: 'Form Progress', to: '/admin/form-progress', icon: ClipboardList, perm: 'forms.view' },
      { label: 'Manage SPOCs', to: '/admin/spocs', icon: UserCog, perm: 'spocs.manage' },
      { label: 'Industries', to: '/admin/industries', icon: Briefcase, perm: 'members.manage' },
    ],
  },
  {
    label: 'Operations',
    icon: Activity,
    children: [
      { label: 'Leadership Dashboard', to: '/admin/ops', icon: LayoutDashboard, end: true, perm: 'ops.view' },
      { label: 'Alerts', to: '/admin/ops/signals', icon: Bell, perm: 'ops.view' },
      { label: 'Member Health', to: '/admin/ops/members', icon: Users, perm: 'ops.view' },
      { label: 'Year Plans', to: '/admin/ops/journey', icon: Route, perm: 'ops.view' },
      { label: 'Ops Settings', to: '/admin/ops/settings', icon: SlidersHorizontal, perm: 'ops.settings' },
    ],
  },
  {
    label: 'Content',
    icon: FolderOpen,
    children: [
      { label: 'Resources', to: '/admin/resources', icon: BookOpen, perm: 'content.manage' },
      { label: 'Glimpses', to: '/admin/glimpses', icon: Image, perm: 'content.manage' },
      { label: 'Announcements', to: '/admin/announcements', icon: Megaphone, perm: 'content.manage' },
      { label: 'News', to: '/admin/news', icon: Newspaper, perm: 'content.manage' },
      { label: 'Magazine', to: '/admin/magazine', icon: Library, perm: 'content.manage' },
      { label: 'Broadcast', to: '/admin/broadcast', icon: Mail, perm: 'broadcast.send' },
      { label: 'Storage', to: '/admin/storage', icon: HardDrive, perm: 'storage.manage' },
    ],
  },
  { label: 'Audit Logs', to: '/admin/audit-logs', icon: ScrollText, perm: 'audit.view' },
  { label: 'Access', to: '/admin/access', icon: KeyRound, perm: 'access.manage' },
];

// Keeps only what this person may use. A group with nothing left disappears.
function allowed(items, user, { admin }) {
  const out = [];
  for (const item of items) {
    if (item.adminOnly && !admin) continue;
    if (item.children) {
      const children = allowed(item.children, user, { admin });
      if (children.length) out.push({ ...item, children });
    } else if (!item.perm || can(user, item.perm)) {
      out.push(item);
    }
  }
  return out;
}

// The "Admin Controls" label shows for Super Admin too (the old app showed the CEO label).
export function navFor(user) {
  const role = user.role;
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return { section: 'Admin Controls', items: allowed(staff, user, { admin: true }) };
  }
  if (role === 'SPOC') {
    const base = allowed(spocBase, user, { admin: false });
    // Extra staff tools this relationship manager was given, in one group.
    const extras = allowed(staff, user, { admin: false })
      .flatMap((i) => (i.children ? i.children : [i]))
      .map((i) => ({ ...i, label: i.staffLabel ?? i.label }));
    return {
      section: 'SPOC Portal',
      items: extras.length ? [...base, { label: 'Staff tools', icon: Wrench, children: extras }] : base,
    };
  }
  return { section: 'Executive Navigation', items: ceo };
}

// Every clickable item, with groups flattened. Used for the page title.
export const flattenNav = (items) => items.flatMap((i) => (i.children ? i.children : [i]));

// Used for a page that is not a menu item (profile, notifications ...).
export const EXTRA_TITLES = {
  '/profile': 'My Profile',
  '/notifications': 'Notifications',
  '/admin/members/new': 'Add Member',
  '/admin/members/bulk': 'Bulk Upload',
  '/admin/events/new': 'New Event',
  '/admin/access': 'Access',
};

export function isActive(item, pathname, search) {
  if (item.also?.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  const samePath = item.end
    ? pathname === item.to
    : pathname === item.to || pathname.startsWith(`${item.to}/`);
  if (!samePath) return false;
  if (item.search && !search.includes(item.search)) return false;
  if (item.notSearch && search.includes(item.notSearch)) return false;
  return true;
}

export const groupHasActive = (group, pathname, search) =>
  group.children.some((c) => isActive(c, pathname, search));
