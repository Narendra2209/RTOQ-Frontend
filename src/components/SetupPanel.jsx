import { useState } from 'react';
import { syncItems, testConnection } from '../api.js';

export default function SetupPanel({ open, status, onRefresh }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');

  const ready = !!status && status.missing.length === 0;

  const setupMsg = testResult || (
    !status ? 'Checking your settings.'
      : ready ? 'Settings look complete. Test it to be sure.'
      : 'Still missing from your .env file: ' + status.missing.join(', ')
  );

  const itemMsg = !status ? 'No items loaded yet.'
    : status.sync.running ? (status.sync.message || 'Pulling items')
    : status.sync.error ? 'Last pull failed: ' + status.sync.error
    : status.items ? status.items.toLocaleString() + ' codes ready for matching.'
    : 'No items loaded. Pull them from MYOB, or drop an items.csv into backend/data.';

  async function test() {
    setTesting(true);
    try {
      const r = await testConnection();
      setTestResult(r.ok ? 'Connected to MYOB.' : 'MYOB said: ' + r.error);
    } catch (err) {
      setTestResult('Server not reachable: ' + err.message);
    }
    setTesting(false);
    onRefresh();
  }

  async function sync() {
    try {
      await syncItems();
    } catch {
      // the next status check shows what happened
    }
    setTimeout(onRefresh, 600);
  }

  return (
    <div id="setup" className={open ? 'open' : ''}>
      <div className="grid">
        <div>
          <h3>MYOB connection</h3>
          <p>{setupMsg}</p>
          <div className="actions">
            <button className="btn" onClick={test} disabled={testing}>
              {testing ? 'Testing' : 'Test connection'}
            </button>
          </div>
        </div>
        <div>
          <h3>Item catalogue</h3>
          <p>{itemMsg}</p>
          <div className="actions">
            <button className="btn" onClick={sync} disabled={!status || status.sync.running || !ready}>
              Pull items from MYOB
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
