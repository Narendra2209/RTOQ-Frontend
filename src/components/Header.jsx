export default function Header({ status, unreachable, onToggleSetup, showRestart, onRestart }) {
  const ready = status ? status.missing.length === 0 : false;

  let dot = 'dot';
  let text = 'checking';
  if (status) {
    dot = 'dot ' + (ready ? 'on' : 'off');
    text = ready ? (status.items ? status.items.toLocaleString() + ' items' : 'no items yet') : 'setup needed';
  }
  if (unreachable) text = 'server not reachable';

  return (
    <header>
      <h1>Quote Bridge</h1>
      <span className="sub">quote request in, MYOB quote out</span>
      <div className="right">
        <span id="conn"><span className={dot} />{text}</span>
        <button className="linkish" onClick={onToggleSetup}>Setup</button>
        {showRestart && <button className="linkish" onClick={onRestart}>New document</button>}
      </div>
    </header>
  );
}
