'use client'

import { useMemo, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Building2, Phone, Mail, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { useFinancialState } from '@/application/context'
import type { Client } from '@/data/centralData'

type ClientType = Client['type']

interface ClientFormState {
  name: string
  email: string
  phone: string
  address: string
  type: ClientType
  notes: string
}

type ClientFormField = keyof ClientFormState

interface ClientTypeInfo {
  label: string
  relationship: Client['relationship']
  category: string
}

interface NewClientDialogProps {
  open: boolean
  onClose: () => void
  onClientAdded: (clientName: string) => void
}

export function NewClientDialog({ open, onClose, onClientAdded }: NewClientDialogProps) {
  const { clients: clientsState } = useFinancialState()
  const { addClient } = clientsState
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ClientFormState>({
    name: '',
    email: '',
    phone: '',
    address: '',
    type: 'individual',
    notes: ''
  })

  const clientTypeInfo = useMemo<Record<ClientType, ClientTypeInfo>>(() => ({
    government: {
      label: 'حكومي',
      relationship: 'government',
      category: 'حكومي'
    },
    private: {
      label: 'شركة خاصة',
      relationship: 'regular',
      category: 'شركة خاصة'
    },
    individual: {
      label: 'فرد',
      relationship: 'regular',
      category: 'أفراد'
    }
  }), [])

  const handleInputChange = (field: ClientFormField, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم العميل')
      return false
    }
    return true
  }

  const normalizePhone = (value: string) => value.replace(/\s+/g, '').replace(/[^\d+]/g, '')

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      setIsLoading(true)

      const trimmedName = formData.name.trim()
      const trimmedEmail = formData.email.trim()
      const trimmedAddress = formData.address.trim()
      const normalizedPhone = normalizePhone(formData.phone)
      const typeInfo = clientTypeInfo[formData.type]

      const newClient: Omit<Client, 'id'> = {
        name: trimmedName,
        email: trimmedEmail,
        phone: normalizedPhone,
        contact: normalizedPhone,
        type: formData.type,
        category: typeInfo.category,
        projects: 0,
        totalValue: 0,
        status: 'active',
        lastProject: '',
        relationship: typeInfo.relationship,
        paymentRating: 'good',
        location: trimmedAddress,
        establishedDate: new Date().toISOString().split('T')[0],
        completedProjects: 0,
        outstandingPayments: 0,
      }

      await addClient(newClient)

      onClientAdded(trimmedName)

      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        type: 'individual',
        notes: ''
      })

      onClose()
      toast.success('تم إضافة العميل بنجاح!')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في إضافة العميل'
      console.error('فشل في إضافة العميل الجديد', error)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      type: 'individual',
      notes: ''
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            إضافة عميل جديد
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات العميل الجديد. سيتم إضافته تلقائياً إلى قائمة العملاء في النظام.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name" className="flex items-center gap-1">
              اسم العميل
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client-name"
              placeholder="اسم العميل أو الشركة"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-type">نوع العميل</Label>
            <Select value={formData.type} onValueChange={(value: ClientType) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع العميل" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(clientTypeInfo).map(([value, info]) => (
                  <SelectItem key={value} value={value as ClientType}>
                    {info.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                رقم الهاتف
              </Label>
              <Input
                id="client-phone"
                placeholder="05xxxxxxxx"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              البريد الإلكتروني
            </Label>
            <Input
              id="client-email"
              type="email"
              placeholder="example@domain.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              العنوان
            </Label>
            <Textarea
              id="client-address"
              placeholder="عنوان العميل"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={2}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-notes">ملاحظات</Label>
            <Textarea
              id="client-notes"
              placeholder="ملاحظات إضافية عن العميل"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={2}
              className="bg-background"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'جاري الحفظ...' : 'إضافة العميل'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
