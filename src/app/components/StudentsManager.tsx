import { useState, useEffect } from 'react';
import { Users, Trash2, FolderOpen, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { StudentImporter, Student } from './StudentImporter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function StudentsManager() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [activeClass, setActiveClass] = useState<string>('');

  // جلب الطلاب عند فتح الصفحة
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('fastGrader_students') || '[]');
    setAllStudents(stored);
    
    // تحديد أول صف كنشط افتراضياً
    const classes = getUniqueClasses(stored);
    if (classes.length > 0) setActiveClass(classes[0]);
  }, []);

  // استخراج أسماء الفصول (الصفوف) بدون تكرار
  const getUniqueClasses = (studentsList: Student[]) => {
    const classes = studentsList.map(s => s.className || 'غير مصنف');
    return Array.from(new Set(classes)).sort();
  };

  const classesList = getUniqueClasses(allStudents);

  // السحر هنا: دمج الطلاب الجدد مع القدامى بدون تكرار
  const handleStudentsImported = (newStudents: Student[]) => {
    setAllStudents(prevStudents => {
      const mergedStudents = [...prevStudents];
      let addedCount = 0;
      let updatedCount = 0;

      newStudents.forEach(newStudent => {
        const existingIndex = mergedStudents.findIndex(s => s.id === newStudent.id);
        if (existingIndex >= 0) {
          // تحديث بيانات الطالب إذا كان موجوداً مسبقاً
          mergedStudents[existingIndex] = newStudent;
          updatedCount++;
        } else {
          // إضافة الطالب الجديد
          mergedStudents.push(newStudent);
          addedCount++;
        }
      });

      localStorage.setItem('fastGrader_students', JSON.stringify(mergedStudents));
      
      toast.success(`تمت العملية بنجاح! إضافة: ${addedCount} طالب، تحديث: ${updatedCount} طالب.`);
      
      // تنشيط صف الطلاب الجدد تلقائياً ليرى المعلم النتيجة
      if (newStudents.length > 0) {
        setActiveClass(newStudents[0].className || 'غير مصنف');
      }

      return mergedStudents;
    });
  };

  // دالة لحذف صف كامل
  const handleDeleteClass = (classNameToDelete: string) => {
    if (confirm(`هل أنت متأكد من حذف جميع طلاب "${classNameToDelete}"؟ لن تتأثر أوراق الاختبار المصححة مسبقاً.`)) {
      const remainingStudents = allStudents.filter(s => (s.className || 'غير مصنف') !== classNameToDelete);
      setAllStudents(remainingStudents);
      localStorage.setItem('fastGrader_students', JSON.stringify(remainingStudents));
      
      toast.success(`تم حذف ${classNameToDelete} بنجاح.`);
      
      const newClasses = getUniqueClasses(remainingStudents);
      setActiveClass(newClasses.length > 0 ? newClasses[0] : '');
    }
  };

  // دالة لمسح قاعدة البيانات بالكامل
  const handleClearAll = () => {
    if (confirm('تحذير خطير: هل أنت متأكد من مسح قاعدة بيانات جميع الطلاب بالكامل؟')) {
      setAllStudents([]);
      localStorage.removeItem('fastGrader_students');
      setActiveClass('');
      toast.success('تم تفريغ قاعدة بيانات الطلاب بنجاح.');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl text-right h-full flex flex-col" dir="rtl">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-slate-800">قاعدة بيانات الطلاب</h1>
          <p className="text-slate-500">قم بإدارة فصولك ورفع كشوف الأسماء لتسهيل التعرف الآلي على الأوراق</p>
        </div>
        <div className="flex gap-2">
          {allStudents.length > 0 && (
            <Button variant="outline" className="text-red-600 hover:bg-red-50 border-red-200" onClick={handleClearAll}>
              <AlertTriangle className="w-4 h-4 ml-2" />
              مسح جميع البيانات
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        
        {/* عمود رفع الإكسل (يأخذ مساحة أصغر) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-md border-blue-100 sticky top-6">
            <CardHeader className="bg-blue-50/50 border-b">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <FolderOpen className="w-5 h-5" />
                إضافة فصول جديدة
              </CardTitle>
              <CardDescription>
                ارفع ملف Excel لكل صف على حدة. سيقوم النظام بدمجهم آلياً بناءً على عمود "الصف".
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <StudentImporter onImportSuccess={handleStudentsImported} />
              
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-800 mb-2 block">💡 نصيحة للمعلم:</strong>
                تأكد أن ملف الإكسل يحتوي على الأعمدة التالية لضمان الدقة:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>الرقم التعريفي (ID)</li>
                  <li>اسم الطالب</li>
                  <li>الصف (مثال: عاشر/أ)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* عمود عرض البيانات وإدارة الفصول (يأخذ مساحة أكبر) */}
        <div className="lg:col-span-8">
          <Card className="shadow-sm min-h-[500px]">
            <CardHeader className="border-b bg-slate-50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">سجل الطلاب المعرفين في النظام</CardTitle>
                <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
                  الإجمالي: {allStudents.length} طالب
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {allStudents.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">قاعدة البيانات فارغة حالياً.</p>
                  <p className="text-sm mt-2">ابدأ برفع ملف الإكسل للصف الأول من القائمة الجانبية.</p>
                </div>
              ) : (
                <Tabs value={activeClass} onValueChange={setActiveClass} className="w-full flex flex-col">
                  {/* شريط الفصول */}
                  <div className="bg-white border-b px-4 py-2 overflow-x-auto">
                    <TabsList className="bg-slate-100 flex-wrap h-auto p-1 justify-start">
                      {classesList.map(className => (
                        <TabsTrigger 
                          key={className} 
                          value={className}
                          className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all px-4 py-2 m-1"
                        >
                          {className}
                          <Badge variant="secondary" className="mr-2 opacity-80 text-xs">
                            {allStudents.filter(s => (s.className || 'غير مصنف') === className).length}
                          </Badge>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* جداول الطلاب لكل فصل */}
                  {classesList.map(className => {
                    const classStudents = allStudents.filter(s => (s.className || 'غير مصنف') === className);
                    return (
                      <TabsContent key={className} value={className} className="p-0 m-0">
                        <div className="bg-blue-50/30 p-3 border-b flex justify-between items-center">
                          <span className="font-bold text-slate-700">قائمة الأسماء: {className}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
                            onClick={() => handleDeleteClass(className)}
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            حذف هذا الصف بالكامل
                          </Button>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                          <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 shadow-sm z-10">
                              <TableRow>
                                <TableHead className="text-right w-16">م</TableHead>
                                <TableHead className="text-right">الرقم التعريفي</TableHead>
                                <TableHead className="text-right">اسم الطالب</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {classStudents.map((student, idx) => (
                                <TableRow key={student.id} className="hover:bg-blue-50/50">
                                  <TableCell className="text-slate-400 font-medium">{idx + 1}</TableCell>
                                  <TableCell className="font-bold text-blue-700">{student.id}</TableCell>
                                  <TableCell className="font-medium text-slate-800">{student.name}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
