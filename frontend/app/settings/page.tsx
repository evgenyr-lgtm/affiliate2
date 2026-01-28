'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'
import Image from 'next/image'

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  jobTitle: z.string().optional(),
})

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

const getBackendBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
  return apiUrl.replace(/\/api\/?$/, '')
}

export default function SettingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifySystem, setNotifySystem] = useState(true)
  const [notifyMarketing, setNotifyMarketing] = useState(true)

  useEffect(() => {
    const token = Cookies.get('accessToken')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/affiliate/dashboard')
      return response.data
    },
  })

  const affiliate = useMemo(() => dashboardData?.affiliate || {}, [dashboardData])
  const email = affiliate.email || dashboardData?.user?.email || ''
  const baseUrl = getBackendBaseUrl()

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: affiliate.firstName || '',
      lastName: affiliate.lastName || '',
      phone: affiliate.phone || '',
      companyName: affiliate.companyName || '',
      jobTitle: affiliate.jobTitle || '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    if (dashboardData?.affiliate) {
      resetProfile({
        firstName: affiliate.firstName || '',
        lastName: affiliate.lastName || '',
        phone: affiliate.phone || '',
        companyName: affiliate.companyName || '',
        jobTitle: affiliate.jobTitle || '',
      })
      setNotifySystem(affiliate.notifySystem ?? true)
      setNotifyMarketing(affiliate.notifyMarketing ?? true)
    }
  }, [affiliate, dashboardData, resetProfile])

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return api.put('/affiliate/profile', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Profile updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { oldPassword: string; newPassword: string }) => {
      return api.post('/auth/change-password', data)
    },
    onSuccess: () => {
      resetPassword()
      toast.success('Password changed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password')
    },
  })

  const updateNotificationsMutation = useMutation({
    mutationFn: async () => {
      return api.put('/affiliate/profile', {
        notifySystem,
        notifyMarketing,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Notification preferences updated')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update notifications')
    },
  })

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return api.delete('/affiliate/account')
    },
    onSuccess: () => {
      Cookies.remove('accessToken')
      Cookies.remove('refreshToken')
      router.push('/login')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete account')
    },
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('Only PNG or JPG images are allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max file size is 5 MB')
      return
    }

    const formData = new FormData()
    formData.append('avatar', file)

    try {
      await api.put('/affiliate/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Avatar updated successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload avatar')
    }
  }

  const onProfileSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data)
  }

  const onPasswordSubmit = (data: PasswordForm) => {
    changePasswordMutation.mutate({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    })
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

      <main className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Account Settings</h1>
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

          <section className="bg-white shadow rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Account Details</h2>
            <div className="flex items-center gap-4">
              {affiliate.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${baseUrl}${affiliate.avatar}`}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
              )}
              <label className="text-sm font-medium text-gray-700">
                <span className="block mb-2">Upload profile picture (PNG/JPG, max 5 MB)</span>
                <input type="file" accept="image/png,image/jpeg" onChange={handleAvatarUpload} />
              </label>
            </div>

            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name *</label>
                  <input
                    {...registerProfile('firstName')}
                    type="text"
                    className="mt-2 block w-full rounded-full border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  {profileErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                  <input
                    {...registerProfile('lastName')}
                    type="text"
                    className="mt-2 block w-full rounded-full border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  {profileErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input
                    {...registerProfile('companyName')}
                    type="text"
                    className="mt-2 block w-full rounded-full border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Job Title</label>
                  <input
                    {...registerProfile('jobTitle')}
                    type="text"
                    className="mt-2 block w-full rounded-full border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    {...registerProfile('phone')}
                    type="tel"
                    className="mt-2 block w-full rounded-full border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  {profileErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.phone.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    value={email}
                    readOnly
                    className="mt-2 block w-full rounded-full border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="rounded-full bg-[#2b36ff] px-6 py-2 text-sm font-semibold text-white"
              >
                Save Changes
              </button>
            </form>
          </section>

          <section className="bg-white shadow rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
            <p className="text-sm text-gray-600">
              You can modify your password anytime, please note that your new password should meet the minimal password strength requirements.
            </p>
            <button
              className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700"
              onClick={() => setPasswordOpen((prev) => !prev)}
            >
              Change Password
            </button>
            {passwordOpen && (
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    {...registerPassword('oldPassword')}
                    type="password"
                    className="mt-2 block w-full rounded-full border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm"
                  />
                  {passwordErrors.oldPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.oldPassword.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    {...registerPassword('newPassword')}
                    type="password"
                    className="mt-2 block w-full rounded-full border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm"
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Repeat Password</label>
                  <input
                    {...registerPassword('confirmPassword')}
                    type="password"
                    className="mt-2 block w-full rounded-full border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-[#2b36ff] px-6 py-2 text-sm font-semibold text-white"
                >
                  Save Changes
                </button>
              </form>
            )}
          </section>

          <section className="bg-white shadow rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Delete Account</h2>
            <p className="text-sm text-gray-600">
              The account will no longer be available, and all data in the account will be permanently deleted.
            </p>
            <button
              className="rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-600"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
            {showDeleteConfirm && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700 mb-3">
                  This action cannot be undone. Are you sure you want to permanently delete your account?
                </p>
                <div className="flex gap-3">
                  <button
                    className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                    onClick={() => deleteAccountMutation.mutate()}
                  >
                    I understand this, delete
                  </button>
                  <button
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="bg-white shadow rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Emails & Notifications</h2>
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={notifySystem}
                onChange={(event) => setNotifySystem(event.target.checked)}
              />
              <span>
                I would like to receive important system notifications (e.g. referral status changes, important updates, etc.)
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={notifyMarketing}
                onChange={(event) => setNotifyMarketing(event.target.checked)}
              />
              <span>
                I would like to receive information about your products/services, news and offers.
              </span>
            </label>
            <button
              className="rounded-full bg-[#2b36ff] px-6 py-2 text-sm font-semibold text-white"
              onClick={() => updateNotificationsMutation.mutate()}
            >
              Save Changes
            </button>
          </section>
        </div>
      </main>
    </div>
  )
}
