import { lineDetail, lineStatus } from '../utils.js';
import CodePicker from './CodePicker.jsx';

const numberValue = v => (v === '' ? '' : parseFloat(v));

export default function LineRow({ line, showPrice, onField, onRemove, onClearCode, onPickCode }) {
  const bits = lineDetail(line);

  return (
    <div className={'row ' + lineStatus(line)}>
      <div>
        <input className="desc" value={line.description || ''}
               onChange={e => onField('description', e.target.value)} />
        <div className="meta">
          {bits || 'No detail read from the page'}
          {line.match_reason ? <> · <b>{String(line.match_reason)}</b></> : null}
          {line.qty_note ? ' · ' + line.qty_note : null}
          {line.unit_warning ? <> · <b className="flag">{String(line.unit_warning)}</b></> : null}
        </div>
        <CodePicker line={line} onClearCode={onClearCode} onPick={onPickCode} />
      </div>
      <div>
        <input className="qty num" type="number" step="any" value={line.quantity ?? ''}
               onChange={e => onField('quantity', numberValue(e.target.value))} />
        <input className="uom" value={line.uom || ''} placeholder="UOM"
               onChange={e => onField('uom', e.target.value)} />
      </div>
      {/* Hidden, not removed, while MYOB prices the quote, so the columns stay put. */}
      <div style={{ visibility: showPrice ? 'visible' : 'hidden' }}>
        <input className="price num" type="number" step="0.01" value={line.unit_price ?? ''} placeholder="price"
               onChange={e => onField('unit_price', numberValue(e.target.value))} />
      </div>
      <button className="kill" title="Remove this line" onClick={onRemove}>×</button>
    </div>
  );
}
