import { useEffect, useState } from 'react';
import { FileText, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { getPapers } from '../utils/storage';
import { ExamPaper } from '../types/exam';

export function QuickStats() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    const papers = getPapers();
    setStats({
      total: papers.length,
      pending: papers.filter(p => p.status === 'pending').length,
      inProgress: papers.filter(p => p.status === 'in-progress').length,
      completed: papers.filter(p => p.status === 'completed').length,
    });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4" dir="rtl">
      {/* إجمالي الأوراق */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg shrink-0">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-600">إجمالي الأوراق</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قيد الانتظار */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg shrink-0">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-gray-600">قيد الانتظار</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جاري التصحيح */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg shrink-0">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p className="text-sm text-gray-600">جاري العمل</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* مكتملة */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-sm text-gray-600">مكتملة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}