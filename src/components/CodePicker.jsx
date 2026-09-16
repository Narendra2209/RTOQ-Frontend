import { useEffect, useRef, useState } from 'react';
import { searchItems } from '../api.js';

// The item code box on a line: click into an empty box to see the line's shortlist,
// or type to search the whole catalogue.
export default function CodePicker({ line, onClearCode, onPick }) {
  const [text, setText] = useState(line.code || '');
  const [list, setList] = useState(null); // null = closed, else { rows } | { none } | { error }
  const typeTimer = useRef(null);
  const hideTimer = useRef(null);
  const request = useRef(0);

  useEffect(() => {
    if (line.code) setText(line.code);
  }, [line.code]);

  useEffect(() => () => { clearTimeout(typeTimer.current); clearTimeout(hideTimer.current); }, []);

  function onChange(e) {
    const v = e.target.value;
    setText(v);
    onClearCode();
    clearTimeout(typeTimer.current);
    typeTimer.current = setTimeout(async () => {
      const q = v.trim();
      if (q.length < 2) { request.current++; setList(null); return; }
      const id = ++request.current;
      let res;
      try {
        res = await searchItems(q);
      } catch (err) {
        if (id === request.current) setList({ error: err.message });
        return;
      }
      if (id !== request.current) return;
      setList(res.length ? { rows: res } : { none: true });
    }, 240);
  }

  function onFocus() {
    clearTimeout(hideTimer.current);
    if (!text && line.candidates?.length) setList({ rows: line.candidates.slice(0, 30) });
  }

  function onBlur() {
    hideTimer.current = setTimeout(() => setList(null), 160);
  }

  function choose(it) {
    request.current++;
    setText(it.code);
    onPick(it.code, it.uom || '');
    setList(null);
  }

  return (
    <div className="codepick">
      <input className={'codein ' + (line.code ? '' : 'empty')} autoComplete="off"
             value={text} placeholder="No code matched — type to search your MYOB items"
             onChange={onChange} onFocus={onFocus} onBlur={onBlur} />
      {list && (
        <div className="drop-list">
          {list.none && <div className="none">Nothing in the catalogue matches that.</div>}
          {list.error && <div className="none">Search failed: {list.error}</div>}
          {/* keyed by position: a hand-made items.csv can list the same code twice */}
          {list.rows && list.rows.map((it, i) => (
            <button key={i + ':' + it.code} onMouseDown={() => choose(it)}>
              <span className="code">{it.code}</span><span className="d">{' ' + (it.desc || '')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
