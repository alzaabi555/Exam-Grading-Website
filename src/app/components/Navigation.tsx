import { NavLink } from 'react-router';
import { LayoutDashboard, Upload, CheckSquare, Settings, FileText, HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

export function Navigation() {
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
    { path: '/', icon: Upload, label: 'رفع الأوراق' },
    { path: '/grade', icon: CheckSquare, label: 'واجهة التصحيح' },
    { path: '/mark-distribution', icon: Settings, label: 'قوالب الدرجات' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20 shrink-0">
      {/* شعار واسم البرنامج */}
      <div className="h-20 flex items-center justify-center border-b border-slate-800 px-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2 w-full">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FileText className="text-white w-5 h-5" />
          </div>
          المصحح السريع
        </h1>
      </div>
      
      {/* قائمة الروابط */}
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white font-medium shadow-md translate-x-[-4px]' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* زر معلومات النظام (الذي قمت أنت بتصميمه) */}
      <div className="p-4 border-t border-slate-800">
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex items-center gap-3 px-4 py-3 w-full text-right rounded-lg hover:bg-slate-800 hover:text-white transition-all duration-200">
              <HelpCircle className="w-5 h-5" />
              <span>معلومات النظام</span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto text-right bg-white" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-xl text-slate-800">معلومات النظام</DialogTitle>
              <DialogDescription className="text-slate-500">
                تعرف على كيفية استخدام نظام تصحيح الاختبارات بفعالية
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <h3 className="font-bold text-blue-700 mb-2">الرفع الجماعي الذكي</h3>
                <p className="text-sm text-gray-600 mb-2">
                  يسمح لك النظام الجديد برفع مئات الأوراق دفعة واحدة:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside pr-4">
                  <li>قم بتسمية ملف الـ PDF برقم الطالب (مثال: 1005.pdf).</li>
                  <li>سيقوم النظام بمطابقة الرقم مع قائمة الطلاب المحفوظة لديك آلياً.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-blue-700 mb-2">اختصارات لوحة المفاتيح في التصحيح</h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside pr-4">
                  <li><strong>الأرقام 0-9</strong>: لرصد الدرجة للجزء الحالي.</li>
                  <li><strong>زر Tab</strong>: للانتقال للسؤال أو الجزء التالي بسرعة دون استخدام الماوس.</li>
                  <li><strong>عجلة الماوس + Ctrl</strong>: لتكبير أو تصغير ورقة الـ PDF.</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800 leading-relaxed">
                  <strong>ملاحظة (وضع التجربة):</strong> هذا التطبيق يستخدم التخزين المحلي للمتصفح (localStorage). 
                  البيانات تبقى محفوظة على جهازك، ولكن يُنصح بأخذ نسخة احتياطية من كشوف الدرجات بانتظام.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* تذييل الشريط الجانبي (الإصدار) */}
      <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500 bg-slate-950/50">
        الإصدار 1.0.0
      </div>
    </aside>
  );
}
