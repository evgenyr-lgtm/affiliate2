'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Cookies from 'js-cookie'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const token = Cookies.get('accessToken')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [dashboardRes, linkRes] = await Promise.all([
        api.get('/affiliate/dashboard'),
        api.get('/affiliate/link'),
      ])
      return {
        ...dashboardRes.data,
        affiliateLink: linkRes.data.link,
      }
    },
  })

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  const { affiliate, referrals, stats } = data || {}

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Affiliate Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span>{affiliate?.firstName} {affiliate?.lastName}</span>
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
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{stats?.approved || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold">{stats?.paid || 0}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Your Affiliate Link</h3>
            <div className="bg-white p-4 rounded-lg shadow">
              <code className="text-sm">{data?.affiliateLink || 'Loading...'}</code>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Referrals</h3>
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
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(referral.entryDate).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
