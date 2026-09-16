// Same aliases as the server: "M" on a document is lineal metres, "NOS" is each, and so on.
export const UNIT_ALIASES = {
  M: 'LM', MT: 'LM', MTR: 'LM', METRE: 'LM', METRES: 'LM', 'L/M': 'LM',
  NO: 'EA', NOS: 'EA', EACH: 'EA', PC: 'EA', PCS: 'EA', ROLL: 'EA', ROLLS: 'EA', BOXES: 'BOX', SQM: 'M2',
};

export const unitKey = u => {
  u = String(u || '').trim().toUpperCase();
  return UNIT_ALIASES[u] || u;
};

// The item's own unit is what MYOB expects; flag it when the document counted in something else.
export function withPickedCode(line, code, uom) {
  const l = { ...line, code };
  if (uom) l.uom = uom;
  const docUnit = unitKey(l.unit);
  l.unit_warning = uom && docUnit && docUnit !== unitKey(uom)
    ? `Document says ${l.unit}, item is sold per ${uom}: check the quantity` : '';
  return l;
}

// Material, colour, profile and sizes read off the page, for the grey line under a row.
export function lineDetail(ln) {
  return [ln.material, ln.colour, ln.profile, ln.thickness,
    ln.girth_mm && ln.girth_mm + 'mm girth', ln.folds && ln.folds + ' folds',
    ln.length_mm && ln.length_mm + 'mm long'].filter(Boolean).join(' · ');
}

// The colour down the left of a row: no code yet, matched but unsure, or matched.
export function lineStatus(ln) {
  if (!ln.code) return 'needs';
  return (ln.confidence === 'low' || ln.match_confidence === 'low' || ln.unit_warning) ? 'unsure' : '';
}

let lastKey = 0;
export const newKey = () => ++lastKey;

export function fmt(n) {
  return n == null ? '' : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
