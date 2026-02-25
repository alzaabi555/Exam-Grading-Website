import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Save, CheckCircle, AlertCircle, Check, X, PenTool, Type, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { getPapers } from '../utils/storage';
import { ExamPaper } from '../types/exam';
import { toast } from 'sonner';

// استيراد مكتبة عرض الـ PDF التفاعلية
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// تهيئة محرك الـ PDF ليعمل مع Vite بسلاسة
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// واجهة العلامات (Annotations)
interface Annotation {
  id: string;
  x: number;
  y: number;
  type: 'check' | 'cross' | 'score';
  value?: string;
}

export function GradingInterface() {
  const navigate = useNavigate();
  const [currentPaper, setCurrentPaper] = useState<ExamPaper | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  
  // حالات الـ PDF التفاعلي
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTool, setActiveTool] = useState<'check' | 'cross' | 'score' | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const pdfWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNextPaper();
  }, []);

  const loadNextPaper = () => {
    const papers = getPapers();
    const pendingPaper = papers.find(p => p.status !== 'completed');
    if (pendingPaper) {
      setCurrentPaper(pendingPaper);
      setScores({});
      setAnnotations([]); // تفريغ العلامات للورقة الجديدة
      setCurrentPage(1);
    } else {
      setCurrentPaper(null);
    }
  };

  const handleScoreChange = (partId: string, value: string, maxScore: number) => {
    let numValue = parseFloat(value);
    if (isNaN(numValue)) {
      const newScores = { ...scores };
      delete newScores[partId];
      setScores(newScores);
      return;
    }
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
      // حفظ البيانات بما فيها العلامات (Annotations)
      papers[paperIndex] = {
        ...currentPaper,
        totalScore,
        status: isComplete ? 'completed' : 'in-progress',
        gradedDate: isComplete ? new Date().toISOString() : undefined,
        // يمكنك لاحقاً إضافة annotations إلى نوع ExamPaper لحفظها
        // annotations: annotations 
      };

      localStorage.setItem('fastGrader_papers', JSON.stringify(papers));

      if (isComplete) {
        toast.success('تم إنهاء التصحيح! جارٍ تحميل الورقة التالية...');
        loadNextPaper();
      } else {
        toast.success('تم حفظ التقدم والعلامات مؤقتاً.');
      }
    }
  };

  // --- دوال اللوحة التفاعلية ---
  const handlePdfClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeTool || !pdfWrapperRef.current) return;

    // حساب الإحداثيات كنسبة مئوية لكي تبقى دقيقة حتى لو تغير حجم الشاشة
    const rect = pdfWrapperRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    let value = '';
    if (activeTool === 'score') {
      value = prompt('أدخل الدرجة التي تريد طباعتها على الورقة:') || '';
      if (!value.trim()) return; // إلغاء إذا لم يدخل رقماً
    }

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      x,
      y,
      type: activeTool,
      value
    };

    setAnnotations([...annotations, newAnnotation]);
  };

  const removeAnnotation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // منع وضع علامة جديدة عند حذف القديمة
    setAnnotations(annotations.filter(a => a.id !== id));
  };

  if (!currentPaper) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4" dir="rtl">
        <CheckCircle className="w-24 h-24 text-green-500 mb-4" />
        <h2 className="text-4xl font-bold text-slate-800">لا توجد أوراق بانتظار التصحيح!</h2>
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
        <div className="p-4 border-b bg-blue-50/50">
          <div className="flex justify-between items-center mb-3">
            <Badge className="bg-blue-600 text-sm px-3 py-1">{currentPaper.studentName}</Badge>
            <Badge variant="outline" className="bg-white text-slate-600">رقم: {currentPaper.studentId}</Badge>
          </div>
          <h2 className="font-bold text-slate-800 truncate">{currentPaper.examName}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
          {currentPaper.questions.map((question, qIdx) => (
            <Card key={question.id} className="border-blue-100 shadow-sm overflow-hidden">
              <CardHeader className="py-2 bg-slate-50 border-b">
                <CardTitle className="text-sm font-bold flex justify-between">
                  <span>السؤال {question.questionNumber}</span>
                  <span className="text-xs font-normal text-slate-500">{question.totalMaxScore} درجات</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3 bg-white">
                {question.parts.map((part, pIdx) => (
                  <div key={part.id} className="flex items-center justify-between">
                    <Label className="text-sm text-slate-600">الجزء {part.partNumber}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        max={part.maxScore}
                        className="w-20 text-center font-bold text-lg border-blue-200"
                        value={scores[part.id] ?? ''}
                        onChange={(e) => handleScoreChange(part.id, e.target.value, part.maxScore)}
                        autoFocus={qIdx === 0 && pIdx === 0}
                      />
                      <span className="text-slate-400 text-sm w-8">/ {part.maxScore}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="p-4 border-t bg-slate-50 space-y-4">
          <div className="flex justify-between p-3 bg-white rounded-lg border font-bold text-lg">
            <span>المجموع:</span>
            <span className="text-blue-700">{calculateTotal()} <span className="text-sm text-slate-400">/ {currentPaper.totalMaxScore}</span></span>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => saveProgress(false)} variant="outline" className="flex-1 bg-white h-12">
              <Save className="w-5 h-5 ml-2" /> حفظ
            </Button>
            <Button onClick={() => saveProgress(true)} className="flex-1 bg-green-600 hover:bg-green-700 h-12">
              <CheckCircle className="w-5 h-5 ml-2" /> إنهاء وتالي
            </Button>
          </div>
        </div>
      </div>

      {/* --- العمود الأيسر: اللوحة التفاعلية للـ PDF --- */}
      <div className="flex-1 p-4 h-full bg-slate-200 flex flex-col overflow-hidden">
        
        {/* شريط أدوات القلم الأحمر */}
        <div className="bg-white p-2 mb-2 rounded-lg shadow-sm border border-slate-300 flex items-center justify-center gap-4">
          <span className="text-sm font-bold text-slate-500">أدوات التصحيح اليدوي:</span>
          
          <Button 
            variant={activeTool === 'check' ? 'default' : 'outline'}
            className={activeTool === 'check' ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-green-50 hover:text-green-600'}
            onClick={() => setActiveTool(activeTool === 'check' ? null : 'check')}
          >
            <Check className="w-5 h-5 ml-2" /> إجابة صحيحة
          </Button>

          <Button 
            variant={activeTool === 'cross' ? 'default' : 'outline'}
            className={activeTool === 'cross' ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-red-50 hover:text-red-600'}
            onClick={() => setActiveTool(activeTool === 'cross' ? null : 'cross')}
          >
            <X className="w-5 h-5 ml-2" /> إجابة خاطئة
          </Button>

          <Button 
            variant={activeTool === 'score' ? 'default' : 'outline'}
            className={activeTool === 'score' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50 hover:text-blue-600'}
            onClick={() => setActiveTool(activeTool === 'score' ? null : 'score')}
          >
            <Type className="w-5 h-5 ml-2" /> كتابة درجة
          </Button>

          <div className="h-8 w-px bg-slate-300 mx-2"></div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage <= 1}>السابق</Button>
            <span className="text-sm font-medium">صفحة {currentPage} من {numPages}</span>
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))} disabled={currentPage >= numPages}>التالي</Button>
          </div>
        </div>

        {/* عارض الـ PDF مع طبقة العلامات */}
        <div className="flex-1 overflow-auto flex justify-center bg-slate-300 rounded-lg shadow-inner p-4 custom-scrollbar">
          {currentPaper.pdfUrl ? (
            <div 
              className={`relative shadow-2xl bg-white transition-all ${activeTool ? 'cursor-crosshair' : ''}`}
              ref={pdfWrapperRef}
              onClick={handlePdfClick}
            >
              <Document
                file={currentPaper.pdfUrl}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={<div className="p-20 text-slate-500">جاري تحميل الورقة...</div>}
              >
                <Page 
                  pageNumber={currentPage} 
                  renderTextLayer={false} 
                  renderAnnotationLayer={false}
                  width={800} // عرض ثابت لضمان التناسق
                />
              </Document>

              {/* رسم العلامات (الصح والخطأ والدرجات) */}
              {annotations.map(ann => (
                <div 
                  key={ann.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                  onClick={(e) => removeAnnotation(ann.id, e)}
                  title="اضغط للحذف"
                >
                  {ann.type === 'check' && <Check className="w-10 h-10 text-green-600 stroke-[4] drop-shadow-md" />}
                  {ann.type === 'cross' && <X className="w-10 h-10 text-red-600 stroke-[4] drop-shadow-md" />}
                  {ann.type === 'score' && (
                    <div className="text-2xl font-bold text-red-600 bg-white/80 px-2 rounded-full border-2 border-red-600 drop-shadow-md">
                      {ann.value}
                    </div>
                  )}
                  {/* زر حذف يظهر عند تمرير الماوس */}
                  <div className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="m-auto text-slate-500 flex flex-col items-center">
              <AlertCircle className="w-16 h-16 mb-4 opacity-30" />
              <p>لا يوجد ملف PDF مرتبط بهذه الورقة</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
