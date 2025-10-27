import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProjectFormPage } from '@/presentation/pages/ProjectFormPage.refactored'

interface ProjectFormMockProps {
  project?: unknown
  onSubmit: (data: unknown) => Promise<void>
  onCancel: () => void
}

const { useProjectDataMock, projectFormMock } = vi.hoisted(() => ({
  useProjectDataMock: vi.fn(),
  projectFormMock: vi.fn(),
}))

vi.mock('@/application/hooks/useProjectData', () => ({
  useProjectData: useProjectDataMock,
}))

vi.mock('@/presentation/components/projects/ProjectForm', () => ({
  ProjectForm: projectFormMock,
}))

describe('ProjectFormPage', () => {
  let loadProjectMock: ReturnType<typeof vi.fn>
  let createProjectMock: ReturnType<typeof vi.fn>
  let updateProjectMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    loadProjectMock = vi.fn()
    createProjectMock = vi.fn()
    updateProjectMock = vi.fn()

    projectFormMock.mockImplementation(({ project, onSubmit, onCancel }: ProjectFormMockProps) => (
      <div data-testid="project-form">
        {project ? (
          <span data-testid="form-mode">edit</span>
        ) : (
          <span data-testid="form-mode">create</span>
        )}
        <button data-testid="submit-form" onClick={() => onSubmit({ name: 'Test Project' })}>
          Submit
        </button>
        <button data-testid="cancel-form" onClick={onCancel}>
          Cancel
        </button>
      </div>
    ))

    useProjectDataMock.mockReturnValue({
      loadProject: loadProjectMock,
      createProject: createProjectMock,
      updateProject: updateProjectMock,
      currentProject: null,
      isLoading: false,
      error: null,
    })
  })

  it('renders create form when route is /new', () => {
    render(
      <MemoryRouter initialEntries={['/projects/new']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectFormPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('project-form')).toBeInTheDocument()
    expect(screen.getByTestId('form-mode')).toHaveTextContent('create')
    expect(screen.getByText('Create New Project')).toBeInTheDocument()
  })

  it('loads project when editing existing project', async () => {
    const mockProject = { id: 'proj-1', name: 'Existing Project' }
    useProjectDataMock.mockReturnValue({
      loadProject: loadProjectMock,
      createProject: createProjectMock,
      updateProject: updateProjectMock,
      currentProject: mockProject,
      isLoading: false,
      error: null,
    })

    render(
      <MemoryRouter initialEntries={['/projects/proj-1']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectFormPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(loadProjectMock).toHaveBeenCalledWith('proj-1')
    await waitFor(() => {
      expect(screen.getByTestId('form-mode')).toHaveTextContent('edit')
      expect(screen.getByText('Edit Project')).toBeInTheDocument()
    })
  })

  it('shows loading spinner when loading project data', () => {
    useProjectDataMock.mockReturnValue({
      loadProject: loadProjectMock,
      createProject: createProjectMock,
      updateProject: updateProjectMock,
      currentProject: null,
      isLoading: true,
      error: null,
    })

    render(
      <MemoryRouter initialEntries={['/projects/proj-1']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectFormPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('displays error message when loading fails', () => {
    useProjectDataMock.mockReturnValue({
      loadProject: loadProjectMock,
      createProject: createProjectMock,
      updateProject: updateProjectMock,
      currentProject: null,
      isLoading: false,
      error: 'Failed to load project',
    })

    render(
      <MemoryRouter initialEntries={['/projects/proj-1']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectFormPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Error Loading Project')).toBeInTheDocument()
    expect(screen.getByText('Failed to load project')).toBeInTheDocument()
  })

  it('creates new project on submit in create mode', async () => {
    const user = userEvent.setup()
    const newProject = { id: 'new-proj', name: 'Test Project' }
    createProjectMock.mockResolvedValue(newProject)

    render(
      <MemoryRouter initialEntries={['/projects/new']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectFormPage />} />
          <Route path="/projects/:projectId" element={<div data-testid="redirect-details" />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByTestId('submit-form'))

    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalledWith({ name: 'Test Project' })
    })
  })

  it('updates existing project on submit in edit mode', async () => {
    const user = userEvent.setup()
    const mockProject = { id: 'proj-1', name: 'Existing Project' }
    useProjectDataMock.mockReturnValue({
      loadProject: loadProjectMock,
      createProject: createProjectMock,
      updateProject: updateProjectMock,
      currentProject: mockProject,
      isLoading: false,
      error: null,
    })

    render(
      <MemoryRouter initialEntries={['/projects/proj-1']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectFormPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByTestId('submit-form'))

    await waitFor(() => {
      expect(updateProjectMock).toHaveBeenCalledWith('proj-1', { name: 'Test Project' })
    })
  })

  it('navigates to projects list on cancel in create mode', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/projects/new']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectFormPage />} />
          <Route path="/projects" element={<div data-testid="projects-list">List</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByTestId('cancel-form'))

    await waitFor(() => {
      expect(screen.getByTestId('projects-list')).toBeInTheDocument()
    })
  })

  it('navigates to project details on cancel in edit mode', async () => {
    const user = userEvent.setup()
    const mockProject = { id: 'proj-1', name: 'Existing Project' }
    useProjectDataMock.mockReturnValue({
      loadProject: loadProjectMock,
      createProject: createProjectMock,
      updateProject: updateProjectMock,
      currentProject: mockProject,
      isLoading: false,
      error: null,
    })

    render(
      <MemoryRouter initialEntries={['/projects/proj-1/edit']}>
        <Routes>
          <Route path="/projects/:id/edit" element={<ProjectFormPage />} />
          <Route path="/projects/:id" element={<div data-testid="project-details">Details</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByTestId('cancel-form'))

    await waitFor(() => {
      expect(screen.getByTestId('project-details')).toBeInTheDocument()
    })
  })

  it('displays submit error when form submission fails', async () => {
    const user = userEvent.setup()
    createProjectMock.mockRejectedValue(new Error('Network error'))

    render(
      <MemoryRouter initialEntries={['/projects/new']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectFormPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByTestId('submit-form'))

    await waitFor(() => {
      expect(screen.getByText('Error Saving Project')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })
})
