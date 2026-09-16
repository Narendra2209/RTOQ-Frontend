import { useRef, useState } from 'react';
import { extractDocument } from '../api.js';

export default function StartScreen({ status, onRead, onStartOver }) {
  const [stage, setStage] = useState('idle'); // idle | reading | failed
  const [error, setError] = useState('');
  const [hot, setHot] = useState(false);
  const fileInput = useRef(null);

  async function send(file) {
    if (!file || stage !== 'idle') return;
    setStage('reading');
    let data;
    try {
      data = await extractDocument(file);
    } catch (err) {
      setError(err.message);
      setStage('failed');
      setTimeout(onStartOver, 4000);
      return;
    }
    onRead(file, data);
  }

  const over = e => { e.preventDefault(); setHot(true); };
  const leave = e => { e.preventDefault(); setHot(false); };
  const dropped = e => { leave(e); send(e.dataTransfer.files[0]); };

  const missing = status ? status.missing : [];

  return (
    <section id="start">
      <h2>Turn a quote request into a MYOB quote.</h2>
      <p>Drop in the customer's request or a roof report. The lines come out on screen, you check them against the page, then push it across as a quote.</p>

      <div id="drop" className={hot ? 'hot' : ''}
           onDragEnter={over} onDragOver={over} onDragLeave={leave} onDrop={dropped}>
        {stage === 'idle' && (
          <>
            <div className="big">Drop a PDF here</div>
            <button className="btn" onClick={() => fileInput.current.click()}>Choose a file</button>
            <input type="file" ref={fileInput} accept=".pdf,application/pdf" hidden
                   onChange={e => send(e.target.files[0])} />
            <div className="small">The PDF is read on this computer. Nothing is sent anywhere except the finished quote, to MYOB.</div>
          </>
        )}
        {stage === 'reading' && (
          <>
            <div className="big"><span className="spin" />Reading the document</div>
            <div className="small">Pulling out the lines to quote.</div>
          </>
        )}
        {stage === 'failed' && (
          <>
            <div className="big">That did not work</div>
            <div className="small">{error}</div>
          </>
        )}
      </div>

      {missing.length > 0 && (
        <div className="warn">
          <strong>Finish setup first</strong>
          <ul>{missing.map(m => <li key={m}>{m}</li>)}</ul>
        </div>
      )}
    </section>
  );
}
