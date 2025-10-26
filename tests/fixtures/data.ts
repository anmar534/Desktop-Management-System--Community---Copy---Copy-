/**
 * Test Fixtures - Sample Data for Tests
 */

import type { Tender } from '@/shared/types/contracts'
import type { BOQItem } from '@/shared/types/boq'

export const mockTenders: Tender[] = [
  {
    id: 'tender-123',
    name: 'Test Tender 1',
    title: 'Test Tender 1',
    client: 'Test Owner',
    value: 0,
    status: 'under_action',
    phase: 'preparation',
    category: 'construction',
    location: 'Test Location',
    type: 'public',
    deadline: '2024-12-31',
    daysLeft: 30,
    progress: 0,
    priority: 'medium',
    team: 'Team A',
    manager: 'Test Manager',
    winChance: 50,
    competition: 'medium',
    competitors: [],
    lastAction: 'Created',
    requirements: [],
    documents: [],
    proposals: [],
    evaluationCriteria: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastUpdate: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tender-456',
    name: 'Test Tender 2',
    title: 'Test Tender 2',
    client: 'Test Owner 2',
    value: 50000,
    status: 'submitted',
    phase: 'submission',
    category: 'construction',
    location: 'Test Location 2',
    type: 'private',
    deadline: '2024-12-31',
    daysLeft: 15,
    progress: 100,
    priority: 'high',
    team: 'Team B',
    manager: 'Test Manager 2',
    winChance: 75,
    competition: 'low',
    competitors: [],
    lastAction: 'Submitted',
    requirements: [],
    documents: [],
    proposals: [],
    evaluationCriteria: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastUpdate: '2024-01-01T00:00:00Z',
  },
]

export const mockBOQItems: BOQItem[] = [
  {
    id: 'item-1',
    description: 'Test Item 1',
    unit: 'متر',
    category: 'أعمال مدنية',
  },
  {
    id: 'item-2',
    description: 'Test Item 2',
    unit: 'متر مربع',
    category: 'أعمال كهربائية',
  },
  {
    id: 'item-3',
    description: 'Test Item 3',
    unit: 'طن',
    category: 'أعمال ميكانيكية',
  },
]

export const mockPricingData = {
  'item-1': {
    id: 'item-1',
    unitPrice: 100,
    quantity: 100,
    totalPrice: 10000,
    materials: [
      {
        id: 'm-1',
        name: 'Material 1',
        unit: 'كجم',
        quantity: 50,
        unitPrice: 10,
        totalPrice: 500,
        waste: 5,
      },
    ],
    labor: [
      {
        id: 'l-1',
        name: 'عامل',
        hours: 8,
        hourlyRate: 50,
        totalPrice: 400,
      },
    ],
    equipment: [],
    subcontractors: [],
    completed: true,
  },
  'item-2': {
    id: 'item-2',
    unitPrice: 200,
    quantity: 50,
    totalPrice: 10000,
    materials: [],
    labor: [],
    equipment: [],
    subcontractors: [],
    completed: true,
  },
}

export const mockDefaultPercentages = {
  adminPercentage: 10,
  operationalPercentage: 5,
  profitPercentage: 15,
}
