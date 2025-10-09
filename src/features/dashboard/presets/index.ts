import type { Layout } from 'react-grid-layout';
import { BASE_GRID_COLS, DASHBOARD_COLS, type DashboardBreakpoint, type DashboardLayouts } from '../layoutConfig';
import type { PresetType } from '../types';

export type PresetLayoutRecord = Record<PresetType, DashboardLayouts>;

interface WidgetDimensionConfig {
  id: string;
  defaultWidth: number;
  defaultHeight: number;
  widths?: Partial<Record<DashboardBreakpoint, number>>;
  heights?: Partial<Record<DashboardBreakpoint, number>>;
  minW?: number;
  minH?: number;
}

const BREAKPOINT_SEQUENCE: DashboardBreakpoint[] = ['lg', 'md', 'sm', 'xs', 'xxs'];

const cloneLayout = (layout: Layout[] = []): Layout[] => layout.map((item) => ({ ...item }));

export const cloneDashboardLayouts = (layouts: DashboardLayouts): DashboardLayouts => ({
  lg: cloneLayout(layouts.lg),
  md: cloneLayout(layouts.md),
  sm: cloneLayout(layouts.sm),
  xs: cloneLayout(layouts.xs),
  xxs: cloneLayout(layouts.xxs),
});

const WIDGET_DIMENSIONS: Record<string, WidgetDimensionConfig> = {
  cash: {
    id: 'cash',
    defaultWidth: 3,
    defaultHeight: 2,
    widths: { md: 2, sm: 4, xs: 2, xxs: 2 },
  },
  runway: {
    id: 'runway',
    defaultWidth: 3,
    defaultHeight: 2,
    widths: { md: 2, sm: 4, xs: 2, xxs: 2 },
  },
  projects: {
    id: 'projects',
    defaultWidth: 3,
    defaultHeight: 2,
    widths: { md: 2, sm: 4, xs: 2, xxs: 2 },
  },
  tenders: {
    id: 'tenders',
    defaultWidth: 3,
    defaultHeight: 2,
    widths: { md: 2, sm: 4, xs: 2, xxs: 2 },
  },
  cashflow: {
    id: 'cashflow',
    defaultWidth: 6,
    defaultHeight: 4,
    widths: { md: 5, sm: 8, xs: 4, xxs: 2 },
    minW: 4,
    minH: 3,
  },
  expense: {
    id: 'expense',
    defaultWidth: 6,
    defaultHeight: 4,
    widths: { md: 5, sm: 8, xs: 4, xxs: 2 },
    minW: 4,
    minH: 3,
  },
  deadlines: {
    id: 'deadlines',
    defaultWidth: 4,
    defaultHeight: 3,
    widths: { md: 5, sm: 4, xs: 2, xxs: 2 },
  },
  projectHealth: {
    id: 'projectHealth',
    defaultWidth: 4,
    defaultHeight: 3,
    widths: { md: 5, sm: 4, xs: 2, xxs: 2 },
  },
  invoiceAging: {
    id: 'invoiceAging',
    defaultWidth: 4,
    defaultHeight: 3,
    widths: { md: 5, sm: 4, xs: 2, xxs: 2 },
  },
  insights: {
    id: 'insights',
    defaultWidth: 4,
    defaultHeight: 3,
    widths: { md: 5, sm: 4, xs: 2, xxs: 2 },
  },
  team: {
    id: 'team',
    defaultWidth: 4,
    defaultHeight: 3,
    widths: { md: 5, sm: 4, xs: 2, xxs: 2 },
  },
  financial: {
    id: 'financial',
    defaultWidth: 4,
    defaultHeight: 3,
    widths: { md: 5, sm: 4, xs: 2, xxs: 2 },
  },
  calendar: {
    id: 'calendar',
    defaultWidth: 4,
    defaultHeight: 4,
    widths: { md: 5, sm: 4, xs: 2, xxs: 2 },
    minH: 3,
  },
  documents: {
    id: 'documents',
    defaultWidth: 4,
    defaultHeight: 3,
    widths: { md: 5, sm: 4, xs: 2, xxs: 2 },
  },
  micro: {
    id: 'micro',
    defaultWidth: 4,
    defaultHeight: 3,
    widths: { md: 5, sm: 4, xs: 2, xxs: 2 },
  },
};

const EXECUTIVE_ORDER = [
  'cash',
  'runway',
  'projects',
  'tenders',
  'cashflow',
  'expense',
  'deadlines',
  'projectHealth',
  'invoiceAging',
  'insights',
  'team',
  'financial',
  'calendar',
  'documents',
  'micro',
];

