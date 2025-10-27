import { MemoryRouter, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { ProjectListPage } from '@/presentation/pages/ProjectListPage.refactored'
import { ProjectDetailsPageView } from '@/presentation/pages/ProjectDetailsPage.refactored'
import { ProjectFormPage } from '@/presentation/pages/ProjectFormPage.refactored'
import type { ProjectsViewProps } from '@/presentation/components/projects'

interface ProjectsContainerProps {
  onSectionChange: ProjectsViewProps['onSectionChange']
}

export function ProjectsContainer({ onSectionChange }: ProjectsContainerProps) {
  return (
    <MemoryRouter
      initialEntries={['/']}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<ProjectListPage />} />
        <Route path="new" element={<ProjectFormRoute />} />
        <Route
          path=":projectId"
          element={<ProjectDetailsRoute onSectionChange={onSectionChange} />}
        />
        <Route path=":projectId/edit" element={<ProjectFormRoute />} />
      </Routes>
    </MemoryRouter>
  )
}

export default ProjectsContainer

function ProjectFormRoute() {
  return <ProjectFormPage />
}

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
