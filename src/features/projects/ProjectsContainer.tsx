import { MemoryRouter, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import ProjectsView, { type ProjectsViewProps } from '@/presentation/components/projects'
import { useFinancialState } from '@/application/context'
import { ProjectDetailsPageView } from '@/presentation/pages/ProjectDetailsPage.refactored'

interface ProjectsContainerProps {
  onSectionChange: ProjectsViewProps['onSectionChange']
}

export function ProjectsContainer({ onSectionChange }: ProjectsContainerProps) {
  const { projects: projectsState } = useFinancialState()
  const { projects, deleteProject, updateProject } = projectsState

  return (
    <MemoryRouter
      initialEntries={['/']}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route
          path="/"
          element={
            <ProjectsView
              projects={projects as ProjectsViewProps['projects']}
              onSectionChange={onSectionChange}
              onDeleteProject={deleteProject}
              onUpdateProject={updateProject as ProjectsViewProps['onUpdateProject']}
            />
          }
        />
        <Route
          path=":projectId"
          element={<ProjectDetailsRoute onSectionChange={onSectionChange} />}
        />
      </Routes>
    </MemoryRouter>
  )
}

export default ProjectsContainer

interface ProjectDetailsRouteProps {
  onSectionChange: ProjectsViewProps['onSectionChange']
}

function ProjectDetailsRoute({ onSectionChange }: ProjectDetailsRouteProps) {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  return (
    <ProjectDetailsPageView
      projectId={projectId}
      onBack={() => navigate('/')}
      onSectionChange={onSectionChange}
    />
  )
}
