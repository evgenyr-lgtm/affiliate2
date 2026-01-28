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
  Email: `mailto:?subject=${encodeURIComponent('Marketing Materials')}&body=${encodeURIComponent(url)}`,
  Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
})

export default function MarketingMaterialsPage() {
  const router = useRouter()
  const [openShareId, setOpenShareId] = useState<string | null>(null)

  useEffect(() => {
    const token = Cookies.get('accessToken')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const { data, isLoading } = useQuery({
    queryKey: ['marketing-materials'],
    queryFn: async () => {
      const response = await api.get('/documents')
      return response.data
    },
  })

  const documents: DocumentRow[] = data || []
  const baseUrl = getBackendBaseUrl()

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
              Back to Dashboard
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 0 1 .02-1.06L10.168 10 7.23 7.29a.75.75 0 0 1 1.04-1.08l3.5 3.24a.75.75 0 0 1 0 1.1l-3.5 3.24a.75.75 0 0 1-1.06-.02Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="overflow-auto">
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
                      const fileLink = `${baseUrl}${doc.fileUrl}`
                      const shareLinks = buildShareLinks(fileLink)
                      return (
                        <tr key={doc.id} className="text-gray-700">
                          <td className="px-4 py-3">{doc.name}</td>
                          <td className="px-4 py-3">{formatDate(doc.uploadedAt)}</td>
                          <td className="px-4 py-3">{doc.type}</td>
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
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setOpenShareId((prev) => (prev === doc.id ? null : doc.id))
                                }
                                className="text-primary-600 hover:text-primary-500"
                              >
                                Share
                              </button>
                              {openShareId === doc.id && (
                                <div className="absolute right-0 z-10 mt-2 w-44 rounded-md border border-gray-200 bg-white shadow-lg">
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
