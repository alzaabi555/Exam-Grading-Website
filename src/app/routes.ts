import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { UploadPaper } from './components/UploadPaper';
import { GradingInterface } from './components/GradingInterface';
import { Dashboard } from './components/Dashboard';
import { StudentResults } from './components/StudentResults';
import { MarkDistributionManager } from './components/MarkDistribution';

export const router = createBrowserRouter([
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