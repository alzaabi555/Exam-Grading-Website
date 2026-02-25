import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowRight, FileText, CheckCircle, XCircle } from 'lucide-react'; // استبدلت ArrowLeft بـ ArrowRight
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { getPapers } from '../utils/storage';
import { ExamPaper } from '../types/exam';

export function StudentResults() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState<ExamPaper | null>(null);

  useEffect(() => {
    const papers = getPapers();
    const foundPaper = papers.find(p => p.id === paperId);
    setPaper(foundPaper || null);
  }, [paperId]);

  if (!paper) {
    return (
      <div className="container mx-auto p-6 max-w-4xl text-right" dir="rtl">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl mb-4 font-bold">ورقة الاختبار غير موجودة</h2>
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

  return (
    <div className="container mx-auto p-6 max-w-5xl text-right" dir="rtl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للوحة التحكم
        </Button>
        <h1 className="text-3xl font-bold mb-2">نتائج الاختبار</h1>
        <p className="text-gray-600">تفاصيل رصد الدرجات والنتيجة النهائية</p>
      </div>

      {/* معلومات الطالب */}
      <Card className="mb-6 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">معلومات الطالب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">اسم الطالب</p>
              <p className="font-bold">{paper.studentName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">رقم الطالب</p>
              <p className="font-bold">{paper.studentId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">اسم الاختبار</p>
              <p className="font-bold">{paper.examName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">تاريخ التصحيح</p>
              <p className="font-bold">
                {paper.gradedDate
                  ? new Date(paper.gradedDate).toLocaleDateString('ar-EG')
                  : 'جاري التصحيح...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملخص الدرجات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-t-4 border-t-blue-500">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">إجمالي الدرجة</p>
            <p className="text-4xl font-black">
              {paper.totalScore !== undefined ? paper.totalScore : '—'} <span className="text-lg text-gray-400">/ {paper.totalMaxScore}</span>
            </p>
          </CardContent>
        </Card>
        <Card className={`border-t-4 ${percentage >= 50 ? 'border-t-green-500' : 'border-t-red-500'}`}>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">النسبة المئوية</p>
            <p className={`text-4xl font-black ${gradeInfo.color}`}>
              {percentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card className={`border-t-4 ${percentage >= 50 ? 'border-t-green-500' : 'border-t-red-500'}`}>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">التقدير العام</p>
            <p className={`text-2xl font-black ${gradeInfo.color}`}>
              {gradeInfo.grade}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* شريط التقدم */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span>مستوى الإنجاز في الدرجات</span>
              <span>{paper.totalScore !== undefined ? paper.totalScore : 0} من أصل {paper.totalMaxScore}</span>
            </div>
            <Progress value={percentage} className="h-4" />
          </div>
        </CardContent>
      </Card>

      {/* تفاصيل الأسئلة */}
      <Card>
        <CardHeader>
          <CardTitle>تحليل الأسئلة التفصيلي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {paper.questions.map((question, qIndex) => {
              const questionScore = question.parts.reduce((sum, p) => sum + (p.score || 0), 0);
              const questionPercentage = question.totalMaxScore > 0
                ? (questionScore / question.totalMaxScore) * 100
                : 0;

              return (
                <div key={question.id}>
                  {qIndex > 0 && <Separator className="mb-8" />}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-blue-800">
                        السؤال {question.questionNumber}
                      </h3>
                      <div className="text-left">
                        <p className="font-bold text-lg">
                          {questionScore} <span className="text-sm text-gray-400">/ {question.totalMaxScore}</span>
                        </p>
                        <p className="text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                          {questionPercentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="text-right">الجزء</TableHead>
                          <TableHead className="text-right">معرف الجزء</TableHead>
                          <TableHead className="text-center">الدرجة القصوى</TableHead>
                          <TableHead className="text-center">الدرجة المرصودة</TableHead>
                          <TableHead className="text-left">النتيجة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {question.parts.map(part => {
                          const partPercentage = part.maxScore > 0
                            ? ((part.score || 0) / part.maxScore) * 100
                            : 0;
                          const isPerfect = part.score === part.maxScore;
                          const isFailed = (part.score || 0) < part.maxScore * 0.5;

                          return (
                            <TableRow key={part.id}>
                              <TableCell className="font-bold">
                                جزء {part.partNumber}
                              </TableCell>
                              <TableCell className="text-xs text-gray-400 font-mono">
                                {part.id}
                              </TableCell>
                              <TableCell className="text-center">{part.maxScore}</TableCell>
                              <TableCell className="text-center">
                                <span className={`font-bold ${
                                  isPerfect ? 'text-green-600' :
                                  isFailed ? 'text-red-600' :
                                  'text-blue-600'
                                }`}>
                                  {part.score !== undefined ? part.score : '—'}
                                </span>
                              </TableCell>
                              <TableCell className="text-left">
                                {part.score !== undefined && (
                                  <div className="flex items-center justify-start gap-2">
                                    <span className="text-xs font-medium">
                                      {partPercentage.toFixed(0)}%
                                    </span>
                                    {isPerfect ? (
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : isFailed ? (
                                      <XCircle className="w-5 h-5 text-red-500" />
                                    ) : null}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* المرجع الفريد */}
      <Card className="mt-6 bg-gray-50 border-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <FileText className="w-4 h-4" />
            <span>المعرف الرقمي للورقة: {paper.id}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}