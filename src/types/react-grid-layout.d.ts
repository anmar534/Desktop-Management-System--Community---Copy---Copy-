declare module 'react-grid-layout' {
  import type { Component, ComponentType, ReactNode } from 'react';

  export interface Layout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
    static?: boolean;
    isResizable?: boolean;
    isDraggable?: boolean;
  }

  export type Layouts = Record<string, Layout[]>;

  export interface ResponsiveProps {
    className?: string;
    children?: ReactNode;
    layouts: Layouts;
    cols?: Record<string, number>;
    rowHeight?: number;
    margin?: [number, number];
    containerPadding?: [number, number];
    isDraggable?: boolean;
    isResizable?: boolean;
    onLayoutChange?: (layout: Layout[], layouts: Layouts) => void;
    draggableHandle?: string;
    draggableCancel?: string;
    compactType?: 'vertical' | 'horizontal' | null;
    preventCollision?: boolean;
    isBounded?: boolean;
    measureBeforeMount?: boolean;
    useCSSTransforms?: boolean;
    [key: string]: unknown;
  }

  export class Responsive extends Component<ResponsiveProps> {}
  export function WidthProvider<P>(component: ComponentType<P>): ComponentType<P>;
}
