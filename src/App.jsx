import { useCallback, useEffect, useRef, useState } from 'react';
import { getStatus } from './api.js';
import Header from './components/Header.jsx';
import SetupPanel from './components/SetupPanel.jsx';
import StartScreen from './components/StartScreen.jsx';
import Workspace from './components/Workspace.jsx';

const startOver = () => window.location.reload();

export default function App() {
  const [status, setStatus] = useState(null);
  const [unreachable, setUnreachable] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  // Branch and warehouse default to the server's settings, but only while they are blank.
  const [branch, setBranch] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [work, setWork] = useState(null); // { file, data } once a document has been read
  const pollTimer = useRef(null);

  const refresh = useCallback(async () => {
    clearTimeout(pollTimer.current);
    try {
      const s = await getStatus();
      setStatus(s);
      setUnreachable(false);
      if (s.branch) setBranch(b => b || s.branch);
      if (s.warehouse) setWarehouse(w => w || s.warehouse);
      // Keep checking while items are being pulled from MYOB.
      clearTimeout(pollTimer.current);
      if (s.sync.running) pollTimer.current = setTimeout(refresh, 2500);
    } catch {
      setUnreachable(true);
      // Try again, so the page recovers once the server is up (dev.bat starts both at once).
      clearTimeout(pollTimer.current);
      pollTimer.current = setTimeout(refresh, 2500);
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => clearTimeout(pollTimer.current);
  }, [refresh]);

  return (
    <>
      <Header
        status={status}
        unreachable={unreachable}
        onToggleSetup={() => setSetupOpen(o => !o)}
        showRestart={!!work}
        onRestart={startOver}
      />
      <SetupPanel open={setupOpen} status={status} onRefresh={refresh} />
      {work ? (
        <Workspace
          file={work.file}
          data={work.data}
          branch={branch}
          setBranch={setBranch}
          warehouse={warehouse}
          setWarehouse={setWarehouse}
          onStartOver={startOver}
        />
      ) : (
        <StartScreen status={status} onRead={(file, data) => setWork({ file, data })} onStartOver={startOver} />
      )}
    </>
  );
}
