// 1. التعديل الأول هنا: استدعاء createHashRouter
import { createHashRouter } from 'react-router';
import { Layout } from './components/Layout';
import { UploadPaper } from './components/UploadPaper';
import { GradingInterface } from './components/GradingInterface';
import { Dashboard } from './components/Dashboard';
import { StudentResults } from './components/StudentResults';
import { MarkDistributionManager } from './components/MarkDistribution';

// 2. التعديل الثاني هنا: استخدام createHashRouter
export const router = createHashRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      {
        index: true,
        Component: UploadPaper,
      },
      {
        path: 'grade',
        Component: GradingInterface,
      },
      {
        path: 'dashboard',
        Component: Dashboard,
      },
      {
        path: 'results/:paperId',
        Component: StudentResults,
      },
      {
        path: 'mark-distribution',
        Component: MarkDistributionManager,
      },
    ],
  },
]);
