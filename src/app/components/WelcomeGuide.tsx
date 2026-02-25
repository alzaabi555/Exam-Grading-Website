import { useState } from 'react';
import { X, FileText, Upload, GraduationCap, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

export function WelcomeGuide() {
  const [isVisible, setIsVisible] = useState(
    !localStorage.getItem('welcomeGuideShown')
  );

  const handleClose = () => {
    localStorage.setItem('welcomeGuideShown', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="text-right">
              <CardTitle className="text-2xl font-bold">مرحباً بك في نظام تصحيح الاختبارات</CardTitle>
              <CardDescription>ابدأ الآن بتصحيح أوراق الاختبارات بكفاءة وسرعة</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">1. رفع الأوراق</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 text-right">
                  <li>• رفع أوراق الاختبار بصيغة PDF</li>
                  <li>• إضافة صور الإجابات مقسمة إلى أجزاء</li>
                  <li>• ربط كل جزء بأسئلة محددة</li>
                  <li>• تحديد الدرجة القصوى لكل جزء</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <GraduationCap className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">2. تصحيح الأوراق</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 text-right">
                  <li>• عرض الـ PDF وصور الإجابات جنباً إلى جنب</li>
                  <li>• رصد الدرجات عبر أزرار تفاعلية</li>
                  <li>• التنقل السريع بين (السابق/التالي)</li>
                  <li>• حساب تلقائي لإجمالي الدرجات</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">3. لوحة التحكم</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 text-right">
                  <li>• تتبع جميع الأوراق المرفوعة</li>
                  <li>• مراقبة تقدم عملية التصحيح</li>
                  <li>• عرض إحصائيات الإكمال</li>
                  <li>• إدارة توزيع الدرجات</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">4. نتائج الطلاب</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 text-right">
                  <li>• عرض تفصيلي لتوزيع الدرجات</li>
                  <li>• رؤية التقديرات والنسب المئوية</li>
                  <li>• تحليل دقيق لكل سؤال على حدة</li>
                  <li>• تصدير أو مشاركة النتائج</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base text-right">المميزات الرئيسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-right">
              <p>
                <strong>هوية فريدة:</strong> لكل ورقة وسؤال وجزء كود تعريفي خاص لضمان دقة التتبع.
              </p>
              <p>
                <strong>هيكل هرمي:</strong> (أوراق ← أسئلة ← أجزاء) مرتبطة ببعضها بدقة.
              </p>
              <p>
                <strong>قوالب الدرجات:</strong> إعداد مسبق لتوزيع الدرجات للاختبارات المتكررة.
              </p>
              <p>
                <strong>متابعة التقدم:</strong> رؤية فورية لمستوى الإنجاز في التصحيح.
              </p>
              <p>
                <strong>تخزين محلي:</strong> جميع بياناتك محفوظة بأمان في متصفحك (وضع التجربة).
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button onClick={handleClose} size="lg" className="px-8">
              ابدأ الآن
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}