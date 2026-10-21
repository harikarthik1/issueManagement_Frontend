import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages/auth/LoginPage';
import { authApi } from '../api/authApi';
import { Role } from '../utils/constants';

vi.mock('../api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    registerAdmin: vi.fn(),
    changePassword: vi.fn(),
  },
}));

// Mock ToastContext
vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

describe('Authentication Journey', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders login form inputs correctly', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('submits valid credentials to backend auth API and establishes authenticated state', async () => {
    const mockAuthResponse = {
      token: 'jwt-test-token-12345',
      tokenType: 'Bearer',
      expiresInMs: 86400000,
      user: {
        id: 1,
        email: 'admin@company.com',
        firstName: 'System',
        lastName: 'Admin',
        role: Role.ADMIN,
        active: true,
        passwordChangeRequired: false,
      },
    };

    authApi.login.mockResolvedValueOnce(mockAuthResponse);

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'admin@company.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'SecretPassword123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'admin@company.com',
        password: 'SecretPassword123!',
      });
      expect(localStorage.getItem('token')).toBe('jwt-test-token-12345');
      expect(JSON.parse(localStorage.getItem('user'))).toEqual(mockAuthResponse.user);
    });
  });

  it('cleans up server session and local storage on logout', async () => {
    localStorage.setItem('token', 'existing-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'user@test.com', role: Role.EMPLOYEE }));

    authApi.logout.mockResolvedValueOnce({ success: true });

    function TestLogoutComponent() {
      const { logout, isAuthenticated } = useAuth();
      return (
        <div>
          <span>{isAuthenticated ? 'AUTHENTICATED' : 'LOGGED_OUT'}</span>
          <button onClick={logout}>Sign Out</button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <TestLogoutComponent />
      </AuthProvider>
    );

    expect(screen.getByText('AUTHENTICATED')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Sign Out'));

    await waitFor(() => {
      expect(authApi.logout).toHaveBeenCalled();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(screen.getByText('LOGGED_OUT')).toBeInTheDocument();
    });
  });
});
