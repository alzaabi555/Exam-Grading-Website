import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowRight, FileText, CheckCircle, XCircle, Printer, Download, Award } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge'; // <-- تم إضافة الاستدعاء المفقود هنا
import { getPapers } from '../utils/storage';
import { ExamPaper } from '../types/exam';
import { toast } from 'sonner';
import { PDFDocument, rgb } from 'pdf-lib';

// دالة فك التشفير السحرية
const dataUrlToArrayBuffer = (dataUrl: string) => {
  const base64 = dataUrl.split(',')[1];
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export function StudentResults() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchPaperData = async () => {
      try {
        const papers = await getPapers();
        const foundPaper = papers.find(p => p.id === paperId);
        setPaper(foundPaper || null);
      } catch (error) {
        console.error("حدث خطأ أثناء جلب الورقة:", error);
      }
    };
    fetchPaperData();
  }, [paperId]);

  if (!paper) {
    return (
      <div className="container mx-auto p-6 max-w-4xl text-right" dir="rtl">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl mb-4 font-bold">ورقة الاختبار غير موجودة أو جاري تحميلها...</h2>
            <Button onClick={() => navigate('/dashboard')}>العودة للوحة التحكم</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const percentage = paper.totalMaxScore > 0
    ? ((paper.totalScore || 0) / paper.totalMaxScore) * 100
    : 0;

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'ممتاز مرتفع (A+)', color: 'text-green-600' };
    if (percentage >= 85) return { grade: 'ممتاز (A)', color: 'text-green-600' };
    if (percentage >= 80) return { grade: 'جيد جداً مرتفع (B+)', color: 'text-blue-600' };
    if (percentage >= 70) return { grade: 'جيد جداً (B)', color: 'text-blue-500' };
    if (percentage >= 60) return { grade: 'جيد (C)', color: 'text-yellow-600' };
    if (percentage >= 50) return { grade: 'مقبول (D)', color: 'text-orange-600' };
    return { grade: 'راسب (F)', color: 'text-red-600' };
  };

  const gradeInfo = getGrade(percentage);

  const handlePrintReport = () => {
    window.print();
  };

  // زر التنزيل المعدل
  const handleDownloadPaper = async () => {
    if (!paper.pdfUrl) {
      toast.error('ملف الاختبار غير موجود!');
      return;
    }

    setIsExporting(true);
    toast.info('جاري تجهيز الورقة المصححة...');

    try {
      // استخدام دالة فك التشفير بدلاً من fetch
      const fileBytes = dataUrlToArrayBuffer(paper.pdfUrl);
      let pdfDoc;
      let page;
      let width, height;

      if (paper.fileType === 'image') {
        pdfDoc = await PDFDocument.create();
        let imageToEmbed;
        try { imageToEmbed = await pdfDoc.embedJpg(fileBytes); } 
        catch { imageToEmbed = await pdfDoc.embedPng(fileBytes); }
        
        const dims = imageToEmbed.scale(1);
        width = dims.width; height = dims.height;
        page = pdfDoc.addPage([width, height]);
        page.drawImage(imageToEmbed, { x: 0, y: 0, width, height });
      } else {
        pdfDoc = await PDFDocument.load(fileBytes);
        page = pdfDoc.getPages()[0]; 
        const size = page.getSize();
        width = size.width; height = size.height;
      }

      if (paper.annotations && paper.annotations.length > 0) {
        for (const ann of paper.annotations) {
          const xPos = (ann.x / 100) * width;
          const yPos = height - ((ann.y / 100) * height);

          if (ann.type === 'check') {
            page.drawSvgPath('M -5,5 L 5,15 L 20,-5', { x: xPos, y: yPos, borderColor: rgb(0.1, 0.6, 0.1), borderWidth: 4 });
          } else if (ann.type === 'cross') {
            page.drawSvgPath('M -10,-10 L 10,10 M 10,-10 L -10,10', { x: xPos, y: yPos, borderColor: rgb(0.8, 0.1, 0.1), borderWidth: 4 });
          } else if (ann.type === 'score' && ann.value) {
            page.drawText(ann.value, { x: xPos - 10, y: yPos - 10, size: 24, color: rgb(0.8, 0.1, 0.1) });
          }
        }
      }

      page.drawText(`المجموع: ${paper.totalScore} / ${paper.totalMaxScore}`, {
        x: 40, y: height - 50, size: 24, color: rgb(0.8, 0.1, 0.1),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `اختبار_${paper.studentName}_${paper.examName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success('تم التنزيل بنجاح!');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تصدير الورقة.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl text-right font-sans" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 print:hidden bg-white p-4 rounded-lg shadow-sm border">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-slate-600">
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للنتائج
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownloadPaper} disabled={isExporting} className="border-blue-200 text-blue-700 hover:bg-blue-50">
            <Download className="w-4 h-4 ml-2" />
            {isExporting ? 'جاري التجهيز...' : 'تنزيل ورقة الاختبار'}
          </Button>
          <Button onClick={handlePrintReport} className="bg-slate-800 hover:bg-slate-900">
            <Printer className="w-4 h-4 ml-2" />
            طباعة الشهادة (التقرير)
          </Button>
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg border-4 border-double border-slate-200 print:shadow-none print:border-none print:p-0">
        <div className="text-center mb-10 pb-6 border-b-2 border-slate-100">
          <Award className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <h1 className="text-3xl font-black text-slate-800 mb-2">تقرير نتيجة اختبار تفصيلي</h1>
          <p className="text-slate-500 font-medium">مستخرج آلياً من نظام المصحح السريع</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 bg-slate-50 p-6 rounded-lg border border-slate-100 print:bg-transparent print:border-b">
          <div>
            <p className="text-sm text-slate-500 mb-1">اسم الطالب</p>
            <p className="font-bold text-lg text-blue-900">{paper.studentName}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">الرقم التعريفي</p>
            <p className="font-bold text-lg">{paper.studentId}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">اسم الاختبار</p>
            <p className="font-bold text-lg">{paper.examName}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">تاريخ الاعتماد</p>
            <p className="font-bold text-lg">
              {paper.gradedDate ? new Date(paper.gradedDate).toLocaleDateString('ar-EG') : '—'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="border-t-4 border-t-blue-500 shadow-sm print:shadow-none">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-slate-500 mb-2 font-bold">الدرجة المكتسبة</p>
              <p className="text-5xl font-black text-slate-800">
                {paper.totalScore !== undefined ? paper.totalScore : '—'} 
                <span className="text-xl text-slate-400 font-medium ml-1">/ {paper.totalMaxScore}</span>
              </p>
            </CardContent>
          </Card>
          <Card className={`border-t-4 shadow-sm print:shadow-none ${percentage >= 50 ? 'border-t-green-500' : 'border-t-red-500'}`}>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-slate-500 mb-2 font-bold">النسبة المئوية</p>
              <p className={`text-5xl font-black ${gradeInfo.color}`}>
                {percentage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card className={`border-t-4 shadow-sm print:shadow-none ${percentage >= 50 ? 'border-t-green-500' : 'border-t-red-500'}`}>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-slate-500 mb-2 font-bold">التقدير العام</p>
              <p className={`text-3xl font-black mt-3 ${gradeInfo.color}`}>
                {gradeInfo.grade}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-10 bg-slate-50 p-6 rounded-lg border border-slate-100 print:hidden">
          <div className="flex justify-between text-sm font-bold text-slate-700 mb-3">
            <span>مؤشر الأداء العام</span>
            <span>{paper.totalScore !== undefined ? paper.totalScore : 0} من أصل {paper.totalMaxScore}</span>
          </div>
          <Progress value={percentage} className="h-4 bg-slate-200" />
        </div>

        <div>
          <h3 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-2 inline-block">تحليل الأداء التفصيلي:</h3>
          <div className="space-y-8">
            {paper.questions.map((question, qIndex) => {
              const questionScore = question.parts.reduce((sum, p) => sum + (p.score || 0), 0);
              const questionPercentage = question.totalMaxScore > 0 ? (questionScore / question.totalMaxScore) * 100 : 0;

              return (
                <div key={question.id} className="break-inside-avoid">
                  <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-t-lg border border-b-0 border-blue-100">
                    <h4 className="text-lg font-bold text-blue-900">
                      السؤال {question.questionNumber}
                    </h4>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-blue-800">
                        {questionScore} <span className="text-sm text-blue-400">/ {question.totalMaxScore}</span>
                      </p>
                      <Badge className="bg-white text-blue-700 border-blue-200 shadow-sm hover:bg-white">
                        {questionPercentage.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>

                  <Table className="border border-slate-200">
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-right w-32">الجزء</TableHead>
                        <TableHead className="text-center">الدرجة القصوى</TableHead>
                        <TableHead className="text-center">الدرجة المرصودة</TableHead>
                        <TableHead className="text-left w-32">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {question.parts.map(part => {
                        const isPerfect = part.score === part.maxScore;
                        const isFailed = (part.score || 0) < part.maxScore * 0.5;

                        return (
                          <TableRow key={part.id}>
                            <TableCell className="font-bold text-slate-700">
                              الفرع {part.partNumber}
                            </TableCell>
                            <TableCell className="text-center font-medium">{part.maxScore}</TableCell>
                            <TableCell className="text-center">
                              <span className={`font-bold text-lg ${
                                isPerfect ? 'text-green-600' : isFailed ? 'text-red-600' : 'text-blue-600'
                              }`}>
                                {part.score !== undefined ? part.score : '—'}
                              </span>
                            </TableCell>
                            <TableCell className="text-left">
                              {part.score !== undefined && (
                                <div className="flex items-center justify-start gap-2">
                                  {isPerfect ? (
                                    <Badge className="bg-green-100 text-green-700 border-none hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" /> كاملة</Badge>
                                  ) : isFailed ? (
                                    <Badge className="bg-red-100 text-red-700 border-none hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" /> إخفاق</Badge>
                                  ) : (
                                    <Badge className="bg-blue-100 text-blue-700 border-none hover:bg-blue-100">جزئية</Badge>
                                  )}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500 print:mt-10">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="font-mono">ID: {paper.id.split('-').pop()}</span>
          </div>
          <div>
            <p>توقيع المعلم المعتمد: ..........................</p>
          </div>
        </div>
      </div>
    </div>
  );
}
