import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProjectsContainer from '@/features/projects/ProjectsContainer'

// Use vi.hoisted to ensure mocks are defined before being used
const { ProjectListPageMock, ProjectDetailsPageViewMock, ProjectFormPageMock } = vi.hoisted(() => ({
  ProjectListPageMock: () => <div data-testid="project-list-page">ProjectListPage</div>,
  ProjectDetailsPageViewMock: () => (
    <div data-testid="project-details-page">ProjectDetailsPage</div>
  ),
  ProjectFormPageMock: () => <div data-testid="project-form-page">ProjectFormPage</div>,
}))

vi.mock('@/presentation/pages/ProjectListPage.refactored', () => ({
  default: ProjectListPageMock,
  ProjectListPage: ProjectListPageMock,
}))

vi.mock('@/presentation/pages/ProjectDetailsPage.refactored', () => ({
  default: ProjectDetailsPageViewMock,
  ProjectDetailsPageView: ProjectDetailsPageViewMock,
}))

vi.mock('@/presentation/pages/ProjectFormPage.refactored', () => ({
  default: ProjectFormPageMock,
  ProjectFormPage: ProjectFormPageMock,
}))

describe('ProjectsContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders project list page by default', () => {
    const onSectionChange = vi.fn()
    render(<ProjectsContainer onSectionChange={onSectionChange} />)

    expect(screen.getByTestId('project-list-page')).toBeInTheDocument()
  })

  it('accepts onSectionChange prop', () => {
    const onSectionChange = vi.fn()
    render(<ProjectsContainer onSectionChange={onSectionChange} />)

    expect(screen.getByTestId('project-list-page')).toBeInTheDocument()
  })
})
