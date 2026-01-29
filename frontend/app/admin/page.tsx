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
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false)
  const [adminPasswordCurrent, setAdminPasswordCurrent] = useState('')
  const [adminPasswordNext, setAdminPasswordNext] = useState('')
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('')
  const [resetAffiliateId, setResetAffiliateId] = useState<string | null>(null)
  const [resetAffiliatePassword, setResetAffiliatePassword] = useState('')
  const [resetAffiliateConfirm, setResetAffiliateConfirm] = useState('')
  const [deleteAffiliateId, setDeleteAffiliateId] = useState<string | null>(null)
  const [visibleColumns, setVisibleColumns] = useState({
    email: false,
    phone: false,
    accountType: false,
    companyName: false,
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
  const [referralDrafts, setReferralDrafts] = useState<Record<string, any>>({})
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const affiliateFilterRef = useRef<HTMLDivElement | null>(null)
  const affiliateExportRef = useRef<HTMLDivElement | null>(null)
  const referralFilterRef = useRef<HTMLDivElement | null>(null)
  const referralExportRef = useRef<HTMLDivElement | null>(null)

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
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [adminMenuOpen, exportMenuOpen, referralExportMenuOpen, showFilters, showReferralFilters])

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

  const adminPasswordStrength = adminPasswordNext
    ? getPasswordStrength(adminPasswordNext)
    : null
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

  const adminChangePasswordMutation = useMutation({
    mutationFn: async (data: { oldPassword: string; newPassword: string }) => {
      return api.post('/auth/change-password', data)
    },
    onSuccess: () => {
      toast.success('Password updated')
      setShowAdminPasswordModal(false)
      setAdminPasswordCurrent('')
      setAdminPasswordNext('')
      setAdminPasswordConfirm('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update password')
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

  const handleDraftChange = (affiliateId: string, patch: any) => {
    setDrafts((prev) => ({
      ...prev,
      [affiliateId]: {
        ...prev[affiliateId],
        ...patch,
      },
    }))
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
                      onClick={() => {
                        setAdminMenuOpen(false)
                        setShowAdminPasswordModal(true)
                      }}
                    >
                      Change Password
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
                      onClick={() => setShowFilters((prev) => !prev)}
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
                          ].map((field) => (
                            <label key={field.key} className="flex items-center gap-2 text-sm text-gray-600">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300"
                                checked={(visibleColumns as any)[field.key]}
                                onChange={(event) =>
                                  setVisibleColumns((prev) => ({
                                    ...prev,
                                    [field.key]: event.target.checked,
                                  }))
                                }
                              />
                              {field.label}
                            </label>
                          ))}
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
                  <div className="overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
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
                                {affiliate.firstName} {affiliate.lastName}
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
                                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm disabled:bg-gray-50"
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
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                      <path d="M10 2a4 4 0 0 0-4 4v2H5a1 1 0 0 0-1 1v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9a1 1 0 0 0-1-1h-1V6a4 4 0 0 0-4-4Zm2 6H8V6a2 2 0 1 1 4 0v2Z" />
                                    </svg>
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
                      onClick={() => setShowReferralFilters((prev) => !prev)}
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
                                checked={(visibleReferralColumns as any)[field.key]}
                                onChange={(event) =>
                                  setVisibleReferralColumns((prev) => ({
                                    ...prev,
                                    [field.key]: event.target.checked,
                                  }))
                                }
                              />
                              {field.label}
                            </label>
                          ))}
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
                  <div className="overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
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
                              <td className="px-4 py-3">{getReferralName(referral)}</td>
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
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-600">Settings management coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {showAdminPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
            <div className="mt-4 space-y-3">
              <input
                type="password"
                value={adminPasswordCurrent}
                onChange={(event) => setAdminPasswordCurrent(event.target.value)}
                className="w-full rounded-md border border-gray-200 px-4 py-3 text-sm text-gray-900"
                placeholder="Current Password"
              />
              <input
                type="password"
                value={adminPasswordNext}
                onChange={(event) => setAdminPasswordNext(event.target.value)}
                className="w-full rounded-md border border-gray-200 px-4 py-3 text-sm text-gray-900"
                placeholder="New Password"
              />
              <input
                type="password"
                value={adminPasswordConfirm}
                onChange={(event) => setAdminPasswordConfirm(event.target.value)}
                className="w-full rounded-md border border-gray-200 px-4 py-3 text-sm text-gray-900"
                placeholder="Repeat Password"
              />
              {adminPasswordStrength && (
                <p
                  className={`text-xs font-medium ${
                    adminPasswordStrength === 'Strong'
                      ? 'text-green-600'
                      : adminPasswordStrength === 'Medium'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  Strength: {adminPasswordStrength}
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
                onClick={() => setShowAdminPasswordModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-[#2b36ff] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => {
                  if (!adminPasswordCurrent || !adminPasswordNext) {
                    toast.error('Please fill in all password fields')
                    return
                  }
                  if (adminPasswordNext !== adminPasswordConfirm) {
                    toast.error('Passwords do not match')
                    return
                  }
                  if (getPasswordStrength(adminPasswordNext) === 'Easy') {
                    toast.error('Password is too weak')
                    return
                  }
                  adminChangePasswordMutation.mutate({
                    oldPassword: adminPasswordCurrent,
                    newPassword: adminPasswordNext,
                  })
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}
