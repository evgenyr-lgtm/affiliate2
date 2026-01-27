'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

  useEffect(() => {
    const token = Cookies.get('accessToken')
    if (!token) {
      router.push('/login')
    }
  }, [router])

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
    mutationFn: async (id: string) => {
      return api.post(`/admin/affiliates/${id}/reset-password`)
    },
    onSuccess: () => {
      toast.success('Password reset email sent')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send reset email')
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
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
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
                  <div className="relative">
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

              {showFilters && (
                <div className="mb-4 rounded-md border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Additional fields
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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

              {affiliatesLoading ? (
                <div>Loading...</div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <div className="overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Affiliate ID</th>
                          <th className="px-4 py-3 text-left font-semibold">Affiliate</th>
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
                        {affiliates?.map((affiliate: AffiliateRow) => {
                          const isEditing = editingId === affiliate.id
                          const draft = drafts[affiliate.id] || {}
                          const isBlocked = Boolean(affiliate.user?.isBlocked)
                          return (
                            <tr key={affiliate.id} className="text-gray-700">
                              <td className="px-4 py-3">{affiliate.affiliateNumber ?? '-'}</td>
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
                                <div className="flex flex-wrap gap-2">
                                  {!isEditing ? (
                                    <button
                                      className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:border-gray-300"
                                      onClick={() => setEditingId(affiliate.id)}
                                    >
                                      Edit
                                    </button>
                                  ) : (
                                    <button
                                      className="rounded-md bg-[#2b36ff] px-3 py-1 text-xs font-semibold text-white hover:bg-[#2330f0]"
                                      onClick={() =>
                                        updateAffiliateMutation.mutate({
                                          id: affiliate.id,
                                          data: draft,
                                        })
                                      }
                                    >
                                      Save
                                    </button>
                                  )}
                                  <button
                                    className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:border-gray-300"
                                    onClick={() => resetPasswordMutation.mutate(affiliate.id)}
                                  >
                                    Reset Password
                                  </button>
                                  <button
                                    className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:border-gray-300"
                                    onClick={() =>
                                      blockMutation.mutate({
                                        id: affiliate.id,
                                        blocked: !isBlocked,
                                      })
                                    }
                                  >
                                    {isBlocked ? 'Unblock' : 'Block'}
                                  </button>
                                  <button
                                    className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:border-red-300"
                                    onClick={() => {
                                      const confirmed = window.confirm(
                                        'Delete this affiliate? This will block their access.'
                                      )
                                      if (confirmed) {
                                        deleteAffiliateMutation.mutate(affiliate.id)
                                      }
                                    }}
                                  >
                                    Delete
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
                  <div className="relative">
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

              {showReferralFilters && (
                <div className="mb-4 rounded-md border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Additional fields
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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

              {referralsLoading ? (
                <div>Loading...</div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <div className="overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Referral Registration ID</th>
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
                        {referrals?.map((referral: ReferralRow) => {
                          const isEditing = referralEditingId === referral.id
                          const draft = referralDrafts[referral.id] || {}
                          return (
                            <tr key={referral.id} className="text-gray-700">
                              <td className="px-4 py-3">{referral.referralNumber ?? '-'}</td>
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
                                <div className="flex flex-wrap gap-2">
                                  {!isEditing ? (
                                    <button
                                      className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:border-gray-300"
                                      onClick={() => setReferralEditingId(referral.id)}
                                    >
                                      Edit
                                    </button>
                                  ) : (
                                    <button
                                      className="rounded-md bg-[#2b36ff] px-3 py-1 text-xs font-semibold text-white hover:bg-[#2330f0]"
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
                                      Save
                                    </button>
                                  )}
                                  <button
                                    className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:border-red-300"
                                    onClick={() => {
                                      const confirmed = window.confirm(
                                        'Delete this referral? This will remove it from the list.'
                                      )
                                      if (confirmed) {
                                        deleteReferralMutation.mutate(referral.id)
                                      }
                                    }}
                                  >
                                    Delete
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
    </div>
  )
}
