'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Image from 'next/image'

type AffiliateRow = {
  id: string
  affiliateNumber?: number
  firstName: string
  lastName: string
  companyName?: string
  accountType: 'individual' | 'company'
  phone?: string
  internalNotes?: string
  status: 'pending' | 'active' | 'rejected'
  paymentTerm: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  rateType: 'percent' | 'fixed'
  rateValue: number
  currency?: string
  createdAt: string
  user?: {
    email?: string
    createdAt?: string
    isBlocked?: boolean
  }
}

type ReferralRow = {
  id: string
  referralNumber?: number
  accountType: 'individual' | 'company'
  firstName?: string
  lastName?: string
  companyName?: string
  contactFirstName?: string
  contactLastName?: string
  email?: string
  phone?: string
  contactEmail?: string
  contactPhone?: string
  status: 'pending' | 'approved' | 'rejected'
  paymentStatus: 'unpaid' | 'paid' | 'rejected'
  internalNotes?: string
  entryDate?: string
  affiliate?: {
    firstName?: string
    lastName?: string
  }
}

type DocumentRow = {
  id: string
  name: string
  type: string
  fileUrl: string
  uploadedAt: string
  isHidden?: boolean
}

type EmailTemplateRow = {
  id: string
  name: string
  description?: string | null
  subject: string
  body: string
  enabled: boolean
  variables?: string[]
}

type ExportRow = Record<string, string | number>

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'rejected', label: 'Rejected' },
]

const paymentTermOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

const rateTypeOptions = [
  { value: 'percent', label: 'Percent' },
  { value: 'fixed', label: 'Fixed Rate' },
]

const referralStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const paymentStatusOptions = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
]

const currencyOptions = ['USD', 'EUR', 'GBP', 'RUB']
const documentTypeOptions = [
  { value: 'guide', label: 'Guide' },
  { value: 'corporate_brochure', label: 'Corporate Brochure' },
  { value: 'one_pager', label: 'One-pager' },
  { value: 'terms_and_conditions', label: 'Terms & Conditions' },
  { value: 'banner', label: 'Banner' },
  { value: 'other', label: 'Other' },
]

type PasswordStrength = 'Easy' | 'Medium' | 'Strong'

const getPasswordStrength = (password: string): PasswordStrength => {
  const lengthScore = password.length >= 12 ? 2 : password.length >= 8 ? 1 : 0
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)
  const variety = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length
  const score = lengthScore + variety

  if (password.length >= 12 && variety >= 4 && score >= 5) return 'Strong'
  if (password.length >= 8 && variety >= 3) return 'Medium'
  return 'Easy'
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-GB').format(date)
}

const formatInputDate = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const buildShareLinks = (url: string) => ({
  Telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}`,
  WhatsApp: `https://wa.me/?text=${encodeURIComponent(url)}`,
  LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  Email: `mailto:?subject=${encodeURIComponent('Marketing Materials')}&body=${encodeURIComponent(url)}`,
  Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
})

const getBackendBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
  return apiUrl.replace(/\/api\/?$/, '')
}

const templateGroups = {
  manager: [
    {
      name: 'New Affiliate Registration',
      description: 'Sent to a manager when a new affiliate registers.',
      subject: 'A new affiliate has registered on your site | {first_name}{last_name}',
      body:
        'A new affiliate has registered on your site, https://accessfinancial.com\n\n' +
        'Account Type: {account_type}\n\n' +
        'First Name: {first_name}\n' +
        'Last Name: {last_name}\n' +
        'Phone: {phone}\n' +
        'Email: {user_email}\n' +
        'Company: {company_name}\n' +
        'Country: {country}\n\n' +
        'Kind regards,\n' +
        'Access Financial Team',
    },
    {
      name: 'New Referral',
      description: 'Sent to a manager when a new referral is created.',
      subject: 'A new referral has been created | {first_name}{last_name}',
      body:
        'A new referral has been created on your site, https://accessfinancial.com\n\n' +
        'Referral Name: {first_name} {last_name}\n' +
        'Email: {user_email}\n' +
        'Phone: {phone}\n' +
        'Company: {company_name}\n' +
        'Country: {country}\n\n' +
        'Kind regards,\n' +
        'Access Financial Team',
    },
  ],
  affiliate: [
    {
      name: 'Application Pending',
      description: 'Sent when an affiliate registers and approval is required.',
      subject: 'Your application is pending | {first_name}{last_name}',
      body:
        'Hi {first_name},\n\n' +
        'Thank you for registering. Your application is currently pending review.\n\n' +
        'Kind regards,\n' +
        'Access Financial Team',
    },
    {
      name: 'Application Rejected',
      description: 'Sent when an affiliate application is rejected.',
      subject: 'Your application was rejected | {first_name}{last_name}',
      body:
        'Hi {first_name},\n\n' +
        'We are sorry to inform you that your application was rejected.\n\n' +
        'Kind regards,\n' +
        'Access Financial Team',
    },
    {
      name: 'New Referral Added',
      description: 'Sent to affiliates when they add a new referral.',
      subject: 'New referral submitted | {first_name}{last_name}',
      body:
        'Hi {first_name},\n\n' +
        'Your new referral has been submitted successfully.\n\n' +
        'Kind regards,\n' +
        'Access Financial Team',
    },
    {
      name: 'Referral Approved',
      description: 'Sent when a referral is approved.',
      subject: 'Referral approved | {first_name}{last_name}',
      body:
        'Hi {first_name},\n\n' +
        'Your referral has been approved.\n\n' +
        'Kind regards,\n' +
        'Access Financial Team',
    },
    {
      name: 'Payment Done',
      description: 'Sent to an affiliate when a payment is processed.',
      subject: 'Payment processed | {first_name}{last_name}',
      body:
        'Hi {first_name},\n\n' +
        'Your payment has been processed.\n\n' +
        'Kind regards,\n' +
        'Access Financial Team',
    },
  ],
}

const availableTags = [
  '{first_name}',
  '{last_name}',
  '{account_type}',
  '{phone}',
  '{user_email}',
  '{company_name}',
  '{country}',
]

const labelFrom = (value: string, options: { value: string; label: string }[]) =>
  options.find((option) => option.value === value)?.label || value

const getReferralName = (referral: ReferralRow) => {
  if (referral.accountType === 'company') {
    const contactName = `${referral.contactFirstName || ''} ${referral.contactLastName || ''}`.trim()
    return contactName || referral.companyName || '-'
  }
  const name = `${referral.firstName || ''} ${referral.lastName || ''}`.trim()
  return name || '-'
}

const getReferralEmail = (referral: ReferralRow) =>
  referral.accountType === 'company'
    ? referral.contactEmail || referral.email || ''
    : referral.email || referral.contactEmail || ''

const getReferralPhone = (referral: ReferralRow) =>
  referral.accountType === 'company'
    ? referral.contactPhone || referral.phone || ''
    : referral.phone || referral.contactPhone || ''

