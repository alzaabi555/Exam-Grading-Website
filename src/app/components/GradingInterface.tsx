import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Save, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { KeyboardShortcuts, KeyboardShortcutsHelp } from './KeyboardShortcuts';
import { getPapers, updatePaper, saveGradingSession, getGradingSession } from '../utils/storage';
import { ExamPaper, AnswerPart } from '../types/exam';
import { toast } from 'sonner';

export function GradingInterface() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [currentPaperIndex, setCurrentPaperIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [scoringDialogOpen, setScoringDialogOpen] = useState(false);
  const [currentPart, setCurrentPart] = useState<AnswerPart | null>(null);

  useEffect(() => {
    loadPapers();
    const session = getGradingSession();
    if (session) {
      const paperIdx = papers.findIndex(p => p.id === session.currentPaperId);
      if (paperIdx !== -1) {
        setCurrentPaperIndex(paperIdx);
        setCurrentQuestionIndex(session.currentQuestionIndex);
        setCurrentPartIndex(session.currentPartIndex);
      }
    }
  }, []);

  const loadPapers = () => {
    const allPapers = getPapers();
    const gradingPapers = allPapers.filter(p => p.status !== 'completed');
    setPapers(gradingPapers);
  };

  const currentPaper = papers[currentPaperIndex];
  const currentQuestion = currentPaper?.questions[currentQuestionIndex];
  const currentAnswerPart = currentQuestion?.parts[currentPartIndex];

  const handleScore = (score: number) => {
    if (!currentPaper || !currentQuestion || !currentAnswerPart) return;

    const updatedPaper = { ...currentPaper };
    updatedPaper.questions[currentQuestionIndex].parts[currentPartIndex].score = score;
    
    let totalScore = 0;
    let allGraded = true;

    updatedPaper.questions.forEach(q => {
      q.parts.forEach(p => {
        if (p.score !== undefined) {
          totalScore += p.score;
        } else {
          allGraded = false;
        }
      });
    });

    updatedPaper.totalScore = totalScore;
    updatedPaper.status = allGraded ? 'completed' : 'in-progress';
    
    if (allGraded) {
      updatedPaper.gradedDate = new Date().toISOString();
    }

    updatePaper(currentPaper.id, updatedPaper);
    loadPapers();
    setScoringDialogOpen(false);
    toast.success(`تم رصد الدرجة: ${score}/${currentAnswerPart.maxScore}`);

    handleNext();
  };

  const handleNext = () => {
    if (!currentPaper) return;

    let nextPaperIndex = currentPaperIndex;
    let nextQuestionIndex = currentQuestionIndex;
    let nextPartIndex = currentPartIndex + 1;

    if (nextPartIndex >= currentQuestion.parts.length) {
      nextPartIndex = 0;
      nextQuestionIndex += 1;

      if (nextQuestionIndex >= currentPaper.questions.length) {
        nextQuestionIndex = 0;
        nextPaperIndex += 1;

        if (nextPaperIndex >= papers.length) {
          toast.success('تم تصحيح جميع الأوراق!');
          navigate('/dashboard');
          return;
        }
      }
    }

    setCurrentPaperIndex(nextPaperIndex);
    setCurrentQuestionIndex(nextQuestionIndex);
    setCurrentPartIndex(nextPartIndex);

    saveGradingSession({
      currentPaperId: papers[nextPaperIndex]?.id,
      currentQuestionIndex: nextQuestionIndex,
      currentPartIndex: nextPartIndex,
    });
  };

  const handlePrevious = () => {
    if (!currentPaper) return;

    let prevPaperIndex = currentPaperIndex;
    let prevQuestionIndex = currentQuestionIndex;
    let prevPartIndex = currentPartIndex - 1;

    if (prevPartIndex < 0) {
      prevQuestionIndex -= 1;

      if (prevQuestionIndex < 0) {
        prevPaperIndex -= 1;

        if (prevPaperIndex < 0) {
          toast.error('أنت بالفعل في أول إجابة');
          return;
        }

        const prevPaper = papers[prevPaperIndex];
        prevQuestionIndex = prevPaper.questions.length - 1;
      }

      const prevQuestion = papers[prevPaperIndex].questions[prevQuestionIndex];
      prevPartIndex = prevQuestion.parts.length - 1;
    }

    setCurrentPaperIndex(prevPaperIndex);
    setCurrentQuestionIndex(prevQuestionIndex);
    setCurrentPartIndex(prevPartIndex);

    saveGradingSession({
      currentPaperId: papers[prevPaperIndex]?.id,
      currentQuestionIndex: prevQuestionIndex,
      currentPartIndex: prevPartIndex,
    });
  };

  const openScoringDialog = () => {
    setCurrentPart(currentAnswerPart);
    setScoringDialogOpen(true);
  };

  const getProgress = () => {
    if (!currentPaper) return 0;
    let totalParts = 0;
    let gradedParts = 0;

    currentPaper.questions.forEach(q => {
      q.parts.forEach(p => {
        totalParts++;
        if (p.score !== undefined) gradedParts++;
      });
    });

    return totalParts > 0 ? (gradedParts / totalParts) * 100 : 0;
  };

  if (!currentPaper || !currentQuestion || !currentAnswerPart) {
    return (
      <div className="container mx-auto p-6 max-w-6xl text-right" dir="rtl">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl mb-4 text-bold">لا توجد أوراق للتصحيح</h2>
            <p className="text-gray-600 mb-6">قم برفع أوراق الاختبار لتبدأ عملية التصحيح</p>
            <Button onClick={() => navigate('/')}>رفع الأوراق</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scoreOptions = Array.from({ length: currentAnswerPart.maxScore + 1 }, (_, i) => i);

  return (
    <div className="container mx-auto p-6 max-w-6xl text-right" dir="rtl">
      <KeyboardShortcuts
        onScoreShortcut={handleScore}
        onNext={handleNext}
        onPrevious={handlePrevious}
        maxScore={currentAnswerPart?.maxScore}
      />
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">واجهة التصحيح</h1>
            <p className="text-gray-600">
              الورقة {currentPaperIndex + 1} من {papers.length} - {currentPaper.studentName} ({currentPaper.studentId})
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            لوحة التحكم
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>تقدم تصحيح الورقة</span>
            <span>{Math.round(getProgress())}%</span>
          </div>
          <Progress value={getProgress()} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ملف الـ PDF */}
        <Card>
          <CardHeader>
            <CardTitle>ورقة الاختبار - {currentPaper.examName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-8 text-center min-h-96 flex items-center justify-center">
              <div className="text-gray-500">
                <p className="mb-2 text-lg font-medium">معاين ملف PDF</p>
                <p className="text-sm">معرف الورقة: {currentPaper.id}</p>
                <p className="text-sm text-gray-400 mt-4 italic">
                  في النسخة الفعلية، سيتم عرض ملف الـ PDF هنا باستخدام react-pdf
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* صورة الإجابة */}
        <Card>
          <CardHeader>
            <CardTitle>
              السؤال {currentQuestion.questionNumber}، الجزء {currentAnswerPart.partNumber}
            </CardTitle>
            <p className="text-sm text-gray-600">
              الدرجة القصوى: {currentAnswerPart.maxScore} | 
              الدرجة الحالية: {currentAnswerPart.score !== undefined ? currentAnswerPart.score : 'لم تصحح بعد'}
            </p>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-4 min-h-96 flex items-center justify-center mb-4 border-2 border-dashed border-gray-200">
              {currentAnswerPart.imageUrl.startsWith('blob:') ? (
                <img
                  src={currentAnswerPart.imageUrl}
                  alt={`سؤال ${currentQuestion.questionNumber} جزء ${currentAnswerPart.partNumber}`}
                  className="max-w-full max-h-96 rounded shadow-md"
                />
              ) : (
                <div className="text-center text-gray-500">
                  <p className="mb-2 text-lg font-medium">معاينة صورة الإجابة</p>
                  <p className="text-sm">معرف الجزء: {currentAnswerPart.id}</p>
                  <p className="text-sm text-gray-400 mt-4 italic">
                    نموذج إجابة للتوضيح
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={openScoringDialog}
                className="flex-1"
                size="lg"
              >
                <Save className="w-4 h-4 ml-2" />
                {currentAnswerPart.score !== undefined ? 'تعديل الدرجة' : 'إضافة درجة'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التنقل */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentPaperIndex === 0 && currentQuestionIndex === 0 && currentPartIndex === 0}
            >
              <ChevronRight className="w-4 h-4 ml-2" />
              السابق
            </Button>

            <div className="text-center">
              <p className="font-medium">
                السؤال {currentQuestion.questionNumber} من {currentPaper.questions.length}
              </p>
              <p className="text-sm text-gray-500">
                الجزء {currentPartIndex + 1} من {currentQuestion.parts.length}
              </p>
            </div>

            <Button onClick={handleNext}>
              التالي
              <ChevronLeft className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* نافذة رصد الدرجات */}
      <Dialog open={scoringDialogOpen} onOpenChange={setScoringDialogOpen}>
        <DialogContent>
          <DialogHeader className="text-right">
            <DialogTitle>
              رصد درجة السؤال {currentQuestion.questionNumber}، الجزء {currentAnswerPart.partNumber}
            </DialogTitle>
            <DialogDescription>
              اختر الدرجة المناسبة لهذا الجزء (من 0 إلى {currentAnswerPart.maxScore})
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-3 py-4" dir="ltr"> {/* ترك الأرقام LTR لسهولة قراءة الترتيب */}
            {scoreOptions.map(score => (
              <Button
                key={score}
                onClick={() => handleScore(score)}
                variant={currentAnswerPart.score === score ? 'default' : 'outline'}
                className="h-16 text-xl font-bold"
              >
                {score}
              </Button>
            ))}
          </div>

          <div className="text-sm text-gray-500 text-center italic">
            اضغط على الرقم لرصد الدرجة مباشرة
          </div>
        </DialogContent>
      </Dialog>

      {/* مساعدة اختصارات لوحة المفاتيح */}
      <div className="mt-6">
        <KeyboardShortcutsHelp />
      </div>
    </div>
  );
}