import PropTypes from 'prop-types';

export function Skeleton({ width = '100%', height = '1.25rem', style = {}, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={{ width, height, ...style }}
    />
  );
}

Skeleton.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  style: PropTypes.object,
  className: PropTypes.string,
};

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <Skeleton width="60%" height="1rem" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}>
                  <Skeleton width={c === 0 ? '40%' : '80%'} height="1.1rem" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

TableSkeleton.propTypes = {
  rows: PropTypes.number,
  cols: PropTypes.number,
};

export function CardSkeleton() {
  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Skeleton width="40%" height="1.25rem" />
      <Skeleton width="90%" height="0.875rem" />
      <Skeleton width="70%" height="0.875rem" />
    </div>
  );
}
