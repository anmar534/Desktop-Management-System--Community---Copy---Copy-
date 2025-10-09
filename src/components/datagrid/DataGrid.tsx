/**
 * Advanced DataGrid Component
 *
 * TanStack Table v8 + React Virtual for high performance data grids.
 * Features:
 * - Sorting, filtering, column visibility
 * - Pagination with server/client support
 * - Virtualized rows (10k+ without lag)
 * - Row selection & bulk actions
 * - Inline editing callback hooks
 * - Keyboard navigation & accessibility attributes
 * - Export helpers (CSV / Excel / JSON)
 *
 * @version 1.0.0
 * @date 2025-10-07
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type FocusEvent,
  type ReactNode,
} from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Cell,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableState,
} from '@tanstack/react-table';
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import { Search, Columns3, Download, Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { cn } from '@/utils/cn';
import { exportToCsv, exportToJson, exportToXlsx } from '@/utils/exporters';

const DEFAULT_CONTAINER_HEIGHT = 520;

export interface DataGridBulkAction<TData> {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onAction: (selectedRows: TData[]) => void | Promise<void>;
}

export interface DataGridProps<TData, TValue = unknown> {
  /** Column definitions */
  columns: ColumnDef<TData, TValue>[];
  /** Data rows */
  data: TData[];
  /** Grid height in pixels (virtualized viewport) */
  height?: number;
  /** Enable virtualization (default true) */
  enableVirtualization?: boolean;
  /** Enable column filters */
  enableFilters?: boolean;
  /** Enable row selection */
  enableSelection?: boolean;
  /** Enable inline editing callbacks */
  onCellEdit?: (options: {
    row: TData;
    columnId: string;
    newValue: unknown;
  }) => void | Promise<void>;
  /** Provide bulk actions (requires row selection) */
  bulkActions?: DataGridBulkAction<TData>[];
  /** Controlled sorting state */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Controlled pagination state */
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  /** Initial internal state overrides */
  initialState?: Partial<TableState>;
  /** Custom toolbar content placement */
  toolbarSlot?: ReactNode;
  /** Loading indicator */
  isLoading?: boolean;
  /** Empty state fallback */
  emptyState?: React.ReactNode;
  /** Optional className */
  className?: string;
}

