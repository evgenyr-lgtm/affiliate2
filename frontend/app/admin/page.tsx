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

const currencyOptions = ['USD', 'EUR', 'GBP', 'RUB']

const formatDate = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-GB').format(date)
}

const labelFrom = (value: string, options: { value: string; label: string }[]) =>
  options.find((option) => option.value === value)?.label || value

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
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update referral')
    },
  })

  const handleReferralUpdate = (referralId: string, data: any) => {
    updateReferralMutation.mutate({ id: referralId, data })
  }

  const handleDraftChange = (affiliateId: string, patch: any) => {
    setDrafts((prev) => ({
      ...prev,
      [affiliateId]: {
        ...prev[affiliateId],
        ...patch,
      },
    }))
  }

  const exportRows = useMemo(() => {
    if (!affiliates) return []
    return affiliates.map((affiliate: AffiliateRow) => ({
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

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    if (!exportRows.length) {
      toast.error('No affiliates to export')
      return
    }

    const headers = Object.keys(exportRows[0])
    if (format === 'csv') {
      const csv = [
        headers.join(','),
        ...exportRows.map((row) =>
          headers
            .map((header) => {
              const value = String((row as any)[header] ?? '')
              return `"${value.replace(/"/g, '""')}"`
            })
            .join(',')
        ),
      ].join('\n')
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'affiliates.csv')
      return
    }

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(exportRows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Affiliates')
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      downloadBlob(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        'affiliates.xlsx'
      )
      return
    }

    const doc = new jsPDF({ orientation: 'landscape' })
    autoTable(doc, {
      head: [headers],
      body: exportRows.map((row) => headers.map((header) => String((row as any)[header] ?? ''))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [33, 37, 41] },
    })
    doc.save('affiliates.pdf')
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
                <h2 className="text-2xl font-bold">Affiliates</h2>
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
                            handleExport('csv')
                            setExportMenuOpen(false)
                          }}
                        >
                          CSV
                        </button>
                        <button
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            handleExport('xlsx')
                            setExportMenuOpen(false)
                          }}
                        >
                          Excel
                        </button>
                        <button
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            handleExport('pdf')
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
              <h2 className="text-2xl font-bold mb-4">Referrals</h2>
              {referralsLoading ? (
                <div>Loading...</div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {referrals?.map((referral: any) => (
                      <li key={referral.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {referral.firstName} {referral.lastName || referral.companyName}
                            </p>
                            <p className="text-sm text-gray-500">
                              Status: {referral.status} | Payment: {referral.paymentStatus}
                            </p>
                            <p className="text-sm text-gray-500">
                              Affiliate: {referral.affiliate?.firstName} {referral.affiliate?.lastName}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <select
                              value={referral.status}
                              onChange={(event) =>
                                handleReferralUpdate(referral.id, { status: event.target.value })
                              }
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                            <select
                              value={referral.paymentStatus}
                              onChange={(event) =>
                                handleReferralUpdate(referral.id, { paymentStatus: event.target.value })
                              }
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="unpaid">Unpaid</option>
                              <option value="paid">Paid</option>
                            </select>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Settings</h2>
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
