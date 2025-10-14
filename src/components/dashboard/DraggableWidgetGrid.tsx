/**
 * شبكة الودجات القابلة للسحب والإفلات
 * Draggable Widget Grid Component
 * 
 * يوفر شبكة تفاعلية لترتيب الودجات بالسحب والإفلات
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  GripVertical, 
  Settings, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  X,
  Plus,
  RotateCcw,
  Save
} from 'lucide-react';
import { Widget, customizationService } from '../../services/customizationService';

interface DragState {
  isDragging: boolean;
  draggedWidget: Widget | null;
  dragOffset: { x: number; y: number };
  dropZone: { x: number; y: number } | null;
}

interface GridConfig {
  columns: number;
  rows: number;
  gap: number;
  cellWidth: number;
  cellHeight: number;
}

interface DraggableWidgetGridProps {
  widgets: Widget[];
  onWidgetsChange: (widgets: Widget[]) => void;
  gridConfig?: Partial<GridConfig>;
  isEditMode?: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export const DraggableWidgetGrid: React.FC<DraggableWidgetGridProps> = ({
  widgets,
  onWidgetsChange,
  gridConfig: customGridConfig,
  isEditMode = false,
  onEditModeChange
}) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedWidget: null,
    dragOffset: { x: 0, y: 0 },
    dropZone: null
  });

  const [gridConfig] = useState<GridConfig>({
    columns: 12,
    rows: 8,
    gap: 16,
    cellWidth: 100,
    cellHeight: 100,
    ...customGridConfig
  });

  const gridRef = useRef<HTMLDivElement>(null);
  const [gridBounds, setGridBounds] = useState<DOMRect | null>(null);

  // تحديث حدود الشبكة
  useEffect(() => {
    if (gridRef.current) {
      setGridBounds(gridRef.current.getBoundingClientRect());
    }
  }, []);

  // حساب موضع الودجة في الشبكة
  const getWidgetStyle = useCallback((widget: Widget) => {
    const { position } = widget;
    const { cellWidth, cellHeight, gap } = gridConfig;
    
    return {
      position: 'absolute' as const,
      left: position.x * (cellWidth + gap),
      top: position.y * (cellHeight + gap),
      width: position.width * cellWidth + (position.width - 1) * gap,
      height: position.height * cellHeight + (position.height - 1) * gap,
      zIndex: dragState.draggedWidget?.id === widget.id ? 1000 : 1
    };
  }, [gridConfig, dragState.draggedWidget]);

  // بدء السحب
  const handleDragStart = useCallback((widget: Widget, event: React.MouseEvent) => {
    if (!isEditMode) return;
    
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    setDragState({
      isDragging: true,
      draggedWidget: widget,
      dragOffset: offset,
      dropZone: null
    });
  }, [isEditMode]);

  // أثناء السحب
  const handleDragMove = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedWidget || !gridBounds) return;

    const { cellWidth, cellHeight, gap } = gridConfig;
    const mouseX = event.clientX - gridBounds.left - dragState.dragOffset.x;
    const mouseY = event.clientY - gridBounds.top - dragState.dragOffset.y;

    // حساب موضع الشبكة الأقرب
    const gridX = Math.round(mouseX / (cellWidth + gap));
    const gridY = Math.round(mouseY / (cellHeight + gap));

    // التأكد من أن الموضع داخل حدود الشبكة
    const clampedX = Math.max(0, Math.min(gridX, gridConfig.columns - dragState.draggedWidget.position.width));
    const clampedY = Math.max(0, Math.min(gridY, gridConfig.rows - dragState.draggedWidget.position.height));

    setDragState(prev => ({
      ...prev,
      dropZone: { x: clampedX, y: clampedY }
    }));
  }, [dragState, gridBounds, gridConfig]);

  // انتهاء السحب
  const handleDragEnd = useCallback(() => {
    if (!dragState.isDragging || !dragState.draggedWidget || !dragState.dropZone) {
      setDragState({
        isDragging: false,
        draggedWidget: null,
        dragOffset: { x: 0, y: 0 },
        dropZone: null
      });
      return;
    }

    // تحديث موضع الودجة
    const updatedWidgets = widgets.map(widget => {
      if (widget.id === dragState.draggedWidget!.id) {
        return {
          ...widget,
          position: {
            ...widget.position,
            x: dragState.dropZone!.x,
            y: dragState.dropZone!.y
          }
        };
      }
      return widget;
    });

    onWidgetsChange(updatedWidgets);
    
    setDragState({
      isDragging: false,
      draggedWidget: null,
      dragOffset: { x: 0, y: 0 },
      dropZone: null
    });
  }, [dragState, widgets, onWidgetsChange]);

  // إضافة مستمعي الأحداث للسحب
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  // تبديل رؤية الودجة
  const handleToggleVisibility = async (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    try {
      await customizationService.updateWidget(widgetId, { isVisible: !widget.isVisible });
      const updatedWidgets = widgets.map(w => 
        w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w
      );
      onWidgetsChange(updatedWidgets);
    } catch (error) {
      console.error('Error toggling widget visibility:', error);
    }
  };

  // تبديل قفل الودجة
  const handleToggleLock = async (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    try {
      await customizationService.updateWidget(widgetId, { isLocked: !widget.isLocked });
      const updatedWidgets = widgets.map(w => 
        w.id === widgetId ? { ...w, isLocked: !w.isLocked } : w
      );
      onWidgetsChange(updatedWidgets);
    } catch (error) {
      console.error('Error toggling widget lock:', error);
    }
  };

  // حذف الودجة
  const handleRemoveWidget = async (widgetId: string) => {
    try {
      await customizationService.removeWidget(widgetId);
      const updatedWidgets = widgets.filter(w => w.id !== widgetId);
      onWidgetsChange(updatedWidgets);
    } catch (error) {
      console.error('Error removing widget:', error);
    }
  };

  // رسم خطوط الشبكة
  const renderGridLines = () => {
    if (!isEditMode) return null;

    const { columns, rows, cellWidth, cellHeight, gap } = gridConfig;
    const lines = [];

    // خطوط عمودية
    for (let i = 0; i <= columns; i++) {
      lines.push(
        <div
          key={`v-${i}`}
          className="absolute bg-gray-200 opacity-30"
          style={{
            left: i * (cellWidth + gap) - 1,
            top: 0,
            width: 1,
            height: rows * (cellHeight + gap)
          }}
        />
      );
    }

    // خطوط أفقية
    for (let i = 0; i <= rows; i++) {
      lines.push(
        <div
          key={`h-${i}`}
          className="absolute bg-gray-200 opacity-30"
          style={{
            left: 0,
            top: i * (cellHeight + gap) - 1,
            width: columns * (cellWidth + gap),
            height: 1
          }}
        />
      );
    }

    return lines;
  };

  // رسم منطقة الإسقاط
  const renderDropZone = () => {
    if (!dragState.dropZone || !dragState.draggedWidget) return null;

    const { cellWidth, cellHeight, gap } = gridConfig;
    const { dropZone, draggedWidget } = dragState;

    return (
      <div
        className="absolute bg-blue-200 border-2 border-blue-400 border-dashed rounded-lg opacity-50"
        style={{
          left: dropZone.x * (cellWidth + gap),
          top: dropZone.y * (cellHeight + gap),
          width: draggedWidget.position.width * cellWidth + (draggedWidget.position.width - 1) * gap,
          height: draggedWidget.position.height * cellHeight + (draggedWidget.position.height - 1) * gap,
          zIndex: 999
        }}
      />
    );
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* شريط الأدوات */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">تخطيط لوحة التحكم</h2>
          <Badge variant={isEditMode ? "default" : "secondary"}>
            {isEditMode ? "وضع التحرير" : "وضع العرض"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditModeChange?.(!isEditMode)}
          >
            {isEditMode ? "إنهاء التحرير" : "تحرير التخطيط"}
          </Button>
          {isEditMode && (
            <>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 ml-2" />
                إضافة ودجة
              </Button>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 ml-2" />
                إعادة تعيين
              </Button>
              <Button size="sm">
                <Save className="h-4 w-4 ml-2" />
                حفظ التخطيط
              </Button>
            </>
          )}
        </div>
      </div>

      {/* الشبكة */}
      <div className="relative bg-gray-50 rounded-lg p-4 overflow-hidden">
        <div
          ref={gridRef}
          className="relative"
          style={{
            width: gridConfig.columns * (gridConfig.cellWidth + gridConfig.gap),
            height: gridConfig.rows * (gridConfig.cellHeight + gridConfig.gap),
            minHeight: 600
          }}
        >
          {/* خطوط الشبكة */}
          {renderGridLines()}

          {/* منطقة الإسقاط */}
          {renderDropZone()}

          {/* الودجات */}
          {widgets
            .filter(widget => widget.isVisible)
            .map((widget) => (
              <div
                key={widget.id}
                style={getWidgetStyle(widget)}
                className={`
                  transition-all duration-200
                  ${dragState.draggedWidget?.id === widget.id ? 'opacity-70 scale-105' : ''}
                  ${isEditMode ? 'cursor-move' : ''}
                `}
                onMouseDown={(e) => handleDragStart(widget, e)}
              >
                <Card className={`h-full ${widget.isLocked ? 'border-red-200' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm truncate">{widget.name}</CardTitle>
                      <div className="flex items-center gap-1">
                        {isEditMode && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleVisibility(widget.id);
                              }}
                            >
                              {widget.isVisible ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleLock(widget.id);
                              }}
                            >
                              {widget.isLocked ? (
                                <Lock className="h-3 w-3" />
                              ) : (
                                <Unlock className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                // فتح إعدادات الودجة
                              }}
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveWidget(widget.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {isEditMode && !widget.isLocked && (
                          <GripVertical className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>النوع:</span>
                        <Badge variant="outline" className="text-xs">
                          {widget.type}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {widget.position.width}×{widget.position.height}
                      </div>
                      
                      {/* محتوى الودجة - يمكن استبداله بالمكون الفعلي */}
                      <div className="bg-gray-100 rounded p-2 text-center text-xs text-gray-600">
                        محتوى الودجة
                        <br />
                        {widget.component}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
        </div>
      </div>

      {/* معلومات إضافية */}
      {isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">تعليمات التحرير</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• اسحب الودجات لتغيير مواضعها</li>
            <li>• استخدم أيقونة العين لإخفاء/إظهار الودجات</li>
            <li>• استخدم أيقونة القفل لمنع تحريك الودجات</li>
            <li>• استخدم أيقونة الإعدادات لتخصيص الودجة</li>
            <li>• استخدم أيقونة X لحذف الودجة</li>
          </ul>
        </div>
      )}
    </div>
  );
};
