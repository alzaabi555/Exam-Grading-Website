import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Save, CheckCircle, AlertCircle, Check, X, Type, Trash2, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { getPapers } from '../utils/storage';
import { ExamPaper } from '../types/exam';
import { toast } from 'sonner';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface Annotation {
  id: string;
  x: number;
  y: number;
  type: 'check' | 'cross' | 'score';
  value?: string;
  partId?: string; // لربط العلامة بالسؤال المحدد
}

export function GradingInterface() {
  const navigate = useNavigate();
  const [currentPaper, setCurrentPaper] = useState<ExamPaper | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTool, setActiveTool] = useState<'check' | 'cross' | 'score'>('check'); // الافتراضي 'صح'
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const pdfWrapperRef = useRef<HTMLDivElement>(null);

  // --- السحر الجديد: تتبع الجزء النشط حالياً ---
  const [activePartId, setActivePartId] = useState<string | null>(null);

  useEffect(() => {
    loadNextPaper();
  }, []);

  const loadNextPaper = () => {
    const papers = getPapers();
    const pendingPaper = papers.find(p => p.status !== 'completed');
    if (pendingPaper) {
      setCurrentPaper(pendingPaper);
      setScores({});
      setAnnotations([]);
      setCurrentPage(1);
      // تنشيط أول جزء في أول سؤال تلقائياً
      if (pendingPaper.questions.length > 0 && pendingPaper.questions[0].parts.length > 0) {
        setActivePartId(pendingPaper.questions[0].parts[0].id);
      }
    } else {
      setCurrentPaper(null);
    }
  };

  // دالة القفز التلقائي للسؤال التالي
  const advanceToNextPart = (currentPartId: string) => {
    if (!currentPaper) return;
    const allParts = currentPaper.questions.flatMap(q => q.parts);
    const currentIndex = allParts.findIndex(p => p.id === currentPartId);
    
    if (currentIndex !== -1 && currentIndex < allParts.length - 1) {
      setActivePartId(allParts[currentIndex + 1].id);
    } else {
      setActivePartId(null);
      toast.success('تم الانتهاء من جميع الأسئلة! يرجى إنهاء الورقة.');
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
    setActivePartId(partId); // عند التعديل اليدوي، نجعله هو النشط
  };

  const calculateTotal = () => {
    return Object.values(scores).reduce((sum, score) => sum + score, 0);
  };

  const saveProgress = (isComplete: boolean = false) => {
    if (!currentPaper) return;
    const papers = getPapers();
    const paperIndex = papers.findIndex(p => p.id === currentPaper.id);

    if (paperIndex !== -1) {
      papers[paperIndex] = {
        ...currentPaper,
        totalScore: calculateTotal(),
        status: isComplete ? 'completed' : 'in-progress',
        gradedDate: isComplete ? new Date().toISOString() : undefined,
      };
      localStorage.setItem('fastGrader_papers', JSON.stringify(papers));

      if (isComplete) {
        toast.success('تم إنهاء التصحيح!');
        loadNextPaper();
      } else {
        toast.success('تم الحفظ مؤقتاً.');
      }
    }
  };

  // --- دالة التصحيح الذكية المدمجة ---
  const handlePdfClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeTool || !pdfWrapperRef.current || !currentPaper) return;

    if (!activePartId) {
      toast.error('يرجى تحديد السؤال المراد تصحيحه من القائمة الجانبية');
      return;
    }

    const allParts = currentPaper.questions.flatMap(q => q.parts);
    const currentPart = allParts.find(p => p.id === activePartId);
    if (!currentPart) return;

    const rect = pdfWrapperRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    let newScore = 0;
    let displayValue = '';

    if (activeTool === 'check') {
      newScore = currentPart.maxScore; // الدرجة الكاملة
    } else if (activeTool === 'cross') {
      newScore = 0; // صفر
    } else if (activeTool === 'score') {
      const val = prompt(`أدخل الدرجة (الحد الأقصى ${currentPart.maxScore}):`);
      if (val === null || val.trim() === '') return;
      newScore = parseFloat(val);
      if (isNaN(newScore) || newScore < 0 || newScore > currentPart.maxScore) {
        toast.error('درجة غير صالحة');
        return;
      }
      displayValue = newScore.toString();
    }

    // 1. تسجيل الدرجة آلياً
    setScores(prev => ({ ...prev, [activePartId]: newScore }));

    // 2. رسم الختم
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      x, y, type: activeTool, value: displayValue, partId: activePartId
    };
    setAnnotations([...annotations, newAnnotation]);

    // 3. القفز للسؤال التالي تلقائياً
    advanceToNextPart(activePartId);
  };

  // حذف العلامة يمسح الدرجة آلياً أيضاً
  const removeAnnotation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const annToRemove = annotations.find(a => a.id === id);
    if (annToRemove && annToRemove.partId) {
      const newScores = { ...scores };
      delete newScores[annToRemove.partId];
      setScores(newScores);
      setActivePartId(annToRemove.partId); // إعادة التنشيط للسؤال المحذوف لتصحيحه مجدداً
    }
    setAnnotations(annotations.filter(a => a.id !== id));
  };

  if (!currentPaper) return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4" dir="rtl">
      <CheckCircle className="w-24 h-24 text-green-500 mb-4" />
      <h2 className="text-4xl font-bold">لا توجد أوراق بانتظار التصحيح!</h2>
      <Button onClick={() => navigate('/dashboard')} size="lg">العودة للوحة التحكم</Button>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-slate-100" dir="rtl">
      
      {/* العمود الأيمن */}
      <div className="w-[380px] min-w-[350px] bg-white border-l shadow-2xl flex flex-col z-10">
        <div className="p-4 border-b bg-blue-50/50">
          <div className="flex justify-between items-center mb-3">
            <Badge className="bg-blue-600">{currentPaper.studentName}</Badge>
            <Badge variant="outline">رقم: {currentPaper.studentId}</Badge>
          </div>
          <h2 className="font-bold truncate">{currentPaper.examName}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {currentPaper.questions.map((question) => (
            <Card key={question.id} className="shadow-sm">
              <CardHeader className="py-2 bg-slate-50 border-b">
                <CardTitle className="text-sm font-bold flex justify-between">
                  <span>السؤال {question.questionNumber}</span>
                  <span className="text-slate-500">{question.totalMaxScore} درجات</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {question.parts.map((part) => {
                  const isActive = activePartId === part.id;
                  return (
                    <div 
                      key={part.id} 
                      onClick={() => setActivePartId(part.id)}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-all border-2 ${
                        isActive ? 'bg-blue-50 border-blue-400 shadow-inner' : 'border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isActive && <Target className="w-4 h-4 text-blue-500 animate-pulse" />}
                        <Label className={`text-sm cursor-pointer ${isActive ? 'text-blue-700 font-bold' : 'text-slate-600'}`}>
                          الجزء {part.partNumber}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          max={part.maxScore}
                          className={`w-16 text-center font-bold h-8 ${isActive ? 'border-blue-400 bg-white' : 'border-slate-200'}`}
                          value={scores[part.id] ?? ''}
                          onChange={(e) => handleScoreChange(part.id, e.target.value, part.maxScore)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-slate-400 text-xs w-8">/ {part.maxScore}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="p-4 border-t bg-slate-50 space-y-4">
          <div className="flex justify-between p-3 bg-white rounded-lg border font-bold text-lg">
            <span>المجموع:</span>
            <span className="text-blue-700">{calculateTotal()} / {currentPaper.totalMaxScore}</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => saveProgress(false)} variant="outline" className="flex-1">حفظ</Button>
            <Button onClick={() => saveProgress(true)} className="flex-1 bg-green-600 hover:bg-green-700">إنهاء وتالي</Button>
          </div>
        </div>
      </div>

      {/* العمود الأيسر (اللوحة التفاعلية) */}
      <div className="flex-1 p-4 h-full bg-slate-200 flex flex-col overflow-hidden">
        <div className="bg-white p-2 mb-2 rounded-lg shadow-sm border border-slate-300 flex items-center justify-center gap-4">
          <span className="text-sm font-bold text-slate-500">القلم الحالي:</span>
          
          <Button 
            variant={activeTool === 'check' ? 'default' : 'outline'}
            className={activeTool === 'check' ? 'bg-green-600' : ''}
            onClick={() => setActiveTool('check')}
          >
            <Check className="w-5 h-5 ml-2" /> (صح) درجة كاملة
          </Button>

          <Button 
            variant={activeTool === 'cross' ? 'default' : 'outline'}
            className={activeTool === 'cross' ? 'bg-red-600' : ''}
            onClick={() => setActiveTool('cross')}
          >
            <X className="w-5 h-5 ml-2" /> (خطأ) صفر
          </Button>

          <Button 
            variant={activeTool === 'score' ? 'default' : 'outline'}
            className={activeTool === 'score' ? 'bg-blue-600' : ''}
            onClick={() => setActiveTool('score')}
          >
            <Type className="w-5 h-5 ml-2" /> درجة مخصصة
          </Button>
        </div>

        <div className="flex-1 overflow-auto flex justify-center bg-slate-300 rounded-lg p-4 custom-scrollbar">
          {currentPaper.pdfUrl ? (
            <div 
              className={`relative shadow-2xl bg-white ${activeTool ? 'cursor-crosshair' : ''}`}
              ref={pdfWrapperRef}
              onClick={handlePdfClick}
            >
              <Document file={currentPaper.pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                <Page pageNumber={currentPage} renderTextLayer={false} renderAnnotationLayer={false} width={800} />
              </Document>

              {annotations.map(ann => (
                <div 
                  key={ann.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                  onClick={(e) => removeAnnotation(ann.id, e)}
                >
                  {ann.type === 'check' && <Check className="w-10 h-10 text-green-600 stroke-[4] drop-shadow-md" />}
                  {ann.type === 'cross' && <X className="w-10 h-10 text-red-600 stroke-[4] drop-shadow-md" />}
                  {ann.type === 'score' && (
                    <div className="text-2xl font-bold text-red-600 bg-white/80 px-2 rounded-full border-2 border-red-600 drop-shadow-md">
                      {ann.value}
                    </div>
                  )}
                  <div className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="m-auto text-slate-500"><AlertCircle className="w-16 h-16 opacity-30" /></div>
          )}
        </div>
      </div>
    </div>
  );
}
