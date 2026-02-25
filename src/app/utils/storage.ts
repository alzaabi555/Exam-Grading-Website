// أدوات التخزين المحلي لإدارة بيانات الاختبارات

import { ExamPaper, GradingSession, MarkDistribution } from '../types/exam';

const STORAGE_KEYS = {
  PAPERS: 'exam_papers',
  GRADING_SESSION: 'grading_session',
  MARK_DISTRIBUTIONS: 'mark_distributions',
};

// إدارة الأوراق (Papers)
export const savePapers = (papers: ExamPaper[]): void => {
  localStorage.setItem(STORAGE_KEYS.PAPERS, JSON.stringify(papers));
};

export const getPapers = (): ExamPaper[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PAPERS);
  return data ? JSON.parse(data) : [];
};

export const addPaper = (paper: ExamPaper): void => {
  const papers = getPapers();
  papers.push(paper);
  savePapers(papers);
};

export const updatePaper = (paperId: string, updates: Partial<ExamPaper>): void => {
  const papers = getPapers();
  const index = papers.findIndex(p => p.id === paperId);
  if (index !== -1) {
    papers[index] = { ...papers[index], ...updates };
    savePapers(papers);
  }
};

export const deletePaper = (paperId: string): void => {
  const papers = getPapers();
  const filtered = papers.filter(p => p.id !== paperId);
  savePapers(filtered);
};

// إدارة جلسة التصحيح (Grading Session)
export const saveGradingSession = (session: GradingSession): void => {
  localStorage.setItem(STORAGE_KEYS.GRADING_SESSION, JSON.stringify(session));
};

export const getGradingSession = (): GradingSession | null => {
  const data = localStorage.getItem(STORAGE_KEYS.GRADING_SESSION);
  return data ? JSON.parse(data) : null;
};

export const clearGradingSession = (): void => {
  localStorage.removeItem(STORAGE_KEYS.GRADING_SESSION);
};

// إدارة توزيع الدرجات (Mark Distributions)
export const saveMarkDistributions = (distributions: MarkDistribution[]): void => {
  localStorage.setItem(STORAGE_KEYS.MARK_DISTRIBUTIONS, JSON.stringify(distributions));
};

export const getMarkDistributions = (): MarkDistribution[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MARK_DISTRIBUTIONS);
  return data ? JSON.parse(data) : [];
};

export const addMarkDistribution = (distribution: MarkDistribution): void => {
  const distributions = getMarkDistributions();
  const index = distributions.findIndex(d => d.examName === distribution.examName);
  if (index !== -1) {
    distributions[index] = distribution;
  } else {
    distributions.push(distribution);
  }
  saveMarkDistributions(distributions);
};

export const getMarkDistributionByExam = (examName: string): MarkDistribution | undefined => {
  const distributions = getMarkDistributions();
  return distributions.find(d => d.examName === examName);
};

// تهيئة البيانات التجريبية بالعربية إذا كان التخزين فارغاً
export const initializeSampleData = (): void => {
  const papers = getPapers();
  if (papers.length === 0) {
    const samplePapers: ExamPaper[] = [
      {
        id: 'paper-001',
        studentName: 'أحمد المنصور', // تعريب الاسم
        studentId: '2024001',
        examName: 'اختبار منتصف الفصل - رياضيات', // تعريب المادة
        pdfUrl: 'sample-pdf-1',
        uploadDate: '2026-02-20T10:00:00Z',
        totalMaxScore: 100,
        status: 'pending',
        questions: [
          {
            id: 'q1-paper-001',
            paperId: 'paper-001',
            questionNumber: 1,
            totalMaxScore: 30,
            parts: [
              {
                id: 'p1-q1-paper-001',
                questionId: 'q1-paper-001',
                paperId: 'paper-001',
                partNumber: 1,
                imageUrl: 'sample-image-1',
                maxScore: 10,
              },
              {
                id: 'p2-q1-paper-001',
                questionId: 'q1-paper-001',
                paperId: 'paper-001',
                partNumber: 2,
                imageUrl: 'sample-image-2',
                maxScore: 10,
              },
              {
                id: 'p3-q1-paper-001',
                questionId: 'q1-paper-001',
                paperId: 'paper-001',
                partNumber: 3,
                imageUrl: 'sample-image-3',
                maxScore: 10,
              },
            ],
          },
          {
            id: 'q2-paper-001',
            paperId: 'paper-001',
            questionNumber: 2,
            totalMaxScore: 40,
            parts: [
              {
                id: 'p1-q2-paper-001',
                questionId: 'q2-paper-001',
                paperId: 'paper-001',
                partNumber: 1,
                imageUrl: 'sample-image-4',
                maxScore: 20,
              },
              {
                id: 'p2-q2-paper-001',
                questionId: 'q2-paper-001',
                paperId: 'paper-001',
                partNumber: 2,
                imageUrl: 'sample-image-5',
                maxScore: 20,
              },
            ],
          },
        ],
      },
      {
        id: 'paper-002',
        studentName: 'سارة العامري', // تعريب الاسم
        studentId: '2024002',
        examName: 'اختبار منتصف الفصل - رياضيات',
        pdfUrl: 'sample-pdf-2',
        uploadDate: '2026-02-20T10:05:00Z',
        totalMaxScore: 100,
        status: 'pending',
        questions: [
          {
            id: 'q1-paper-002',
            paperId: 'paper-002',
            questionNumber: 1,
            totalMaxScore: 30,
            parts: [
              {
                id: 'p1-q1-paper-002',
                questionId: 'q1-paper-002',
                paperId: 'paper-002',
                partNumber: 1,
                imageUrl: 'sample-image-7',
                maxScore: 10,
              },
            ],
          },
        ],
      },
    ];
    savePapers(samplePapers);

    // نموذج توزيع درجات تجريبي بالعربية
    const sampleDistribution: MarkDistribution = {
      examName: 'اختبار منتصف الفصل - رياضيات',
      questions: [
        {
          questionNumber: 1,
          parts: [
            { partNumber: 1, maxScore: 10 },
            { partNumber: 2, maxScore: 10 },
            { partNumber: 3, maxScore: 10 },
          ],
        },
        {
          questionNumber: 2,
          parts: [
            { partNumber: 1, maxScore: 20 },
            { partNumber: 2, maxScore: 20 },
          ],
        },
        {
          questionNumber: 3,
          parts: [{ partNumber: 1, maxScore: 30 }],
        },
      ],
    };
    addMarkDistribution(sampleDistribution);
  }
};