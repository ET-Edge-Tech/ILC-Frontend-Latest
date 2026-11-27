// Turns the rows of an Excel sheet into checked rows for the SPOC bulk upload preview.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Accepts a few spellings of each column heading.
const HEADINGS = {
  name: ['name', 'full name'],
  email: ['email', 'email address'],
  title: ['title', 'designation'],
  phone: ['phone', 'mobile'],
};

export const TEMPLATE_HEAD = ['Name', 'Email', 'Title', 'Phone'];
export const TEMPLATE_EXAMPLE = ['Rahul Mehta', 'rahul.mehta@example.com', 'Relationship Manager', '+91 98765 43210'];
export const MAX_ROWS = 200;

const clean = (v) => (v === null || v === undefined ? '' : String(v).trim());

export function parseSheet(data) {
  if (!data || data.length < 2) return { rows: [], error: 'The file has no data rows. Use the template and fill in the rows under the headings.' };

  const header = data[0].map((h) => clean(h).toLowerCase());
  const col = {};
  for (const [key, names] of Object.entries(HEADINGS)) col[key] = header.findIndex((h) => names.includes(h));
  const missing = ['name', 'email'].filter((k) => col[k] === -1);
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
      phone: get('phone'),
    };
    if (!row.name && !row.email) return; // skip fully empty rows

    const problems = [];
    if (!row.name) problems.push('name is missing');
    if (!EMAIL.test(row.email)) problems.push('email is not valid');
    if (row.email && seen.has(row.email)) problems.push('email is repeated in this file');
    seen.add(row.email);

    rows.push({ ...row, problems });
  });

  if (rows.length === 0) return { rows: [], error: 'No rows found under the headings.' };
  return { rows, error: null };
}
