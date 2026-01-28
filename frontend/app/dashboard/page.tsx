'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Cookies from 'js-cookie'
import Image from 'next/image'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type ReferralRow = {
  id: string
  accountType: 'individual' | 'company'
  status: 'pending' | 'approved' | 'rejected'
  paymentStatus: 'unpaid' | 'paid' | 'rejected'
  entryDate?: string
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone?: string
  contactFirstName?: string
  contactLastName?: string
  contactEmail?: string
  contactPhone?: string
  internalNotes?: string
}

type AffiliateData = {
  firstName?: string
  lastName?: string
  email?: string
  companyName?: string
  jobTitle?: string
  phone?: string
  avatar?: string
  rateType?: 'percent' | 'fixed'
  rateValue?: number
  paymentTerm?: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
}

type ExportRow = Record<string, string | number>

const formatDate = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-GB').format(date)
}

const labelFrom = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : '-'

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

const getBackendBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
  return apiUrl.replace(/\/api\/?$/, '')
}

export default function DashboardPage() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [referralType, setReferralType] = useState<'individual' | 'company'>('individual')
  const [showFilters, setShowFilters] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    email: false,
    phone: false,
    companyName: false,
  })

  useEffect(() => {
    const token = Cookies.get('accessToken')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const dashboardRes = await api.get('/affiliate/dashboard')
      return dashboardRes.data
    },
  })

  const affiliateData: AffiliateData = useMemo(() => data?.affiliate || {}, [data])
  const referralRows: ReferralRow[] = useMemo(() => data?.referrals || [], [data])
  const stats = data?.stats || {}

  const exportRows = useMemo<ExportRow[]>(() => {
    return referralRows.map((referral, index) => ({
      'Referral Registration ID': index + 1,
      'Referral Name': getReferralName(referral),
      Status: labelFrom(referral.status),
      'Payment Term': labelFrom(affiliateData.paymentTerm || ''),
      'Rate Type': labelFrom(affiliateData.rateType || ''),
      Rate: affiliateData.rateValue ?? 0,
      'Payment Status': labelFrom(referral.paymentStatus),
      'Date of Registration': formatDate(referral.entryDate),
      Email: getReferralEmail(referral) || '',
      Phone: getReferralPhone(referral) || '',
      'Company Name': referral.companyName || '',
    }))
  }, [referralRows, affiliateData])

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

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
    if (!exportRows.length) return
    const headers = Object.keys(exportRows[0])
    if (format === 'csv') {
      const csv = [
        headers.join(','),
        ...exportRows.map((row) =>
          headers
            .map((header) => {
              const value = String(row[header] ?? '')
              return `"${value.replace(/"/g, '""')}"`
            })
            .join(',')
        ),
      ].join('\n')
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'referrals.csv')
      return
    }

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(exportRows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Referrals')
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      downloadBlob(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        'referrals.xlsx'
      )
      return
    }

    const doc = new jsPDF({ orientation: 'landscape' })
    autoTable(doc, {
      head: [headers],
      body: exportRows.map((row) => headers.map((header) => String(row[header] ?? ''))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [33, 37, 41] },
    })
    doc.save('referrals.pdf')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-3"
            >
              <Image
                src="/af-logo-short-dark.svg"
                alt="Access Financial"
                width={96}
                height={40}
                className="h-8 w-auto"
              />
            </button>
            <button
              type="button"
              onClick={() => router.push('/marketing-materials')}
              className="hidden md:flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 6a2 2 0 0 1 2-2h10a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H8a4 4 0 0 1-4-4V6Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path d="M8 4v12a2 2 0 0 0 2 2h10" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Marketing Materials
            </button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700"
                >
                  {affiliateData.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${getBackendBaseUrl()}${affiliateData.avatar}`}
                      alt="Profile"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                  )}
                  <span>Welcome, {affiliateData.firstName || 'Affiliate'}!</span>
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-40 rounded-md border border-gray-200 bg-white shadow-lg">
                    <button
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => router.push('/settings')}
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
        <div className="px-4 py-6 sm:px-0 space-y-10">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Referrals', value: stats?.total || 0 },
                { label: 'Pending', value: stats?.pending || 0 },
                { label: 'Approved', value: stats?.approved || 0 },
                { label: 'Paid', value: stats?.paid || 0 },
              ].map((card) => (
                <div key={card.label} className="bg-white p-6 rounded-lg shadow">
                  <p className="text-sm text-gray-600">{card.label}</p>
                  <p className="text-3xl font-semibold text-gray-900">{card.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Manual Referral Entry Form</h2>
            <div className="flex items-center gap-3 text-sm text-gray-500 mb-6">
              <span className={`font-semibold ${step === 1 ? 'text-gray-900' : ''}`}>Step 1</span>
              <span>Choose who you want to refer</span>
              <span className="text-gray-300">|</span>
              <span className={`font-semibold ${step === 2 ? 'text-gray-900' : ''}`}>Step 2</span>
              <span>Enter your referral’s information</span>
            </div>

            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: 'individual', label: 'Individual' },
                  { value: 'company', label: 'Company' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setReferralType(option.value as 'individual' | 'company')}
                    className={`rounded-lg border px-6 py-4 text-left ${
                      referralType === option.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    <p className="text-sm font-semibold">{option.label}</p>
                    <p className="text-xs text-gray-500">Click to select</p>
                  </button>
                ))}
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-full bg-[#2b36ff] px-6 py-2 text-sm font-semibold text-white shadow"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Affiliate Name</label>
                    <input
                      readOnly
                      value={`${affiliateData.firstName || ''} ${affiliateData.lastName || ''}`.trim()}
                      className="mt-2 w-full rounded-full border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Affiliate Email</label>
                    <input
                      readOnly
                      value={affiliateData.email || ''}
                      className="mt-2 w-full rounded-full border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-700"
                    />
                  </div>
                </div>

                {referralType === 'individual' ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-800">Referral Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input className="rounded-full border border-gray-200 px-4 py-3 text-sm" placeholder="First Name*" />
                      <input className="rounded-full border border-gray-200 px-4 py-3 text-sm" placeholder="Last Name" />
                      <input className="rounded-full border border-gray-200 px-4 py-3 text-sm" placeholder="Email*" />
                      <input className="rounded-full border border-gray-200 px-4 py-3 text-sm" placeholder="Phone" />
                      <input className="rounded-full border border-gray-200 px-4 py-3 text-sm" placeholder="Contract duration (if known)" />
                      <input className="rounded-full border border-gray-200 px-4 py-3 text-sm" placeholder="Work country (if known)" />
                      <input className="rounded-full border border-gray-200 px-4 py-3 text-sm" placeholder="Nationality (if known)" />
                      <input className="rounded-full border border-gray-200 px-4 py-3 text-sm" placeholder="Marital status (if known)" />
                    </div>
                    <textarea className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm" rows={4} placeholder="Additional information" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-800">Referral Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input className="rounded-full border border-gray-200 px-4 py-3 text-sm" placeholder="Company Name" />
                      <input className="rounded-full border border-gray-200 px-4 py-3 text-sm" placeholder="Country" />
                      <input className="rounded-full border border-gray-200 px-4 py-3 text-sm" placeholder="First Name*" />
                      <input className="rounded-full border border-gray-200 px-4 py-3 text-sm" placeholder="Last Name" />
                      <input className="rounded-full border border-gray-200 px-4 py-3 text-sm" placeholder="Job title" />
                      <input className="rounded-full border border-gray-200 px-4 py-3 text-sm" placeholder="Email*" />
                      <input className="rounded-full border border-gray-200 px-4 py-3 text-sm" placeholder="Phone" />
                      <input className="rounded-full border border-gray-200 px-4 py-3 text-sm" placeholder="LinkedIn profile (if known)" />
                    </div>
                    <textarea className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm" rows={4} placeholder="Additional information" />
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-full border border-gray-200 px-6 py-2 text-sm font-semibold text-gray-700"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled
                    className="rounded-full bg-gray-300 px-6 py-2 text-sm font-semibold text-white"
                  >
                    Send Referral
                  </button>
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Referrals</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:border-gray-300"
                >
                  <span>Filters</span>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-500">
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
                      {(['csv', 'xlsx', 'pdf'] as const).map((format) => (
                        <button
                          key={format}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            handleExport(format)
                            setExportMenuOpen(false)
                          }}
                        >
                          {format.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="mb-4 rounded-md border border-gray-200 bg-white p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Additional fields</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { key: 'email', label: 'Referral email' },
                    { key: 'phone', label: 'Phone number' },
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

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="overflow-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">#</th>
                      <th className="px-4 py-3 text-left font-semibold">Referral Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Payment Term</th>
                      <th className="px-4 py-3 text-left font-semibold">Rate Type</th>
                      <th className="px-4 py-3 text-left font-semibold">Rate</th>
                      <th className="px-4 py-3 text-left font-semibold">Payment Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Date of Registration</th>
                      {visibleColumns.email && (
                        <th className="px-4 py-3 text-left font-semibold">Referral Email</th>
                      )}
                      {visibleColumns.phone && (
                        <th className="px-4 py-3 text-left font-semibold">Phone</th>
                      )}
                      {visibleColumns.companyName && (
                        <th className="px-4 py-3 text-left font-semibold">Company Name</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {referralRows.map((referral, index) => (
                      <tr key={referral.id} className="text-gray-700">
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3">{getReferralName(referral)}</td>
                        <td className="px-4 py-3">{labelFrom(referral.status)}</td>
                        <td className="px-4 py-3">{labelFrom(affiliateData.paymentTerm || '')}</td>
                        <td className="px-4 py-3">{labelFrom(affiliateData.rateType || '')}</td>
                        <td className="px-4 py-3">{affiliateData.rateValue ?? 0}</td>
                        <td className="px-4 py-3">{labelFrom(referral.paymentStatus)}</td>
                        <td className="px-4 py-3">{formatDate(referral.entryDate)}</td>
                        {visibleColumns.email && (
                          <td className="px-4 py-3">{getReferralEmail(referral) || '-'}</td>
                        )}
                        {visibleColumns.phone && (
                          <td className="px-4 py-3">{getReferralPhone(referral) || '-'}</td>
                        )}
                        {visibleColumns.companyName && (
                          <td className="px-4 py-3">{referral.companyName || '-'}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
