import { Outlet } from 'react-router';
import { Navigation } from './Navigation';

export function Layout() {
  return (
    // أضفت dir="rtl" لضمان أن الخلفية وتوزيع العناصر يبدأ من اليمين
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Navigation />
      <main>
        <Outlet />
      </main>
    </div>
  );
}