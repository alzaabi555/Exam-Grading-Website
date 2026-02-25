import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from './ui/button'; // تأكد من مسار أزرار Radix/Tailwind لديك
import { Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

// تعريف شكل بيانات الطالب
export interface Student {
  id: string;
  name: string;
  className?: string; // اختياري (الصف أو الشعبة)
}

interface StudentImporterProps {
  onImportSuccess: (students: Student[]) => void;
}

export function StudentImporter({ onImportSuccess }: StudentImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const binaryStr = event.target?.result;
        // قراءة ملف الإكسل
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        
        // أخذ الورقة الأولى (Sheet1)
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // تحويل البيانات إلى مصفوفة (JSON)
        const rawData = XLSX.utils.sheet_to_json(worksheet);

        // تنسيق البيانات لتناسب برنامجنا
        // نفترض أن ملف الإكسل يحتوي على أعمدة باسم "الرقم التعريفي" و "اسم الطالب"
        const students: Student[] = rawData.map((row: any) => ({
          id: String(row['الرقم التعريفي'] || row['ID'] || Math.random().toString().slice(2, 8)),
          name: row['اسم الطالب'] || row['الاسم'] || row['Name'] || 'طالب غير معروف',
          className: row['الصف'] || row['الشعبة'] || row['Class'] || 'عام',
        }));

        if (students.length > 0) {
          toast.success(`تم استيراد ${students.length} طالب بنجاح!`);
          onImportSuccess(students);
        } else {
          toast.error('الملف فارغ أو لا يحتوي على الأعمدة المطلوبة.');
        }
      } catch (error) {
        console.error('خطأ في قراءة الملف:', error);
        toast.error('حدث خطأ أثناء قراءة ملف الإكسل. تأكد من صيغة الملف.');
      }
      
      // تفريغ المدخل ليسمح برفع نفس الملف مرة أخرى إذا لزم الأمر
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50 border-slate-200">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="text-green-600" />
          استيراد كشوف الطلاب
        </h3>
        <p className="text-sm text-slate-500">
          قم برفع ملف Excel (.xlsx) يحتوي على أعمدة: "الرقم التعريفي"، "اسم الطالب"، "الصف".
        </p>
      </div>
      
      <input
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
      
      <Button 
        onClick={() => fileInputRef.current?.click()}
        className="bg-green-600 hover:bg-green-700 text-white gap-2"
      >
        <Upload size={18} />
        اختر ملف الإكسل
      </Button>
    </div>
  );
}
