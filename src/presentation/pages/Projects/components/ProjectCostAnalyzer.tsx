/**
 * 🔗 مُحلل التكاليف الفعلية للمشاريع
 * Project Cost Analyzer - يربط بين إدارة المشتريات والمشاريع
 */

import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { useFinancialState } from '@/application/context';
import { useExpenses } from '@/application/hooks/useExpenses';
import { 
  Calculator,
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  BarChart3
} from 'lucide-react';

// دالة لتنسيق العملة
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const ProjectCostAnalyzer: React.FC = () => {
  const { projects, financial } = useFinancialState();
  const { projects: projectList } = projects;
  const { getProjectsWithActualCosts } = financial;
  const { getExpensesByProject } = useExpenses();

  // تحليل التكاليف لجميع المشاريع
  const projectAnalysis = getProjectsWithActualCosts();

  return (
    <div className="space-y-6">
      {/* عنوان القسم */}
      <div className="flex items-center gap-3">
        <Calculator className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">تحليل التكاليف الفعلية للمشاريع</h2>
          <p className="text-sm text-muted-foreground">
            ربط المشتريات والمصروفات بالمشاريع لحساب التكاليف الفعلية
          </p>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">إجمالي المشاريع</span>
            </div>
            <div className="text-2xl font-bold">{projectList.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">مكتملة</span>
            </div>
            <div className="text-2xl font-bold text-success">
              {projectList.filter(p => p.status === 'completed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-warning" />
              <span className="text-sm text-muted-foreground">نشطة</span>
            </div>
            <div className="text-2xl font-bold text-warning">
              {projectList.filter(p => p.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">متأخرة</span>
            </div>
            <div className="text-2xl font-bold text-destructive">
              {projectList.filter(p => p.status === 'delayed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تحليل تفصيلي لكل مشروع */}
      <div className="grid gap-4">
        {projectAnalysis.map((project) => {
          const projectExpenses = getExpensesByProject(project.id);
          const hasExpenses = projectExpenses.length > 0;
          
          return (
            <Card key={project.id} className="border-border">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {project.name}
                      <Badge variant={project.status === 'completed' ? 'default' : 
                                   project.status === 'active' ? 'secondary' : 'destructive'}>
                        {project.status === 'completed' ? 'مكتمل' :
                         project.status === 'active' ? 'نشط' :
                         project.status === 'delayed' ? 'متأخر' : 'متوقف'}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      العميل: {project.client} | المدير: {project.manager}
                    </p>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-muted-foreground">قيمة المشروع</div>
                    <div className="text-lg font-bold text-primary">
                      {formatCurrency(project.value)}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* الميزانية المخطط لها */}
                  <div className="rounded-lg bg-info/10 p-3">
                    <div className="text-xs text-muted-foreground mb-1">الميزانية المخططة</div>
                    <div className="text-lg font-bold text-info">
                      {formatCurrency(project.budget)}
                    </div>
                  </div>

                  {/* التكلفة الفعلية من المشتريات */}
                  <div className="rounded-lg bg-warning/10 p-3">
                    <div className="text-xs text-muted-foreground mb-1">التكلفة الفعلية</div>
                    <div className="text-lg font-bold text-warning">
                      {formatCurrency(project.actualCost)}
                    </div>
                    {hasExpenses && (
                      <div className="text-xs text-muted-foreground">
                        {projectExpenses.length} مصروف
                      </div>
                    )}
                  </div>

                  {/* انحراف الميزانية */}
                  <div className="rounded-lg bg-accent/10 p-3">
                    <div className="text-xs text-muted-foreground mb-1">انحراف الميزانية</div>
                    <div className={`text-lg font-bold flex items-center gap-1 ${
                      project.budgetVariance > 0 ? 'text-destructive' : 'text-success'
                    }`}>
                      {project.budgetVariance > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {Math.abs(project.budgetVariance).toFixed(1)}%
                    </div>
                  </div>

                  {/* هامش الربح */}
                  <div className="rounded-lg bg-success/10 p-3">
                    <div className="text-xs text-muted-foreground mb-1">هامش الربح</div>
                    <div className="text-lg font-bold text-success">
                      {project.profitMargin.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(project.value - project.actualCost)}
                    </div>
                  </div>
                </div>

                {/* تحذير إذا لم توجد مصروفات */}
                {!hasExpenses && (
                  <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3">
                    <div className="flex items-center gap-2 text-warning">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">
                        لا توجد مصروفات مسجلة لهذا المشروع. قم بإضافة المشتريات والتكاليف لحساب الربحية الفعلية.
                      </span>
                    </div>
                  </div>
                )}

                {/* عرض المصروفات إذا وُجدت */}
                {hasExpenses && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">المصروفات المرتبطة:</h4>
                    <div className="space-y-2">
                      {projectExpenses.slice(0, 3).map((expense) => (
                        <div key={expense.id} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="text-sm">{expense.title}</span>
                          <span className="text-sm font-medium">{formatCurrency(expense.amount)}</span>
                        </div>
                      ))}
                      {projectExpenses.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{projectExpenses.length - 3} مصروف آخر...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ملاحظة تعليمية */}
      <Card className="border border-info/30 bg-info/10">
        <CardContent className="p-4">
          <h3 className="mb-2 font-semibold text-info">
            📊 كيفية عمل ربط التكاليف
          </h3>
          <ul className="space-y-1 text-sm text-info">
            <li>• يتم ربط كل مصروف بمشروع محدد من خلال <code>projectId</code></li>
            <li>• التكلفة الفعلية = مجموع جميع المصروفات المرتبطة بالمشروع</li>
            <li>• انحراف الميزانية = (التكلفة الفعلية / الميزانية المخططة - 1) × 100</li>
            <li>• هامش الربح = (قيمة المشروع - التكلفة الفعلية) / قيمة المشروع × 100</li>
            <li>• هذه البيانات تنعكس تلقائياً على الإدارة المالية</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
