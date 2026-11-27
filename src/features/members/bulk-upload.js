// Turns the rows of an Excel sheet into checked rows for the bulk upload preview.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Accepts a few spellings of each column heading.
const HEADINGS = {
  name: ['name', 'full name'],
  email: ['email', 'email address'],
  title: ['title', 'designation'],
  role: ['role'],
  phone: ['phone', 'mobile'],
  spoc_email: ['spoc email', 'spoc'],
};

export const TEMPLATE_HEAD = ['Name', 'Email', 'Title', 'Role', 'Phone', 'SPOC Email'];
export const TEMPLATE_EXAMPLE = ['Asha Rao', 'asha.rao@example.com', 'Managing Director', 'CEO', '+91 98765 43210', 'rm@ilc.in'];
export const MAX_ROWS = 200;

const clean = (v) => (v === null || v === undefined ? '' : String(v).trim());

export function parseSheet(data) {
  if (!data || data.length < 2) return { rows: [], error: 'The file has no data rows. Use the template and fill in the rows under the headings.' };

  const header = data[0].map((h) => clean(h).toLowerCase());
  const col = {};
  for (const [key, names] of Object.entries(HEADINGS)) col[key] = header.findIndex((h) => names.includes(h));
  const missing = ['name', 'email', 'title'].filter((k) => col[k] === -1);
  if (missing.length) return { rows: [], error: `Missing column heading: ${missing.join(', ')}. Use the template.` };

  const seen = new Set();
  const rows = [];
  data.slice(1).forEach((cells, i) => {
    const get = (k) => (col[k] === -1 ? '' : clean(cells[col[k]]));
    const row = {
      line: i + 2, // the row number as shown in Excel
      name: get('name'),
      email: get('email').toLowerCase(),
      title: get('title'),
      role: (get('role') || 'CEO').toUpperCase(),
      phone: get('phone'),
      spoc_email: get('spoc_email').toLowerCase(),
    };
    if (!row.name && !row.email && !row.title) return; // skip fully empty rows

    const problems = [];
    if (!row.name) problems.push('name is missing');
    if (!EMAIL.test(row.email)) problems.push('email is not valid');
    if (!row.title) problems.push('title is missing');
    if (!['CEO', 'ADMIN'].includes(row.role)) problems.push('role must be CEO or ADMIN');
    if (row.spoc_email && !EMAIL.test(row.spoc_email)) problems.push('SPOC email is not valid');
    if (row.email && seen.has(row.email)) problems.push('email is repeated in this file');
    seen.add(row.email);

    rows.push({ ...row, problems });
  });

  if (rows.length === 0) return { rows: [], error: 'No rows found under the headings.' };
  return { rows, error: null };
}
