// Every call the page makes to the Flask backend.

// Where the backend is. Blank in development and in the all-in-one local build: the
// vite proxy (npm run dev) and Flask itself (npm run build) both serve the API on the
// page's own origin, so a relative /api/... already lands in the right place. On Render
// the page is a static site on its own domain, so VITE_API_URL is set at build time to
// the backend service's address and the calls go across to it.
const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

// The response body as JSON. With the backend window closed (or the backend crashed) the
// answer is empty or an HTML error page: that becomes a readable message, marked
// `backendDown` so it isn't shown as something MYOB said.
async function body(r) {
  const text = await r.text();
  const down = { error: `The backend is not answering (HTTP ${r.status}). Is its window still open?`, backendDown: true };
  if (!text) return r.ok ? {} : down;
  try {
    return JSON.parse(text);
  } catch {
    return down;
  }
}

async function json(r) {
  const d = await body(r);
  if (!r.ok || d.backendDown) {
    const err = new Error(d.error || `The backend answered HTTP ${r.status}.`);
    err.backendDown = !!d.backendDown || r.status >= 500;
    throw err;
  }
  return d;
}

export function getStatus() {
  return fetch(API + '/api/status').then(json);
}

export function testConnection() {
  // a 400 is MYOB's own answer ({ ok: false, error }); anything else wrong is the backend
  return fetch(API + '/api/test-connection', { method: 'POST' }).then(r => (r.status === 400 ? body(r) : json(r)));
}

export function syncItems() {
  return fetch(API + '/api/items/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
}

export function searchItems(q) {
  return fetch(API + '/api/items/search?q=' + encodeURIComponent(q)).then(json);
}

export function searchCustomers(q) {
  return fetch(API + '/api/customers?q=' + encodeURIComponent(q)).then(json);
}

export async function extractDocument(file) {
  const fd = new FormData();
  fd.append('file', file);
  return json(await fetch(API + '/api/extract', { method: 'POST', body: fd }));
}

// The line's quantity and unit refitted to a newly picked item (screws in packs, stock lengths).
export async function fitLine(line, code) {
  const keep = ['description', 'quantity', 'unit', 'length_mm', 'cut_lengths', 'doc_quantity', 'doc_unit', 'fit_quantity'];
  const r = await fetch(API + '/api/fit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, line: Object.fromEntries(keep.map(k => [k, line[k] ?? null])) }),
  });
  return json(r);
}

export async function createQuote(quote) {
  const r = await fetch(API + '/api/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quote),
  });
  return json(r);
}
