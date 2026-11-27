// Where a signed-in user must go. First matching rule wins (Developer Guide, section 6).

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

export const GATE_ROUTES = ['/expired', '/set-password', '/onboarding', '/pending-approval'];

export function isMembershipExpired(user) {
  if (user.role !== 'CEO' || !user.membership_end) return false;
  const today = new Date().toISOString().slice(0, 10);
  return user.membership_end < today; // both are YYYY-MM-DD
}

// A screen the user is stuck on until they finish it, or null.
export function gateFor(user) {
  if (isMembershipExpired(user)) return '/expired';
  if (user.isFirstLogin) return '/set-password';
  if (user.role === 'CEO' && user.profileStatus === 'PENDING') return '/onboarding';
  if (user.role === 'CEO' && user.profileStatus === 'SUBMITTED') return '/pending-approval';
  return null;
}

// Does this person hold this permission? (The server decides the same thing on every request.)
export const can = (user, key) => Boolean(user?.permissions?.includes(key));

export function homeFor(user) {
  if (ADMIN_ROLES.includes(user.role)) return '/admin';
  if (user.role === 'SPOC') return can(user, 'spoc.members') ? '/spoc' : '/events';
  return '/dashboard';
}

// Which permission each staff page needs. More specific paths first.
export const PAGE_PERMISSIONS = [
  ['/admin/ops/settings', 'ops.settings'],
  ['/admin/ops', 'ops.view'],
  ['/admin/events', 'events.manage'],
  ['/admin/et-edge', 'events.manage'],
  ['/admin/photos', 'photos.review'],
  ['/admin/members', 'members.manage'],
  ['/admin/industries', 'members.manage'],
  ['/admin/pending-invites', 'members.manage'],
  ['/admin/form-progress', 'forms.view'],
  ['/admin/spocs', 'spocs.manage'],
  ['/admin/resources', 'content.manage'],
  ['/admin/glimpses', 'content.manage'],
  ['/admin/news', 'content.manage'],
  ['/admin/magazine', 'content.manage'],
  ['/admin/announcements', 'content.manage'],
  ['/admin/broadcast', 'broadcast.send'],
  ['/admin/storage', 'storage.manage'],
  ['/admin/audit-logs', 'audit.view'],
  ['/admin/access', 'access.manage'],
];

export function pagePermission(pathname) {
  const hit = PAGE_PERMISSIONS.find(([p]) => pathname === p || pathname.startsWith(`${p}/`));
  return hit ? hit[1] : null;
}

// Which area a path belongs to. Staff pages need the matching permission (any role may hold one);
// the Admin overview is for Admins; members cannot sit on staff pages.
export function areaAllowed(user, pathname) {
  if (pathname.startsWith('/admin')) {
    const need = pagePermission(pathname);
    return need ? can(user, need) : ADMIN_ROLES.includes(user.role);
  }
  if (pathname.startsWith('/spoc')) return user.role === 'SPOC' && can(user, 'spoc.members');
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/council') || pathname.startsWith('/meetings')) return user.role === 'CEO';
  return true;
}

// The /me answer uses snake_case; the stored user uses the token's names.
export function userFromMe(me) {
  return {
    id: me.id,
    email: me.email,
    name: me.name,
    title: me.title,
    initials: me.initials,
    role: me.role,
    photo_url: me.photo_url,
    isFirstLogin: me.is_first_login,
    profileStatus: me.profile_status,
    membership_end: me.membership_end ?? null,
    permissions: me.permissions ?? [],
    industry_id: me.industry_id ?? null,
  };
}
