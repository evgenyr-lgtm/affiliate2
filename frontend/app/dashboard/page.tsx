'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import Cookies from 'js-cookie'
import Image from 'next/image'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import toast from 'react-hot-toast'
import { phoneCountries } from '@/lib/phoneCountries'
import PhoneCountrySelect from '@/components/PhoneCountrySelect'

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
  currency?: string
}

type ExportRow = Record<string, string | number>

const formatDate = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-GB').format(date)
}

const formatDateDisplay = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
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

const findCountryByCode = (code?: string) => {
  const trimmed = String(code || '').toUpperCase()
  return phoneCountries.find((item) => item.code === trimmed)
}

const getBackendBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
  return apiUrl.replace(/\/api\/?$/, '')
}

export default function DashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
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
  const [draftVisibleColumns, setDraftVisibleColumns] = useState({
    email: false,
    phone: false,
    companyName: false,
  })
  const [referralForm, setReferralForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    contractDuration: '',
    workCountry: '',
    nationality: '',
    maritalStatus: '',
    notes: '',
    companyName: '',
    country: '',
    contactFirstName: '',
    contactLastName: '',
    contactEmail: '',
    contactPhone: '',
    jobTitle: '',
    linkedin: '',
  })
  const [contractStart, setContractStart] = useState('')
  const [contractEnd, setContractEnd] = useState('')
  const [referralPhoneCountry, setReferralPhoneCountry] = useState(
    phoneCountries.find((item) => item.code === 'US') || phoneCountries[0]
  )
  const [contactPhoneCountry, setContactPhoneCountry] = useState(
    phoneCountries.find((item) => item.code === 'US') || phoneCountries[0]
  )
  const [referralPhoneNumber, setReferralPhoneNumber] = useState('')
  const [contactPhoneNumber, setContactPhoneNumber] = useState('')
  const [hasSelectedReferralCountry, setHasSelectedReferralCountry] = useState(false)
  const [hasSelectedContactCountry, setHasSelectedContactCountry] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const exportMenuRef = useRef<HTMLDivElement | null>(null)
  const filterMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const token = Cookies.get('accessToken')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (menuOpen && profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setMenuOpen(false)
      }
      if (exportMenuOpen && exportMenuRef.current && !exportMenuRef.current.contains(target)) {
        setExportMenuOpen(false)
      }
      if (showFilters && filterMenuRef.current && !filterMenuRef.current.contains(target)) {
        setShowFilters(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen, exportMenuOpen, showFilters])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem('affiliate-referral-filters')
      if (saved) {
        const parsed = JSON.parse(saved)
        const next = {
          email: false,
          phone: false,
          companyName: false,
          ...parsed,
        }
        setVisibleColumns(next)
        setDraftVisibleColumns(next)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const dashboardRes = await api.get('/affiliate/dashboard')
      return dashboardRes.data
    },
  })

  const affiliateData: AffiliateData = useMemo(() => data?.affiliate || {}, [data])
  const affiliateEmail = affiliateData.email || data?.user?.email || ''
  const referralRows: ReferralRow[] = useMemo(() => data?.referrals || [], [data])
  const stats = data?.stats || {}

  useEffect(() => {
    let active = true
    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/')
        if (!response.ok) return
        const data = await response.json()
        const match = findCountryByCode(data?.country_code)
        if (!active || !match) return
        if (!hasSelectedReferralCountry) {
          setReferralPhoneCountry(match)
        }
        if (!hasSelectedContactCountry) {
          setContactPhoneCountry(match)
        }
      } catch (error) {
        // ignore geolocation failures
      }
    }

    detectCountry()
    return () => {
      active = false
    }
  }, [hasSelectedReferralCountry, hasSelectedContactCountry])

  useEffect(() => {
    const nextDuration = [contractStart, contractEnd].filter(Boolean).join(' - ')
    setReferralForm((prev) => ({ ...prev, contractDuration: nextDuration }))
  }, [contractStart, contractEnd])

  useEffect(() => {
    const trimmed = referralPhoneNumber.trim()
    setReferralForm((prev) => ({
      ...prev,
      phone: trimmed ? `${referralPhoneCountry.dial} ${trimmed}` : '',
    }))
  }, [referralPhoneCountry, referralPhoneNumber])

  useEffect(() => {
    const trimmed = contactPhoneNumber.trim()
    setReferralForm((prev) => ({
      ...prev,
      contactPhone: trimmed ? `${contactPhoneCountry.dial} ${trimmed}` : '',
    }))
  }, [contactPhoneCountry, contactPhoneNumber])

  const exportRows = useMemo<ExportRow[]>(() => {
    return referralRows.map((referral, index) => ({
      'Referral Registration ID': index + 1,
      'Referral Name': getReferralName(referral),
      Status: labelFrom(referral.status),
      'Payment Term': labelFrom(affiliateData.paymentTerm || ''),
      'Rate Type': labelFrom(affiliateData.rateType || ''),
      Rate: affiliateData.rateValue ?? 0,
      Currency: affiliateData.currency || 'USD',
      'Payment Status': labelFrom(referral.paymentStatus),
      'Date of Registration': formatDate(referral.entryDate),
      Email: getReferralEmail(referral) || '',
      Phone: getReferralPhone(referral) || '',
      'Company Name': referral.companyName || '',
    }))
  }, [referralRows, affiliateData])

  const manualReferralMutation = useMutation({
    mutationFn: async () => {
      const payload =
        referralType === 'individual'
          ? {
              accountType: 'individual',
              firstName: referralForm.firstName,
              lastName: referralForm.lastName || undefined,
              email: referralForm.email,
              phone: referralForm.phone || undefined,
              contractDuration: referralForm.contractDuration || undefined,
              workCountry: referralForm.workCountry || undefined,
              nationality: referralForm.nationality || undefined,
              maritalStatus: referralForm.maritalStatus || undefined,
              notes: referralForm.notes || undefined,
            }
          : {
              accountType: 'company',
              companyName: referralForm.companyName || undefined,
              country: referralForm.country || undefined,
              contactFirstName: referralForm.contactFirstName,
              contactLastName: referralForm.contactLastName || undefined,
              contactEmail: referralForm.contactEmail,
              contactPhone: referralForm.contactPhone || undefined,
              jobTitle: referralForm.jobTitle || undefined,
              linkedin: referralForm.linkedin || undefined,
              notes: referralForm.notes || undefined,
            }

      return api.post('/referrals/manual', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Referral submitted successfully')
      setReferralForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        contractDuration: '',
        workCountry: '',
        nationality: '',
        maritalStatus: '',
        notes: '',
        companyName: '',
        country: '',
        contactFirstName: '',
        contactLastName: '',
        contactEmail: '',
        contactPhone: '',
        jobTitle: '',
        linkedin: '',
      })
      setContractStart('')
      setContractEnd('')
      setReferralPhoneNumber('')
      setContactPhoneNumber('')
      setStep(1)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit referral')
    },
  })

  const isManualSubmitDisabled =
    manualReferralMutation.isPending ||
    (referralType === 'individual'
      ? !referralForm.firstName || !referralForm.email
      : !referralForm.contactFirstName || !referralForm.contactEmail)

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
                width={88}
                height={36}
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
              <div className="relative" ref={profileMenuRef}>
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
              <span className={`font-semibold ${step === 1 ? 'text-[#2b36ff]' : ''}`}>Step 1</span>
              <span>Choose who you want to refer</span>
              <span className="text-gray-300">|</span>
              <span className={`font-semibold ${step === 2 ? 'text-[#2b36ff]' : ''}`}>Step 2</span>
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
                      className="mt-2 w-full rounded-full border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Affiliate Email</label>
                    <input
                      readOnly
                      value={affiliateEmail}
                      className="mt-2 w-full rounded-full border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-900"
                    />
                  </div>
                </div>

                {referralType === 'individual' ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-800">Referral Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        value={referralForm.firstName}
                        onChange={(event) =>
                          setReferralForm((prev) => ({ ...prev, firstName: event.target.value }))
                        }
                        className="rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900"
                        placeholder="First Name*"
                      />
                      <input
                        value={referralForm.lastName}
                        onChange={(event) =>
                          setReferralForm((prev) => ({ ...prev, lastName: event.target.value }))
                        }
                        className="rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900"
                        placeholder="Last Name"
                      />
                      <input
                        value={referralForm.email}
                        onChange={(event) =>
                          setReferralForm((prev) => ({ ...prev, email: event.target.value }))
                        }
                        className="rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900"
                        placeholder="Email*"
                      />
                      <input
                        value={referralForm.phone}
                        readOnly
                        className="hidden"
                      />
                      <PhoneCountrySelect
                        country={referralPhoneCountry}
                        onCountryChange={(next) => {
                          setHasSelectedReferralCountry(true)
                          setReferralPhoneCountry(next)
                        }}
                        number={referralPhoneNumber}
                        onNumberChange={setReferralPhoneNumber}
                        placeholder="Phone"
                      />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="relative">
                          <input
                            type="date"
                            value={contractStart}
                            onChange={(event) => setContractStart(event.target.value)}
                            className="w-full rounded-full border border-gray-200 px-4 py-3 pr-10 text-sm text-transparent caret-transparent"
                          />
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                            {contractStart ? formatDateDisplay(contractStart) : 'Contract Start Date'}
                          </span>
                          <svg
                            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v2H2V6a2 2 0 0 1 2-2h1V3a1 1 0 1 1 2 0v1Zm12 8v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6h16Z" />
                          </svg>
                        </div>
                        <div className="relative">
                          <input
                            type="date"
                            value={contractEnd}
                            onChange={(event) => setContractEnd(event.target.value)}
                            className="w-full rounded-full border border-gray-200 px-4 py-3 pr-10 text-sm text-transparent caret-transparent"
                          />
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                            {contractEnd ? formatDateDisplay(contractEnd) : 'Contract End Date'}
                          </span>
                          <svg
                            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v2H2V6a2 2 0 0 1 2-2h1V3a1 1 0 1 1 2 0v1Zm12 8v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6h16Z" />
                          </svg>
                        </div>
                      </div>
                      <input
                        value={referralForm.workCountry}
                        onChange={(event) =>
                          setReferralForm((prev) => ({ ...prev, workCountry: event.target.value }))
                        }
                        className="rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900"
                        placeholder="Work country (if known)"
                      />
                      <input
                        value={referralForm.nationality}
                        onChange={(event) =>
                          setReferralForm((prev) => ({ ...prev, nationality: event.target.value }))
                        }
                        className="rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900"
                        placeholder="Nationality (if known)"
                      />
                      <div className="relative">
                        <select
                          value={referralForm.maritalStatus}
                          onChange={(event) =>
                            setReferralForm((prev) => ({ ...prev, maritalStatus: event.target.value }))
                          }
                          className="w-full appearance-none rounded-full border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900"
                        >
                          <option value="">Marital status</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </select>
                        <svg
                          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <textarea
                      value={referralForm.notes}
                      onChange={(event) =>
                        setReferralForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900"
                      rows={4}
                      placeholder="Additional information"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-800">Referral Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        value={referralForm.companyName}
                        onChange={(event) =>
                          setReferralForm((prev) => ({ ...prev, companyName: event.target.value }))
                        }
                        className="rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900"
                        placeholder="Company Name"
                      />
                      <input
                        value={referralForm.country}
                        onChange={(event) =>
                          setReferralForm((prev) => ({ ...prev, country: event.target.value }))
                        }
                        className="rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900"
                        placeholder="Country"
                      />
                      <input
                        value={referralForm.contactFirstName}
                        onChange={(event) =>
                          setReferralForm((prev) => ({ ...prev, contactFirstName: event.target.value }))
                        }
                        className="rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900"
                        placeholder="First Name*"
                      />
                      <input
                        value={referralForm.contactLastName}
                        onChange={(event) =>
                          setReferralForm((prev) => ({ ...prev, contactLastName: event.target.value }))
                        }
                        className="rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900"
                        placeholder="Last Name"
                      />
                      <input
                        value={referralForm.jobTitle}
                        onChange={(event) =>
                          setReferralForm((prev) => ({ ...prev, jobTitle: event.target.value }))
                        }
                        className="rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900"
                        placeholder="Job title"
                      />
                      <input
                        value={referralForm.contactEmail}
                        onChange={(event) =>
                          setReferralForm((prev) => ({ ...prev, contactEmail: event.target.value }))
                        }
                        className="rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900"
                        placeholder="Email*"
                      />
                      <input
                        value={referralForm.contactPhone}
                        readOnly
                        className="hidden"
                      />
                      <PhoneCountrySelect
                        country={contactPhoneCountry}
                        onCountryChange={(next) => {
                          setHasSelectedContactCountry(true)
                          setContactPhoneCountry(next)
                        }}
                        number={contactPhoneNumber}
                        onNumberChange={setContactPhoneNumber}
                        placeholder="Phone"
                      />
                      <input
                        value={referralForm.linkedin}
                        onChange={(event) =>
                          setReferralForm((prev) => ({ ...prev, linkedin: event.target.value }))
                        }
                        className="rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900"
                        placeholder="LinkedIn profile (if known)"
                      />
                    </div>
                    <textarea
                      value={referralForm.notes}
                      onChange={(event) =>
                        setReferralForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900"
                      rows={4}
                      placeholder="Additional information"
                    />
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
                    disabled={isManualSubmitDisabled}
                    onClick={() => manualReferralMutation.mutate()}
                    className={`rounded-full px-6 py-2 text-sm font-semibold text-white ${
                      isManualSubmitDisabled ? 'bg-gray-300' : 'bg-[#2b36ff] hover:bg-[#2330f0]'
                    }`}
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
                <div className="relative" ref={filterMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftVisibleColumns(visibleColumns)
                      setShowFilters((prev) => !prev)
                    }}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:border-gray-300"
                  >
                    <span>Filters</span>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-500">
                      <path d="M3 4h14v2H3V4zm2 5h10v2H5V9zm3 5h4v2H8v-2z" />
                    </svg>
                  </button>
                  {showFilters && (
                    <div className="absolute right-0 mt-2 w-64 rounded-md border border-gray-200 bg-white p-4 shadow-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">Additional fields</p>
                      <div className="grid grid-cols-1 gap-2">
                      {[
                        { key: 'email', label: 'Referral Email' },
                        { key: 'phone', label: 'Phone Number' },
                        { key: 'companyName', label: 'Company Name' },
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
                            companyName: false,
                          }
                          setDraftVisibleColumns(cleared)
                          setVisibleColumns(cleared)
                          if (typeof window !== 'undefined') {
                            window.localStorage.setItem('affiliate-referral-filters', JSON.stringify(cleared))
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
                              'affiliate-referral-filters',
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
                <div className="relative" ref={exportMenuRef}>
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
                      <th className="px-4 py-3 text-left font-semibold">Currency</th>
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
                        <td className="px-4 py-3">{affiliateData.currency || 'USD'}</td>
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
