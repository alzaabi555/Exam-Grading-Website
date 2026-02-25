import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { WelcomeGuide } from './components/WelcomeGuide';
import { router } from './routes';
import { initializeSampleData } from './utils/storage';

export default function App() {
  useEffect(() => {
    // تهيئة البيانات التجريبية بالعربية عند أول تحميل
    initializeSampleData();
    
    // ضبط اتجاه الصفحة بالكامل للغة العربية
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      {/* قمت بإضافة dir="rtl" للتنبيهات لضمان ظهور رسائل النجاح والخطأ بشكل صحيح */}
      <Toaster dir="rtl" position="top-center" richColors />
      <WelcomeGuide />
    </>
  );
}