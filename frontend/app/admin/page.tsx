'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'affiliates' | 'referrals' | 'settings'>('affiliates')

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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.put(`/admin/affiliates/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] })
      toast.success('Status updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status')
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

  const handleStatusChange = (affiliateId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: affiliateId, status: newStatus })
  }

  const handleReferralUpdate = (referralId: string, data: any) => {
    updateReferralMutation.mutate({ id: referralId, data })
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
          {/* Tabs */}
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

          {/* Affiliates Tab */}
          {activeTab === 'affiliates' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Affiliates</h2>
              {affiliatesLoading ? (
                <div>Loading...</div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {affiliates?.map((affiliate: any) => (
                      <li key={affiliate.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {affiliate.firstName} {affiliate.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{affiliate.user?.email}</p>
                            <p className="text-sm text-gray-500">
                              Status: <span className="font-medium">{affiliate.status}</span>
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            {affiliate.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(affiliate.id, 'active')}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusChange(affiliate.id, 'rejected')}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Referrals Tab */}
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
                              onChange={(e) =>
                                handleReferralUpdate(referral.id, { status: e.target.value })
                              }
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                            <select
                              value={referral.paymentStatus}
                              onChange={(e) =>
                                handleReferralUpdate(referral.id, { paymentStatus: e.target.value })
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

          {/* Settings Tab */}
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
