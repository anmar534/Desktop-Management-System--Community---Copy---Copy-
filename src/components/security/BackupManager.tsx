/**
 * Backup Manager Component - مكون إدارة النسخ الاحتياطي
 * Sprint 5.5: الأمان والحماية المتقدمة
 */

import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Download, Upload, Trash2, RefreshCw, Database, Lock } from 'lucide-react'
import { designTokens } from '@/styles/design-system'
import type { BackupMetadata } from '@/application/services/security/backup.service'
import {
  getBackups,
  createBackup,
  deleteBackup,
  exportBackup,
  importBackup,
  restoreBackup,
} from '@/application/services/security/backup.service'

// ============================================================================
// Types
// ============================================================================

export interface BackupManagerProps {
  /** Current user ID / معرف المستخدم الحالي */
  userId: string

  /** Current user name / اسم المستخدم الحالي */
  userName: string

  /** RTL mode / وضع RTL */
  rtl?: boolean
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

const Button = styled.button<{ variant?: 'primary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[2]};
  padding: ${designTokens.spacing[2]} ${designTokens.spacing[4]};
  border: 1px solid
    ${(props) => {
      if (props.variant === 'primary') return designTokens.colors.primary[500]
      if (props.variant === 'danger') return designTokens.colors.error[500]
      return designTokens.colors.border.main
    }};
  background-color: ${(props) => {
    if (props.variant === 'primary') return designTokens.colors.primary[500]
    if (props.variant === 'danger') return designTokens.colors.error[500]
    return designTokens.colors.background.paper
  }};
  color: ${(props) => {
    if (props.variant === 'primary' || props.variant === 'danger')
      return designTokens.colors.neutral[0]
    return designTokens.colors.text.primary
  }};
  font-size: ${designTokens.typography.fontSize.sm};
  font-weight: ${designTokens.typography.fontWeight.medium};
  border-radius: ${designTokens.borderRadius.md};
  cursor: pointer;
  transition: ${designTokens.transitions.fast};

  &:hover {
    background-color: ${(props) => {
      if (props.variant === 'primary') return designTokens.colors.primary[600]
      if (props.variant === 'danger') return designTokens.colors.error[600]
      return designTokens.colors.neutral[50]
    }};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${designTokens.colors.primary[500]};
    outline-offset: 2px;
  }
`

const BackupList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${designTokens.spacing[2]};
  max-height: 500px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${designTokens.colors.neutral[300]};
    border-radius: ${designTokens.borderRadius.full};
  }
`

const BackupItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${designTokens.spacing[3]};
  padding: ${designTokens.spacing[3]};
  background-color: ${designTokens.colors.neutral[50]};
  border-radius: ${designTokens.borderRadius.md};
  transition: ${designTokens.transitions.fast};

  &:hover {
    background-color: ${designTokens.colors.neutral[100]};
  }
`

const BackupIcon = styled.div<{ encrypted: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: ${designTokens.borderRadius.full};
  background-color: ${(props) =>
    props.encrypted ? designTokens.colors.success[100] : designTokens.colors.primary[100]};
  color: ${(props) =>
    props.encrypted ? designTokens.colors.success[600] : designTokens.colors.primary[600]};
`

const BackupInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${designTokens.spacing[1]};
`

const BackupName = styled.div`
  font-size: ${designTokens.typography.fontSize.sm};
  font-weight: ${designTokens.typography.fontWeight.semibold};
  color: ${designTokens.colors.text.primary};
`

const BackupMeta = styled.div`
  display: flex;
  gap: ${designTokens.spacing[3]};
  font-size: ${designTokens.typography.fontSize.xs};
  color: ${designTokens.colors.text.hint};
`

const BackupActions = styled.div`
  display: flex;
  gap: ${designTokens.spacing[1]};
`

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background-color: transparent;
  color: ${designTokens.colors.text.secondary};
  border-radius: ${designTokens.borderRadius.md};
  cursor: pointer;
  transition: ${designTokens.transitions.fast};

  &:hover {
    background-color: ${designTokens.colors.neutral[200]};
    color: ${designTokens.colors.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${designTokens.colors.primary[500]};
    outline-offset: 2px;
  }
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

const HiddenInput = styled.input`
  display: none;
`

// ============================================================================
// Component
// ============================================================================

export const BackupManager: React.FC<BackupManagerProps> = ({ userId, userName, rtl = false }) => {
  const [backups, setBackups] = useState<BackupMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Load backups
  useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = () => {
    const allBackups = getBackups()
    setBackups(allBackups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()))
  }

  const handleCreateBackup = async () => {
    setLoading(true)
    try {
      await createBackup(userId, userName, 'manual', {
        description: rtl ? 'نسخة احتياطية يدوية' : 'Manual backup',
      })
      loadBackups()
    } catch (error) {
      console.error('Failed to create backup:', error)
      alert(rtl ? 'فشل إنشاء النسخة الاحتياطية' : 'Failed to create backup')
    } finally {
      setLoading(false)
    }
  }

  const handleExportBackup = (backupId: string) => {
    try {
      exportBackup(backupId)
    } catch (error) {
      console.error('Failed to export backup:', error)
      alert(rtl ? 'فشل تصدير النسخة الاحتياطية' : 'Failed to export backup')
    }
  }

  const handleImportBackup = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      await importBackup(file)
      loadBackups()
    } catch (error) {
      console.error('Failed to import backup:', error)
      alert(rtl ? 'فشل استيراد النسخة الاحتياطية' : 'Failed to import backup')
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRestoreBackup = async (backupId: string) => {
    if (
      !confirm(
        rtl
          ? 'هل أنت متأكد من استرداد هذه النسخة الاحتياطية؟'
          : 'Are you sure you want to restore this backup?',
      )
    ) {
      return
    }

    setLoading(true)
    try {
      await restoreBackup(backupId)
      alert(rtl ? 'تم استرداد النسخة الاحتياطية بنجاح' : 'Backup restored successfully')
    } catch (error) {
      console.error('Failed to restore backup:', error)
      alert(rtl ? 'فشل استرداد النسخة الاحتياطية' : 'Failed to restore backup')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBackup = (backupId: string) => {
    if (
      !confirm(
        rtl
          ? 'هل أنت متأكد من حذف هذه النسخة الاحتياطية؟'
          : 'Are you sure you want to delete this backup?',
      )
    ) {
      return
    }

    try {
      deleteBackup(backupId)
      loadBackups()
    } catch (error) {
      console.error('Failed to delete backup:', error)
      alert(rtl ? 'فشل حذف النسخة الاحتياطية' : 'Failed to delete backup')
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(rtl ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Container>
      <Header>
        <Title>{rtl ? 'إدارة النسخ الاحتياطي' : 'Backup Management'}</Title>
        <Actions>
          <Button onClick={handleCreateBackup} disabled={loading} variant="primary">
            <Database size={16} />
            {rtl ? 'إنشاء نسخة احتياطية' : 'Create Backup'}
          </Button>
          <Button onClick={handleImportBackup} disabled={loading}>
            <Upload size={16} />
            {rtl ? 'استيراد' : 'Import'}
          </Button>
        </Actions>
      </Header>

      <HiddenInput ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} />

      <BackupList>
        {backups.length === 0 ? (
          <EmptyState>
            <Database size={48} />
            <div>{rtl ? 'لا توجد نسخ احتياطية' : 'No backups found'}</div>
          </EmptyState>
        ) : (
          backups.map((backup) => (
            <BackupItem key={backup.id}>
              <BackupIcon encrypted={backup.encrypted}>
                {backup.encrypted ? <Lock size={20} /> : <Database size={20} />}
              </BackupIcon>
              <BackupInfo>
                <BackupName>
                  {backup.description || (rtl ? 'نسخة احتياطية' : 'Backup')} -{' '}
                  {backup.type === 'automatic'
                    ? rtl
                      ? 'تلقائية'
                      : 'Auto'
                    : rtl
                      ? 'يدوية'
                      : 'Manual'}
                </BackupName>
                <BackupMeta>
                  <span>{formatDate(backup.timestamp)}</span>
                  <span>•</span>
                  <span>{formatSize(backup.size)}</span>
                  <span>•</span>
                  <span>{backup.userName}</span>
                </BackupMeta>
              </BackupInfo>
              <BackupActions>
                <IconButton
                  onClick={() => handleRestoreBackup(backup.id)}
                  title={rtl ? 'استرداد' : 'Restore'}
                >
                  <RefreshCw size={16} />
                </IconButton>
                <IconButton
                  onClick={() => handleExportBackup(backup.id)}
                  title={rtl ? 'تصدير' : 'Export'}
                >
                  <Download size={16} />
                </IconButton>
                <IconButton
                  onClick={() => handleDeleteBackup(backup.id)}
                  title={rtl ? 'حذف' : 'Delete'}
                >
                  <Trash2 size={16} />
                </IconButton>
              </BackupActions>
            </BackupItem>
          ))
        )}
      </BackupList>
    </Container>
  )
}

export default BackupManager
