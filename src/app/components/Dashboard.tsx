import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Trash2, Eye, BarChart3, Upload, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { getPapers, deletePaper, getMarkDistributions } from '../utils/storage';
import { ExamPaper, MarkDistribution } from '../types/exam';
import { toast } from 'sonner';

export function Dashboard() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [distributions, setDistributions] = useState<MarkDistribution[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  // تحويل الدالة إلى async لتتوافق مع المستودع العملاق
  const loadData = async () => {
    try {
      const fetchedPapers = await getPapers();
      setPapers(fetchedPapers);
      
      const fetchedDistributions = await getMarkDistributions();
      setDistributions(fetchedDistributions);
    } catch (error) {
      console.error("حدث خطأ أثناء تحميل البيانات:", error);
      toast.error('حدث خطأ أثناء تحميل أوراق الاختبار.');
    }
  };

  // تحويل دالة الحذف إلى async
  const handleDelete = async (paperId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الورقة بشكل نهائي؟')) {
      await deletePaper(paperId);
      await loadData();
      toast.success('تم حذف الورقة بنجاح');
    }
  };

  const getStatusBadge = (status: ExamPaper['status']) => {
    const variants = {
      pending: 'secondary',
      'in-progress': 'default',
      completed: 'default',
    } as const;

    const labels = {
      pending: 'قيد الانتظار',
      'in-progress': 'جاري التصحيح',
      completed: 'مكتمل',
    };

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
    };

    return (
      <Badge variant={variants[status]} className={`${colors[status]} px-3 py-1 font-bold`}>
        {labels[status]}
      </Badge>
    );
  };

  const getExamStats = () => {
    const stats = {
      total: papers.length,
      pending: papers.filter(p => p.status === 'pending').length,
      inProgress: papers.filter(p => p.status === 'in-progress').length,
      completed: papers.filter(p => p.status === 'completed').length,
      avgScore: 0,
    };

    const completedPapers = papers.filter(p => p.status === 'completed' && p.totalScore !== undefined);
    if (completedPapers.length > 0) {
      const totalScore = completedPapers.reduce((sum, p) => sum + (p.totalScore || 0), 0);
      const totalMax = completedPapers.reduce((sum, p) => sum + p.totalMaxScore, 0);
      stats.avgScore = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
    }

    return stats;
  };

  const stats = getExamStats();

  return (
    <div className="container mx-auto p-6 max-w-7xl text-right" dir="rtl">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-slate-800">لوحة تحكم النتائج</h1>
            <p className="text-gray-600">نظرة شاملة على أوراق الاختبار والنتائج المكتملة</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/mark-distribution')} className="border-blue-200 text-blue-700 hover:bg-blue-50">
              <Settings className="w-4 h-4 ml-2" />
              توزيع الدرجات
            </Button>
            <Button onClick={() => navigate('/')} className="bg-slate-800 hover:bg-slate-900">
              <Upload className="w-4 h-4 ml-2" />
              رفع أوراق جديدة
            </Button>
          </div>
        </div>

        {/* كروت الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-6">
              <div className="text-3xl font-black text-slate-700">{stats.total}</div>
              <div className="text-sm font-bold text-slate-500 mt-1">إجمالي الأوراق</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-yellow-200 bg-yellow-50/30">
            <CardContent className="p-6">
              <div className="text-3xl font-black text-yellow-600">{stats.pending}</div>
              <div className="text-sm font-bold text-yellow-700 mt-1">قيد الانتظار</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-blue-200 bg-blue-50/30">
            <CardContent className="p-6">
              <div className="text-3xl font-black text-blue-600">{stats.inProgress}</div>
              <div className="text-sm font-bold text-blue-700 mt-1">جاري التصحيح</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-green-200 bg-green-50/30">
            <CardContent className="p-6">
              <div className="text-3xl font-black text-green-600">{stats.completed}</div>
              <div className="text-sm font-bold text-green-700 mt-1">مكتملة وجاهزة</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-6">
              <div className="text-3xl font-black text-slate-700">{stats.avgScore.toFixed(1)}%</div>
              <div className="text-sm font-bold text-slate-500 mt-1">متوسط أداء الطلاب</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="results" className="space-y-4">
        <TabsList className="flex justify-start bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="results" className="text-md px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">نتائج الطلاب المكتملة</TabsTrigger>
          <TabsTrigger value="papers" className="text-md px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">سجل الأوراق المرفوعة</TabsTrigger>
        </TabsList>

        {/* --- التبويب الأول: نتائج الطلاب --- */}
        <TabsContent value="results">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-xl text-slate-800">سجل النتائج النهائية</CardTitle>
              <CardDescription>عرض وطباعة شهادات الاختبارات التي تم الانتهاء من تصحيحها</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {papers.filter(p => p.status === 'completed').length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-bold text-slate-600 mb-2">لا توجد نتائج مكتملة بعد</p>
                  <p className="text-sm text-slate-500 mb-6">قم بتصحيح الأوراق التي قمت برفعها لتظهر نتائجها هنا</p>
                  <Button onClick={() => navigate('/grade')} className="bg-blue-600 hover:bg-blue-700">الذهاب لغرفة التصحيح</Button>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="text-right font-bold text-slate-600">اسم الطالب</TableHead>
                        <TableHead className="text-right font-bold text-slate-600">الرقم التعريفي</TableHead>
                        <TableHead className="text-right font-bold text-slate-600">الاختبار المعتمد</TableHead>
                        <TableHead className="text-center font-bold text-slate-600">الدرجة</TableHead>
                        <TableHead className="text-center font-bold text-slate-600">النسبة</TableHead>
                        <TableHead className="text-right font-bold text-slate-600">تاريخ الإنجاز</TableHead>
                        <TableHead className="text-center font-bold text-slate-600">الشهادة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100">
                      {papers
                        .filter(p => p.status === 'completed')
                        .map(paper => {
                          const percentage = paper.totalMaxScore > 0
                            ? ((paper.totalScore || 0) / paper.totalMaxScore) * 100
                            : 0;
                          
                          return (
                            <TableRow key={paper.id} className="hover:bg-blue-50/30 transition-colors">
                              <TableCell className="font-bold text-blue-900">{paper.studentName}</TableCell>
                              <TableCell className="text-slate-600 font-mono">{paper.studentId}</TableCell>
                              <TableCell className="font-medium text-slate-700">{paper.examName}</TableCell>
                              <TableCell className="text-center">
                                <span className="font-bold text-lg text-slate-800">{paper.totalScore}</span>
                                <span className="text-xs text-slate-400 ml-1">/ {paper.totalMaxScore}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={`border-none ${
                                  percentage >= 80 ? 'bg-green-100 text-green-700' :
                                  percentage >= 60 ? 'bg-blue-100 text-blue-700' :
                                  percentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {percentage.toFixed(1)}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-slate-500">
                                {paper.gradedDate ? new Date(paper.gradedDate).toLocaleDateString('ar-EG') : '—'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:bg-blue-100"
                                  onClick={() => navigate(`/results/${paper.id}`)}
                                >
                                  <Eye className="w-4 h-4 ml-2" />
                                  عرض وطباعة
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- التبويب الثاني: سجل جميع الأوراق --- */}
        <TabsContent value="papers">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-xl text-slate-800">سجل الأوراق المرفوعة</CardTitle>
              <CardDescription>متابعة حالة جميع الأوراق التي تم ربطها بالطلاب</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {papers.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-bold text-slate-600 mb-2">لا توجد أوراق مرفوعة حتى الآن</p>
                  <Button onClick={() => navigate('/')} className="mt-4">
                    <Upload className="w-4 h-4 ml-2" />
                    رفع أول مجموعة أوراق
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="text-right font-bold text-slate-600">اسم الطالب</TableHead>
                        <TableHead className="text-right font-bold text-slate-600">الرقم</TableHead>
                        <TableHead className="text-right font-bold text-slate-600">الاختبار</TableHead>
                        <TableHead className="text-center font-bold text-slate-600">الحالة</TableHead>
                        <TableHead className="text-right font-bold text-slate-600">تاريخ الرفع</TableHead>
                        <TableHead className="text-left font-bold text-slate-600">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100">
                      {papers.map(paper => (
                        <TableRow key={paper.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-bold text-slate-700">{paper.studentName}</TableCell>
                          <TableCell className="text-slate-500 font-mono">{paper.studentId}</TableCell>
                          <TableCell className="text-slate-600">{paper.examName}</TableCell>
                          <TableCell className="text-center">{getStatusBadge(paper.status)}</TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {new Date(paper.uploadDate).toLocaleDateString('ar-EG')}
                          </TableCell>
                          <TableCell className="text-left">
                            <div className="flex justify-end gap-2">
                              {paper.status !== 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                  onClick={() => navigate('/grade')}
                                >
                                  تصحيح الآن
                                </Button>
                              )}
                              {paper.status === 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-slate-600 hover:text-blue-600"
                                  onClick={() => navigate(`/results/${paper.id}`)}
                                  title="عرض التفاصيل"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(paper.id)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                title="حذف نهائي"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
