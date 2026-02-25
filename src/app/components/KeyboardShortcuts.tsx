import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface ShortcutProps {
  onScoreShortcut?: (score: number) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  maxScore?: number;
}

export function KeyboardShortcuts({ onScoreShortcut, onNext, onPrevious, maxScore = 10 }: ShortcutProps) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // مفاتيح الأرقام للرصد (0-9)
      if (e.key >= '0' && e.key <= '9') {
        const score = parseInt(e.key);
        if (score <= maxScore && onScoreShortcut) {
          onScoreShortcut(score);
        }
      }

      // تخصيص مفاتيح الأسهم بما يتناسب مع الاتجاه العربي
      if (e.key === 'ArrowLeft' && onNext) {
        e.preventDefault();
        onNext(); // السهم الأيسر للتقدم في الواجهة العربية
      }
      if (e.key === 'ArrowRight' && onPrevious) {
        e.preventDefault();
        onPrevious(); // السهم الأيمن للرجوع في الواجهة العربية
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onScoreShortcut, onNext, onPrevious, maxScore]);

  return null;
}

export function KeyboardShortcutsHelp() {
  return (
    <Card className="border-2 border-blue-200 bg-blue-50 text-right" dir="rtl">
      <CardHeader>
        <CardTitle className="text-base font-bold">اختصارات لوحة المفاتيح</CardTitle>
        <CardDescription>سرّع عملية التصحيح باستخدام هذه الاختصارات</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">رصد الدرجة (0-9)</span>
          <Badge variant="outline" className="bg-white font-sans">الأرقام 0-9</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">الإجابة التالية</span>
          <Badge variant="outline" className="bg-white font-sans">سهم يسار ←</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">الإجابة السابقة</span>
          <Badge variant="outline" className="bg-white font-sans">سهم يمين →</Badge>
        </div>
      </CardContent>
    </Card>
  );
}