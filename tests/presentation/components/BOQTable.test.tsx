import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BOQTable, BOQColumn, SortConfig } from '../../../src/presentation/components/BOQTable'

// Mock data type
interface MockBOQItem {
  id: number
  code: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  margin: number
}

// Mock data
const mockData: MockBOQItem[] = [
  {
    id: 1,
    code: 'BOQ-001',
    description: 'بند اختبار 1',
    quantity: 10,
    unitPrice: 100,
    total: 1000,
    margin: 15,
  },
  {
    id: 2,
    code: 'BOQ-002',
    description: 'بند اختبار 2',
    quantity: 20,
    unitPrice: 200,
    total: 4000,
    margin: 20,
  },
  {
    id: 3,
    code: 'BOQ-003',
    description: 'بند اختبار 3',
    quantity: 5,
    unitPrice: 50,
    total: 250,
    margin: 10,
  },
]

// Basic columns
const basicColumns: BOQColumn<MockBOQItem>[] = [
  { key: 'code', label: 'الرمز', sortable: true },
  { key: 'description', label: 'الوصف' },
  { key: 'quantity', label: 'الكمية', format: 'quantity', align: 'right' },
  { key: 'unitPrice', label: 'سعر الوحدة', format: 'currency', align: 'right' },
  { key: 'total', label: 'الإجمالي', format: 'currency', align: 'right', sortable: true },
]

