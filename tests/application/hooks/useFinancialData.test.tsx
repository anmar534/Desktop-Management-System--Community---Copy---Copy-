import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useEffect } from 'react'
import { render, cleanup, waitFor, act } from '@testing-library/react'
import type { Expense } from '@/data/expenseCategories'
import type { Project, Tender } from '@/data/centralData'

const refreshExpensesMock = vi.fn(() => Promise.resolve())
const refreshProjectsMock = vi.fn(() => Promise.resolve())
const refreshTendersMock = vi.fn(() => Promise.resolve())

const expensesStub: Expense[] = [
  {
    id: 'exp-1',
    title: 'مصروف إداري',
    amount: 25000,
    categoryId: 'admin_salaries',
    frequency: 'monthly',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'completed',
    isAdministrative: true,
    createdAt: '2025-05-01T00:00:00.000Z',
    updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'exp-2',
    title: 'مصروف مشروع',
    amount: 40000,
    categoryId: 'project_materials',
    frequency: 'one_time',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    projectId: 'project-1',
    isAdministrative: false,
    createdAt: '2025-05-02T00:00:00.000Z',
    updatedAt: '2025-05-02T00:00:00.000Z',
  },
]

const projectsStub: Project[] = [
  {
    id: 'project-1',
    name: 'برج الأعمال',
    client: 'شركة التعمير',
    status: 'active',
    priority: 'high',
    progress: 65,
    contractValue: 600000,
    estimatedCost: 400000,
    actualCost: 350000,
    spent: 320000,
    remaining: 280000,
    expectedProfit: 200000,
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: '2025-12-31T23:59:59.000Z',
    manager: 'م. أحمد',
    team: 'فريق التنفيذ',
    location: 'الرياض',
    phase: 'construction',
    health: 'green',
    lastUpdate: '2025-05-10T08:00:00.000Z',
    category: 'commercial',
    efficiency: 82,
    riskLevel: 'medium',
    budget: 600000,
    value: 600000,
    type: 'building',
  },
  {
    id: 'project-2',
    name: 'طريق الشمال',
    client: 'وزارة النقل',
    status: 'planning',
    priority: 'medium',
    progress: 15,
    contractValue: 400000,
    estimatedCost: 250000,
    actualCost: 50000,
    spent: 45000,
    remaining: 355000,
    expectedProfit: 150000,
    startDate: '2025-03-01T00:00:00.000Z',
    endDate: '2026-02-28T23:59:59.000Z',
    manager: 'م. سارة',
    team: 'فريق البنية التحتية',
    location: 'القصيم',
    phase: 'planning',
    health: 'yellow',
    lastUpdate: '2025-05-09T10:00:00.000Z',
    category: 'infrastructure',
    efficiency: 74,
    riskLevel: 'low',
    budget: 400000,
    value: 400000,
    type: 'road',
  },
]

const tendersStub: Tender[] = [
  {
    id: 'tender-1',
    name: 'منافسة مبنى الخدمات',
    title: 'منافسة مبنى الخدمات',
    client: 'بلدية الرياض',
    value: 500000,
    status: 'won',
    phase: 'evaluation',
    deadline: '2025-05-20T00:00:00.000Z',
    daysLeft: 5,
    progress: 100,
    priority: 'high',
    team: 'فريق المناقصات',
    manager: 'م. ليلى',
    winChance: 80,
    competition: 'open',
    submissionDate: '2025-05-01T00:00:00.000Z',
    lastAction: 'submitted',
    lastUpdate: '2025-05-05T00:00:00.000Z',
    category: 'government',
    location: 'الرياض',
    type: 'building',
    totalItems: 10,
    pricedItems: 10,
    completionPercentage: 100,
    documentPrice: 500,
    bookletPrice: 500,
  },
]

vi.mock('@/application/hooks/useExpenses', () => ({
  useExpenses: () => ({
    expenses: expensesStub,
    loading: false,
    error: null,
    addExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
    getExpensesByType: vi.fn(),
    getExpensesByProject: vi.fn(),
    refreshExpenses: refreshExpensesMock,
  }),
}))

vi.mock('@/application/hooks/useProjects', () => ({
  useProjects: () => ({
    projects: projectsStub,
    addProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    refreshProjects: refreshProjectsMock,
    isLoading: false,
  }),
}))

vi.mock('@/application/hooks/useTenders', () => ({
  useTenders: () => ({
    tenders: tendersStub,
    isLoading: false,
    refreshTenders: refreshTendersMock,
    addTender: vi.fn(),
    updateTender: vi.fn(),
    deleteTender: vi.fn(),
    stats: { totalTenders: 1, activeTenders: 0, wonTenders: 1, lostTenders: 0 },
  }),
}))

import { useFinancialData } from '@/application/hooks/useFinancialData'
import type { UseFinancialDataReturn } from '@/application/hooks/useFinancialData'

type FinancialDataHook = UseFinancialDataReturn

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useFinancialData', () => {
  it('refreshes underlying repositories and recalculates metrics', async () => {
    let latest: FinancialDataHook | null = null

    const Harness = ({ onData }: { onData: (value: FinancialDataHook) => void }) => {
      const data = useFinancialData()
      useEffect(() => {
        onData(data)
      }, [data, onData])
      return null
    }

    const capture = (value: FinancialDataHook) => {
      latest = value
    }

    render(<Harness onData={capture} />)

    await waitFor(() => {
      expect(latest).not.toBeNull()
    })

    if (!latest) {
      throw new Error('expected financial data to be captured')
    }

    const current = latest as FinancialDataHook

    expect(current.financialData.revenue.total).toBe(1000000)

    await act(async () => {
      await current.refreshData()
    })

    expect(refreshExpensesMock).toHaveBeenCalledTimes(1)
    expect(refreshProjectsMock).toHaveBeenCalledTimes(1)
    expect(refreshTendersMock).toHaveBeenCalledTimes(1)
  })
})
