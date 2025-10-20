/**
 * Audit Log Viewer Component - مكون عرض سجل المراجعة
 * Sprint 5.5: الأمان والحماية المتقدمة
 */

import type React from 'react'
import { useState, useMemo } from 'react'
import styled from 'styled-components'
import {
  Download,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
} from 'lucide-react'
import { designTokens } from '@/styles/design-system'
import type { AuditFilter, AuditSeverity } from '@/application/services/security/audit.service'
import {
  AuditLog,
  getAuditLogs,
  exportAuditLogs,
} from '@/application/services/security/audit.service'

// ============================================================================
// Types
// ============================================================================

export interface AuditLogViewerProps {
  /** RTL mode / وضع RTL */
  rtl?: boolean

  /** Initial filter / التصفية الأولية */
  initialFilter?: AuditFilter
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${designTokens.spacing[4]};
  padding: ${designTokens.spacing[6]};
  background-color: ${designTokens.colors.background.paper};
  border-radius: ${designTokens.borderRadius.xl};
  box-shadow: ${designTokens.shadows.md};
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${designTokens.spacing[4]};
`

const Title = styled.h2`
  font-size: ${designTokens.typography.fontSize['2xl']};
  font-weight: ${designTokens.typography.fontWeight.bold};
  color: ${designTokens.colors.text.primary};
  margin: 0;
`

const Actions = styled.div`
  display: flex;
  gap: ${designTokens.spacing[2]};
`

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[2]};
  padding: ${designTokens.spacing[2]} ${designTokens.spacing[4]};
  border: 1px solid ${designTokens.colors.border.main};
  background-color: ${designTokens.colors.background.paper};
  color: ${designTokens.colors.text.primary};
  font-size: ${designTokens.typography.fontSize.sm};
  font-weight: ${designTokens.typography.fontWeight.medium};
  border-radius: ${designTokens.borderRadius.md};
  cursor: pointer;
  transition: ${designTokens.transitions.fast};

  &:hover {
    background-color: ${designTokens.colors.neutral[50]};
    border-color: ${designTokens.colors.primary[500]};
  }

  &:focus-visible {
    outline: 2px solid ${designTokens.colors.primary[500]};
    outline-offset: 2px;
  }
`

const Filters = styled.div`
  display: flex;
  gap: ${designTokens.spacing[3]};
  flex-wrap: wrap;
`

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: ${designTokens.spacing[2]} ${designTokens.spacing[3]};
  border: 1px solid ${designTokens.colors.border.main};
  border-radius: ${designTokens.borderRadius.md};
  font-size: ${designTokens.typography.fontSize.sm};
  color: ${designTokens.colors.text.primary};
  background-color: ${designTokens.colors.background.paper};

