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

  const loadData = () => {
    setPapers(getPapers());
    setDistributions(getMarkDistributions());
  };

  const handleDelete = (paperId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الورقة؟')) {
      deletePaper(paperId);
      loadData();
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
      pending: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">لوحة تحكم التصحيح</h1>
            <p className="text-gray-600">إدارة أوراق الاختبار وعرض إحصائيات التصحيح</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/mark-distribution')}>
              <Settings className="w-4 h-4 ml-2" />
              توزيع الدرجات
            </Button>
            <Button onClick={() => navigate('/')}>
              <Upload className="w-4 h-4 ml-2" />
              رفع ورقة جديدة
            </Button>
          </div>
        </div>

        {/* كروت الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">إجمالي الأوراق</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">قيد الانتظار</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-sm text-gray-600">جاري العمل</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">مكتملة</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{stats.avgScore.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">متوسط الدرجات</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="papers" className="space-y-4">
        <TabsList className="flex justify-start">
          <TabsTrigger value="papers">أوراق الاختبارات</TabsTrigger>
          <TabsTrigger value="results">نتائج الطلاب</TabsTrigger>
        </TabsList>

        <TabsContent value="papers">
          <Card>
            <CardHeader>
              <CardTitle>جميع أوراق الاختبار</CardTitle>
              <CardDescription>عرض وإدارة أوراق الاختبار المرفوعة</CardDescription>
            </CardHeader>
            <CardContent>
              {papers.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 mb-4">لا توجد أوراق مرفوعة حتى الآن</p>
                  <Button onClick={() => navigate('/')}>
                    <Upload className="w-4 h-4 ml-2" />
                    رفع أول ورقة
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم الطالب</TableHead>
                        <TableHead className="text-right">رقم الطالب</TableHead>
                        <TableHead className="text-right">اسم الاختبار</TableHead>
                        <TableHead className="text-right">الأسئلة</TableHead>
                        <TableHead className="text-right">الدرجة</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">تاريخ الرفع</TableHead>
                        <TableHead className="text-left">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {papers.map(paper => (
                        <TableRow key={paper.id}>
                          <TableCell className="font-medium">{paper.studentName}</TableCell>
                          <TableCell>{paper.studentId}</TableCell>
                          <TableCell>{paper.examName}</TableCell>
                          <TableCell>{paper.questions.length}</TableCell>
                          <TableCell>
                            {paper.totalScore !== undefined
                              ? `${paper.totalScore}/${paper.totalMaxScore}`
                              : `—/${paper.totalMaxScore}`}
                          </TableCell>
                          <TableCell>{getStatusBadge(paper.status)}</TableCell>
                          <TableCell>
                            {new Date(paper.uploadDate).toLocaleDateString('ar-EG')}
                          </TableCell>
                          <TableCell className="text-left">
                            <div className="flex justify-start gap-2">
                              {paper.status !== 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate('/grade')}
                                >
                                  تصحيح
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/results/${paper.id}`)}
                                title="عرض التفاصيل"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(paper.id)}
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
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

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>نتائج الطلاب</CardTitle>
              <CardDescription>عرض نتائج الاختبارات المكتملة حسب الطالب</CardDescription>
            </CardHeader>
            <CardContent>
              {papers.filter(p => p.status === 'completed').length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 mb-4">لا توجد اختبارات مكتملة بعد</p>
                  <Button onClick={() => navigate('/grade')}>ابدأ التصحيح</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم الطالب</TableHead>
                        <TableHead className="text-right">رقم الطالب</TableHead>
                        <TableHead className="text-right">اسم الاختبار</TableHead>
                        <TableHead className="text-right">إجمالي الدرجة</TableHead>
                        <TableHead className="text-right">النسبة المئوية</TableHead>
                        <TableHead className="text-right">تاريخ التصحيح</TableHead>
                        <TableHead className="text-left">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {papers
                        .filter(p => p.status === 'completed')
                        .map(paper => {
                          const percentage = paper.totalMaxScore > 0
                            ? ((paper.totalScore || 0) / paper.totalMaxScore) * 100
                            : 0;
                          
                          return (
                            <TableRow key={paper.id}>
                              <TableCell className="font-medium">{paper.studentName}</TableCell>
                              <TableCell>{paper.studentId}</TableCell>
                              <TableCell>{paper.examName}</TableCell>
                              <TableCell>
                                {paper.totalScore}/{paper.totalMaxScore}
                              </TableCell>
                              <TableCell>
                                <span className={
                                  percentage >= 70 ? 'text-green-600 font-bold' :
                                  percentage >= 50 ? 'text-yellow-600 font-bold' :
                                  'text-red-600 font-bold'
                                }>
                                  {percentage.toFixed(1)}%
                                </span>
                              </TableCell>
                              <TableCell>
                                {paper.gradedDate 
                                  ? new Date(paper.gradedDate).toLocaleDateString('ar-EG')
                                  : '—'}
                              </TableCell>
                              <TableCell className="text-left">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/results/${paper.id}`)}
                                >
                                  <Eye className="w-4 h-4 ml-2" />
                                  عرض التفاصيل
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
      </Tabs>
    </div>
  );
}