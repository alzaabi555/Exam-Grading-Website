import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, FileEdit, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { addMarkDistribution, getMarkDistributions, saveMarkDistributions } from '../utils/storage';
import { MarkDistribution } from '../types/exam';
import { toast } from 'sonner';

export function MarkDistributionManager() {
  const [examName, setExamName] = useState('');
  const [questions, setQuestions] = useState<MarkDistribution['questions']>([]);
  const [distributions, setDistributions] = useState<MarkDistribution[]>([]);

  useEffect(() => {
    loadDistributions();
  }, []);

  // 1. الدالة بعد عملية الحماية الجراحية: نضمن دائماً وجود مصفوفة (Array)
  const loadDistributions = async () => {
    try {
      const data = await getMarkDistributions();
      // السطر السحري: إذا كانت البيانات موجودة ومصفوفة ضعها، وإلا ضع مصفوفة فارغة
      setDistributions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("خطأ في جلب القوالب:", error);
      setDistributions([]);
    }
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
    const updatedQuestions = questions.filter((_, i) => i !== index).map((q, i) => ({
      ...q,
      questionNumber: i + 1
    }));
    setQuestions(updatedQuestions);
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
    updatedQuestions[questionIndex].parts = updatedQuestions[questionIndex].parts.map((p, i) => ({
      ...p,
      partNumber: i + 1
    }));
    setQuestions(updatedQuestions);
  };

  const updatePartScore = (questionIndex: number, partIndex: number, maxScore: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].parts[partIndex].maxScore = maxScore;
    setQuestions(updatedQuestions);
  };

  // 2. دالة الحفظ
  const handleSave = async () => {
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
      toast.error('يجب أن تكون جميع الدرجات أكبر من صفر (0)');
      return;
    }

    const distribution: MarkDistribution = {
      examName,
      questions,
    };

    await addMarkDistribution(distribution);
    await loadDistributions();
    
    setExamName('');
    setQuestions([]);
    
    toast.success('تم حفظ قالب توزيع الدرجات بنجاح!');
  };

  const loadTemplate = (distribution: MarkDistribution) => {
    setExamName(distribution.examName);
    setQuestions(JSON.parse(JSON.stringify(distribution.questions)));
    toast.success(`تم تحميل قالب "${distribution.examName}" للتعديل`);
  };

  // 3. دالة الحذف
  const deleteTemplate = async (examNameToDelete: string) => {
    if (confirm(`هل أنت متأكد من حذف قالب "${examNameToDelete}" نهائياً؟`)) {
      const updatedDistributions = distributions.filter(d => d.examName !== examNameToDelete);
      setDistributions(updatedDistributions);
      await saveMarkDistributions(updatedDistributions);
      toast.success('تم حذف القالب بنجاح');
    }
  };

  const getTotalMarks = (dist: MarkDistribution | { questions: MarkDistribution['questions'] }) => {
    return dist.questions.reduce(
      (sum, q) => sum + q.parts.reduce((pSum, p) => pSum + p.maxScore, 0),
      0
    );
  };

  return (
    <div className="text-right h-full flex flex-col" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">قوالب توزيع الدرجات</h1>
        <p className="text-slate-500">قم بإعداد هياكل الاختبارات لربطها لاحقاً بالأوراق المرفوعة</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        
        {/* --- العمود الأيمن: إنشاء/تعديل التوزيع --- */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-blue-100 shadow-md">
            <CardHeader className="bg-blue-50/50 border-b">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <FileEdit className="w-5 h-5" />
                محرر توزيع الدرجات
              </CardTitle>
              <CardDescription>حدد اسم الاختبار ثم أضف الأسئلة ودرجاتها بالتفصيل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <Label htmlFor="examName" className="text-lg font-bold mb-2 block">اسم الاختبار المعتمد</Label>
                <Input
                  id="examName"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="مثال: منتصف الفصل - لغة عربية"
                  className="text-lg py-6 border-blue-300 focus-visible:ring-blue-500"
                />
              </div>

              <div className="flex justify-between items-center bg-slate-800 text-white p-3 rounded-lg shadow-sm">
                <Label className="text-lg font-bold">هيكل الأسئلة</Label>
                <Button type="button" size="sm" onClick={addQuestion} className="bg-blue-600 hover:bg-blue-500">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة سؤال جديد
                </Button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                  <FileEdit className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>لم يتم إضافة أي أسئلة بعد.</p>
                  <p className="text-sm">اضغط على "إضافة سؤال جديد" للبدء.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {questions.map((question, qIndex) => (
                    <Card key={qIndex} className="border border-slate-200 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                      <CardHeader className="py-3 bg-slate-50/80 border-b">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-md font-bold text-slate-700">
                            السؤال {question.questionNumber}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addPart(qIndex)}
                              className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Plus className="w-3 h-3 ml-1" />
                              إضافة جزء (فرع)
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(qIndex)}
                              className="h-8 hover:bg-red-50 hover:text-red-600"
                              title="حذف السؤال بالكامل"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3 bg-white">
                        {question.parts.map((part, pIndex) => (
                          <div key={pIndex} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors">
                            <Badge variant="outline" className="w-16 justify-center bg-white">
                              جزء {part.partNumber}
                            </Badge>
                            <div className="flex-1 flex items-center gap-2">
                              <Input
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={part.maxScore || ''}
                                onChange={(e) => updatePartScore(qIndex, pIndex, parseFloat(e.target.value) || 0)}
                                placeholder="الدرجة المخصصة"
                                className="w-32 text-center"
                              />
                              <span className="text-sm text-slate-500">درجة</span>
                            </div>
                            {question.parts.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removePart(qIndex, pIndex)}
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        
                        <div className="pt-3 mt-2 border-t flex justify-between items-center text-slate-600 bg-slate-50 p-2 rounded">
                          <span className="text-sm font-bold">إجمالي درجات السؤال:</span>
                          <span className="font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                            {question.parts.reduce((sum, p) => sum + p.maxScore, 0)} درجة
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {questions.length > 0 && (
                <div className="pt-6 border-t mt-4">
                  <div className="flex justify-between items-center mb-4 bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="font-bold text-lg text-green-800">الإجمالي الكلي للاختبار:</p>
                    <p className="font-bold text-2xl text-green-700">
                      {getTotalMarks({ questions })} <span className="text-sm font-normal">درجة</span>
                    </p>
                  </div>
                  <Button onClick={handleSave} className="w-full h-14 text-lg bg-slate-900 hover:bg-slate-800">
                    <Save className="w-5 h-5 ml-2" />
                    حفظ واعتماد قالب توزيع الدرجات
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* --- العمود الأيسر: التوزيعات المحفوظة --- */}
        <div className="lg:col-span-5">
          <Card className="shadow-sm sticky top-6">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg">القوالب المحفوظة مسبقاً</CardTitle>
              <CardDescription>النماذج الجاهزة للاستخدام</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {distributions.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>لا توجد قوالب محفوظة</p>
                </div>
              ) : (
                <div className="divide-y max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {distributions.map((dist, index) => (
                    <div key={index} className="p-4 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-slate-800 text-lg leading-tight">
                          {dist.examName}
                        </h3>
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 shrink-0">
                          {getTotalMarks(dist)} درجة
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2 text-sm text-slate-500 mb-4">
                        <span>{dist.questions.length} أسئلة</span>
                        <span>•</span>
                        <span>{dist.questions.reduce((sum, q) => sum + q.parts.length, 0)} أجزاء (فروع)</span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-white border-slate-300 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() => loadTemplate(dist)}
                        >
                          <FileEdit className="w-4 h-4 ml-2" />
                          تحميل وتعديل
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-3 text-slate-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteTemplate(dist.examName)}
                          title="حذف القالب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
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
