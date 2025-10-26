import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectAttachmentsList } from '@/presentation/components/projects/ProjectAttachmentsList'
import type { ProjectAttachmentListItem } from '@/presentation/components/projects/ProjectAttachmentsList'

describe('ProjectAttachmentsList', () => {
  const sampleAttachments: ProjectAttachmentListItem[] = [
    {
      id: 'att-1',
      name: 'مخطط المشروع.pdf',
      size: 512000,
      uploadedAt: '2025-02-20T10:30:00Z',
      mimeType: 'application/pdf',
      category: 'وثائق',
    },
    {
      id: 'att-2',
      name: 'قائمة التكاليف.xlsx',
      size: 1048576,
      uploadedAt: '2025-02-21T08:15:00Z',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      category: 'مالية',
    },
  ]

  it('renders attachments summary and table rows', () => {
    render(
      <ProjectAttachmentsList
        attachments={sampleAttachments}
        formatTimestamp={() => '20/02/2025 13:30'}
      />,
    )

    expect(screen.getByTestId('attachments-summary')).toBeInTheDocument()
    expect(screen.getByText('مخطط المشروع.pdf')).toBeInTheDocument()
    expect(screen.getByText('قائمة التكاليف.xlsx')).toBeInTheDocument()
    expect(screen.getAllByTestId(/attachment-row-/)).toHaveLength(2)
  })

  it('invokes onUpload when a new file is selected', async () => {
    const onUpload = vi.fn()
    render(<ProjectAttachmentsList attachments={[]} onUpload={onUpload} />)

    const file = new File(['dummy'], 'contract.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    const input = screen.getByTestId('attachments-upload-input') as HTMLInputElement

    await fireEvent.change(input, {
      target: { files: [file] },
    })

    expect(onUpload).toHaveBeenCalledTimes(1)
    const callArg = onUpload.mock.calls[0][0] as File
    expect(callArg.name).toBe('contract.docx')
  })

  it('forwards download and delete actions', async () => {
    const onDownload = vi.fn()
    const onDelete = vi.fn()
    const user = userEvent.setup()

    render(
      <ProjectAttachmentsList
        attachments={[sampleAttachments[0]]}
        onDownload={onDownload}
        onDelete={onDelete}
        formatTimestamp={() => '20/02/2025 13:30'}
      />,
    )

    const row = screen.getByTestId('attachment-row-att-1')
    const actions = within(row).getByTestId('attachment-actions-att-1')

    await user.click(within(actions).getByTestId('attachment-download-att-1'))
    await user.click(within(actions).getByTestId('attachment-delete-att-1'))

    expect(onDownload).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('shows empty state when no attachments exist', () => {
    render(<ProjectAttachmentsList attachments={[]} />)
    expect(screen.getByTestId('attachments-empty-state')).toBeInTheDocument()
  })
})
