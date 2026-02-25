import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Upload, Plus, Trash2, FileText, Users, CheckCircle, AlertCircle, Layers } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { QuickStats } from './QuickStats';
import { addPaper, getMarkDistributionByExam } from '../utils/storage';
import { ExamPaper, Question, AnswerPart } from '../types/exam';
import { toast } from 'sonner';

// واجهة لملفات الرفع الجماعي
interface BulkFile {
  file: File;
  studentId: string;
  studentName: string;
  isMatched: boolean;
}

export function UploadPaper() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  
  // حالات الرفع الفردي
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [examName, setExamName] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  // حالات الرفع الجماعي
  const [bulkFiles, setBulkFiles] = useState<BulkFile[]>([]);
  
  // جلب الطلاب عند فتح الصفحة
  useEffect(() => {
    const storedStudents = JSON.parse(localStorage.getItem('fastGrader_students') || '[]');
    setStudents(storedStudents);
  }, []);

  // دالة مطابقة الملفات مع الطلاب
  const handleBulkPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const filesArray = Array.from(e.target.files);
    const matchedFiles = filesArray.map(file => {
      // استخراج أي أرقام من اسم الملف (مثال: 1001.pdf -> 1001)
      const match = file.name.match(/\d+/);
      const extractedId = match ? match[0] : '';
      
      // البحث عن الطالب في قاعدة البيانات
      const student = students.find(s => s.id === extractedId);
      
      return {
        file,
        studentId: extractedId,
        studentName: student ? student.name : 'طالب غير مسجل',
        isMatched: !!student,
      };
    });

    setBulkFiles(matchedFiles);
    
    const matchedCount = matchedFiles.filter(f => f.isMatched).length;
    toast.success(`تم اختيار ${matchedFiles.length} ملف، والتعرف على ${matchedCount} طالب.`);
  };

  // دالة الإرسال الجماعي الذكي
  const handleBulkSubmit = async () => {
    if (!examName) {
      toast.error('يرجى إدخال اسم الاختبار (ليتم ربطه بقالب الدرجات)');
      return;
    }

    if (bulkFiles.length === 0) {
      toast.error('يرجى اختيار ملفات PDF أولاً');
      return;
    }

    const distribution = getMarkDistributionByExam(examName);
    if (!distribution) {
      toast.error('يجب إنشاء "توزيع درجات" لهذا الاختبار أولاً من الإعدادات!');
      return;
    }

    let successCount = 0;

    // معالجة كل ملف وإنشاء ورقة اختبار له
    bulkFiles.forEach(bulkFile => {
      if (!bulkFile.isMatched && !bulkFile.studentId) return; // تخطي الملفات التي ليس لها رقم

      const paperId = `paper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const pdfUrl = URL.createObjectURL(bulkFile.file);

      // توليد هيكل الأسئلة والدرجات من القالب مباشرة (بدون صور مقصوصة)
      const questions: Question[] = distribution.questions.map(q => {
        const questionId = `q${q.questionNumber}-${paperId}`;
        const parts: AnswerPart[] = q.parts.map(p => ({
          id: `p${p.partNumber}-${questionId}`,
          questionId,
          paperId,
          partNumber: p.partNumber,
          imageUrl: '', // نتركها فارغة، لأننا سنعرض الـ PDF الكامل في واجهة التصحيح
          maxScore: p.maxScore,
        }));

        return {
          id: questionId,
          paperId,
          questionNumber: q.questionNumber,
          parts,
          totalMaxScore: parts.reduce((sum, p) => sum + p.maxScore, 0),
        };
      });

      const totalMaxScore = questions.reduce((sum, q) => sum + q.totalMaxScore, 0);

      const paper: ExamPaper = {
        id: paperId,
        studentName: bulkFile.studentName,
        studentId: bulkFile.studentId,
        examName,
        pdfUrl,
        uploadDate: new Date().toISOString(),
        questions,
        totalMaxScore,
        status: 'pending',
      };

      addPaper(paper);
      successCount++;
    });

    toast.success(`تم إنشاء ورفع ${successCount} ورقة اختبار بنجاح!`);
    setBulkFiles([]); // تفريغ القائمة
    navigate('/dashboard'); // العودة للوحة التحكم
  };

  // (تم اختصار دالة الرفع الفردي القديمة للحفاظ على نظافة الكود)
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.error('يرجى استخدام الرفع الجماعي مع قالب الدرجات لضمان السرعة.');
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl text-right" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">رفع أوراق الاختبار</h1>
        <p className="text-gray-600">قم برفع أوراق الطلاب وربطها بقوالب التصحيح آلياً</p>
      </div>

      <div className="mb-6">
        <QuickStats />
      </div>

      <Card className="mb-6 border-blue-200 shadow-md">
        <CardHeader className="bg-blue-50/50">
          <CardTitle>الإعدادات الأساسية (مطلوبة)</CardTitle>
          <CardDescription>حدد اسم الاختبار لكي يتم ربطه بقالب توزيع الدرجات الخاص به</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="examName" className="font-bold">اسم الاختبار المعتمد</Label>
            <Input
              id="examName"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="يجب أن يطابق الاسم الموجود في قسم (توزيع الدرجات)"
              className="text-lg py-6 border-blue-300"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="bulk" className="space-y-4">
        <TabsList className="flex justify-start">
          <TabsTrigger value="bulk" className="gap-2 text-lg py-3">
            <Layers className="w-5 h-5" />
            الرفع الجماعي الذكي (مستحسن)
          </TabsTrigger>
          <TabsTrigger value="single" className="gap-2">
            <FileText className="w-4 h-4" />
            رفع ورقة مفردة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>رفع ملفات PDF متعددة</CardTitle>
              <CardDescription>
                اختر جميع أوراق الاختبار (تأكد أن اسم كل ملف يحتوي على الرقم التعريفي للطالب، مثلاً 1005.pdf)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-green-300 rounded-lg p-10 text-center hover:bg-green-50 transition-colors bg-green-50/20">
                <Input
                  type="file"
                  accept="application/pdf"
                  multiple
                  onChange={handleBulkPdfUpload}
                  className="hidden"
                  id="bulk-pdf-upload"
                />
                <Label htmlFor="bulk-pdf-upload" className="cursor-pointer block">
                  <Upload className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <p className="text-xl text-green-700 font-bold mb-2">اضغط لاختيار جميع أوراق الطلاب (PDF)</p>
                  <p className="text-sm text-gray-500">يمكنك تحديد مئات الملفات دفعة واحدة</p>
                </Label>
              </div>

              {/* قائمة الملفات المطابقة */}
              {bulkFiles.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-100 p-3 font-bold flex justify-between items-center">
                    <span>الملفات المحددة ({bulkFiles.length})</span>
                    <Badge variant="outline" className="bg-white">
                      متطابق: {bulkFiles.filter(f => f.isMatched).length} | غير معروف: {bulkFiles.filter(f => !f.isMatched).length}
                    </Badge>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-4 space-y-2">
                    {bulkFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded bg-white">
                        <div className="flex items-center gap-3">
                          {file.isMatched ? (
                            <CheckCircle className="text-green-500 w-5 h-5" />
                          ) : (
                            <AlertCircle className="text-yellow-500 w-5 h-5" />
                          )}
                          <div>
                            <p className="font-bold text-sm">{file.file.name}</p>
                            <p className={`text-xs ${file.isMatched ? 'text-green-600' : 'text-yellow-600'}`}>
                              الرقم المستخرج: {file.studentId || 'لا يوجد'} - الطالب: {file.studentName}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleBulkSubmit} 
                className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700"
                disabled={bulkFiles.length === 0}
              >
                <Plus className="w-5 h-5 ml-2" />
                تأكيد ورفع جميع الأوراق المطابقة
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>الرفع الفردي</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-center py-12 text-gray-500 border border-dashed rounded-lg">
                  <p>تم إيقاف هذه الميزة مؤقتاً لتفعيل الرفع الجماعي الذكي.</p>
                  <p>يرجى استخدام التبويب الخاص بـ "الرفع الجماعي".</p>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
