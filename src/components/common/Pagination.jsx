import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({
  pageNumber = 0,
  totalPages = 1,
  totalElements = 0,
  pageSize = 20,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const startIdx = pageNumber * pageSize + 1;
  const endIdx = Math.min((pageNumber + 1) * pageSize, totalElements);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 1.25rem',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--slate-50)',
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
      }}
    >
      <div>
        Showing <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{startIdx}</span> to{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{endIdx}</span> of{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{totalElements}</span> results
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={pageNumber === 0}
          onClick={() => onPageChange(pageNumber - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span>Prev</span>
        </button>

        <span style={{ padding: '0 0.5rem', fontWeight: 500 }}>
          Page {pageNumber + 1} of {totalPages}
        </span>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={pageNumber >= totalPages - 1}
          onClick={() => onPageChange(pageNumber + 1)}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

Pagination.propTypes = {
  pageNumber: PropTypes.number,
  totalPages: PropTypes.number,
  totalElements: PropTypes.number,
  pageSize: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
};
