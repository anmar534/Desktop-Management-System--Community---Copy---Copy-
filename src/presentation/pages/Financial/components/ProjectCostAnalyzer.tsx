/**
 * Project Cost Analyzer Component
 */

import React from 'react'

interface ProjectCostAnalyzerProps {
  onSectionChange?: (section: string) => void
}

export const ProjectCostAnalyzer: React.FC<ProjectCostAnalyzerProps> = ({ onSectionChange }) => {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold">Project Cost Analyzer</h3>
      <p className="text-sm text-muted-foreground">Project cost analyzer placeholder</p>
    </div>
  )
}

