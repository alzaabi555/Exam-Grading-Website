// الأنواع الأساسية لنظام تصحيح الاختبارات

// 1. تمت إضافة واجهة العلامات (الأختام الحمراء)
export interface Annotation {
  id: string;
  x: number;
  y: number;
  type: 'check' | 'cross' | 'score';
  value?: string;
  partId?: string;
}

export interface AnswerPart {
  id: string;
  questionId: string;
  paperId: string;
  partNumber: number; // رقم الجزء
  imageUrl: string;
  maxScore: number; // الدرجة القصوى
  score?: number;   // الدرجة المستحقة (اختياري حتى يتم التصحيح)
}

export interface Question {
  id: string;
  paperId: string;
  questionNumber: number; // رقم السؤال
  parts: AnswerPart[];    // أجزاء السؤال
  totalMaxScore: number;  // إجمالي درجة السؤال القصوى
}

export interface ExamPaper {
  id: string;
  studentName: string; // اسم الطالب
  studentId: string;   // رقم الطالب
  examName: string;    // اسم الاختبار
  pdfUrl: string;      // سنستخدم هذا الرابط سواء كان PDF أو صورة
  
  // 2. التعديلات الجديدة لدعم الصور والأختام
  fileType?: 'pdf' | 'image'; 
  annotations?: Annotation[]; 

  uploadDate: string;  // تاريخ الرفع
  questions: Question[];
  totalMaxScore: number;
  totalScore?: number;
  gradedDate?: string; // تاريخ الانتهاء من التصحيح
  status: 'pending' | 'in-progress' | 'completed'; 
}

// كائن مساعد للترجمة 
export const StatusLabels = {
  'pending': 'قيد الانتظار',
  'in-progress': 'جاري التصحيح',
  'completed': 'مكتمل'
} as const;

export interface GradingSession {
  currentPaperId: string;
  currentQuestionIndex: number;
  currentPartIndex: number;
}

export interface MarkDistribution {
  examName: string;
  questions: {
    questionNumber: number;
    parts: {
      partNumber: number;
      maxScore: number;
    }[];
  }[];
}