  &:focus {
    outline: none;
    border-color: ${designTokens.colors.primary[500]};
  }
`

const LogList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${designTokens.spacing[2]};
  max-height: 600px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${designTokens.colors.neutral[300]};
    border-radius: ${designTokens.borderRadius.full};
  }
`

const LogItem = styled.div<{ severity: AuditSeverity }>`
  display: flex;
  align-items: flex-start;
  gap: ${designTokens.spacing[3]};
  padding: ${designTokens.spacing[3]};
  background-color: ${designTokens.colors.neutral[50]};
  border-left: 4px solid
    ${(props) => {
      switch (props.severity) {
        case 'critical':
          return designTokens.colors.error[500]
        case 'high':
          return designTokens.colors.warning[500]
        case 'medium':
          return designTokens.colors.info[500]
        case 'low':
          return designTokens.colors.success[500]
        default:
          return designTokens.colors.neutral[500]
      }
    }};
  border-radius: ${designTokens.borderRadius.md};
  transition: ${designTokens.transitions.fast};

  &:hover {
    background-color: ${designTokens.colors.neutral[100]};
  }
`

const LogIcon = styled.div<{ severity: AuditSeverity }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: ${designTokens.borderRadius.full};
  background-color: ${(props) => {
    switch (props.severity) {
      case 'critical':
        return designTokens.colors.error[100]
      case 'high':
        return designTokens.colors.warning[100]
      case 'medium':
        return designTokens.colors.info[100]
      case 'low':
        return designTokens.colors.success[100]
      default:
        return designTokens.colors.neutral[100]
    }
  }};
  color: ${(props) => {
    switch (props.severity) {
      case 'critical':
        return designTokens.colors.error[600]
      case 'high':
        return designTokens.colors.warning[600]
      case 'medium':
        return designTokens.colors.info[600]
      case 'low':
        return designTokens.colors.success[600]
      default:
        return designTokens.colors.neutral[600]
    }
  }};
`

const LogContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${designTokens.spacing[1]};
`

const LogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${designTokens.spacing[2]};
`

const LogUser = styled.div`
  font-size: ${designTokens.typography.fontSize.sm};
  font-weight: ${designTokens.typography.fontWeight.semibold};
  color: ${designTokens.colors.text.primary};
`

const LogTime = styled.div`
  font-size: ${designTokens.typography.fontSize.xs};
  color: ${designTokens.colors.text.hint};
`

const LogDescription = styled.div`
  font-size: ${designTokens.typography.fontSize.sm};
  color: ${designTokens.colors.text.secondary};
  line-height: ${designTokens.typography.lineHeight.normal};
`

const LogAction = styled.div`
  font-size: ${designTokens.typography.fontSize.xs};
  color: ${designTokens.colors.text.hint};
  font-family: ${designTokens.typography.fontFamily.mono};
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${designTokens.spacing[12]};
  color: ${designTokens.colors.text.hint};
  text-align: center;
`

// ============================================================================
// Component
// ============================================================================

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ rtl = false, initialFilter }) => {
  const [filter, setFilter] = useState<AuditFilter>(initialFilter || {})
  const [searchQuery, setSearchQuery] = useState('')

  // Get filtered logs
  const logs = useMemo(() => {
    return getAuditLogs({ ...filter, search: searchQuery })
  }, [filter, searchQuery])

  const handleExport = () => {
    const data = exportAuditLogs({ ...filter, search: searchQuery })
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit_logs_${new Date().toISOString()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getIcon = (severity: AuditSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle size={20} />
      case 'high':
        return <AlertTriangle size={20} />
      case 'medium':
        return <Info size={20} />
      case 'low':
        return <CheckCircle size={20} />
      default:
        return <Info size={20} />
    }
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date)
  }

  return (
    <Container>
      <Header>
        <Title>{rtl ? 'سجل المراجعة' : 'Audit Log'}</Title>
        <Actions>
          <Button onClick={handleExport}>
            <Download size={16} />
            {rtl ? 'تصدير' : 'Export'}
          </Button>
        </Actions>
      </Header>

      <Filters>
        <SearchInput
          type="text"
          placeholder={rtl ? 'بحث...' : 'Search...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Filters>

      <LogList>
        {logs.length === 0 ? (
          <EmptyState>
            <Info size={48} />
            <div>{rtl ? 'لا توجد سجلات' : 'No logs found'}</div>
          </EmptyState>
        ) : (
          logs.map((log) => (
            <LogItem key={log.id} severity={log.severity}>
              <LogIcon severity={log.severity}>{getIcon(log.severity)}</LogIcon>
              <LogContent>
                <LogHeader>
                  <LogUser>{log.userName}</LogUser>
                  <LogTime>{formatTime(log.timestamp)}</LogTime>
                </LogHeader>
                <LogDescription>
                  {rtl && log.descriptionAr ? log.descriptionAr : log.description}
                </LogDescription>
                <LogAction>{log.action}</LogAction>
              </LogContent>
            </LogItem>
          ))
        )}
      </LogList>
    </Container>
  )
}

export default AuditLogViewer
