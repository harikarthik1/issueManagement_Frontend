import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { FileQuestion } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--slate-100)',
          color: 'var(--slate-500)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <FileQuestion size={36} />
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>
        Page Not Found
      </h1>

      <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '420px', marginBottom: '1.5rem' }}>
        The page or resource you are looking for does not exist or has been moved.
      </p>

      <Link to="/dashboard">
        <Button variant="primary">Return to Dashboard</Button>
      </Link>
    </div>
  );
}