describe('BOQTable', () => {
  describe('Basic Rendering', () => {
    it('should render table with data', () => {
      render(<BOQTable data={mockData} columns={basicColumns} />)

      // Check headers
      expect(screen.getByText('الرمز')).toBeInTheDocument()
      expect(screen.getByText('الوصف')).toBeInTheDocument()
      expect(screen.getByText('الكمية')).toBeInTheDocument()

      // Check data
      expect(screen.getByText('BOQ-001')).toBeInTheDocument()
      expect(screen.getByText('بند اختبار 1')).toBeInTheDocument()
    })

    it('should render empty state when no data', () => {
      render(<BOQTable data={[]} columns={basicColumns} />)

      expect(screen.getByText('لا توجد بيانات')).toBeInTheDocument()
    })

    it('should render custom empty message', () => {
      render(<BOQTable data={[]} columns={basicColumns} emptyMessage="لا توجد بنود BOQ" />)

      expect(screen.getByText('لا توجد بنود BOQ')).toBeInTheDocument()
    })

    it('should render loading state', () => {
      render(<BOQTable data={mockData} columns={basicColumns} loading />)

      expect(screen.getByText('جاري التحميل...')).toBeInTheDocument()
      expect(screen.queryByText('BOQ-001')).not.toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <BOQTable data={mockData} columns={basicColumns} className="custom-table" />,
      )

      const table = container.querySelector('.boq-table')
      expect(table).toHaveClass('custom-table')
    })
  })

  describe('Formatting', () => {
    it('should format currency values', () => {
      render(<BOQTable data={mockData} columns={basicColumns} />)

      // Check currency formatting (ر.س prefix)
      expect(screen.getByText(/ر\.س 100/)).toBeInTheDocument()
      expect(screen.getByText(/ر\.س 1,000/)).toBeInTheDocument()
    })

    it('should format quantity values', () => {
      render(<BOQTable data={mockData} columns={basicColumns} />)

      expect(screen.getByText(/^10/)).toBeInTheDocument()
      expect(screen.getByText(/^20/)).toBeInTheDocument()
    })

    it('should format percentage values', () => {
      const columns: BOQColumn<MockBOQItem>[] = [
        { key: 'code', label: 'الرمز' },
        { key: 'margin', label: 'الهامش', format: 'percentage', align: 'right' },
      ]

      render(<BOQTable data={mockData} columns={columns} />)

      expect(screen.getByText(/15.*%/)).toBeInTheDocument()
      expect(screen.getByText(/20.*%/)).toBeInTheDocument()
    })

    it('should respect custom decimals', () => {
      const columns: BOQColumn<MockBOQItem>[] = [
        { key: 'quantity', label: 'الكمية', format: 'quantity', decimals: 0 },
      ]

      render(<BOQTable data={mockData} columns={columns} />)

      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('20')).toBeInTheDocument()
    })

    it('should handle null/undefined values', () => {
      const dataWithNull: Partial<MockBOQItem>[] = [
        {
          ...mockData[0],
          quantity: null as unknown as number,
          unitPrice: undefined as unknown as number,
        },
      ]

      render(<BOQTable data={dataWithNull as MockBOQItem[]} columns={basicColumns} />)

      const cells = screen.getAllByText('-')
      expect(cells.length).toBeGreaterThan(0)
    })
  })

  describe('Custom Render', () => {
    it('should use custom render function', () => {
      const columns: BOQColumn<MockBOQItem>[] = [
        {
          key: 'code',
          label: 'الرمز',
          render: (value) =>
            (<strong data-testid="custom-code">{String(value)}</strong>) as React.ReactNode,
        },
      ]

      render(<BOQTable data={mockData} columns={columns} />)

      const customElements = screen.getAllByTestId('custom-code')
      expect(customElements).toHaveLength(3)
      expect(customElements[0]).toHaveTextContent('BOQ-001')
    })

    it('should receive row and index in custom render', () => {
      const renderFn = vi.fn((_value, __row, index) => `${_value} (${index})`)
      const columns: BOQColumn<MockBOQItem>[] = [{ key: 'code', label: 'الرمز', render: renderFn }]

      render(<BOQTable data={mockData} columns={columns} />)

      expect(renderFn).toHaveBeenCalledTimes(3)
      expect(renderFn).toHaveBeenCalledWith('BOQ-001', mockData[0], 0)
    })
  })

  describe('Sorting', () => {
    it('should render sort icon for sortable columns', () => {
      const sortConfig: SortConfig = { key: 'code', direction: 'asc' }

      render(<BOQTable data={mockData} columns={basicColumns} sortConfig={sortConfig} />)

      expect(screen.getByText('↑')).toBeInTheDocument()
    })

    it('should call onSortChange when clicking sortable header', async () => {
      const user = userEvent.setup()
      const handleSortChange = vi.fn()

      render(<BOQTable data={mockData} columns={basicColumns} onSortChange={handleSortChange} />)

      await user.click(screen.getByText('الرمز'))

      expect(handleSortChange).toHaveBeenCalledWith({
        key: 'code',
        direction: 'asc',
      })
    })

    it('should toggle sort direction', async () => {
      const user = userEvent.setup()
      const handleSortChange = vi.fn()
      const sortConfig: SortConfig = { key: 'code', direction: 'asc' }

      render(
        <BOQTable
          data={mockData}
          columns={basicColumns}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
        />,
      )

      await user.click(screen.getByText('الرمز'))

      expect(handleSortChange).toHaveBeenCalledWith({
        key: 'code',
        direction: 'desc',
      })
    })

    it('should not call onSortChange for non-sortable columns', async () => {
      const user = userEvent.setup()
      const handleSortChange = vi.fn()

      render(<BOQTable data={mockData} columns={basicColumns} onSortChange={handleSortChange} />)

      await user.click(screen.getByText('الوصف'))

      expect(handleSortChange).not.toHaveBeenCalled()
    })
  })

  describe('Selection', () => {
    it('should render checkboxes when selectable', () => {
      render(<BOQTable data={mockData} columns={basicColumns} selectable />)

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes).toHaveLength(4) // 1 header + 3 rows
    })

    it('should not render checkboxes when not selectable', () => {
      render(<BOQTable data={mockData} columns={basicColumns} />)

      const checkboxes = screen.queryAllByRole('checkbox')
      expect(checkboxes).toHaveLength(0)
    })

    it('should call onSelectionChange when selecting row', async () => {
      const user = userEvent.setup()
      const handleSelectionChange = vi.fn()

      render(
        <BOQTable
          data={mockData}
          columns={basicColumns}
          selectable
          onSelectionChange={handleSelectionChange}
          getRowKey={(row) => row.id}
        />,
      )

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1]) // First row checkbox

      expect(handleSelectionChange).toHaveBeenCalledWith(new Set([1]))
    })

    it('should select all rows when clicking header checkbox', async () => {
      const user = userEvent.setup()
      const handleSelectionChange = vi.fn()

      render(
        <BOQTable
          data={mockData}
          columns={basicColumns}
          selectable
          onSelectionChange={handleSelectionChange}
          getRowKey={(row) => row.id}
        />,
      )

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0]) // Header checkbox

      expect(handleSelectionChange).toHaveBeenCalledWith(new Set([1, 2, 3]))
    })

    it('should deselect all when clicking header checkbox if all selected', async () => {
      const user = userEvent.setup()
      const handleSelectionChange = vi.fn()
      const selectedKeys = new Set([1, 2, 3])

      render(
        <BOQTable
          data={mockData}
          columns={basicColumns}
          selectable
          selectedKeys={selectedKeys}
          onSelectionChange={handleSelectionChange}
          getRowKey={(row) => row.id}
        />,
      )

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0]) // Header checkbox

      expect(handleSelectionChange).toHaveBeenCalledWith(new Set())
    })

    it('should show indeterminate state when some rows selected', () => {
      const selectedKeys = new Set([1])

      const { container } = render(
        <BOQTable
          data={mockData}
          columns={basicColumns}
          selectable
          selectedKeys={selectedKeys}
          getRowKey={(row) => row.id}
        />,
      )

      const headerCheckbox = container.querySelector('input[type="checkbox"]')!
      expect((headerCheckbox as HTMLInputElement).indeterminate).toBe(true)
    })

    it('should use default getRowKey (index) if not provided', async () => {
      const user = userEvent.setup()
      const handleSelectionChange = vi.fn()

      render(
        <BOQTable
          data={mockData}
          columns={basicColumns}
          selectable
          onSelectionChange={handleSelectionChange}
        />,
      )

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      expect(handleSelectionChange).toHaveBeenCalledWith(new Set([0]))
    })
  })

  describe('Row Interaction', () => {
    it('should call onRowClick when clicking row', async () => {
      const user = userEvent.setup()
      const handleRowClick = vi.fn()

      render(<BOQTable data={mockData} columns={basicColumns} onRowClick={handleRowClick} />)

      const rows = screen.getAllByRole('row')
      await user.click(rows[1]) // First data row (index 0 is header)

      expect(handleRowClick).toHaveBeenCalledWith(mockData[0], 0)
    })

    it('should not call onRowClick when clicking checkbox', async () => {
      const user = userEvent.setup()
      const handleRowClick = vi.fn()

      render(
        <BOQTable data={mockData} columns={basicColumns} selectable onRowClick={handleRowClick} />,
      )

      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      expect(handleRowClick).not.toHaveBeenCalled()
    })
  })

  describe('Styling Props', () => {
    it('should apply hoverable class', () => {
      const { container } = render(<BOQTable data={mockData} columns={basicColumns} hoverable />)

      expect(container.querySelector('.boq-table--hoverable')).toBeInTheDocument()
    })

    it('should apply striped class', () => {
      const { container } = render(<BOQTable data={mockData} columns={basicColumns} striped />)

      expect(container.querySelector('.boq-table--striped')).toBeInTheDocument()
    })

    it('should apply compact class', () => {
      const { container } = render(<BOQTable data={mockData} columns={basicColumns} compact />)

      expect(container.querySelector('.boq-table--compact')).toBeInTheDocument()
    })

    it('should apply column alignment', () => {
      const { container } = render(<BOQTable data={mockData} columns={basicColumns} />)

      const rightAlignedCells = container.querySelectorAll('.boq-table-cell--right')
      expect(rightAlignedCells.length).toBeGreaterThan(0)
    })

    it('should apply column width', () => {
      const columns: BOQColumn<MockBOQItem>[] = [{ key: 'code', label: 'الرمز', width: '150px' }]

      const { container } = render(<BOQTable data={mockData} columns={columns} />)

      const header = container.querySelector('th')
      expect(header).toHaveAttribute('style', 'width: 150px;')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty columns array', () => {
      const { container } = render(<BOQTable data={mockData} columns={[]} />)

      const headers = container.querySelectorAll('th')
      expect(headers).toHaveLength(0)
    })

    it('should handle single row', () => {
      render(<BOQTable data={[mockData[0]]} columns={basicColumns} />)

      expect(screen.getByText('BOQ-001')).toBeInTheDocument()
    })

    it('should handle very long data', () => {
      const longData = Array.from({ length: 100 }, (_, i) => ({
        ...mockData[0],
        id: i,
        code: `BOQ-${String(i).padStart(3, '0')}`,
      }))

      render(<BOQTable data={longData} columns={basicColumns} />)

      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(101) // 100 data + 1 header
    })
  })
})
