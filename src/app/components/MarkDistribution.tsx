import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, Plus, Trash2, Save } from 'lucide-react'; // استبدلت ArrowLeft بـ ArrowRight للرجوع في RTL
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { addMarkDistribution, getMarkDistributions } from '../utils/storage';
import { MarkDistribution } from '../types/exam';
import { toast } from 'sonner';

export function MarkDistributionManager() {
  const navigate = useNavigate();
  const [examName, setExamName] = useState('');
  const [questions, setQuestions] = useState<MarkDistribution['questions']>([]);
  const [distributions, setDistributions] = useState<MarkDistribution[]>([]);

  useEffect(() => {
    loadDistributions();
  }, []);

  const loadDistributions = () => {
    setDistributions(getMarkDistributions());
  };

  const addQuestion = () => {
    const newQuestionNumber = questions.length + 1;
    setQuestions([
      ...questions,
      {
        questionNumber: newQuestionNumber,
        parts: [{ partNumber: 1, maxScore: 0 }],
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addPart = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    const newPartNumber = updatedQuestions[questionIndex].parts.length + 1;
    updatedQuestions[questionIndex].parts.push({
      partNumber: newPartNumber,
      maxScore: 0,
    });
    setQuestions(updatedQuestions);
  };

  const removePart = (questionIndex: number, partIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].parts = updatedQuestions[questionIndex].parts.filter(
      (_, i) => i !== partIndex
    );
    setQuestions(updatedQuestions);
  };

  const updatePartScore = (questionIndex: number, partIndex: number, maxScore: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].parts[partIndex].maxScore = maxScore;
    setQuestions(updatedQuestions);
  };

  const handleSave = () => {
    if (!examName.trim()) {
      toast.error('يرجى إدخال اسم الاختبار');
      return;
    }

    if (questions.length === 0) {
      toast.error('يرجى إضافة سؤال واحد على الأقل');
      return;
    }

    const hasInvalidScores = questions.some(q =>
      q.parts.some(p => p.maxScore <= 0)
    );

    if (hasInvalidScores) {
      toast.error('يجب أن تكون جميع الدرجات أكبر من 0');
      return;
    }

    const distribution: MarkDistribution = {
      examName,
      questions,
    };

    addMarkDistribution(distribution);
    loadDistributions();
    
    setExamName('');
    setQuestions([]);
    
    toast.success('تم حفظ توزيع الدرجات بنجاح!');
  };

  const loadTemplate = (distribution: MarkDistribution) => {
    setExamName(distribution.examName);
    setQuestions(JSON.parse(JSON.stringify(distribution.questions)));
    toast.success('تم تحميل النموذج');
  };

  const getTotalMarks = (dist: MarkDistribution) => {
    return dist.questions.reduce(
      (sum, q) => sum + q.parts.reduce((pSum, p) => pSum + p.maxScore, 0),
      0
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl text-right" dir="rtl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للوحة التحكم
        </Button>
        <h1 className="text-3xl font-bold mb-2">مدير توزيع الدرجات</h1>
        <p className="text-gray-600">تهيئة نماذج توزيع الدرجات للاختبارات</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* إنشاء/تعديل التوزيع */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إنشاء توزيع درجات</CardTitle>
              <CardDescription>حدد توزيع الدرجات لكل سؤال وجزء</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="examName">اسم الاختبار</Label>
                <Input
                  id="examName"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="مثال: منتصف الفصل - رياضيات"
                  className="mt-1"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <Label className="text-lg font-semibold">الأسئلة</Label>
                <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة سؤال
                </Button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                  لم يتم إضافة أسئلة بعد
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pl-2"> {/* pl-2 لترك مساحة لشريط التمرير */}
                  {questions.map((question, qIndex) => (
                    <Card key={qIndex} className="border-2">
                      <CardHeader className="pb-3 bg-gray-50/50">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            السؤال {question.questionNumber}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addPart(qIndex)}
                            >
                              <Plus className="w-3 h-3 ml-1" />
                              جزء
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(qIndex)}
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-4">
                        {question.parts.map((part, pIndex) => (
                          <div key={pIndex} className="flex items-center gap-2">
                            <Label className="w-24 text-sm">الجزء {part.partNumber}</Label>
                            <Input
                              type="number"
                              min="0"
                              value={part.maxScore || ''}
                              onChange={(e) =>
                                updatePartScore(qIndex, pIndex, parseInt(e.target.value) || 0)
                              }
                              placeholder="الدرجة"
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-600 w-12">درجة</span>
                            {question.parts.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removePart(qIndex, pIndex)}
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <div className="pt-2 mt-2 border-t flex justify-between">
                          <p className="text-sm font-bold">
                            إجمالي السؤال:
                          </p>
                          <p className="text-sm font-bold">
                            {question.parts.reduce((sum, p) => sum + p.maxScore, 0)} درجة
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {questions.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-bold text-lg">
                      إجمالي درجات الاختبار:
                    </p>
                    <p className="font-bold text-lg text-blue-600">
                      {questions.reduce(
                        (sum, q) => sum + q.parts.reduce((pSum, p) => pSum + p.maxScore, 0),
                        0
                      )} درجة
                    </p>
                  </div>
                  <Button onClick={handleSave} className="w-full" size="lg">
                    <Save className="w-4 h-4 ml-2" />
                    حفظ التوزيع
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* التوزيعات المحفوظة */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>التوزيعات المحفوظة</CardTitle>
              <CardDescription>نماذج توزيع الدرجات التي تم إعدادها مسبقاً</CardDescription>
            </CardHeader>
            <CardContent>
              {distributions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                  لا توجد توزيعات محفوظة حالياً
                </div>
              ) : (
                <div className="space-y-4">
                  {distributions.map((dist, index) => (
                    <Card key={index} className="border hover:border-blue-300 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{dist.examName}</CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadTemplate(dist)}
                          >
                            تحميل
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-right">السؤال</TableHead>
                              <TableHead className="text-right">الأجزاء</TableHead>
                              <TableHead className="text-left">الدرجات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dist.questions.map((q) => (
                              <TableRow key={q.questionNumber}>
                                <TableCell>س {q.questionNumber}</TableCell>
                                <TableCell>{q.parts.length}</TableCell>
                                <TableCell className="text-left">
                                  {q.parts.reduce((sum, p) => sum + p.maxScore, 0)}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-gray-50/50 font-bold">
                              <TableCell colSpan={2} className="text-right">
                                الإجمالي
                              </TableCell>
                              <TableCell className="text-left">
                                {getTotalMarks(dist)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}