import { useEffect, useState } from 'react';

// The uploaded document stays on the left so each line can be checked against the page.
export default function DocumentViewer({ file }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  return (
    <div id="doc">
      <div id="docbar"><span className="name">{file.name}</span></div>
      {url && (file.type === 'application/pdf'
        ? <embed src={`${url}#toolbar=1`} type="application/pdf" />
        : <img src={url} alt="The uploaded document" />)}
    </div>
  );
}
