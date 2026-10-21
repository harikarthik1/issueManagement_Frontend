import PropTypes from 'prop-types';
import { formatStatus, formatPriority, formatRole } from '../../utils/formatters';

export function StatusBadge({ status }) {
  if (!status) return null;
  const key = String(status).toLowerCase();
  return (
    <span className={`badge badge-status-${key}`}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor', display: 'inline-block' }} />
      {formatStatus(status)}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
};

export function PriorityBadge({ priority }) {
  if (!priority) return null;
  const key = String(priority).toLowerCase();
  return (
    <span className={`badge badge-priority-${key}`}>
      {formatPriority(priority)}
    </span>
  );
}

PriorityBadge.propTypes = {
  priority: PropTypes.string,
};

export function RoleBadge({ role }) {
  if (!role) return null;
  const key = String(role).toLowerCase();
  return (
    <span className={`badge badge-role-${key}`}>
      {formatRole(role)}
    </span>
  );
}

RoleBadge.propTypes = {
  role: PropTypes.string,
};

export function TypeBadge({ type }) {
  if (!type) return null;
  return (
    <span
      className="badge"
      style={{
        backgroundColor: 'var(--slate-100)',
        color: 'var(--slate-700)',
        border: '1px solid var(--slate-200)',
      }}
    >
      {type}
    </span>
  );
}

TypeBadge.propTypes = {
  type: PropTypes.string,
};