const FINANCIAL_ORDER = [
  'cashflow',
  'expense',
  'cash',
  'runway',
  'projects',
  'tenders',
  'financial',
  'projectHealth',
  'invoiceAging',
  'deadlines',
  'insights',
  'team',
  'documents',
  'micro',
  'calendar',
];

const OPERATIONS_ORDER = [
  'team',       // أداء الفريق
  'calendar',   // تقويم التنفيذ
  'deadlines',  // المهام الحرجة
  'projects',   // المشاريع النشطة
  'tenders',    // المنافسات المفتوحة
  'cashflow',   // أداء التدفقات النقدية
  'cash',       // السيولة المتاحة
  'runway',     // أيام التغطية
  'expense',    // النفقات الشهرية
  'projectHealth', // صحة المشاريع
  'invoiceAging',  // أعمار الفواتير
  'documents',     // المستندات
  'financial',     // الملخص المالي
  'insights',      // الرؤى والتوصيات
  'micro',         // البطاقات الصغيرة
];

const PRESET_WIDGET_ORDER: Record<Exclude<PresetType, 'custom'>, string[]> = {
  executive: EXECUTIVE_ORDER,
  financial: FINANCIAL_ORDER,
  operations: OPERATIONS_ORDER,
};

const getDimension = (
  config: WidgetDimensionConfig,
  breakpoint: DashboardBreakpoint,
  cols: number,
  dimension: 'width' | 'height',
): number => {
  if (dimension === 'width') {
    const target = config.widths?.[breakpoint];
    if (typeof target === 'number') {
      return Math.max(1, Math.min(cols, target));
    }
    const base = config.defaultWidth;
    if (breakpoint === 'lg') {
      return Math.max(1, Math.min(cols, base));
    }
    return Math.max(1, Math.min(cols, Math.round((base / BASE_GRID_COLS) * cols)));
  }

  const target = config.heights?.[breakpoint];
  if (typeof target === 'number') {
    return Math.max(1, target);
  }
  return Math.max(1, config.defaultHeight);
};

const placeWidgetsForBreakpoint = (widgetIds: string[], breakpoint: DashboardBreakpoint): Layout[] => {
  const cols = DASHBOARD_COLS[breakpoint];
  const columnHeights = Array.from({ length: cols }, () => 0);

  return widgetIds.map((widgetId) => {
    const config = WIDGET_DIMENSIONS[widgetId];
    const width = Math.min(cols, getDimension(config, breakpoint, cols, 'width'));
    const height = getDimension(config, breakpoint, cols, 'height');

    let bestX = 0;
    let bestY = Number.MAX_SAFE_INTEGER;

    for (let x = 0; x <= cols - width; x += 1) {
      const segment = columnHeights.slice(x, x + width);
      const candidateY = segment.length > 0 ? Math.max(...segment) : 0;

      if (candidateY < bestY || (candidateY === bestY && x < bestX)) {
        bestY = candidateY;
        bestX = x;
      }
    }

    if (!Number.isFinite(bestY)) {
      bestY = 0;
    }

    for (let column = bestX; column < bestX + width && column < columnHeights.length; column += 1) {
      columnHeights[column] = bestY + height;
    }

    return {
      i: widgetId,
      x: bestX,
      y: bestY,
      w: width,
      h: height,
      ...(config.minW ? { minW: Math.min(config.minW, cols) } : {}),
      ...(config.minH ? { minH: config.minH } : {}),
    } satisfies Layout;
  });
};

const buildPresetLayouts = (widgetIds: string[]): DashboardLayouts =>
  BREAKPOINT_SEQUENCE.reduce<DashboardLayouts>(
    (acc, breakpoint) => ({
      ...acc,
      [breakpoint]: placeWidgetsForBreakpoint(widgetIds, breakpoint),
    }),
    {
      lg: [],
      md: [],
      sm: [],
      xs: [],
      xxs: [],
    },
  );

export const createDefaultLayouts = (): PresetLayoutRecord => {
  const executive = buildPresetLayouts(PRESET_WIDGET_ORDER.executive);
  const financial = buildPresetLayouts(PRESET_WIDGET_ORDER.financial);
  const operations = buildPresetLayouts(PRESET_WIDGET_ORDER.operations);

  return {
    executive,
    financial,
    operations,
    custom: cloneDashboardLayouts(executive),
  };
};

export const PRESET_LAYOUTS = createDefaultLayouts();

export default PRESET_LAYOUTS;
