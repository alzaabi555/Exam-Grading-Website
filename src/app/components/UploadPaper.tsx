import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Upload, Plus, AlertCircle, CheckCircle, Image as ImageIcon, FileText, Link as LinkIcon, Loader2 } from 'lucide-react';
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
  selectedStudentId: string;
}

export function UploadPaper() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [distributions, setDistributions] = useState<MarkDistribution[]>([]);
  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [filesToMap, setFilesToMap] = useState<UploadedFile[]>([]);
  
  // حالة جديدة لمنع الضغط المتكرر أثناء الحفظ
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedStudents = JSON.parse(localStorage.getItem('fastGrader_students') || '[]');
    setStudents(storedStudents);
    
    const uniqueClasses = Array.from(new Set(storedStudents.map((s: Student) => s.className || 'غير مصنف'))) as string[];
    setClasses(uniqueClasses.sort());
    if (uniqueClasses.length > 0) setSelectedClass(uniqueClasses[0]);

    // 1. إضافة درع الحماية هنا للتأكد من أن البيانات مصفوفة دائماً
    const fetchDistributions = async () => {
      try {
        const dists = await getMarkDistributions();
        const safeDists = Array.isArray(dists) ? dists : [];
        setDistributions(safeDists);
        if (safeDists.length > 0) setSelectedTemplate(safeDists[0].examName);
      } catch (error) {
        console.error("خطأ في جلب القوالب:", error);
        setDistributions([]);
      }
    };
    fetchDistributions();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const classStudents = students.filter(s => (s.className || 'غير مصنف') === selectedClass);
    const newFiles: UploadedFile[] = Array.from(e.target.files).map(file => {
      const isPdf = file.type === 'application/pdf';
      const fileType = isPdf ? 'pdf' : 'image';
      
      const match = file.name.match(/\d+/);
      const extractedId = match ? match[0] : '';
      const matchedStudent = classStudents.find(s => s.id === extractedId);

      return {
        file,
        previewUrl: URL.createObjectURL(file), // للرؤية المؤقتة فقط
        fileType,
        selectedStudentId: matchedStudent ? matchedStudent.id : ''
      };
    });

    setFilesToMap([...filesToMap, ...newFiles]);
    toast.success(`تم إدراج ${newFiles.length} ملف لجدول المطابقة.`);
  };

  const handleStudentSelect = (index: number, studentId: string) => {
    const updated = [...filesToMap];
    updated[index].selectedStudentId = studentId;
    setFilesToMap(updated);
  };

  const removeFile = (index: number) => {
    setFilesToMap(filesToMap.filter((_, i) => i !== index));
  };

  // دالة مساعدة لتحويل الملف إلى نص مشفر (Base64) لحفظه للأبد
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // دالة الاعتماد النهائي 
  const handleSubmitMappedFiles = async () => {
    if (!selectedTemplate) {
      toast.error('يرجى تحديد قالب توزيع الدرجات');
      return;
    }

    const template = distributions.find(d => d.examName === selectedTemplate);
    if (!template) return;

    const readyFiles = filesToMap.filter(f => f.selectedStudentId !== '');
    
    if (readyFiles.length === 0) {
      toast.error('يرجى ربط ملف واحد على الأقل بطالب!');
      return;
    }

    setIsSubmitting(true);
    toast.info('جاري تشفير الملفات وحفظها في قاعدة البيانات...');
    let successCount = 0;

    try {
      for (const mappedFile of readyFiles) {
        const student = students.find(s => s.id === mappedFile.selectedStudentId);
        if (!student) continue;

        const base64Data = await convertFileToBase64(mappedFile.file);
        const paperId = `paper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
          pdfUrl: base64Data, 
          fileType: mappedFile.fileType,
          uploadDate: new Date().toISOString(),
          questions,
          totalMaxScore,
          status: 'pending',
        };

        await addPaper(paper);
        successCount++;
      }

      toast.success(`تم تشفير ورفع ${successCount} ورقة بنجاح!`);
      setFilesToMap([]);
      navigate('/grade');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء حفظ الملفات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const classStudentsList = students.filter(s => (s.className || 'غير مصنف') === selectedClass);

  return (
    <div className="container mx-auto p-6 max-w-5xl text-right" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">محطة مطابقة الأوراق</h1>
        <p className="text-slate-500">اربط أوراق الاختبار الممسوحة ضوئياً بأسماء الطلاب بدقة قبل التصحيح</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                  setFilesToMap([]); 
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

        <Card className="border-green-100 shadow-sm">
          <CardHeader className="bg-green-50/50 pb-4">
            <CardTitle className="text-lg text-green-800">2. إدراج الملفات</CardTitle>
          </CardHeader>
          {/* 2. تحسين شكل منطقة الرفع لكي تشرح سبب القفل */}
          <CardContent className="pt-4 h-full">
            <div className={`border-2 border-dashed rounded-lg h-[150px] flex flex-col items-center justify-center transition-colors relative ${(!selectedClass || !selectedTemplate) ? 'border-slate-300 bg-slate-50 cursor-not-allowed' : 'border-green-300 hover:bg-green-50 bg-green-50/20'}`}>
              <input
                type="file"
                accept="application/pdf, image/jpeg, image/png, image/webp"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                disabled={!selectedClass || !selectedTemplate || isSubmitting}
              />
              <Upload className={`w-12 h-12 mb-2 ${(!selectedClass || !selectedTemplate) ? 'text-slate-300' : 'text-green-500'}`} />
              
              {(!selectedClass || !selectedTemplate) ? (
                <>
                  <p className="font-bold text-slate-500">منطقة الرفع مقفلة</p>
                  <p className="text-xs text-red-500 mt-1 font-bold">الرجاء تحديد (الصف) و (قالب الدرجات) أولاً لتفعيل الرفع</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-slate-700">اضغط أو اسحب أوراق الاختبار هنا</p>
                  <p className="text-xs text-slate-500 mt-1">يدعم ملفات PDF والصور (JPG, PNG)</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
                            disabled={isSubmitting}
                          >
                            <option value="" disabled>-- الرجاء تحديد صاحب هذه الورقة --</option>
                            {classStudentsList.map(s => (
                              <option key={s.id} value={s.id}>{s.name} (رقم: {s.id})</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Button variant="ghost" size="sm" onClick={() => removeFile(idx)} disabled={isSubmitting} className="text-red-500 hover:bg-red-50">
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
                disabled={filesToMap.filter(f => f.selectedStudentId !== '').length === 0 || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 ml-2 animate-spin" /> : <Plus className="w-5 h-5 ml-2" />}
                {isSubmitting ? 'جاري التشفير والحفظ...' : 'اعتماد الأوراق المرتبطة والبدء بالتصحيح'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
