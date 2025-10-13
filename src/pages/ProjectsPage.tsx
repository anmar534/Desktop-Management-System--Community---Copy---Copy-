/**
 * Projects Page Component
 * Main page for project management functionality
 * Entry point for all project-related operations
 */

import React from 'react'
import { Helmet } from 'react-helmet-async'
import { ProjectsManager } from '../components/projects'

export const ProjectsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>إدارة المشاريع - نظام إدارة المكاتب</title>
        <meta name="description" content="إدارة شاملة للمشاريع مع تتبع التقدم والميزانيات والفرق" />
      </Helmet>
      
      <ProjectsManager />
    </>
  )
}

export default ProjectsPage
