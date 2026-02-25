import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Upload, Plus, Trash2, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { QuickStats } from './QuickStats';
import { addPaper, getMarkDistributionByExam } from '../utils/storage';
import { ExamPaper, Question, AnswerPart } from '../types/exam';
import { toast } from 'sonner';

export function UploadPaper() {
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [examName, setExamName] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [answerImages, setAnswerImages] = useState<{ questionNumber: number; partNumber: number; file: File; maxScore: number }[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [currentPart, setCurrentPart] = useState(1);
  const [currentMaxScore, setCurrentMaxScore] = useState(0);

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentMaxScore > 0) {
      const file = e.target.files[0];
      setAnswerImages([
        ...answerImages,
        {
          questionNumber: currentQuestion,
          partNumber: currentPart,
          file,
          maxScore: currentMaxScore,
        },
      ]);
      setCurrentPart(currentPart + 1);
      setCurrentMaxScore(0);
      toast.success(`تم إضافة السؤال ${currentQuestion} الجزء ${currentPart}`);
    }
  };

  const removeImage = (index: number) => {
    setAnswerImages(answerImages.filter((_, i) => i !== index));
    toast.success('تم إزالة جزء الإجابة');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pdfFile || !studentName || !studentId || !examName || answerImages.length === 0) {
      toast.error('يرجى ملء جميع الحقول ورفع صورة إجابة واحدة على الأقل');
      return;
    }

    const paperId = `paper-${Date.now()}`;
    
    const questionGroups = answerImages.reduce((acc, img) => {
      if (!acc[img.questionNumber]) {
        acc[img.questionNumber] = [];
      }
      acc[img.questionNumber].push(img);
      return acc;
    }, {} as Record<number, typeof answerImages>);

    const questions: Question[] = Object.entries(questionGroups).map(([qNum, parts]) => {
      const questionId = `q${qNum}-${paperId}`;
      const answerParts: AnswerPart[] = parts.map((part) => {
        const partId = `p${part.partNumber}-q${qNum}-${paperId}`;
        const imageUrl = URL.createObjectURL(part.file);
        return {
          id: partId,
          questionId,
          paperId,
          partNumber: part.partNumber,
          imageUrl,
          maxScore: part.maxScore,
        };
      });

      return {
        id: questionId,
        paperId,
        questionNumber: parseInt(qNum),
        parts: answerParts,
        totalMaxScore: answerParts.reduce((sum, p) => sum + p.maxScore, 0),
      };
    });

    const pdfUrl = URL.createObjectURL(pdfFile);
    const totalMaxScore = questions.reduce((sum, q) => sum + q.totalMaxScore, 0);

    const paper: ExamPaper = {
      id: paperId,
      studentName,
      studentId,
      examName,
      pdfUrl,
      uploadDate: new Date().toISOString(),
      questions,
      totalMaxScore,
      status: 'pending',
    };

    addPaper(paper);
    toast.success('تم رفع ورقة الاختبار بنجاح!');
    
    setStudentName('');
    setStudentId('');
    setExamName('');
    setPdfFile(null);
    setAnswerImages([]);
    setCurrentQuestion(1);
    setCurrentPart(1);
    setCurrentMaxScore(0);
  };

  const loadFromTemplate = () => {
    if (!examName) {
      toast.error('يرجى إدخال اسم الاختبار أولاً');
      return;
    }

    const distribution = getMarkDistributionByExam(examName);
    if (distribution) {
      toast.success('تم تحميل النموذج! ارفع الصور بالترتيب.');
      setCurrentQuestion(distribution.questions[0]?.questionNumber || 1);
      setCurrentPart(1);
    } else {
      toast.error('لم يتم العثور على نموذج لهذا الاختبار');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl text-right" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">رفع ورقة اختبار</h1>
        <p className="text-gray-600">ارفع أوراق اختبار الطلاب وقم بتهيئة هيكل التصحيح</p>
      </div>

      <div className="mb-6">
        <QuickStats />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* معلومات الطالب */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات الطالب</CardTitle>
            <CardDescription>أدخل تفاصيل الطالب واسم الاختبار</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentName">اسم الطالب</Label>
                <Input
                  id="studentName"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="أدخل اسم الطالب الكامل"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId">الرقم الجامعي / الهوية</Label>
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="أدخل رقم الطالب"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="examName">اسم الاختبار</Label>
              <div className="flex gap-2">
                <Input
                  id="examName"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="مثال: اختبار منتصف الفصل - رياضيات"
                  required
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={loadFromTemplate}>
                  تحميل نموذج
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* رفع ملف PDF */}
        <Card>
          <CardHeader>
            <CardTitle>رفع ملف الاختبار (PDF)</CardTitle>
            <CardDescription>ارفع ورقة الاختبار كاملة بصيغة PDF للمعينة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
              <Input
                type="file"
                accept="application/pdf"
                onChange={handlePdfUpload}
                className="hidden"
                id="pdf-upload"
              />
              <Label htmlFor="pdf-upload" className="cursor-pointer block">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                {pdfFile ? (
                  <p className="text-green-600 font-medium">{pdfFile.name}</p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-gray-600 font-medium">اضغط لرفع ملف PDF</p>
                    <p className="text-xs text-gray-400">يمكنك سحب وإفلات الملف هنا</p>
                  </div>
                )}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* رفع صور الإجابات */}
        <Card>
          <CardHeader>
            <CardTitle>رفع صور الإجابات</CardTitle>
            <CardDescription>ارفع أجزاء الإجابات كصور مع تحديد درجاتها</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="questionNumber">رقم السؤال</Label>
                <Input
                  id="questionNumber"
                  type="number"
                  min="1"
                  value={currentQuestion}
                  onChange={(e) => {
                    setCurrentQuestion(parseInt(e.target.value) || 1);
                    setCurrentPart(1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partNumber">رقم الجزء</Label>
                <Input
                  id="partNumber"
                  type="number"
                  min="1"
                  value={currentPart}
                  onChange={(e) => setCurrentPart(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxScore">الدرجة القصوى</Label>
                <Input
                  id="maxScore"
                  type="number"
                  min="0"
                  value={currentMaxScore}
                  onChange={(e) => setCurrentMaxScore(parseInt(e.target.value) || 0)}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="border-2 border-dashed border-blue-200 rounded-lg p-8 text-center bg-blue-50/30">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={currentMaxScore === 0}
              />
              <Label htmlFor="image-upload" className={currentMaxScore === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer block'}>
                <Upload className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <p className="text-blue-700 font-medium">
                  {currentMaxScore === 0 
                    ? 'حدد الدرجة القصوى أولاً لتتمكن من الرفع' 
                    : `اضغط لرفع صورة س${currentQuestion} ج${currentPart} (بواقع ${currentMaxScore} درجة)`}
                </p>
              </Label>
            </div>

            {/* قائمة الصور المرفوعة */}
            {answerImages.length > 0 && (
              <div className="space-y-3 pt-4">
                <Label className="text-lg font-bold">أجزاء الإجابة المرفوعة ({answerImages.length})</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto pl-2">
                  {answerImages.map((img, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                      <div className="flex items-center gap-4">
                        <img 
                          src={URL.createObjectURL(img.file)} 
                          alt={`س ${img.questionNumber} ج ${img.partNumber}`}
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <div>
                          <p className="font-bold text-blue-900">
                            السؤال {img.questionNumber}، الجزء {img.partNumber}
                          </p>
                          <p className="text-sm text-gray-500">{img.maxScore} درجات</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImage(index)}
                        className="hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* أزرار الإرسال */}
        <div className="flex gap-4">
          <Button type="submit" size="lg" className="flex-1 text-lg font-bold h-14">
            <Plus className="w-5 h-5 ml-2" />
            رفع الورقة وحفظ البيانات
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-14"
            onClick={() => navigate('/dashboard')}
          >
            عرض لوحة التحكم
          </Button>
        </div>
      </form>
    </div>
  );
}