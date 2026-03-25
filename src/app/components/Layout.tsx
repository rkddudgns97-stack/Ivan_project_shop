import { Outlet, useLocation } from 'react-router';
import { Header } from './Header';

export function Layout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: isAdmin ? 'var(--surface-admin)' : 'var(--surface-app)' }}
    >
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
