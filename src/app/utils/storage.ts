import localforage from 'localforage';
import { ExamPaper, GradingSession, MarkDistribution } from '../types/exam';

// تهيئة المستودع العملاق
localforage.config({
  name: 'FastGraderDB',
  storeName: 'exam_data', // اسم قاعدة البيانات
  description: 'قاعدة بيانات تخزين أوراق الاختبارات محلياً'
});

const STORAGE_KEYS = {
  PAPERS: 'exam_papers',
  GRADING_SESSION: 'grading_session',
  MARK_DISTRIBUTIONS: 'mark_distributions',
};

// ------------------------------------
// 1. إدارة الأوراق (تغيرت لتصبح Async)
// ------------------------------------
export const savePapers = async (papers: ExamPaper[]): Promise<void> => {
  await localforage.setItem(STORAGE_KEYS.PAPERS, papers);
};

export const getPapers = async (): Promise<ExamPaper[]> => {
  const data = await localforage.getItem<ExamPaper[]>(STORAGE_KEYS.PAPERS);
  return data || [];
};

export const addPaper = async (paper: ExamPaper): Promise<void> => {
  const papers = await getPapers();
  papers.push(paper);
  await savePapers(papers);
};

export const updatePaper = async (paperId: string, updates: Partial<ExamPaper>): Promise<void> => {
  const papers = await getPapers();
  const index = papers.findIndex(p => p.id === paperId);
  if (index !== -1) {
    papers[index] = { ...papers[index], ...updates };
    await savePapers(papers);
  }
};

export const deletePaper = async (paperId: string): Promise<void> => {
  const papers = await getPapers();
  const filtered = papers.filter(p => p.id !== paperId);
  await savePapers(filtered);
};

// ------------------------------------
// 2. إدارة جلسة التصحيح
// ------------------------------------
export const saveGradingSession = async (session: GradingSession): Promise<void> => {
  await localforage.setItem(STORAGE_KEYS.GRADING_SESSION, session);
};

export const getGradingSession = async (): Promise<GradingSession | null> => {
  const data = await localforage.getItem<GradingSession>(STORAGE_KEYS.GRADING_SESSION);
  return data || null;
};

export const clearGradingSession = async (): Promise<void> => {
  await localforage.removeItem(STORAGE_KEYS.GRADING_SESSION);
};

// ------------------------------------
// 3. إدارة توزيع الدرجات
// ------------------------------------
export const saveMarkDistributions = async (distributions: MarkDistribution[]): Promise<void> => {
  await localforage.setItem(STORAGE_KEYS.MARK_DISTRIBUTIONS, distributions);
};

export const getMarkDistributions = async (): Promise<MarkDistribution[]> => {
  const data = await localforage.getItem<MarkDistribution[]>(STORAGE_KEYS.MARK_DISTRIBUTIONS);
  return data || [];
};

export const addMarkDistribution = async (distribution: MarkDistribution): Promise<void> => {
  const distributions = await getMarkDistributions();
  const index = distributions.findIndex(d => d.examName === distribution.examName);
  if (index !== -1) {
    distributions[index] = distribution;
  } else {
    distributions.push(distribution);
  }
  await saveMarkDistributions(distributions);
};

export const getMarkDistributionByExam = async (examName: string): Promise<MarkDistribution | undefined> => {
  const distributions = await getMarkDistributions();
  return distributions.find(d => d.examName === examName);
};
