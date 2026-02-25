// الأنواع الأساسية لنظام تصحيح الاختبارات

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
  pdfUrl: string;
  uploadDate: string;  // تاريخ الرفع
  questions: Question[];
  totalMaxScore: number;
  totalScore?: number;
  gradedDate?: string; // تاريخ الانتهاء من التصحيح
  // الحالات البرمجية (تبقى بالإنجليزية لسهولة التعامل معها في الكود)
  status: 'pending' | 'in-progress' | 'completed'; 
}

// كائن مساعد للترجمة (أضفه هنا لاستخدامه في كل الموقع)
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