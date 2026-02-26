import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Upload, Plus, AlertCircle, CheckCircle, Image as ImageIcon, FileText, Link as LinkIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { addPaper, getMarkDistributions } from '../utils/storage';
import { ExamPaper, Question, AnswerPart, MarkDistribution } from '../types/exam';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  className?: string;
}

interface UploadedFile {
  file: File;
  previewUrl: string;
  fileType: 'pdf' | 'image';
  selectedStudentId: string; // ID الطالب المربوط (إن وجد)
}

export function UploadPaper() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [distributions, setDistributions] = useState<MarkDistribution[]>([]);
  
  // حالات الإعدادات
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // حالات الملفات
  const [filesToMap, setFilesToMap] = useState<UploadedFile[]>([]);

  // تحميل البيانات الأساسية
  useEffect(() => {
    const storedStudents = JSON.parse(localStorage.getItem('fastGrader_students') || '[]');
    setStudents(storedStudents);
    
    const uniqueClasses = Array.from(new Set(storedStudents.map((s: Student) => s.className || 'غير مصنف'))) as string[];
    setClasses(uniqueClasses.sort());
    if (uniqueClasses.length > 0) setSelectedClass(uniqueClasses[0]);

    const dists = getMarkDistributions();
    setDistributions(dists);
    if (dists.length > 0) setSelectedTemplate(dists[0].examName);
  }, []);

  // دالة استقبال الملفات ومحاولة المطابقة الآلية
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const classStudents = students.filter(s => (s.className || 'غير مصنف') === selectedClass);
    const newFiles: UploadedFile[] = Array.from(e.target.files).map(file => {
      const isPdf = file.type === 'application/pdf';
      const fileType = isPdf ? 'pdf' : 'image';
      
      // محاولة التخمين الآلي: هل اسم الملف يحتوي على رقم تعريفي لأحد طلاب هذا الصف؟
      const match = file.name.match(/\d+/);
      const extractedId = match ? match[0] : '';
      const matchedStudent = classStudents.find(s => s.id === extractedId);

      return {
        file,
        previewUrl: URL.createObjectURL(file),
        fileType,
        selectedStudentId: matchedStudent ? matchedStudent.id : '' // ربط آلي إذا وجده، أو يتركه فارغاً
      };
    });

    setFilesToMap([...filesToMap, ...newFiles]);
    toast.success(`تم إدراج ${newFiles.length} ملف لجدول المطابقة.`);
  };

  // تغيير ربط الطالب يدوياً من القائمة المنسدلة
  const handleStudentSelect = (index: number, studentId: string) => {
    const updated = [...filesToMap];
    updated[index].selectedStudentId = studentId;
    setFilesToMap(updated);
  };

  // مسح ملف من القائمة
  const removeFile = (index: number) => {
    setFilesToMap(filesToMap.filter((_, i) => i !== index));
  };

  // الاعتماد النهائي ورفع الأوراق المرتبطة فقط
  const handleSubmitMappedFiles = () => {
    if (!selectedTemplate) {
      toast.error('يرجى تحديد قالب توزيع الدرجات');
      return;
    }

    const template = distributions.find(d => d.examName === selectedTemplate);
    if (!template) return;

    // تصفية الملفات التي تم ربطها بطالب فقط
    const readyFiles = filesToMap.filter(f => f.selectedStudentId !== '');
    
    if (readyFiles.length === 0) {
      toast.error('يرجى ربط ملف واحد على الأقل بطالب!');
      return;
    }

    let successCount = 0;

    readyFiles.forEach(mappedFile => {
      const student = students.find(s => s.id === mappedFile.selectedStudentId);
      if (!student) return;

      const paperId = `paper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // توليد الأسئلة من القالب
      const questions: Question[] = template.questions.map(q => {
        const questionId = `q${q.questionNumber}-${paperId}`;
        const parts: AnswerPart[] = q.parts.map(p => ({
          id: `p${p.partNumber}-${questionId}`,
          questionId,
          paperId,
          partNumber: p.partNumber,
          imageUrl: '', 
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
        studentName: student.name,
        studentId: student.id,
        examName: selectedTemplate,
        pdfUrl: mappedFile.previewUrl,
        fileType: mappedFile.fileType, // تخزين نوع الملف ليفهمه المصحح لاحقاً
        uploadDate: new Date().toISOString(),
        questions,
        totalMaxScore,
        status: 'pending',
      };

      addPaper(paper);
      successCount++;
    });

    toast.success(`تم ربط ورفع ${successCount} ورقة اختبار بنجاح واحترافية!`);
    setFilesToMap([]); // تفريغ الجدول بعد النجاح
    navigate('/grade'); // الانتقال مباشرة لغرفة التصحيح
  };

  const classStudentsList = students.filter(s => (s.className || 'غير مصنف') === selectedClass);

  return (
    <div className="container mx-auto p-6 max-w-5xl text-right" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">محطة مطابقة الأوراق</h1>
        <p className="text-slate-500">اربط أوراق الاختبار الممسوحة ضوئياً بأسماء الطلاب بدقة قبل التصحيح</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* إعدادات الإطار */}
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="bg-blue-50/50 pb-4">
            <CardTitle className="text-lg text-blue-800">1. تحديد الإطار</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <Label className="font-bold mb-2 block">اختر الصف / الشعبة المستهدفة</Label>
              <select 
                className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setFilesToMap([]); // تصفير الملفات عند تغيير الصف لمنع اختلاط الطلاب
                }}
              >
                {classes.length === 0 ? <option value="">لا توجد فصول (ارفع قائمة طلاب أولاً)</option> : null}
                {classes.map(c => <option key={c} value={c}>صف: {c}</option>)}
              </select>
            </div>
            <div>
              <Label className="font-bold mb-2 block">اختر قالب الدرجات للاختبار</Label>
              <select 
                className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                {distributions.length === 0 ? <option value="">لم تقم بإنشاء قوالب درجات بعد</option> : null}
                {distributions.map(d => <option key={d.examName} value={d.examName}>اختبار: {d.examName}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* منطقة رفع الملفات */}
        <Card className="border-green-100 shadow-sm">
          <CardHeader className="bg-green-50/50 pb-4">
            <CardTitle className="text-lg text-green-800">2. إدراج الملفات</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 h-full">
            <div className="border-2 border-dashed border-green-300 rounded-lg h-[150px] flex flex-col items-center justify-center hover:bg-green-50 transition-colors bg-green-50/20 relative">
              <input
                type="file"
                accept="application/pdf, image/jpeg, image/png, image/webp"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={!selectedClass || !selectedTemplate}
              />
              <Upload className={`w-12 h-12 mb-2 ${(!selectedClass || !selectedTemplate) ? 'text-slate-300' : 'text-green-500'}`} />
              <p className="font-bold text-slate-700">اضغط أو اسحب أوراق الاختبار هنا</p>
              <p className="text-xs text-slate-500 mt-1">يدعم ملفات PDF والصور (JPG, PNG)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول المطابقة اليدوية / الآلية */}
      {filesToMap.length > 0 && (
        <Card className="shadow-md border-slate-200">
          <CardHeader className="bg-slate-800 text-white flex flex-row items-center justify-between py-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-blue-400" />
              3. جدول المطابقة والربط
            </CardTitle>
            <Badge className="bg-blue-600 text-white text-md px-3 py-1">
              {filesToMap.filter(f => f.selectedStudentId !== '').length} من {filesToMap.length} جاهز للرفع
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-50 sticky top-0 border-b z-10">
                  <tr>
                    <th className="p-3 font-bold text-slate-600">ملف الورقة</th>
                    <th className="p-3 font-bold text-slate-600 w-1/2">ربط بـ (طالب من {selectedClass})</th>
                    <th className="p-3 text-center font-bold text-slate-600">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filesToMap.map((mappedFile, idx) => (
                    <tr key={idx} className={`hover:bg-slate-50 transition-colors ${mappedFile.selectedStudentId ? 'bg-green-50/20' : 'bg-red-50/20'}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {mappedFile.fileType === 'pdf' ? (
                            <FileText className="w-8 h-8 text-red-500 bg-red-50 p-1 rounded" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-blue-500 bg-blue-50 p-1 rounded" />
                          )}
                          <div className="flex flex-col max-w-[200px]">
                            <span className="font-bold text-sm truncate" title={mappedFile.file.name}>
                              {mappedFile.file.name}
                            </span>
                            <span className="text-xs text-slate-500">{(mappedFile.file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 relative">
                          {mappedFile.selectedStudentId ? (
                            <CheckCircle className="w-5 h-5 text-green-500 absolute right-3 pointer-events-none" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-400 absolute right-3 pointer-events-none" />
                          )}
                          <select
                            className={`w-full p-2 pr-10 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${
                              mappedFile.selectedStudentId ? 'border-green-300 bg-green-50/30 font-bold text-green-800' : 'border-red-300 bg-red-50/50'
                            }`}
                            value={mappedFile.selectedStudentId}
                            onChange={(e) => handleStudentSelect(idx, e.target.value)}
                          >
                            <option value="" disabled>-- الرجاء تحديد صاحب هذه الورقة --</option>
                            {classStudentsList.map(s => (
                              <option key={s.id} value={s.id}>{s.name} (رقم: {s.id})</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Button variant="ghost" size="sm" onClick={() => removeFile(idx)} className="text-red-500 hover:bg-red-50">
                          إزالة
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <Button 
                onClick={handleSubmitMappedFiles} 
                className="h-12 px-8 text-lg font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                disabled={filesToMap.filter(f => f.selectedStudentId !== '').length === 0}
              >
                <Plus className="w-5 h-5 ml-2" />
                اعتماد الأوراق المرتبطة والبدء بالتصحيح
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
