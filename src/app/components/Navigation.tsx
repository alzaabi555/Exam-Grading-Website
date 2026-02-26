import { NavLink } from 'react-router';
import { Users, Settings, Upload, CheckSquare, Printer, FileText, HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

export function Navigation() {
  // تم ترتيب القائمة لتكون بمثابة "خطوات عمل متسلسلة"
  const navItems = [
    { path: '/students', icon: Users, label: '1. قوائم الطلاب' },
    { path: '/mark-distribution', icon: Settings, label: '2. قوالب الدرجات' },
    { path: '/', icon: Upload, label: '3. رفع الأوراق' },
    { path: '/grade', icon: CheckSquare, label: '4. واجهة التصحيح' },
    { path: '/dashboard', icon: Printer, label: '5. النتائج والطباعة' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20 shrink-0">
      <div className="h-20 flex items-center justify-center border-b border-slate-800 px-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2 w-full">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FileText className="text-white w-5 h-5" />
          </div>
          المصحح السريع
        </h1>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        <p className="text-xs font-bold text-slate-500 mb-4 px-2">تسلسل العمل:</p>
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
                <h3 className="font-bold text-blue-700 mb-2">التسلسل المنطقي الجديد</h3>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside pr-4">
                  <li><strong>قوائم الطلاب:</strong> ارفع ملف الإكسل لتسجيل الطلاب في النظام.</li>
                  <li><strong>قوالب الدرجات:</strong> حدد توزيع الدرجات لكل اختبار.</li>
                  <li><strong>رفع الأوراق:</strong> ارفع ملفات الـ PDF ليقوم النظام بربطها آلياً.</li>
                  <li><strong>واجهة التصحيح:</strong> اختم الأوراق وارصد الدرجات.</li>
                  <li><strong>النتائج والطباعة:</strong> استعرض التقارير وقم بطباعة الأوراق المصححة.</li>
                </ol>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500 bg-slate-950/50">
        الإصدار 1.0.1
      </div>
    </aside>
  );
}
