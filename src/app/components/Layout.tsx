import { Outlet } from 'react-router';
import { Navigation } from './Navigation';

export function Layout() {
  return (
    // استخدام flex لتقسيم الشاشة بأكملها
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans" dir="rtl">
      
      {/* الشريط الجانبي الثابت */}
      <Navigation />
      
      {/* مساحة المحتوى الرئيسية (ديناميكية وقابلة للتمرير الداخلي) */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 min-h-full">
          <Outlet />
        </div>
      </main>
      
    </div>
  );
}
