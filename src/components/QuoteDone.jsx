import { fmt } from '../utils.js';

// What MYOB sent back for the quote it created.
export default function QuoteDone({ result, onStartOver }) {
  return (
    <div className="done">
      <div className="label">Quote created in MYOB</div>
      <div className="n num">{result.order_nbr || ''}</div>
      <div className="summary">
        {result.status || ''}{result.total != null ? ' · total ' + fmt(result.total) : ''}
      </div>
      <table>
        <thead>
          <tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr>
        </thead>
        <tbody>
          {(result.lines || []).map((l, i) => (
            <tr key={i}>
              <td>{l.code}</td>
              <td className="num">{l.qty ?? ''}</td>
              <td className="num">{fmt(l.price)}</td>
              <td className="num">{fmt(l.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="again"><button className="btn" onClick={onStartOver}>Do another one</button></div>
    </div>
  );
}