export default function AdminPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'affiliates' | 'referrals' | 'settings'>('affiliates')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const [resetAffiliateId, setResetAffiliateId] = useState<string | null>(null)
  const [resetAffiliatePassword, setResetAffiliatePassword] = useState('')
  const [resetAffiliateConfirm, setResetAffiliateConfirm] = useState('')
  const [deleteAffiliateId, setDeleteAffiliateId] = useState<string | null>(null)
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateRow | null>(null)
  const [selectedReferral, setSelectedReferral] = useState<ReferralRow | null>(null)
  const [documentEditingId, setDocumentEditingId] = useState<string | null>(null)
  const [documentDrafts, setDocumentDrafts] = useState<Record<string, any>>({})
  const [openShareDocumentId, setOpenShareDocumentId] = useState<string | null>(null)
  const [notificationEmails, setNotificationEmails] = useState<string[]>([
    'marketing@accessfinancial.com',
    '',
  ])
  const [templatesExpanded, setTemplatesExpanded] = useState<Record<string, boolean>>({})
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplateRow | null>(null)
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDescription, setNewTemplateDescription] = useState('')
  const [newTemplateSubject, setNewTemplateSubject] = useState('')
  const [newTemplateBody, setNewTemplateBody] = useState('')
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false)
  const [templatesSeeded, setTemplatesSeeded] = useState(false)
  const [templateDrafts, setTemplateDrafts] = useState<Record<string, any>>({})
  const [visibleColumns, setVisibleColumns] = useState({
    email: false,
    phone: false,
    accountType: false,
    companyName: false,
    notes: false,
  })
  const [draftVisibleColumns, setDraftVisibleColumns] = useState({
    email: false,
    phone: false,
    accountType: false,
    companyName: false,
    notes: false,
  })
  const [drafts, setDrafts] = useState<Record<string, any>>({})
  const [referralEditingId, setReferralEditingId] = useState<string | null>(null)
  const [showReferralFilters, setShowReferralFilters] = useState(false)
  const [referralExportMenuOpen, setReferralExportMenuOpen] = useState(false)
  const [visibleReferralColumns, setVisibleReferralColumns] = useState({
    email: false,
    phone: false,
    notes: false,
  })
  const [draftVisibleReferralColumns, setDraftVisibleReferralColumns] = useState({
    email: false,
    phone: false,
    notes: false,
  })
  const [referralDrafts, setReferralDrafts] = useState<Record<string, any>>({})
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const affiliateFilterRef = useRef<HTMLDivElement | null>(null)
  const affiliateExportRef = useRef<HTMLDivElement | null>(null)
  const referralFilterRef = useRef<HTMLDivElement | null>(null)
  const referralExportRef = useRef<HTMLDivElement | null>(null)
  const documentShareRef = useRef<HTMLDivElement | null>(null)
  const baseUrl = getBackendBaseUrl()

  const toggleTemplateExpanded = (id: string) => {
    setTemplatesExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  useEffect(() => {
    const token = Cookies.get('accessToken')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (adminMenuOpen && profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setAdminMenuOpen(false)
      }
      if (showFilters && affiliateFilterRef.current && !affiliateFilterRef.current.contains(target)) {
        setShowFilters(false)
      }
      if (exportMenuOpen && affiliateExportRef.current && !affiliateExportRef.current.contains(target)) {
        setExportMenuOpen(false)
      }
      if (showReferralFilters && referralFilterRef.current && !referralFilterRef.current.contains(target)) {
        setShowReferralFilters(false)
      }
      if (
        referralExportMenuOpen &&
        referralExportRef.current &&
        !referralExportRef.current.contains(target)
      ) {
        setReferralExportMenuOpen(false)
      }
      if (openShareDocumentId && documentShareRef.current && !documentShareRef.current.contains(target)) {
        setOpenShareDocumentId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [
    adminMenuOpen,
    exportMenuOpen,
    referralExportMenuOpen,
    showFilters,
    showReferralFilters,
    openShareDocumentId,
  ])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem('admin-affiliate-filters')
      if (saved) {
        const parsed = JSON.parse(saved)
        const next = {
          email: false,
          phone: false,
          accountType: false,
          companyName: false,
          notes: false,
          ...parsed,
        }
        setVisibleColumns(next)
        setDraftVisibleColumns(next)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem('admin-referral-filters')
      if (saved) {
        const parsed = JSON.parse(saved)
        const next = {
          email: false,
          phone: false,
          notes: false,
          ...parsed,
        }
        setVisibleReferralColumns(next)
        setDraftVisibleReferralColumns(next)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  const { data: affiliates, isLoading: affiliatesLoading } = useQuery({
    queryKey: ['admin-affiliates'],
    queryFn: async () => {
      const response = await api.get('/admin/affiliates')
      return response.data
    },
  })

  const { data: referrals, isLoading: referralsLoading } = useQuery({
    queryKey: ['admin-referrals'],
    queryFn: async () => {
      const response = await api.get('/referrals')
      return response.data
    },
  })

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['admin-documents'],
    queryFn: async () => {
      const response = await api.get('/documents/admin')
      return response.data
    },
  })

  const { data: settingsData } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await api.get('/settings')
      return response.data
    },
  })

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const response = await api.get('/email-templates')
      return response.data
    },
  })

  useEffect(() => {
    if (!affiliates) return
    const nextDrafts: Record<string, any> = {}
    affiliates.forEach((affiliate: AffiliateRow) => {
      nextDrafts[affiliate.id] = {
        status: affiliate.status,
        paymentTerm: affiliate.paymentTerm,
        rateType: affiliate.rateType,
        rateValue: affiliate.rateValue,
        currency: affiliate.currency || 'USD',
      }
    })
    setDrafts(nextDrafts)
  }, [affiliates])

  useEffect(() => {
    if (!referrals) return
    const nextDrafts: Record<string, any> = {}
    referrals.forEach((referral: ReferralRow) => {
      nextDrafts[referral.id] = {
        status: referral.status,
        paymentStatus: referral.paymentStatus,
        internalNotes: referral.internalNotes || '',
      }
    })
    setReferralDrafts(nextDrafts)
  }, [referrals])

  useEffect(() => {
    if (!documents) return
    const nextDrafts: Record<string, any> = {}
    documents.forEach((doc: DocumentRow) => {
      nextDrafts[doc.id] = {
        name: doc.name,
        type: doc.type,
        uploadedAt: formatInputDate(doc.uploadedAt),
        isHidden: Boolean(doc.isHidden),
      }
    })
    setDocumentDrafts(nextDrafts)
  }, [documents])

  useEffect(() => {
    if (!templates) return
    const nextDrafts: Record<string, any> = {}
    templates.forEach((template: EmailTemplateRow) => {
      nextDrafts[template.id] = {
        subject: template.subject,
        body: template.body,
        enabled: template.enabled,
      }
    })
    setTemplateDrafts(nextDrafts)
  }, [templates])

  useEffect(() => {
    if (!settingsData) return
    const emailsSetting = settingsData.find((setting: any) => setting.key === 'manager_notification_emails')
    if (emailsSetting?.value) {
      try {
        const parsed = JSON.parse(emailsSetting.value)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map((email: string) => email || '')
          const base = normalized.length >= 2 ? normalized : [...normalized, '', '']
          setNotificationEmails(base.slice(0, Math.max(base.length, 2)))
        }
      } catch {
        // ignore
      }
    } else {
      setNotificationEmails(['marketing@accessfinancial.com', ''])
    }
    const maintenanceSetting = settingsData.find((setting: any) => setting.key === 'maintenance_mode')
    setMaintenanceEnabled(maintenanceSetting?.value === 'true')
  }, [settingsData])

  const resetPasswordStrength = resetAffiliatePassword
    ? getPasswordStrength(resetAffiliatePassword)
    : null

  const updateAffiliateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.put(`/admin/affiliates/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] })
      toast.success('Affiliate updated successfully')
      setEditingId(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update affiliate')
    },
  })

  const deleteAffiliateMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/admin/affiliates/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] })
      toast.success('Affiliate deleted')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete affiliate')
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      return api.post(`/admin/affiliates/${id}/reset-password`, { newPassword })
    },
    onSuccess: () => {
      toast.success('Password updated')
      setResetAffiliateId(null)
      setResetAffiliatePassword('')
      setResetAffiliateConfirm('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update password')
    },
  })

  const blockMutation = useMutation({
    mutationFn: async ({ id, blocked }: { id: string; blocked: boolean }) => {
      return api.post(`/admin/affiliates/${id}/block`, { blocked })
    },
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] })
      toast.success(variables.blocked ? 'User blocked' : 'User unblocked')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update block status')
    },
  })


  const updateReferralMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.put(`/referrals/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-referrals'] })
      toast.success('Referral updated successfully')
      setReferralEditingId(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update referral')
    },
  })

  const deleteReferralMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/referrals/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-referrals'] })
      toast.success('Referral deleted')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete referral')
    },
  })

  const uploadDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] })
      toast.success('Document uploaded')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload document')
    },
  })

  const resolveDocumentLink = (doc: DocumentRow) => {
    if (doc.fileUrl.startsWith('http://') || doc.fileUrl.startsWith('https://')) {
      return doc.fileUrl
    }
    return `${baseUrl}/documents/${doc.id}/download`
  }

  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.put(`/documents/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] })
      toast.success('Document updated')
      setDocumentEditingId(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update document')
    },
  })

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/documents/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] })
      toast.success('Document deleted')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete document')
    },
  })

  const saveNotificationEmailsMutation = useMutation({
    mutationFn: async (emails: string[]) => {
      return api.put('/settings/manager_notification_emails', {
        value: JSON.stringify(emails),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      toast.success('Notification emails saved')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save emails')
    },
  })

  const saveMaintenanceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return api.put('/settings/maintenance_mode', {
        value: enabled ? 'true' : 'false',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      toast.success('Maintenance mode updated')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update maintenance mode')
    },
  })

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any; silent?: boolean }) => {
      return api.put(`/email-templates/${id}`, data)
    },
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      if (!variables?.silent) {
        toast.success('Template updated')
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update template')
    },
  })

  const createTemplateMutation = useMutation({
    mutationFn: async ({ data }: { data: any; silent?: boolean }) => {
      return api.post('/email-templates', data)
    },
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      if (!variables?.silent) {
        toast.success('Template created')
        setShowNewTemplateModal(false)
        setNewTemplateName('')
        setNewTemplateDescription('')
        setNewTemplateSubject('')
        setNewTemplateBody('')
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create template')
    },
  })

  useEffect(() => {
    if (!templates || templatesSeeded) return
    const existingNames = new Set((templates as EmailTemplateRow[]).map((t) => t.name))
    const defaults = [...templateGroups.manager, ...templateGroups.affiliate]
    const missing = defaults.filter((template) => !existingNames.has(template.name))
    if (missing.length === 0) {
      setTemplatesSeeded(true)
      return
    }
    missing.forEach((template) => {
      createTemplateMutation.mutate({
        data: {
          name: template.name,
          description: template.description,
          subject: template.subject,
          body: template.body,
          enabled: true,
          variables: availableTags,
        },
        silent: true,
      })
    })
    setTemplatesSeeded(true)
  }, [templates, templatesSeeded, createTemplateMutation])

  const handleDraftChange = (affiliateId: string, patch: any) => {
    setDrafts((prev) => ({
      ...prev,
      [affiliateId]: {
        ...prev[affiliateId],
        ...patch,
      },
    }))
  }

  const handleDocumentDraftChange = (docId: string, patch: any) => {
    setDocumentDrafts((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        ...patch,
      },
    }))
  }

  const handleTemplateDraftChange = (templateId: string, patch: any) => {
    setTemplateDrafts((prev) => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        ...patch,
      },
    }))
  }

  const handleUploadFiles = (fileList: FileList | File[]) => {
    Array.from(fileList).forEach((file) => {
      uploadDocumentMutation.mutate(file)
    })
  }

  const handleReferralDraftChange = (referralId: string, patch: any) => {
    setReferralDrafts((prev) => ({
      ...prev,
      [referralId]: {
        ...prev[referralId],
        ...patch,
      },
    }))
  }

  const documentRows: DocumentRow[] = useMemo(() => documents || [], [documents])
  const templateRows: EmailTemplateRow[] = useMemo(() => templates || [], [templates])

  const affiliateExportRows = useMemo<ExportRow[]>(() => {
    if (!affiliates) return []
    return affiliates.map((affiliate: AffiliateRow): ExportRow => ({
      'Affiliate ID': affiliate.affiliateNumber ?? '',
      Affiliate: `${affiliate.firstName} ${affiliate.lastName}`.trim(),
      'Date of Registration': formatDate(affiliate.createdAt),
      Status: labelFrom(affiliate.status, statusOptions),
      'Payment Term': labelFrom(affiliate.paymentTerm, paymentTermOptions),
      'Rate Type': labelFrom(affiliate.rateType, rateTypeOptions),
      Rate: affiliate.rateValue ?? 0,
      Currency: affiliate.currency || 'USD',
      Email: affiliate.user?.email || '',
      Phone: affiliate.phone || '',
      'Registration Type': affiliate.accountType === 'company' ? 'Company' : 'Individual',
      'Company Name': affiliate.companyName || '–',
    }))
  }, [affiliates])

  const referralExportRows = useMemo<ExportRow[]>(() => {
    if (!referrals) return []
    return referrals.map((referral: ReferralRow): ExportRow => ({
      'Referral Registration ID': referral.referralNumber ?? '',
      'Referral Name': getReferralName(referral),
      'Referral Registration Date': formatDate(referral.entryDate),
      Status: labelFrom(referral.status, referralStatusOptions),
      Affiliate: `${referral.affiliate?.firstName || ''} ${referral.affiliate?.lastName || ''}`.trim(),
      'Payment Status': labelFrom(referral.paymentStatus, paymentStatusOptions),
      Email: getReferralEmail(referral) || '',
      Phone: getReferralPhone(referral) || '',
      Notes: referral.internalNotes || '',
    }))
  }, [referrals])

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  const exportRowsToFile = (rows: ExportRow[], format: 'csv' | 'xlsx' | 'pdf', filename: string) => {
    if (!rows.length) {
      toast.error('No data to export')
      return
    }

    const headers = Object.keys(rows[0])
    if (format === 'csv') {
      const csv = [
        headers.join(','),
        ...rows.map((row: ExportRow) =>
          headers
            .map((header) => {
              const value = String(row[header] ?? '')
              return `"${value.replace(/"/g, '""')}"`
            })
            .join(',')
        ),
      ].join('\n')
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
      return
    }

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Export')
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      downloadBlob(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        filename
      )
      return
    }

    const doc = new jsPDF({ orientation: 'landscape' })
    autoTable(doc, {
      head: [headers],
      body: rows.map((row: ExportRow) =>
        headers.map((header) => String(row[header] ?? ''))
      ),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [33, 37, 41] },
    })
    doc.save(filename)
  }

  const handleAffiliateExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    const filename = format === 'csv' ? 'affiliates.csv' : format === 'xlsx' ? 'affiliates.xlsx' : 'affiliates.pdf'
    exportRowsToFile(affiliateExportRows, format, filename)
  }

  const handleReferralExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    const filename = format === 'csv' ? 'referrals.csv' : format === 'xlsx' ? 'referrals.xlsx' : 'referrals.pdf'
    exportRowsToFile(referralExportRows, format, filename)
  }

  const hasAffiliateExtraColumns =
    visibleColumns.email ||
    visibleColumns.phone ||
    visibleColumns.accountType ||
    visibleColumns.companyName ||
    visibleColumns.notes

  const hasReferralExtraColumns =
    visibleReferralColumns.email || visibleReferralColumns.phone || visibleReferralColumns.notes

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('affiliates')}
                className="flex items-center gap-3"
              >
                <Image
                  src="/af-logo-short-dark.svg"
                  alt="Access Financial"
                  width={88}
                  height={36}
                  className="h-8 w-auto"
                />
              </button>
              <h1 className="text-xl font-semibold">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setAdminMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                  <span>Welcome, Admin!</span>
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {adminMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
                    <button
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => router.push('/admin/account-settings')}
                    >
                      Account Settings
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  Cookies.remove('accessToken')
                  Cookies.remove('refreshToken')
                  router.push('/login')
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('affiliates')}
                className={`${
                  activeTab === 'affiliates'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Affiliates
              </button>
              <button
                onClick={() => setActiveTab('referrals')}
                className={`${
                  activeTab === 'referrals'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Referrals
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`${
                  activeTab === 'settings'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Settings
              </button>
            </nav>
          </div>

          {activeTab === 'affiliates' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Affiliates</h2>
                <div className="flex items-center gap-2">
                  <div className="relative" ref={affiliateFilterRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftVisibleColumns(visibleColumns)
                        setShowFilters((prev) => !prev)
                      }}
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:border-gray-300"
                    >
                      <span>Filters</span>
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4 text-gray-500"
                        aria-hidden="true"
                      >
                        <path d="M3 4h14v2H3V4zm2 5h10v2H5V9zm3 5h4v2H8v-2z" />
                      </svg>
                    </button>
                    {showFilters && (
                      <div className="absolute right-0 z-10 mt-2 w-64 rounded-md border border-gray-200 bg-white p-4 shadow-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">Additional fields</p>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { key: 'email', label: 'User email' },
                            { key: 'phone', label: 'Phone number' },
                            { key: 'accountType', label: 'Registration type' },
                            { key: 'companyName', label: 'Company name' },
                            { key: 'notes', label: 'Notes' },
                          ].map((field) => (
                            <label key={field.key} className="flex items-center gap-2 text-sm text-gray-600">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300"
                                checked={(draftVisibleColumns as any)[field.key]}
                                onChange={(event) =>
                                  setDraftVisibleColumns((prev) => ({
                                    ...prev,
                                    [field.key]: event.target.checked,
                                  }))
                                }
                              />
                              {field.label}
                            </label>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-gray-300"
                            onClick={() => {
                              const cleared = {
                                email: false,
                                phone: false,
                                accountType: false,
                                companyName: false,
                                notes: false,
                              }
                              setDraftVisibleColumns(cleared)
                              setVisibleColumns(cleared)
                              if (typeof window !== 'undefined') {
                                window.localStorage.setItem('admin-affiliate-filters', JSON.stringify(cleared))
                              }
                            }}
                          >
                            Clear All
                          </button>
                          <button
                            type="button"
                            className="rounded-md bg-[#2b36ff] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2330f0]"
                            onClick={() => {
                              setVisibleColumns(draftVisibleColumns)
                              setShowFilters(false)
                              if (typeof window !== 'undefined') {
                                window.localStorage.setItem(
                                  'admin-affiliate-filters',
                                  JSON.stringify(draftVisibleColumns)
                                )
                              }
                            }}
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative" ref={affiliateExportRef}>
                    <button
                      type="button"
                      onClick={() => setExportMenuOpen((prev) => !prev)}
                      className="inline-flex items-center gap-2 rounded-md bg-[#2b36ff] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2330f0]"
                    >
                      Export List
                    </button>
                    {exportMenuOpen && (
                      <div className="absolute right-0 z-10 mt-2 w-40 rounded-md border border-gray-200 bg-white shadow-lg">
                        <button
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            handleAffiliateExport('csv')
                            setExportMenuOpen(false)
                          }}
                        >
                          CSV
                        </button>
                        <button
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            handleAffiliateExport('xlsx')
                            setExportMenuOpen(false)
                          }}
                        >
                          Excel
                        </button>
                        <button
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            handleAffiliateExport('pdf')
                            setExportMenuOpen(false)
                          }}
                        >
                          PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>


              {affiliatesLoading ? (
                <div>Loading...</div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <div className="overflow-x-auto">
                    <table
                      className={`divide-y divide-gray-200 text-sm whitespace-nowrap ${
                        hasAffiliateExtraColumns ? 'min-w-max' : 'min-w-full'
                      }`}
                    >
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">#</th>
                          <th className="px-4 py-3 text-left font-semibold">Affiliate Name</th>
                          <th className="px-4 py-3 text-left font-semibold">Date of Registration</th>
                          <th className="px-4 py-3 text-left font-semibold">Status</th>
                          <th className="px-4 py-3 text-left font-semibold">Payment Term</th>
                          <th className="px-4 py-3 text-left font-semibold">Rate Type</th>
                          <th className="px-4 py-3 text-left font-semibold">Rate</th>
                          <th className="px-4 py-3 text-left font-semibold">Currency</th>
                          {visibleColumns.email && (
                            <th className="px-4 py-3 text-left font-semibold">Email</th>
                          )}
                          {visibleColumns.phone && (
                            <th className="px-4 py-3 text-left font-semibold">Phone</th>
                          )}
                          {visibleColumns.accountType && (
                            <th className="px-4 py-3 text-left font-semibold">Registration Type</th>
                          )}
                          {visibleColumns.companyName && (
                            <th className="px-4 py-3 text-left font-semibold">Company Name</th>
                          )}
                          {visibleColumns.notes && (
                            <th className="px-4 py-3 text-left font-semibold">Notes</th>
                          )}
                          <th className="px-4 py-3 text-left font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {affiliates?.map((affiliate: AffiliateRow, index: number) => {
                          const isEditing = editingId === affiliate.id
                          const draft = drafts[affiliate.id] || {}
                          const isBlocked = Boolean(affiliate.user?.isBlocked)
                          return (
                            <tr key={affiliate.id} className="text-gray-700">
                              <td className="px-4 py-3">{index + 1}</td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  className="text-left text-gray-700 hover:underline"
                                  onClick={() => setSelectedAffiliate(affiliate)}
                                >
                                  {affiliate.firstName} {affiliate.lastName}
                                </button>
                              </td>
                              <td className="px-4 py-3">{formatDate(affiliate.createdAt)}</td>
                              <td className="px-4 py-3">
                                <select
                                  value={draft.status || affiliate.status}
                                  disabled={!isEditing}
                                  onChange={(event) =>
                                    handleDraftChange(affiliate.id, { status: event.target.value })
                                  }
                                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm disabled:bg-gray-50"
                                >
                                  {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={draft.paymentTerm || affiliate.paymentTerm}
                                  disabled={!isEditing}
                                  onChange={(event) =>
                                    handleDraftChange(affiliate.id, { paymentTerm: event.target.value })
                                  }
                                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm disabled:bg-gray-50"
                                >
                                  {paymentTermOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={draft.rateType || affiliate.rateType}
                                  disabled={!isEditing}
                                  onChange={(event) =>
                                    handleDraftChange(affiliate.id, { rateType: event.target.value })
                                  }
                                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm disabled:bg-gray-50"
                                >
                                  {rateTypeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={draft.rateValue ?? affiliate.rateValue ?? 0}
                                  disabled={!isEditing}
                                  onChange={(event) =>
                                    handleDraftChange(affiliate.id, {
                                      rateValue: Number(event.target.value || 0),
                                    })
                                  }
                                  className="w-24 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm disabled:bg-gray-50"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={draft.currency || affiliate.currency || 'USD'}
                                  disabled={!isEditing}
                                  onChange={(event) =>
                                    handleDraftChange(affiliate.id, { currency: event.target.value })
                                  }
                                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm disabled:bg-gray-50"
                                >
                                  {currencyOptions.map((currency) => (
                                    <option key={currency} value={currency}>
                                      {currency}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              {visibleColumns.email && (
                                <td className="px-4 py-3">{affiliate.user?.email || '-'}</td>
                              )}
                              {visibleColumns.phone && (
                                <td className="px-4 py-3">{affiliate.phone || '-'}</td>
                              )}
                              {visibleColumns.accountType && (
                                <td className="px-4 py-3">
                                  {affiliate.accountType === 'company' ? 'Company' : 'Individual'}
                                </td>
                              )}
                              {visibleColumns.companyName && (
                                <td className="px-4 py-3">{affiliate.companyName || '–'}</td>
                              )}
                              {visibleColumns.notes && (
                                <td className="px-4 py-3">
                                  {isEditing ? (
                                    <textarea
                                      value={draft.internalNotes ?? affiliate.internalNotes ?? ''}
                                      onChange={(event) =>
                                        handleDraftChange(affiliate.id, { internalNotes: event.target.value })
                                      }
                                      rows={2}
                                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900"
                                    />
                                  ) : (
                                    affiliate.internalNotes || '-'
                                  )}
                                </td>
                              )}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {!isEditing ? (
                                    <button
                                      type="button"
                                      title="Edit"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:border-gray-300"
                                      onClick={() => setEditingId(affiliate.id)}
                                    >
                                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                        <path d="M4 13.5V16h2.5l7.373-7.373-2.5-2.5L4 13.5Zm11.854-7.646a.5.5 0 0 0 0-.708l-1-1a.5.5 0 0 0-.708 0l-1.02 1.02 2.5 2.5 1.228-1.228Z" />
                                      </svg>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      title="Save"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#2b36ff] text-white hover:bg-[#2330f0]"
                                      onClick={() =>
                                        updateAffiliateMutation.mutate({
                                          id: affiliate.id,
                                          data: draft,
                                        })
                                      }
                                    >
                                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                        <path d="M16.704 5.29 14.71 3.296A1 1 0 0 0 14.003 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-.296-.71ZM6 5h7v3H6V5Zm8 11H6v-5h8v5Z" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    title="Reset Password"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:border-gray-300"
                                    onClick={() => setResetAffiliateId(affiliate.id)}
                                  >
                                  <Image
                                    src="/reset-password.png"
                                    alt="Reset password"
                                    width={24}
                                    height={24}
                                    className="h-6 w-6"
                                  />
                                  </button>
                                  <button
                                    type="button"
                                    title={isBlocked ? 'Unblock' : 'Block'}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:border-gray-300"
                                    onClick={() =>
                                      blockMutation.mutate({
                                        id: affiliate.id,
                                        blocked: !isBlocked,
                                      })
                                    }
                                  >
                                    {isBlocked ? (
                                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                        <path d="M6 8V6a4 4 0 1 1 8 0h-2a2 2 0 1 0-4 0v2h6a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a1 1 0 0 1 1-1h2Z" />
                                      </svg>
                                    ) : (
                                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                        <path d="M10 2a4 4 0 0 0-4 4v2H5a1 1 0 0 0-1 1v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9a1 1 0 0 0-1-1h-1V6a4 4 0 0 0-4-4Zm2 6H8V6a2 2 0 1 1 4 0v2Z" />
                                      </svg>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    title="Delete"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:border-red-300"
                                    onClick={() => setDeleteAffiliateId(affiliate.id)}
                                  >
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                      <path d="M6 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1h3v2H3V4h3V3Zm1 5h2v7H7V8Zm4 0h2v7h-2V8Z" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'referrals' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Referrals</h2>
                <div className="flex items-center gap-2">
                  <div className="relative" ref={referralFilterRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftVisibleReferralColumns(visibleReferralColumns)
                        setShowReferralFilters((prev) => !prev)
                      }}
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:border-gray-300"
                    >
                      <span>Filters</span>
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4 text-gray-500"
                        aria-hidden="true"
                      >
                        <path d="M3 4h14v2H3V4zm2 5h10v2H5V9zm3 5h4v2H8v-2z" />
                      </svg>
                    </button>
                    {showReferralFilters && (
                      <div className="absolute right-0 z-10 mt-2 w-64 rounded-md border border-gray-200 bg-white p-4 shadow-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">Additional fields</p>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { key: 'email', label: 'Referral email' },
                            { key: 'phone', label: 'Telephone number' },
                            { key: 'notes', label: 'Notes' },
                          ].map((field) => (
                            <label key={field.key} className="flex items-center gap-2 text-sm text-gray-600">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300"
                                checked={(draftVisibleReferralColumns as any)[field.key]}
                                onChange={(event) =>
                                  setDraftVisibleReferralColumns((prev) => ({
                                    ...prev,
                                    [field.key]: event.target.checked,
                                  }))
                                }
                              />
                              {field.label}
                            </label>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-gray-300"
                            onClick={() => {
                              const cleared = { email: false, phone: false, notes: false }
                              setDraftVisibleReferralColumns(cleared)
                              setVisibleReferralColumns(cleared)
                              if (typeof window !== 'undefined') {
                                window.localStorage.setItem('admin-referral-filters', JSON.stringify(cleared))
                              }
                            }}
                          >
                            Clear All
                          </button>
                          <button
                            type="button"
                            className="rounded-md bg-[#2b36ff] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2330f0]"
                            onClick={() => {
                              setVisibleReferralColumns(draftVisibleReferralColumns)
                              setShowReferralFilters(false)
                              if (typeof window !== 'undefined') {
                                window.localStorage.setItem(
                                  'admin-referral-filters',
                                  JSON.stringify(draftVisibleReferralColumns)
                                )
                              }
                            }}
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative" ref={referralExportRef}>
                    <button
                      type="button"
                      onClick={() => setReferralExportMenuOpen((prev) => !prev)}
                      className="inline-flex items-center gap-2 rounded-md bg-[#2b36ff] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2330f0]"
                    >
                      Export List
                    </button>
                    {referralExportMenuOpen && (
                      <div className="absolute right-0 z-10 mt-2 w-40 rounded-md border border-gray-200 bg-white shadow-lg">
                        <button
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            handleReferralExport('csv')
                            setReferralExportMenuOpen(false)
                          }}
                        >
                          CSV
                        </button>
                        <button
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            handleReferralExport('xlsx')
                            setReferralExportMenuOpen(false)
                          }}
                        >
                          Excel
                        </button>
                        <button
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            handleReferralExport('pdf')
                            setReferralExportMenuOpen(false)
                          }}
                        >
                          PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {referralsLoading ? (
                <div>Loading...</div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <div className="overflow-x-auto">
                    <table
                      className={`divide-y divide-gray-200 text-sm whitespace-nowrap ${
                        hasReferralExtraColumns ? 'min-w-max' : 'min-w-full'
                      }`}
                    >
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">#</th>
                          <th className="px-4 py-3 text-left font-semibold">Referral Name</th>
                          <th className="px-4 py-3 text-left font-semibold">Referral Registration Date</th>
                          <th className="px-4 py-3 text-left font-semibold">Status</th>
                          <th className="px-4 py-3 text-left font-semibold">Affiliate</th>
                          <th className="px-4 py-3 text-left font-semibold">Payment Status</th>
                          {visibleReferralColumns.email && (
                            <th className="px-4 py-3 text-left font-semibold">Referral Email</th>
                          )}
                          {visibleReferralColumns.phone && (
                            <th className="px-4 py-3 text-left font-semibold">Telephone</th>
                          )}
                          {visibleReferralColumns.notes && (
                            <th className="px-4 py-3 text-left font-semibold">Notes</th>
                          )}
                          <th className="px-4 py-3 text-left font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {referrals?.map((referral: ReferralRow, index: number) => {
                          const isEditing = referralEditingId === referral.id
                          const draft = referralDrafts[referral.id] || {}
                          return (
                            <tr key={referral.id} className="text-gray-700">
                              <td className="px-4 py-3">{index + 1}</td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  className="text-left text-gray-700 hover:underline"
                                  onClick={() => setSelectedReferral(referral)}
                                >
                                  {getReferralName(referral)}
                                </button>
                              </td>
                              <td className="px-4 py-3">{formatDate(referral.entryDate)}</td>
                              <td className="px-4 py-3">
                                <select
                                  value={draft.status || referral.status}
                                  disabled={!isEditing}
                                  onChange={(event) =>
                                    handleReferralDraftChange(referral.id, { status: event.target.value })
                                  }
                                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm disabled:bg-gray-50"
                                >
                                  {referralStatusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                {referral.affiliate?.firstName} {referral.affiliate?.lastName}
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={draft.paymentStatus || referral.paymentStatus}
                                  disabled={!isEditing}
                                  onChange={(event) =>
                                    handleReferralDraftChange(referral.id, {
                                      paymentStatus: event.target.value,
                                    })
                                  }
                                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm disabled:bg-gray-50"
                                >
                                  {paymentStatusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              {visibleReferralColumns.email && (
                                <td className="px-4 py-3">{getReferralEmail(referral) || '-'}</td>
                              )}
                              {visibleReferralColumns.phone && (
                                <td className="px-4 py-3">{getReferralPhone(referral) || '-'}</td>
                              )}
                              {visibleReferralColumns.notes && (
                                <td className="px-4 py-3">
                                  {isEditing ? (
                                    <input
                                      value={draft.internalNotes ?? ''}
                                      onChange={(event) =>
                                        handleReferralDraftChange(referral.id, {
                                          internalNotes: event.target.value,
                                        })
                                      }
                                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm"
                                    />
                                  ) : (
                                    <span>{referral.internalNotes || '–'}</span>
                                  )}
                                </td>
                              )}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {!isEditing ? (
                                    <button
                                      type="button"
                                      title="Edit"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:border-gray-300"
                                      onClick={() => setReferralEditingId(referral.id)}
                                    >
                                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                        <path d="M4 13.5V16h2.5l7.373-7.373-2.5-2.5L4 13.5Zm11.854-7.646a.5.5 0 0 0 0-.708l-1-1a.5.5 0 0 0-.708 0l-1.02 1.02 2.5 2.5 1.228-1.228Z" />
                                      </svg>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      title="Save"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#2b36ff] text-white hover:bg-[#2330f0]"
                                      onClick={() =>
                                        updateReferralMutation.mutate({
                                          id: referral.id,
                                          data: {
                                            status: draft.status,
                                            paymentStatus: draft.paymentStatus,
                                            internalNotes: draft.internalNotes,
                                          },
                                        })
                                      }
                                    >
                                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                        <path d="M16.704 5.29 14.71 3.296A1 1 0 0 0 14.003 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-.296-.71ZM6 5h7v3H6V5Zm8 11H6v-5h8v5Z" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    title="Delete"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:border-red-300"
                                    onClick={() => {
                                      const confirmed = window.confirm(
                                        'Delete this referral? This will remove it from the list.'
                                      )
                                      if (confirmed) {
                                        deleteReferralMutation.mutate(referral.id)
                                      }
                                    }}
                                  >
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                      <path d="M6 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1h3v2H3V4h3V3Zm1 5h2v7H7V8Zm4 0h2v7h-2V8Z" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
              <section className="bg-white shadow rounded-lg p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
                  <p className="text-sm text-gray-500">
                    Drag & drop files here, or click to upload (PDF, Word, Excel, PNG, JPG up to 20 MB).
                  </p>
                </div>
                <label
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500 hover:border-gray-300 cursor-pointer"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    if (event.dataTransfer.files?.length) {
                      handleUploadFiles(event.dataTransfer.files)
                    }
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(event) => {
                      if (event.target.files?.length) {
                        handleUploadFiles(event.target.files)
                        event.target.value = ''
                      }
                    }}
                  />
                  <span className="font-medium text-gray-700">Click to upload</span>
                  <span className="text-xs text-gray-400 mt-2">or drag & drop</span>
                </label>

                {documentsLoading ? (
                  <div className="text-sm text-gray-500">Loading documents...</div>
                ) : (
                  <div className="overflow-x-auto overflow-y-visible">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Document Name</th>
                          <th className="px-4 py-3 text-left font-semibold">Date of Upload</th>
                          <th className="px-4 py-3 text-left font-semibold">Type</th>
                          <th className="px-4 py-3 text-left font-semibold">Status</th>
                          <th className="px-4 py-3 text-left font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {documentRows.map((doc) => {
                          const isEditing = documentEditingId === doc.id
                          const draft = documentDrafts[doc.id] || {}
                          const typeLabel =
                            documentTypeOptions.find((option) => option.value === doc.type)?.label ||
                            doc.type
                          const fileLink = resolveDocumentLink(doc)
                          const shareLinks = buildShareLinks(fileLink)
                          return (
                            <tr key={doc.id} className="text-gray-700">
                              <td className="px-4 py-3">
                                {isEditing ? (
                                  <input
                                    value={draft.name || ''}
                                    onChange={(event) =>
                                      handleDocumentDraftChange(doc.id, { name: event.target.value })
                                    }
                                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900"
                                  />
                                ) : (
                                  doc.name
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {isEditing ? (
                                  <input
                                    type="date"
                                    value={draft.uploadedAt || ''}
                                    onChange={(event) =>
                                      handleDocumentDraftChange(doc.id, { uploadedAt: event.target.value })
                                    }
                                    className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900"
                                  />
                                ) : (
                                  formatDate(doc.uploadedAt)
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {isEditing ? (
                                  <select
                                    value={draft.type || doc.type}
                                    onChange={(event) =>
                                      handleDocumentDraftChange(doc.id, { type: event.target.value })
                                    }
                                    className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                                  >
                                    {documentTypeOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  typeLabel
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {doc.isHidden ? (
                                  <span className="text-xs font-semibold text-gray-500">Hidden</span>
                                ) : (
                                  <span className="text-xs font-semibold text-green-600">Visible</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  {!isEditing ? (
                                    <button
                                      type="button"
                                      title="Edit"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:border-gray-300"
                                      onClick={() => setDocumentEditingId(doc.id)}
                                    >
                                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                        <path d="M4 13.5V16h2.5l7.373-7.373-2.5-2.5L4 13.5Zm11.854-7.646a.5.5 0 0 0 0-.708l-1-1a.5.5 0 0 0-.708 0l-1.02 1.02 2.5 2.5 1.228-1.228Z" />
                                      </svg>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      title="Save"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#2b36ff] text-white hover:bg-[#2330f0]"
                                      onClick={() =>
                                        updateDocumentMutation.mutate({
                                          id: doc.id,
                                          data: {
                                            name: draft.name,
                                            type: draft.type,
                                            uploadedAt: draft.uploadedAt || undefined,
                                          },
                                        })
                                      }
                                    >
                                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                        <path d="M16.704 5.29 14.71 3.296A1 1 0 0 0 14.003 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-.296-.71ZM6 5h7v3H6V5Zm8 11H6v-5h8v5Z" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    title={doc.isHidden ? 'Show' : 'Hide'}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:border-gray-300"
                                    onClick={() =>
                                      updateDocumentMutation.mutate({
                                        id: doc.id,
                                        data: { isHidden: !doc.isHidden },
                                      })
                                    }
                                  >
                                    {doc.isHidden ? (
                                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M3 4.5 21 19.5" />
                                        <path d="M10.58 10.58a2.5 2.5 0 0 0 3.54 3.54" />
                                        <path d="M6.3 6.3C3.7 8.4 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.5 0 2.9-.3 4.1-.8" />
                                        <path d="M14.12 5.7c-.7-.2-1.4-.2-2.1-.2 6 0 9.5 6.5 9.5 6.5a18 18 0 0 1-3 3.9" />
                                      </svg>
                                    ) : (
                                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
                                        <circle cx="12" cy="12" r="3.5" />
                                      </svg>
                                    )}
                                  </button>
                                  <a
                                    href={fileLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Download"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:border-gray-300"
                                  >
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                      <path d="M10 3a1 1 0 0 1 1 1v6.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4A1 1 0 0 1 6.707 8.293L9 10.586V4a1 1 0 0 1 1-1Z" />
                                      <path d="M4 14a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2H4v-2Z" />
                                    </svg>
                                  </a>
                                  <div className="relative" ref={documentShareRef}>
                                    <button
                                      type="button"
                                      title="Share"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:border-gray-300"
                                      onClick={() =>
                                        setOpenShareDocumentId((prev) => (prev === doc.id ? null : doc.id))
                                      }
                                    >
                                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                        <path d="M15 8a3 3 0 0 0-2.24 1.03L7.7 7.26a3 3 0 1 0 0 5.48l5.06-1.77A3 3 0 1 0 15 8Zm-8 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm8-2a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
                                      </svg>
                                    </button>
                                    {openShareDocumentId === doc.id && (
                                      <div className="absolute right-0 z-20 mt-2 w-44 rounded-md border border-gray-200 bg-white shadow-lg">
                                        {Object.entries(shareLinks).map(([label, link]) => (
                                          <a
                                            key={label}
                                            href={link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                          >
                                            {label}
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    title="Delete"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:border-red-300"
                                    onClick={() => deleteDocumentMutation.mutate(doc.id)}
                                  >
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                      <path d="M6 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1h3v2H3V4h3V3Zm1 5h2v7H7V8Zm4 0h2v7h-2V8Z" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="bg-white shadow rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Notification Emails</h2>
                <p className="text-sm text-gray-500">*The email address(es) to receive notifications.</p>
                <div className="space-y-3">
                  {notificationEmails.map((email, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        value={email}
                        onChange={(event) => {
                          const next = [...notificationEmails]
                          next[index] = event.target.value
                          setNotificationEmails(next)
                        }}
                        className="flex-1 rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-900"
                        placeholder={`Email ${index + 1}`}
                      />
                      {index >= 2 && (
                        <button
                          className="text-sm text-red-500"
                          onClick={() => {
                            const next = notificationEmails.filter((_, idx) => idx !== index)
                            setNotificationEmails(next)
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <button
                    className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
                    onClick={() => setNotificationEmails((prev) => [...prev, ''])}
                  >
                    Add More
                  </button>
                  <button
                    className="rounded-md bg-[#2b36ff] px-4 py-2 text-sm font-semibold text-white"
                    onClick={() => {
                      const cleaned = notificationEmails.filter((email, index) => {
                        if (index < 2) return true
                        return email.trim().length > 0
                      })
                      saveNotificationEmailsMutation.mutate(cleaned)
                      setNotificationEmails(cleaned.length >= 2 ? cleaned : [...cleaned, '', ''])
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </section>

              <section className="bg-white shadow rounded-lg p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Email Templates</h2>
                  <button
                    className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
                    onClick={() => setShowNewTemplateModal(true)}
                  >
                    Add a New Template
                  </button>
                </div>

                {templatesLoading ? (
                  <div className="text-sm text-gray-500">Loading templates...</div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Notifications sent to Portal Managers
                      </h3>
                      {templateGroups.manager.map((template) => {
                        const row = templateRows.find((item) => item.name === template.name)
                        if (!row) return null
                        const isOpen = Boolean(templatesExpanded[row.id])
                        const draft = templateDrafts[row.id] || {}
                        return (
                          <div
                            key={row.id}
                            className="rounded-md border border-gray-200 p-4"
                            onClick={() => toggleTemplateExpanded(row.id)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{row.name}</p>
                                <p className="text-xs text-gray-500">{row.description || template.description}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  className="text-sm text-gray-600"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    toggleTemplateExpanded(row.id)
                                  }}
                                >
                                  Configure
                                </button>
                                <label
                                  className="inline-flex items-center gap-2 text-sm text-gray-600"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={draft.enabled ?? row.enabled}
                                    onChange={(event) => {
                                      const nextEnabled = event.target.checked
                                      handleTemplateDraftChange(row.id, { enabled: nextEnabled })
                                      updateTemplateMutation.mutate({
                                        id: row.id,
                                        data: { enabled: nextEnabled },
                                        silent: true,
                                      })
                                    }}
                                  />
                                  {(draft.enabled ?? row.enabled) ? 'On' : 'Off'}
                                </label>
                              </div>
                            </div>
                            {isOpen && (
                              <div className="mt-4 space-y-3" onClick={(event) => event.stopPropagation()}>
                                <input
                                  value={draft.subject ?? row.subject}
                                  onChange={(event) =>
                                    handleTemplateDraftChange(row.id, { subject: event.target.value })
                                  }
                                  className="w-full rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-900"
                                />
                                <textarea
                                  value={draft.body ?? row.body}
                                  onChange={(event) =>
                                    handleTemplateDraftChange(row.id, { body: event.target.value })
                                  }
                                  rows={6}
                                  className="w-full rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-900"
                                />
                                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                  {availableTags.map((tag) => (
                                    <span key={tag} className="rounded-full bg-gray-100 px-2 py-1">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                                    onClick={() =>
                                      setPreviewTemplate({
                                        ...row,
                                        subject: draft.subject ?? row.subject,
                                        body: draft.body ?? row.body,
                                      })
                                    }
                                  >
                                    Preview
                                  </button>
                                  <button
                                    className="rounded-md bg-[#2b36ff] px-3 py-2 text-sm font-semibold text-white"
                                    onClick={() =>
                                      updateTemplateMutation.mutate({
                                        id: row.id,
                                        data: {
                                          subject: draft.subject ?? row.subject,
                                          body: draft.body ?? row.body,
                                          enabled: draft.enabled ?? row.enabled,
                                        },
                                      })
                                    }
                                  >
                                    Save Changes
                                  </button>
                                  <button
                                    className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                                    onClick={() =>
                                      setTemplatesExpanded((prev) => ({
                                        ...prev,
                                        [row.id]: false,
                                      }))
                                    }
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Notifications sent to Affiliates
                      </h3>
                      {templateGroups.affiliate.map((template) => {
                        const row = templateRows.find((item) => item.name === template.name)
                        if (!row) return null
                        const isOpen = Boolean(templatesExpanded[row.id])
                        const draft = templateDrafts[row.id] || {}
                        return (
                          <div
                            key={row.id}
                            className="rounded-md border border-gray-200 p-4"
                            onClick={() => toggleTemplateExpanded(row.id)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{row.name}</p>
                                <p className="text-xs text-gray-500">{row.description || template.description}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  className="text-sm text-gray-600"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    toggleTemplateExpanded(row.id)
                                  }}
                                >
                                  Configure
                                </button>
                                <label
                                  className="inline-flex items-center gap-2 text-sm text-gray-600"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={draft.enabled ?? row.enabled}
                                    onChange={(event) => {
                                      const nextEnabled = event.target.checked
                                      handleTemplateDraftChange(row.id, { enabled: nextEnabled })
                                      updateTemplateMutation.mutate({
                                        id: row.id,
                                        data: { enabled: nextEnabled },
                                        silent: true,
                                      })
                                    }}
                                  />
                                  {(draft.enabled ?? row.enabled) ? 'On' : 'Off'}
                                </label>
                              </div>
                            </div>
                            {isOpen && (
                              <div className="mt-4 space-y-3" onClick={(event) => event.stopPropagation()}>
                                <input
                                  value={draft.subject ?? row.subject}
                                  onChange={(event) =>
                                    handleTemplateDraftChange(row.id, { subject: event.target.value })
                                  }
                                  className="w-full rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-900"
                                />
                                <textarea
                                  value={draft.body ?? row.body}
                                  onChange={(event) =>
                                    handleTemplateDraftChange(row.id, { body: event.target.value })
                                  }
                                  rows={6}
                                  className="w-full rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-900"
                                />
                                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                  {availableTags.map((tag) => (
                                    <span key={tag} className="rounded-full bg-gray-100 px-2 py-1">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                                    onClick={() =>
                                      setPreviewTemplate({
                                        ...row,
                                        subject: draft.subject ?? row.subject,
                                        body: draft.body ?? row.body,
                                      })
                                    }
                                  >
                                    Preview
                                  </button>
                                  <button
                                    className="rounded-md bg-[#2b36ff] px-3 py-2 text-sm font-semibold text-white"
                                    onClick={() =>
                                      updateTemplateMutation.mutate({
                                        id: row.id,
                                        data: {
                                          subject: draft.subject ?? row.subject,
                                          body: draft.body ?? row.body,
                                          enabled: draft.enabled ?? row.enabled,
                                        },
                                      })
                                    }
                                  >
                                    Save Changes
                                  </button>
                                  <button
                                    className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                                    onClick={() =>
                                      setTemplatesExpanded((prev) => ({
                                        ...prev,
                                        [row.id]: false,
                                      }))
                                    }
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </section>

              <section className="bg-white shadow rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Affiliate Portal Maintenance Mode
                    </h2>
                    <p className="text-sm text-gray-500">
                      When enabled, users will see a maintenance message.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={maintenanceEnabled}
                    onClick={() => setMaintenanceEnabled((prev) => !prev)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                      maintenanceEnabled ? 'bg-[#2b36ff]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                        maintenanceEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <button
                  className="rounded-md bg-[#2b36ff] px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => saveMaintenanceMutation.mutate(maintenanceEnabled)}
                >
                  Save Changes
                </button>
              </section>
            </div>
          )}
        </div>
      </main>

      {resetAffiliateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
            <div className="mt-4 space-y-3">
              <input
                type="password"
                value={resetAffiliatePassword}
                onChange={(event) => setResetAffiliatePassword(event.target.value)}
                className="w-full rounded-md border border-gray-200 px-4 py-3 text-sm text-gray-900"
                placeholder="Enter New Password"
              />
              <input
                type="password"
                value={resetAffiliateConfirm}
                onChange={(event) => setResetAffiliateConfirm(event.target.value)}
                className="w-full rounded-md border border-gray-200 px-4 py-3 text-sm text-gray-900"
                placeholder="Repeat Password"
              />
              {resetPasswordStrength && (
                <p
                  className={`text-xs font-medium ${
                    resetPasswordStrength === 'Strong'
                      ? 'text-green-600'
                      : resetPasswordStrength === 'Medium'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  Strength: {resetPasswordStrength}
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
                onClick={() => setResetAffiliateId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-[#2b36ff] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => {
                  if (!resetAffiliatePassword) {
                    toast.error('Please enter a new password')
                    return
                  }
                  if (resetAffiliatePassword !== resetAffiliateConfirm) {
                    toast.error('Passwords do not match')
                    return
                  }
                  if (getPasswordStrength(resetAffiliatePassword) === 'Easy') {
                    toast.error('Password is too weak')
                    return
                  }
                  resetPasswordMutation.mutate({
                    id: resetAffiliateId,
                    newPassword: resetAffiliatePassword,
                  })
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteAffiliateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete Affiliate</h3>
            <p className="mt-3 text-sm text-gray-600">
              This will permanently delete the user and all related data, including referrals.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
                onClick={() => setDeleteAffiliateId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => {
                  deleteAffiliateMutation.mutate(deleteAffiliateId)
                  setDeleteAffiliateId(null)
                }}
              >
                Yes, I understand that. Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAffiliate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setSelectedAffiliate(null)}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Affiliate Details</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setSelectedAffiliate(null)}
              >
                ×
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700">
              <p><span className="font-semibold">Name:</span> {selectedAffiliate.firstName} {selectedAffiliate.lastName}</p>
              <p><span className="font-semibold">Email:</span> {selectedAffiliate.user?.email || '-'}</p>
              <p><span className="font-semibold">Phone:</span> {selectedAffiliate.phone || '-'}</p>
              <p><span className="font-semibold">Account Type:</span> {selectedAffiliate.accountType}</p>
              <p><span className="font-semibold">Company:</span> {selectedAffiliate.companyName || '-'}</p>
              <p><span className="font-semibold">Status:</span> {labelFrom(selectedAffiliate.status, statusOptions)}</p>
              <p><span className="font-semibold">Registered:</span> {formatDate(selectedAffiliate.createdAt)}</p>
            </div>
          </div>
        </div>
      )}

      {selectedReferral && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setSelectedReferral(null)}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Referral Details</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setSelectedReferral(null)}
              >
                ×
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700">
              <p><span className="font-semibold">Referral:</span> {getReferralName(selectedReferral)}</p>
              <p><span className="font-semibold">Affiliate:</span> {selectedReferral.affiliate?.firstName} {selectedReferral.affiliate?.lastName}</p>
              <p><span className="font-semibold">Email:</span> {getReferralEmail(selectedReferral) || '-'}</p>
              <p><span className="font-semibold">Phone:</span> {getReferralPhone(selectedReferral) || '-'}</p>
              <p><span className="font-semibold">Status:</span> {labelFrom(selectedReferral.status, referralStatusOptions)}</p>
              <p><span className="font-semibold">Payment Status:</span> {labelFrom(selectedReferral.paymentStatus, paymentStatusOptions)}</p>
              <p><span className="font-semibold">Date:</span> {formatDate(selectedReferral.entryDate)}</p>
              <p><span className="font-semibold">Notes:</span> {selectedReferral.internalNotes || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setPreviewTemplate(null)}
              >
                ×
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-500">Subject</p>
                <p className="text-sm text-gray-900">{previewTemplate.subject}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Message</p>
                <pre className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-800">
                  {previewTemplate.body}
                </pre>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
                onClick={() => setPreviewTemplate(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add a New Template</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowNewTemplateModal(false)}
              >
                ×
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <input
                value={newTemplateName}
                onChange={(event) => setNewTemplateName(event.target.value)}
                className="w-full rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-900"
                placeholder="Template Name"
              />
              <input
                value={newTemplateDescription}
                onChange={(event) => setNewTemplateDescription(event.target.value)}
                className="w-full rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-900"
                placeholder="Description"
              />
              <input
                value={newTemplateSubject}
                onChange={(event) => setNewTemplateSubject(event.target.value)}
                className="w-full rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-900"
                placeholder="Email Subject"
              />
              <textarea
                value={newTemplateBody}
                onChange={(event) => setNewTemplateBody(event.target.value)}
                rows={6}
                className="w-full rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-900"
                placeholder="Message"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
                onClick={() => setShowNewTemplateModal(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-[#2b36ff] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => {
                  if (!newTemplateName || !newTemplateSubject || !newTemplateBody) {
                    toast.error('Please fill in all required fields')
                    return
                  }
                  createTemplateMutation.mutate({
                    data: {
                      name: newTemplateName,
                      description: newTemplateDescription,
                      subject: newTemplateSubject,
                      body: newTemplateBody,
                      enabled: true,
                      variables: availableTags,
                    },
                  })
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
