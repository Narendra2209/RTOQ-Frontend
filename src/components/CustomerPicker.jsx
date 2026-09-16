import { useEffect, useRef, useState } from 'react';
import { searchCustomers } from '../api.js';

// Customer search box. `initialQuery` is the name read off the document: if it is
// exactly one MYOB customer, that customer is taken (it can still be changed).
export default function CustomerPicker({ text, setText, onPick, onClear, initialQuery }) {
  const [list, setList] = useState(null); // null = closed, else { error } | { none } | { rows }
  const typeTimer = useRef(null);
  const hideTimer = useRef(null);
  const request = useRef(0);
  // The document's name is auto-picked even if a focus search for the same name overtakes it.
  const pendingAutoPick = useRef(false);

  function pick(c) {
    request.current++; // a search still on its way must not reopen the list
    pendingAutoPick.current = false;
    onPick({ id: c.id, name: c.name || '' });
    setText(`${c.id} — ${c.name || ''}`);
    setList(null);
  }

  async function search(q, autoPick) {
    if (!q || q.length < 2) return;
    const auto = autoPick || (pendingAutoPick.current && q === initialQuery);
    const id = ++request.current;
    let res;
    try {
      res = await searchCustomers(q);
    } catch (err) {
      res = { error: err.message };
    }
    if (id !== request.current) return;
    if (auto) pendingAutoPick.current = false;
    if (res.error) { setList({ error: res.error }); return; }
    if (!res.length) { setList({ none: true }); return; }
    const exact = res.filter(c => c.exact);
    if (auto && exact.length === 1) { pick(exact[0]); return; }
    setList({ rows: res });
  }

  useEffect(() => {
    if (initialQuery) {
      pendingAutoPick.current = true;
      search(initialQuery, true);
    }
    return () => { clearTimeout(typeTimer.current); clearTimeout(hideTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onChange(e) {
    const v = e.target.value;
    setText(v);
    onClear();
    pendingAutoPick.current = false;
    clearTimeout(typeTimer.current);
    typeTimer.current = setTimeout(() => search(v), 280);
  }

  function onFocus(e) {
    clearTimeout(hideTimer.current);
    if (e.target.value) search(e.target.value);
  }

  function onBlur() {
    hideTimer.current = setTimeout(() => setList(null), 180);
  }

  return (
    <>
      <input id="cust" placeholder="Search by name or code" autoComplete="off"
             value={text} onChange={onChange} onFocus={onFocus} onBlur={onBlur} />
      {list && (
        <div className="drop-list">
          {list.error && <div className="none">{list.error}</div>}
          {list.none && <div className="none">No customer matches that. Check the spelling, or use their MYOB code.</div>}
          {list.rows && list.rows.map((c, i) => (
            <button key={i + ':' + c.id} onMouseDown={e => e.preventDefault()} onClick={() => pick(c)}>
              <span className="code">{c.id}</span>{' '}
              <span className="d">{c.name || ''}{c.price_class ? ' · price class ' + c.price_class : ''}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