export function DataGrid<TData, TValue = unknown>({
  columns,
  data,
  height = DEFAULT_CONTAINER_HEIGHT,
  enableVirtualization = true,
  enableFilters = true,
  enableSelection = true,
  onCellEdit,
  bulkActions,
  sorting: controlledSorting,
  onSortingChange,
  pagination: controlledPagination,
  onPaginationChange,
  initialState,
  toolbarSlot,
  isLoading,
  emptyState,
  className,
}: DataGridProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(controlledSorting ?? []);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>(
    controlledPagination ?? {
      pageIndex: 0,
      pageSize: 25,
    },
  );

  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      setSorting((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        onSortingChange?.(next);
        return next;
      });
    },
    [onSortingChange],
  );

  const handlePaginationChange: OnChangeFn<PaginationState> = useCallback(
    (updater) => {
      setPagination((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        onPaginationChange?.(next);
        return next;
      });
    },
    [onPaginationChange],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: controlledSorting ?? sorting,
      globalFilter,
      rowSelection,
      pagination: controlledPagination ?? pagination,
    },
    enableSortingRemoval: true,
    enableRowSelection: enableSelection,
    onSortingChange: controlledSorting ? onSortingChange : handleSortingChange,
    onPaginationChange: controlledPagination ? onPaginationChange : handlePaginationChange,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState,
  });

  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: enableVirtualization ? table.getRowModel().rows.length : 0,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48,
    overscan: 12,
  });

  const totalHeight = enableVirtualization
    ? rowVirtualizer.getTotalSize()
    : table.getRowModel().rows.length * 48;

  const virtualRows: (VirtualItem | { index: number; key: string; size: number; start: number })[] = enableVirtualization
    ? rowVirtualizer.getVirtualItems()
    : table
        .getRowModel()
        .rows.map((row) => ({
          index: row.index,
          key: row.id,
          size: 48,
          start: row.index * 48,
        }));

  const selectedRows = useMemo(
    () => table.getSelectedRowModel().rows.map((row) => row.original),
    [table],
  );

  const handleExport = useCallback(
    (type: 'csv' | 'xlsx' | 'json') => {
      const sourceRows = selectedRows.length > 0 ? selectedRows : data;
      const serializableRows = sourceRows.filter(
        (row) => row !== null && typeof row === 'object' && !Array.isArray(row),
      ) as Record<string, unknown>[];

      if (serializableRows.length === 0) {
        return;
      }

      switch (type) {
        case 'csv':
          void exportToCsv(serializableRows, 'dashboard-data-export');
          break;
        case 'xlsx':
          void exportToXlsx(serializableRows, 'dashboard-data-export');
          break;
        case 'json':
          void exportToJson(serializableRows, 'dashboard-data-export');
          break;
        default:
          break;
      }
    },
    [data, selectedRows],
  );

  const showEmptyState = !isLoading && table.getRowModel().rows.length === 0;

  const tbodyRef = useRef<HTMLTableSectionElement | null>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  const registerRowRef = useCallback(
    (rowId: string) => (element: HTMLTableRowElement | null) => {
      if (element) {
        rowRefs.current.set(rowId, element);
      } else {
        rowRefs.current.delete(rowId);
      }
    },
    [],
  );

  useEffect(() => {
    const containerEl = tableContainerRef.current;
    if (!containerEl) return;
    containerEl.style.setProperty('--datagrid-height', `${height}px`);
  }, [height]);

  useEffect(() => {
    const tbodyEl = tbodyRef.current;
    if (!tbodyEl) return;
    if (enableVirtualization) {
      tbodyEl.style.setProperty('--virtual-body-height', `${totalHeight}px`);
    } else {
      tbodyEl.style.removeProperty('--virtual-body-height');
    }
  }, [enableVirtualization, totalHeight]);

  useEffect(() => {
    if (!enableVirtualization) {
      rowRefs.current.forEach((element) => {
        element.style.removeProperty('--virtual-row-offset');
        element.style.removeProperty('--virtual-row-height');
      });
      return;
    }

    const currentRows = table.getRowModel().rows;
    virtualRows.forEach((virtualRow) => {
      const row = currentRows[virtualRow.index];
      const element = rowRefs.current.get(row.id);
      if (element) {
        element.style.setProperty('--virtual-row-offset', `${virtualRow.start}px`);
        element.style.setProperty('--virtual-row-height', `${virtualRow.size}px`);
      }
    });
  }, [enableVirtualization, virtualRows, table]);

  return (
    <div className={cn('flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm', className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalFilter ?? ''}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="بحث سريع (يدعم السجل الكامل)..."
              aria-label="بحث في الجدول"
              className="pr-9"
            />
          </div>

          {enableFilters && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  تصفية الأعمدة
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table.getAllLeafColumns().map((column) => {
                  if (!column.getCanFilter()) return null;
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                      className="capitalize"
                    >
                      {column.columnDef.header as string}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-2">
          {bulkActions && enableSelection && selectedRows.length > 0 && (
            <div className="flex items-center gap-2">
              {bulkActions.map((action) => (
                <Button
                  key={action.id}
                  size="sm"
                  onClick={() => action.onAction(selectedRows)}
                  className="flex items-center gap-2"
                >
                  {action.icon && <action.icon className="h-4 w-4" />}
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Columns3 className="h-4 w-4" />
                الأعمدة
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllLeafColumns().map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                  className="capitalize"
                >
                  {column.columnDef.header as string}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                تصدير
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem onSelect={() => handleExport('csv')}>
                تصدير CSV
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem onSelect={() => handleExport('xlsx')}>
                تصدير Excel
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem onSelect={() => handleExport('json')}>
                تصدير JSON
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {toolbarSlot}
        </div>
      </div>

      {/* Table */}
      <div
        ref={tableContainerRef}
        className="relative w-full overflow-auto rounded-lg border border-border bg-background [height:var(--datagrid-height)]"
      >
        <table className="w-full text-sm" role="presentation">
          <thead className="sticky top-0 z-[1] bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border" style={{ display: 'flex', flexDirection: 'row-reverse', width: '100%' }}>
                {headerGroup.headers.map((header) => {
                  const sortState = header.column.getIsSorted();
                  const ariaSort: 'none' | 'ascending' | 'descending' =
                    sortState === 'asc' ? 'ascending' : sortState === 'desc' ? 'descending' : 'none';
                  const headerA11yProps = header.column.getCanSort()
                    ? { 'aria-sort': ariaSort }
                    : {};

                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      scope="col"
                      style={{
                        flex: header.column.getSize() !== 150 ? `0 0 ${header.column.getSize()}px` : '1 1 0%',
                        minWidth: header.column.getSize() !== 150 ? `${header.column.getSize()}px` : '100px',
                      }}
                      className={cn(
                        'px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                        header.column.getCanSort() && 'cursor-pointer select-none',
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                      {...headerA11yProps}
                    >
                      <div className="flex items-center justify-end gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && <ArrowUpDown className="h-4 w-4" />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody
            ref={tbodyRef}
            className={cn('relative', enableVirtualization && '[height:var(--virtual-body-height)]')}
          >
            {showEmptyState ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-muted-foreground">
                  {emptyState ?? 'لا توجد بيانات متاحة للعرض حالياً.'}
                </td>
              </tr>
            ) : (
              virtualRows.map((virtualRow) => {
                const row = table.getRowModel().rows[virtualRow.index];

                return (
                  <tr
                    key={row.id}
                    data-row-index={row.index}
                    tabIndex={0}
                    ref={registerRowRef(row.id)}
                    className={cn(
                      'border-b border-border transition-colors hover:bg-muted/40 focus-visible:bg-primary/10',
                      enableVirtualization &&
                        'absolute left-0 top-0 w-full [height:var(--virtual-row-height)] [transform:translateY(var(--virtual-row-offset))]',
                      row.getIsSelected() && 'bg-primary/5',
                    )}
                    style={{ display: 'flex', flexDirection: 'row-reverse', width: '100%' }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td 
                        key={cell.id} 
                        className="px-4 py-3 align-middle text-right overflow-hidden"
                        style={{
                          flex: cell.column.getSize() !== 150 ? `0 0 ${cell.column.getSize()}px` : '1 1 0%',
                          minWidth: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : '100px',
                        }}
                      >
                        <CellRenderer
                          cell={cell}
                          onCellEdit={onCellEdit}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <span className="text-sm font-medium text-muted-foreground">جارٍ تحميل البيانات…</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {enableSelection && (
            <>
              <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
                aria-label="تحديد كل الصفوف"
              />
              <span>
                تم تحديد {table.getSelectedRowModel().rows.length} من {table.getFilteredRowModel().rows.length}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            السابق
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            التالي
          </Button>
          <span className="text-muted-foreground">
            الصفحة {table.getState().pagination.pageIndex + 1} من {table.getPageCount()}
          </span>
          <select
            className="rounded-md border border-border bg-background px-2 py-1 text-xs"
            value={table.getState().pagination.pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
            aria-label="تغيير عدد الصفوف في الصفحة"
          >
            {[10, 25, 50, 100, 250].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize} صف
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

interface CellRendererProps<TData> {
  cell: Cell<TData, unknown>;
  onCellEdit?: DataGridProps<TData>['onCellEdit'];
}

function CellRenderer<TData>({ cell, onCellEdit }: CellRendererProps<TData>) {
  const value = cell.getValue();

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (!onCellEdit) return;
      const newValue = event.target.value;
      void onCellEdit({
        row: cell.row.original as TData,
        columnId: cell.column.id,
        newValue,
      });
    },
    [cell.column.id, cell.row.original, onCellEdit],
  );

  const cellMeta = cell.column.columnDef.meta as { editable?: boolean } | undefined;

  if (cellMeta?.editable) {
    return (
      <input
        defaultValue={value as string}
        onBlur={handleBlur}
        className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        aria-label={`تحرير ${cell.column.id}`}
      />
    );
  }

  return <div>{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>;
}

DataGrid.displayName = 'DataGrid';

export default DataGrid;
