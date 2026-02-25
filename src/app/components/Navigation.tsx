import { Link, useLocation } from 'react-router';
import { FileText, Upload, LayoutDashboard, Settings, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

export function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-white" dir="rtl">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold">نظام تصحيح الاختبارات</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant={isActive('/') ? 'default' : 'ghost'}>
                <Upload className="w-4 h-4 ml-2" />
                رفع الملفات
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant={isActive('/dashboard') ? 'default' : 'ghost'}>
                <LayoutDashboard className="w-4 h-4 ml-2" />
                لوحة التحكم
              </Button>
            </Link>
            <Link to="/grade">
              <Button variant={isActive('/grade') ? 'default' : 'ghost'}>
                <FileText className="w-4 h-4 ml-2" />
                التصحيح
              </Button>
            </Link>
            <Link to="/mark-distribution">
              <Button variant={isActive('/mark-distribution') ? 'default' : 'ghost'}>
                <Settings className="w-4 h-4 ml-2" />
                الإعدادات
              </Button>
            </Link>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="معلومات النظام">
                  <HelpCircle className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto text-right" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="text-xl">معلومات النظام</DialogTitle>
                  <DialogDescription>
                    تعرف على كيفية استخدام نظام تصحيح الاختبارات بفعالية
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <h3 className="font-bold text-blue-700 mb-2">نظام المعرفات (ID System)</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      يستخدم النظام معرفات فريدة لضمان دقة الربط بين البيانات:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside pr-4">
                      <li><strong>معرف الورقة</strong>: يربط الورقة بالكامل ببيانات الطالب.</li>
                      <li><strong>معرف السؤال</strong>: يربط الدرجات بسؤال محدد داخل الورقة.</li>
                      <li><strong>معرف الجزء</strong>: يربط صورة الإجابة بجزء محدد من السؤال.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-blue-700 mb-2">خطوات العمل</h3>
                    <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside pr-4">
                      <li><strong>رفع الأوراق</strong>: إضافة بيانات الطالب وملف الـ PDF وصور الإجابات.</li>
                      <li><strong>التصحيح</strong>: رصد الدرجات عبر النوافذ المنبثقة أو اختصارات المفاتيح.</li>
                      <li><strong>المراجعة</strong>: متابعة التقدم والإحصائيات من لوحة التحكم.</li>
                      <li><strong>النتائج</strong>: عرض تقارير أداء الطلاب التفصيلية.</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-bold text-blue-700 mb-2">اختصارات لوحة المفاتيح</h3>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside pr-4">
                      <li><strong>الأرقام 0-9</strong>: لرصد الدرجة للجزء الحالي مباشرة.</li>
                      <li><strong>السهم لليسار ←</strong>: الانتقال للجزء التالي.</li>
                      <li><strong>السهم لليمين →</strong>: العودة للجزء السابق.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-blue-700 mb-2">المميزات</h3>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside pr-4">
                      <li>هيكل تنظيمي دقيق: (أوراق ← أسئلة ← أجزاء).</li>
                      <li>حساب تلقائي وشامل للدرجات على مستوى الورقة.</li>
                      <li>تتبع حي للتقدم وحفظ الجلسات تلقائياً.</li>
                      <li>نماذج جاهزة لتوزيع الدرجات للاختبارات المتكررة.</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 leading-relaxed">
                      <strong>ملاحظة (وضع التجربة):</strong> هذا التطبيق يستخدم التخزين المحلي للمتصفح (localStorage). 
                      البيانات تبقى محفوظة في متصفحك، ولكن هذا الوضع غير مخصص للبيانات الحساسة جداً في بيئة الإنتاج الفعلي.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </nav>
  );
}