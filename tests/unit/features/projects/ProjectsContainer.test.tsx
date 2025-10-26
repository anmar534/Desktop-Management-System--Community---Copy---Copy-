import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useNavigate } from 'react-router-dom'
import ProjectsContainer from '@/features/projects/ProjectsContainer'
import type { FinancialStateContextValue } from '@/application/context/FinancialStateContext'

const { useFinancialStateMock, projectsViewMock, projectDetailsPageViewMock } = vi.hoisted(() => ({
  useFinancialStateMock: vi.fn(),
  projectsViewMock: vi.fn(),
  projectDetailsPageViewMock: vi.fn(),
}))

type SectionChangeHandler = (section: string) => void
interface ProjectsViewMockProps {
  projects: Array<Record<string, unknown>>
  onSectionChange: SectionChangeHandler
  onDeleteProject: (...args: unknown[]) => unknown
  onUpdateProject: (...args: unknown[]) => unknown
}

vi.mock('@/application/context', () => ({
  useFinancialState: useFinancialStateMock,
}))

vi.mock('@/presentation/components/projects', () => ({
  __esModule: true,
  default: projectsViewMock,
}))

vi.mock('@/presentation/pages/ProjectDetailsPage.refactored', () => ({
  __esModule: true,
  ProjectDetailsPageView: projectDetailsPageViewMock,
}))

describe('ProjectsContainer', () => {
  let deleteProjectMock: ReturnType<typeof vi.fn>
  let updateProjectMock: ReturnType<typeof vi.fn>
  let projectsFixture: Array<{ id: string; name: string }>

  beforeEach(() => {
    vi.clearAllMocks()
    deleteProjectMock = vi.fn()
    updateProjectMock = vi.fn()

    projectsViewMock.mockImplementation((_props: ProjectsViewMockProps) => {
      const navigate = useNavigate()
      return (
        <div data-testid="projects-view">
          <button data-testid="open-project" onClick={() => navigate('/project-123')}>
            View project
          </button>
        </div>
      )
    })

    projectDetailsPageViewMock.mockImplementation(
      ({
        projectId,
        onBack,
        onSectionChange,
      }: {
        projectId?: string
        onBack: () => void
        onSectionChange?: SectionChangeHandler
      }) => (
        <div data-testid="project-details-view">
          <span data-testid="project-details-id">{projectId}</span>
          <button data-testid="back-button" onClick={onBack}>
            Back
          </button>
          {onSectionChange ? <span data-testid="section-change-present" /> : null}
        </div>
      ),
    )

    projectsFixture = [
      {
        id: 'project-1',
        name: 'Test Project',
      },
    ]

    const financialState = {
      projects: {
        projects: projectsFixture,
        deleteProject: deleteProjectMock,
        updateProject: updateProjectMock,
      },
    } as unknown as FinancialStateContextValue

    useFinancialStateMock.mockReturnValue(financialState)
  })

  it('renders projects view with store data and handlers', () => {
    const onSectionChange = vi.fn()
    render(<ProjectsContainer onSectionChange={onSectionChange} />)

    expect(screen.getByTestId('projects-view')).toBeInTheDocument()
    expect(projectsViewMock).toHaveBeenCalledTimes(1)

    const propsPassed = projectsViewMock.mock.calls[0][0] as ProjectsViewMockProps
    expect(propsPassed.projects).toBe(projectsFixture)
    expect(propsPassed.onSectionChange).toBe(onSectionChange)
    expect(propsPassed.onDeleteProject).toBe(deleteProjectMock)
    expect(propsPassed.onUpdateProject).toBe(updateProjectMock)
  })

  it('navigates to details route and back to list', async () => {
    const onSectionChange = vi.fn()
    const user = userEvent.setup()

    render(<ProjectsContainer onSectionChange={onSectionChange} />)

    await user.click(screen.getByTestId('open-project'))

    const detailsView = await screen.findByTestId('project-details-view')
    expect(detailsView).toBeInTheDocument()

    expect(projectDetailsPageViewMock).toHaveBeenCalledTimes(1)
    const detailProps = projectDetailsPageViewMock.mock.calls[0][0] as {
      projectId?: string
      onSectionChange?: SectionChangeHandler
    }
    expect(detailProps.projectId).toBe('project-123')
    expect(detailProps.onSectionChange).toBe(onSectionChange)

    await user.click(screen.getByTestId('back-button'))

    expect(await screen.findByTestId('projects-view')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByTestId('project-details-view')).not.toBeInTheDocument()
    })
  })
})
