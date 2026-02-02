'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { useEffect, useState } from 'react'

type DocumentRow = {
  id: string
  name: string
  type: string
  fileUrl: string
  uploadedAt: string
}

const documentTypeLabel = (value: string) => {
  switch (value) {
    case 'guide':
      return 'Guide'
    case 'corporate_brochure':
      return 'Corporate Brochure'
    case 'one_pager':
      return 'One-pager'
    case 'terms_and_conditions':
      return 'Terms & Conditions'
    case 'banner':
      return 'Banner'
    case 'other':
      return 'Other'
    default:
      return value
  }
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-GB').format(date)
}

const getBackendBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
  return apiUrl.replace(/\/api\/?$/, '')
}

const buildShareLinks = (url: string) => ({
  Telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}`,
  WhatsApp: `https://wa.me/?text=${encodeURIComponent(url)}`,
  LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  Email: `mailto:?subject=${encodeURIComponent('Marketing Materials')}&body=${encodeURIComponent(
    `Download link: ${url}`
  )}`,
  Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
})

export default function MarketingMaterialsPage() {
  const router = useRouter()
  const [openShareId, setOpenShareId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const token = Cookies.get('accessToken')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!openShareId) return
      const target = event.target as HTMLElement
      if (target.closest('[data-share-root]')) return
      setOpenShareId(null)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openShareId])

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/affiliate/dashboard')
      return response.data
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['marketing-materials'],
    queryFn: async () => {
      const response = await api.get('/documents')
      return response.data
    },
  })

  const affiliate = dashboardData?.affiliate || {}
  const documents: DocumentRow[] = data || []
  const baseUrl = getBackendBaseUrl()

  const resolveDocumentLink = (doc: DocumentRow) => {
    if (doc.fileUrl.startsWith('http://') || doc.fileUrl.startsWith('https://')) {
      return doc.fileUrl
    }
    return `${baseUrl}/api/documents/${doc.id}/download`
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
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700"
                >
                  {affiliate.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${baseUrl}${affiliate.avatar}`}
                      alt="Profile"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                  )}
                  <span>Welcome, {affiliate.firstName || 'Affiliate'}!</span>
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

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Marketing Materials</h1>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-300"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 0 1-.02 1.06L9.832 10l2.938 3.71a.75.75 0 1 1-1.04 1.08l-3.5-4.24a.75.75 0 0 1 0-1.1l3.5-4.24a.75.75 0 0 1 1.06-.02Z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Dashboard
            </button>
          </div>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="bg-white shadow sm:rounded-md">
              <div className="relative min-h-[420px] overflow-x-auto overflow-y-visible pb-40">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Document Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Date Uploaded</th>
                      <th className="px-4 py-3 text-left font-semibold">Type</th>
                      <th className="px-4 py-3 text-left font-semibold">Link</th>
                      <th className="px-4 py-3 text-left font-semibold">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {documents.map((doc) => {
                      const fileLink = resolveDocumentLink(doc)
                      const shareLinks = buildShareLinks(fileLink)
                      return (
                        <tr key={doc.id} className="text-gray-700">
                          <td className="px-4 py-3">
                            <a
                              href={fileLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-gray-700 hover:text-gray-900 hover:underline"
                            >
                              {doc.name}
                            </a>
                          </td>
                          <td className="px-4 py-3">{formatDate(doc.uploadedAt)}</td>
                          <td className="px-4 py-3">{documentTypeLabel(doc.type)}</td>
                          <td className="px-4 py-3">
                            <a
                              href={fileLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary-600 hover:text-primary-500"
                            >
                              Download
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative" data-share-root>
                              <button
                                onClick={() =>
                                  setOpenShareId((prev) => (prev === doc.id ? null : doc.id))
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:border-gray-300"
                                title="Share"
                              >
                                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M14 3h7v7" />
                                  <path d="M10 14 21 3" />
                                  <path d="M5 7v12a2 2 0 0 0 2 2h12" />
                                </svg>
                              </button>
                              {openShareId === doc.id && (
                                <div className="absolute right-0 z-50 mt-2 w-44 rounded-md border border-gray-200 bg-white shadow-lg">
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
      </main>
    </div>
  )
}
