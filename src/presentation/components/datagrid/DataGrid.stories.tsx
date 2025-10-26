import type { Meta, StoryObj } from '@storybook/react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataGrid, type DataGridProps } from './DataGrid'

interface MockRow {
  id: string
  project: string
  client: string
  status: 'active' | 'completed' | 'delayed'
  progress: number
  contractValue: number
  manager: string
}

const columns: ColumnDef<MockRow>[] = [
  {
    accessorKey: 'project',
    header: 'المشروع',
  },
  {
    accessorKey: 'client',
    header: 'العميل',
  },
  {
    accessorKey: 'status',
    header: 'الحالة',
  },
  {
    accessorKey: 'progress',
    header: 'نسبة الإنجاز',
    cell: ({ getValue }) => `${getValue<number>()}%`,
  },
  {
    accessorKey: 'contractValue',
    header: 'قيمة العقد',
    cell: ({ getValue }) =>
      new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(
        getValue<number>(),
      ),
  },
  {
    accessorKey: 'manager',
    header: 'مدير المشروع',
  },
]

const rows: MockRow[] = Array.from({ length: 120 }, (_, index) => ({
  id: `row-${index}`,
  project: `مشروع ${index + 1}`,
  client: index % 2 === 0 ? 'وزارة الإسكان' : 'مجموعة تطوير',
  status: index % 3 === 0 ? 'completed' : index % 3 === 1 ? 'active' : 'delayed',
  progress: Math.floor(Math.random() * 100),
  contractValue: 1500000 + index * 8500,
  manager: index % 2 === 0 ? 'أحمد العتيبي' : 'فهد الدوسري',
}))

const DataGridComponent = (props: DataGridProps<MockRow>) => <DataGrid<MockRow> {...props} />

const meta: Meta<typeof DataGridComponent> = {
  title: 'Design System/DataGrid',
  component: DataGridComponent,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    columns,
    data: rows,
    height: 420,
  },
}

export default meta

type Story = StoryObj<typeof DataGrid<MockRow>>

export const Default: Story = {
  render: (args) => <DataGrid<MockRow> {...args} />,
}
