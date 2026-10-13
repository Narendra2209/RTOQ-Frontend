import { useEffect, useRef, useState } from 'react';
import { createQuote, fitLine } from '../api.js';
import { newKey, withPickedCode } from '../utils.js';
import CustomerPicker from './CustomerPicker.jsx';
import DocumentViewer from './DocumentViewer.jsx';
import LineRow from './LineRow.jsx';
import QuoteDone from './QuoteDone.jsx';

// A line as it comes off the server, ready to edit. `_key` only keeps React rows apart.
const toScreenLine = l => ({ ...l, uom: l.uom || l.unit || '', unit_price: '', _key: newKey() });

// A document can give a number (a PO number) or a list where text is expected; show it as text.
const asText = v => (v ? String(v) : '');

export default function Workspace({ file, data, branch, setBranch, warehouse, setWarehouse, onStartOver }) {
  const [lines, setLines] = useState(() => (data.lines || []).map(toScreenLine));
  const [customer, setCustomer] = useState(null);
  const [custText, setCustText] = useState(asText(data.customer));
  const [reference, setReference] = useState(asText(data.reference));
  const [description, setDescription] = useState(
    () => [data.site_address, data.customer].filter(Boolean).join(' — ').slice(0, 250)
  );
  const [myobPrice, setMyobPrice] = useState(true);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);
  // One thing at a time above the lines: a message, or the created quote.
  const [notice, setNotice] = useState(data.match_warning ? { text: data.match_warning } : null);
  const msgsRef = useRef(null);

  useEffect(() => {
    if (notice?.result) msgsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [notice]);

  const updateLine = (key, change) =>
    setLines(ls => ls.map(l => (l._key === key ? change(l) : l)));

  const setField = (key, field, value) => updateLine(key, l => ({ ...l, [field]: value }));
  const clearCode = key => updateLine(key, l => (l.code === null ? l : { ...l, code: null }));
  const pickCode = (key, code, uom) => {
    const before = lines.find(l => l._key === key);
    updateLine(key, l => withPickedCode(l, code, uom));
    if (!before) return;
    // the quantity fitted to the picked item: 1500 screws are 2 packs of one, 15 bags of another
    fitLine({ ...before, code }, code)
      .then(fit => updateLine(key, l => (l.code === code ? { ...l, ...fit } : l)))
      // left as it was, the quantity would still be in the document's unit: say so on the line
      .catch(err => updateLine(key, l => (l.code === code
        ? { ...l, unit_warning: `The quantity wasn't worked out for ${code} (${err.message}): check it` }
        : l)));
  };
  const removeLine = key => setLines(ls => ls.filter(l => l._key !== key));
  const addLine = () => setLines(ls => [
    ...ls, { description: '', quantity: 1, uom: '', code: null, candidates: [], unit_price: '', _key: newKey() },
  ]);

  const missing = lines.filter(l => !l.code).length;
  const totalQty = lines.reduce((a, l) => a + (parseFloat(l.quantity) || 0), 0);
  const noQuantity = lines.filter(l => !(parseFloat(l.quantity) > 0)).length;
  const canCreate = !busy && !created && !!customer && lines.length > 0 && missing === 0 && noQuantity === 0;

  async function create() {
    setBusy(true);
    setNotice(null);
    try {
      const usePrices = !myobPrice;
      const body = {
        customer_id: customer.id,
        branch: branch.trim(),
        warehouse: warehouse.trim(),
        reference: reference.trim(),
        description: description.trim(),
        lines: lines.map(l => ({
          code: l.code, quantity: l.quantity, uom: l.uom,
          description: l.description, cut_lengths: l.cut_lengths || '',
          unit_price: usePrices && l.unit_price !== '' ? l.unit_price : null,
        })),
      };
      const result = await createQuote(body);
      setNotice({ result });
      setCreated(true); // one document, one quote: "Do another one" starts over
    } catch (err) {
      setNotice({ text: (err.backendDown ? '' : 'MYOB would not take it: ') + err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="work" className="on">
      <DocumentViewer file={file} />

      <div id="panel">
        <div className="head">
          <div className="fields">
            <div className="field wide">
              <label htmlFor="cust">Customer in MYOB</label>
              <CustomerPicker
                text={custText}
                setText={setCustText}
                onPick={setCustomer}
                onClear={() => setCustomer(null)}
                initialQuery={asText(data.customer)}
              />
            </div>
            <div className="field narrow">
              <label htmlFor="branch">Branch</label>
              <input id="branch" placeholder="e.g. MARCO, or blank" value={branch}
                     onChange={e => setBranch(e.target.value)} />
            </div>
            <div className="field narrow">
              <label htmlFor="warehouse">Warehouse</label>
              <input id="warehouse" placeholder="e.g. SUNBURY" value={warehouse}
                     onChange={e => setWarehouse(e.target.value)} />
            </div>
            <div className="field narrow">
              <label htmlFor="ref">Their reference</label>
              <input id="ref" placeholder="PO or job no." value={reference}
                     onChange={e => setReference(e.target.value)} />
            </div>
            <div className="field wide">
              <label htmlFor="descr">Quote description</label>
              <input id="descr" placeholder="Shown on the quote header" value={description}
                     onChange={e => setDescription(e.target.value)} />
            </div>
          </div>
          {data.notes ? <div className="notes">{asText(data.notes)}</div> : null}
        </div>

        <div id="msgs" ref={msgsRef}>
          {notice?.text && <div className={'msg' + (notice.good ? ' good' : '')}>{notice.text}</div>}
          {notice?.result && <QuoteDone result={notice.result} onStartOver={onStartOver} />}
        </div>

        <div className="lines">
          <h2>Lines read from the document</h2>
          <div id="rows">
            {lines.map(l => (
              <LineRow
                key={l._key}
                line={l}
                showPrice={!myobPrice}
                onField={(field, value) => setField(l._key, field, value)}
                onRemove={() => removeLine(l._key)}
                onClearCode={() => clearCode(l._key)}
                onPickCode={(code, uom) => pickCode(l._key, code, uom)}
              />
            ))}
          </div>
          <button className="btn quiet addline" onClick={addLine}>Add a line</button>
        </div>

        <div id="bar">
          <span className="tally">
            <b>{lines.length}</b> lines · <b className="num">{totalQty.toLocaleString()}</b> total quantity
            {missing ? <> · <span className="bad">{missing} still need a code</span></> : null}
            {noQuantity ? <> · <span className="bad">{noQuantity} need a quantity</span></> : null}
            {customer ? null : ' · pick a customer'}
          </span>
          <label className="check">
            <input type="checkbox" checked={myobPrice} onChange={e => setMyobPrice(e.target.checked)} />
            {' '}Let MYOB price it from the customer's price class
          </label>
          <span className="spacer" />
          <button className="btn primary" disabled={!canCreate} onClick={create}>
            {busy ? <><span className="spin" />Creating</> : 'Create quote in MYOB'}
          </button>
        </div>
      </div>
    </section>
  );
}
