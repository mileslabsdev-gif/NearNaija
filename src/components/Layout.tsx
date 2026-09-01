import { Outlet, useLocation } from 'react-router-dom';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';

export function Layout() {
  const location = useLocation();
  const hideChrome = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideChrome && <TopNav />}
      <main className={`${hideChrome ? '' : 'pb-20 md:pb-0'} max-w-6xl mx-auto`}>
        <Outlet />
      </main>
      {!hideChrome && <BottomNav />}
    </div>
  );
}
