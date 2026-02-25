import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { getPapers } from '../utils/storage';
import { ExamPaper } from '../types/exam';
import { toast } from 'sonner';

export function GradingInterface() {
  const navigate = useNavigate();
  const [currentPaper, setCurrentPaper] = useState<ExamPaper | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});

  // تحميل أول ورقة تحتاج للتصحيح عند فتح الصفحة
  useEffect(() => {
    loadNextPaper();
  }, []);

  const loadNextPaper = () => {
    const papers = getPapers();
    // نبحث عن أول ورقة قيد الانتظار أو جاري العمل عليها
    const pendingPaper = papers.find(p => p.status !== 'completed');
    if (pendingPaper) {
      setCurrentPaper(pendingPaper);
      setScores({}); // تصفير العداد للورقة الجديدة
    } else {
      setCurrentPaper(null);
    }
  };

  const handleScoreChange = (partId: string, value: string, maxScore: number) => {
    let numValue = parseFloat(value);
    
    // منع إدخال قيم فارغة أو حروف
    if (isNaN(numValue)) {
      const newScores = { ...scores };
      delete newScores[partId];
      setScores(newScores);
      return;
    }

    // منع تجاوز الدرجة القصوى أو إدخال قيمة سالبة
    if (numValue > maxScore) numValue = maxScore;
    if (numValue < 0) numValue = 0;

    setScores(prev => ({ ...prev, [partId]: numValue }));
  };

  const calculateTotal = () => {
    return Object.values(scores).reduce((sum, score) => sum + score, 0);
  };

  const saveProgress = (isComplete: boolean = false) => {
    if (!currentPaper) return;

    const papers = getPapers();
    const paperIndex = papers.findIndex(p => p.id === currentPaper.id);

    if (paperIndex !== -1) {
      const totalScore = calculateTotal();
      
      papers[paperIndex] = {
        ...currentPaper,
        totalScore,
        status: isComplete ? 'completed' : 'in-progress',
        gradedDate: isComplete ? new Date().toISOString() : undefined,
      };

      localStorage.setItem('fastGrader_papers', JSON.stringify(papers));

      if (isComplete) {
        toast.success('تم إنهاء التصحيح! جارٍ تحميل الورقة التالية...');
        loadNextPaper(); // الانتقال التلقائي للورقة التالية لتسريع العمل
      } else {
        toast.success('تم حفظ التقدم مؤقتاً.');
      }
    }
  };

  // شاشة النجاح عند الانتهاء من كل الأوراق
  if (!currentPaper) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4" dir="rtl">
        <CheckCircle className="w-24 h-24 text-green-500 mb-4" />
        <h2 className="text-4xl font-bold text-slate-800">لا توجد أوراق بانتظار التصحيح!</h2>
        <p className="text-lg text-slate-500">لقد قمت بتصحيح جميع الأوراق المرفوعة بنجاح. عمل رائع يا أستاذ!</p>
        <Button onClick={() => navigate('/dashboard')} size="lg" className="mt-4">
          العودة للوحة التحكم
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-slate-100" dir="rtl">
      
      {/* --- العمود الأيمن: لوحة التصحيح ورصد الدرجات --- */}
      <div className="w-[380px] min-w-[350px] bg-white border-l shadow-2xl flex flex-col z-10">
        
        {/* معلومات الطالب (مثبتة بالأعلى) */}
        <div className="p-4 border-b bg-blue-50/50">
          <div className="flex justify-between items-center mb-3">
            <Badge className="bg-blue-600 text-sm px-3 py-1">
              {currentPaper.studentName}
            </Badge>
            <Badge variant="outline" className="bg-white text-slate-600">
              رقم: {currentPaper.studentId}
            </Badge>
          </div>
          <h2 className="font-bold text-slate-800 truncate" title={currentPaper.examName}>
            {currentPaper.examName}
          </h2>
        </div>

        {/* قائمة الأسئلة (قابلة للتمرير) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
          {currentPaper.questions.map((question, qIdx) => (
            <Card key={question.id} className="border-blue-100 shadow-sm overflow-hidden">
              <CardHeader className="py-2 bg-slate-50 border-b">
                <CardTitle className="text-sm font-bold text-slate-700 flex justify-between items-center">
                  <span>السؤال {question.questionNumber}</span>
                  <span className="text-xs font-normal text-slate-500">{question.totalMaxScore} درجات</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3 bg-white">
                {question.parts.map((part, pIdx) => (
                  <div key={part.id} className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-slate-600">الجزء {part.partNumber}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max={part.maxScore}
                        step="0.5"
                        className="w-20 text-center font-bold text-lg border-blue-200 focus-visible:ring-blue-500"
                        value={scores[part.id] ?? ''}
                        onChange={(e) => handleScoreChange(part.id, e.target.value, part.maxScore)}
                        placeholder="-"
                        autoFocus={qIdx === 0 && pIdx === 0} // التركيز التلقائي لبدء الكتابة فوراً
                      />
                      <span className="text-slate-400 text-sm w-8 text-left">/ {part.maxScore}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* شريط الأزرار والمجموع (مثبت بالأسفل) */}
        <div className="p-4 border-t bg-slate-50 space-y-4">
          <div className="flex justify-between items-center bg-white p-3 rounded-lg border font-bold text-lg shadow-sm">
            <span className="text-slate-600">المجموع الكلي:</span>
            <span className={calculateTotal() >= (currentPaper.totalMaxScore / 2) ? "text-green-600 text-2xl" : "text-red-600 text-2xl"}>
              {calculateTotal()} <span className="text-sm text-slate-400">/ {currentPaper.totalMaxScore}</span>
            </span>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => saveProgress(false)} variant="outline" className="flex-1 bg-white hover:bg-slate-100 h-12">
              <Save className="w-5 h-5 ml-2 text-slate-500" />
              حفظ مؤقت
            </Button>
            <Button onClick={() => saveProgress(true)} className="flex-1 bg-green-600 hover:bg-green-700 h-12 text-md">
              <CheckCircle className="w-5 h-5 ml-2" />
              إنهاء وتالي
            </Button>
          </div>
        </div>
      </div>

      {/* --- العمود الأيسر: عارض الـ PDF --- */}
      <div className="flex-1 p-4 h-full bg-slate-200 flex flex-col">
        <div className="w-full h-full bg-white rounded-xl shadow-inner overflow-hidden flex flex-col border border-slate-300">
          <div className="p-2 bg-slate-800 text-slate-200 text-sm flex justify-between items-center">
            <span className="font-medium">معاينة الورقة الأصلية</span>
            <span className="text-xs opacity-70">استخدم عجلة الماوس للتكبير (Ctrl + Scroll)</span>
          </div>
          
          {currentPaper.pdfUrl ? (
            <iframe
              src={`${currentPaper.pdfUrl}#toolbar=0&navpanes=0&view=FitH`} 
              className="w-full h-full border-0"
              title="عارض ورقة الاختبار"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col text-slate-400 bg-slate-50">
              <AlertCircle className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg">لا يوجد ملف PDF مرتبط بهذه الورقة</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
