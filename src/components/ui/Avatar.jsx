const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-xs', lg: 'h-16 w-16 text-base' };

// Same rule as the server: only words that start with a letter count ("Bulk 10" gives "BU"), and whole characters are used.
function initialsOf(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const named = words.filter((w) => /^\p{L}/u.test(w));
  const first = (w) => Array.from(w)[0];
  if (named.length >= 2) return (first(named[0]) + first(named[named.length - 1])).toUpperCase();
  return Array.from(named[0] ?? words[0]).slice(0, 2).join('').toUpperCase();
}

// Round photo, or initials when there is no photo.
export default function Avatar({ name, initials, src, size = 'md', className = '' }) {
  const box = `${sizes[size]} shrink-0 rounded-full ${className}`;
  if (src) return <img src={src} alt="" className={`${box} object-cover`} />;
  return (
    <span aria-hidden="true" className={`${box} flex items-center justify-center bg-ilc-sidebar font-bold tracking-wider text-ilc-gold`}>
      {initials || initialsOf(name)}
    </span>
  );
}
