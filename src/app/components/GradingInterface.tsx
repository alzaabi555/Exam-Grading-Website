import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Save, CheckCircle, AlertCircle, Check, X, Type, Trash2, Target, Printer } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { getPapers, savePapers } from '../utils/storage'; // <-- أضفنا savePapers هنا
import { ExamPaper } from '../types/exam';
import { toast } from 'sonner';

// مكتبات الـ PDF
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, rgb } from 'pdf-lib'; 
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

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
  partId?: string;
}

export function GradingInterface() {
  const navigate = useNavigate();
  const [currentPaper, setCurrentPaper] = useState<ExamPaper | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTool, setActiveTool] = useState<'check' | 'cross' | 'score'>('check');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const pdfWrapperRef = useRef<HTMLDivElement>(null);
  const [activePartId, setActivePartId] = useState<string | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadNextPaper();
  }, []);

  // تحويل الدالة إلى async لتتوافق مع المستودع العملاق
  const loadNextPaper = async () => {
    const papers = await getPapers();
    const pendingPaper = papers.find(p => p.status !== 'completed');
    if (pendingPaper) {
      setCurrentPaper(pendingPaper);
      setScores({});
      setAnnotations(pendingPaper.annotations || []); // سحب العلامات القديمة إن وجدت
      setCurrentPage(1);
      if (pendingPaper.questions.length > 0 && pendingPaper.questions[0].parts.length > 0) {
        setActivePartId(pendingPaper.questions[0].parts[0].id);
      }
    } else {
      setCurrentPaper(null);
    }
  };

  const advanceToNextPart = (currentPartId: string) => {
    if (!currentPaper) return;
    const allParts = currentPaper.questions.flatMap(q => q.parts);
    const currentIndex = allParts.findIndex(p => p.id === currentPartId);
    
    if (currentIndex !== -1 && currentIndex < allParts.length - 1) {
      setActivePartId(allParts[currentIndex + 1].id);
    } else {
      setActivePartId(null);
      toast.success('تم الانتهاء من جميع الأسئلة!');
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
    setActivePartId(partId);
  };

  const calculateTotal = () => {
    return Object.values(scores).reduce((sum, score) => sum + score, 0);
  };

  // تحويل الدالة إلى async واستخدام savePapers
  const saveProgress = async (isComplete: boolean = false) => {
    if (!currentPaper) return;
    const papers = await getPapers();
    const paperIndex = papers.findIndex(p => p.id === currentPaper.id);

    if (paperIndex !== -1) {
      papers[paperIndex] = {
        ...currentPaper,
        totalScore: calculateTotal(),
        status: isComplete ? 'completed' : 'in-progress',
        gradedDate: isComplete ? new Date().toISOString() : undefined,
        annotations, // حفظ الحبر الأحمر
      };
      
      // حفظ البيانات في المستودع العملاق بدلاً من localStorage
      await savePapers(papers);

      if (isComplete) {
        toast.success('تم إنهاء التصحيح!');
        await loadNextPaper();
      } else {
        toast.success('تم الحفظ مؤقتاً.');
      }
    }
  };

  const handlePdfClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeTool || !pdfWrapperRef.current || !currentPaper) return;
    if (!activePartId) {
      toast.error('يرجى تحديد السؤال المراد تصحيحه أولاً من القائمة الجانبية');
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
      newScore = currentPart.maxScore;
    } else if (activeTool === 'cross') {
      newScore = 0;
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

    setScores(prev => ({ ...prev, [activePartId]: newScore }));
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      x, y, type: activeTool, value: displayValue, partId: activePartId
    };
    setAnnotations([...annotations, newAnnotation]);
    advanceToNextPart(activePartId);
  };

  const removeAnnotation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const annToRemove = annotations.find(a => a.id === id);
    if (annToRemove && annToRemove.partId) {
      const newScores = { ...scores };
      delete newScores[annToRemove.partId];
      setScores(newScores);
      setActivePartId(annToRemove.partId);
    }
    setAnnotations(annotations.filter(a => a.id !== id));
  };

  // التصدير الذكي (يدعم الصور والـ PDF)
  const exportGradedPdf = async () => {
    if (!currentPaper || !currentPaper.pdfUrl) {
      toast.error('ملف الاختبار غير موجود!');
      return;
    }

    setIsExporting(true);
    toast.info('جاري دمج العلامات وتجهيز الملف للطباعة...');

    try {
      const fileBytes = await fetch(currentPaper.pdfUrl).then(res => res.arrayBuffer());
      let pdfDoc;
      let page;
      let width, height;

      if (currentPaper.fileType === 'image') {
        pdfDoc = await PDFDocument.create();
        let imageToEmbed;
        
        try {
          imageToEmbed = await pdfDoc.embedJpg(fileBytes);
        } catch (e) {
          try {
            imageToEmbed = await pdfDoc.embedPng(fileBytes);
          } catch (err) {
            toast.error('صيغة الصورة غير مدعومة للطباعة (يرجى استخدام JPG أو PNG)');
            setIsExporting(false);
            return;
          }
        }
        
        const dims = imageToEmbed.scale(1);
        width = dims.width;
        height = dims.height;
        page = pdfDoc.addPage([width, height]);
        page.drawImage(imageToEmbed, { x: 0, y: 0, width, height });
        
      } else {
        pdfDoc = await PDFDocument.load(fileBytes);
        const pages = pdfDoc.getPages();
        page = pages[currentPage - 1]; 
        const size = page.getSize();
        width = size.width;
        height = size.height;
      }

      for (const ann of annotations) {
        const xPos = (ann.x / 100) * width;
        const yPos = height - ((ann.y / 100) * height);

        if (ann.type === 'check') {
          page.drawSvgPath('M -5,5 L 5,15 L 20,-5', {
            x: xPos, y: yPos, borderColor: rgb(0.1, 0.6, 0.1), borderWidth: 4,
          });
        } else if (ann.type === 'cross') {
          page.drawSvgPath('M -10,-10 L 10,10 M 10,-10 L -10,10', {
            x: xPos, y: yPos, borderColor: rgb(0.8, 0.1, 0.1), borderWidth: 4,
          });
        } else if (ann.type === 'score' && ann.value) {
          page.drawText(ann.value, {
            x: xPos - 10, y: yPos - 10, size: 24, color: rgb(0.8, 0.1, 0.1),
          });
        }
      }

      const totalScore = calculateTotal();
      page.drawText(`المجموع: ${totalScore} / ${currentPaper.totalMaxScore}`, {
        x: 40,
        y: height - 50,
        size: 24,
        color: rgb(0.8, 0.1, 0.1),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ورقة_مصححة_${currentPaper.studentName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success('تم تصدير الورقة بنجاح! راجع مجلد التنزيلات.');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تصدير ملف الـ PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!currentPaper) return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4" dir="rtl">
      <CheckCircle className="w-24 h-24 text-green-500 mb-4" />
      <h2 className="text-4xl font-bold">لا توجد أوراق بانتظار التصحيح!</h2>
      <Button onClick={() => navigate('/dashboard')} size="lg">عرض النتائج الشاملة</Button>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-slate-100" dir="rtl">
      
      {/* العمود الأيمن (لوحة الرصد) */}
      <div className="w-[380px] min-w-[350px] bg-white border-l shadow-2xl flex flex-col z-10">
        <div className="p-4 border-b bg-blue-50/50">
          <div className="flex justify-between items-center mb-3">
            <Badge className="bg-blue-600">{currentPaper.studentName}</Badge>
            <Badge variant="outline">رقم: {currentPaper.studentId}</Badge>
          </div>
          <h2 className="font-bold truncate">{currentPaper.examName}</h2>
          {currentPaper.fileType === 'image' && (
            <Badge variant="secondary" className="mt-2 text-xs">نوع الملف: صورة</Badge>
          )}
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

        {/* أزرار الحفظ والطباعة */}
        <div className="p-4 border-t bg-slate-50 space-y-3">
          <div className="flex justify-between p-3 bg-white rounded-lg border font-bold text-lg">
            <span>المجموع:</span>
            <span className="text-blue-700">{calculateTotal()} / {currentPaper.totalMaxScore}</span>
          </div>
          
          <Button 
            onClick={exportGradedPdf} 
            disabled={isExporting}
            className="w-full bg-slate-800 hover:bg-slate-900 h-10"
          >
            <Printer className="w-4 h-4 ml-2" />
            {isExporting ? 'جاري الدمج...' : 'استخراج الورقة وطباعتها'}
          </Button>

          <div className="flex gap-2">
            <Button onClick={() => saveProgress(false)} variant="outline" className="flex-1 bg-white h-12 text-slate-600">
              <Save className="w-5 h-5 ml-2" /> حفظ مؤقت
            </Button>
            <Button onClick={() => saveProgress(true)} className="flex-1 bg-green-600 hover:bg-green-700 h-12">
              <CheckCircle className="w-5 h-5 ml-2" /> إنهاء وتالي
            </Button>
          </div>
        </div>
      </div>

      {/* العمود الأيسر (منطقة العرض التفاعلية) */}
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

        <div className="flex-1 overflow-auto flex justify-center items-start bg-slate-300 rounded-lg p-4 custom-scrollbar">
          {currentPaper.pdfUrl ? (
            <div 
              className={`relative shadow-2xl bg-white inline-block ${activeTool ? 'cursor-crosshair' : ''}`}
              ref={pdfWrapperRef}
              onClick={handlePdfClick}
            >
              
              {currentPaper.fileType === 'image' ? (
                <img 
                  src={currentPaper.pdfUrl} 
                  alt="ورقة الطالب" 
                  className="block pointer-events-none select-none max-w-full h-auto"
                  style={{ width: '800px' }} 
                />
              ) : (
                <Document file={currentPaper.pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                  <Page pageNumber={currentPage} renderTextLayer={false} renderAnnotationLayer={false} width={800} />
                </Document>
              )}

              {/* طبقة الأختام التفاعلية */}
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
