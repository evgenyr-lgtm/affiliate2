'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Image from 'next/image'

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

const getBackendBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
  return apiUrl.replace(/\/api\/?$/, '')
}

const generatePassword = () => {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+'
  let result = ''
  for (let i = 0; i < 14; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export default function AdminAccountSettingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const baseUrl = getBackendBaseUrl()
  const [firstName, setFirstName] = useState('Admin')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('admin@accessfinancial.com')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  useEffect(() => {
    const token = Cookies.get('accessToken')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const { data: adminProfile } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      const response = await api.get('/admin/profile')
      return response.data
    },
  })

  useEffect(() => {
    if (!adminProfile) return
    setFirstName(adminProfile.firstName || 'Admin')
    setLastName(adminProfile.lastName || '')
    setEmail(adminProfile.email || 'admin@accessfinancial.com')
  }, [adminProfile])

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      return api.put('/admin/profile', {
        firstName,
        lastName,
        email,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] })
      toast.success('Profile updated')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      return api.post('/auth/change-password', {
        oldPassword: currentPassword,
        newPassword,
      })
    },
    onSuccess: () => {
      toast.success('Password updated')
      setCurrentPassword('')
      setNewPassword('')
      setRepeatPassword('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update password')
    },
  })

  const updateAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      return api.put('/admin/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (response) => {
      queryClient.setQueryData(['admin-profile'], response.data)
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] })
      toast.success('Avatar updated')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update avatar')
    },
  })

  const passwordStrength = useMemo(() => {
    if (!newPassword) return null
    return getPasswordStrength(newPassword)
  }, [newPassword])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              onClick={() => router.push('/admin')}
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
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                {adminProfile?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${baseUrl}${adminProfile.avatar}`}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                )}
                <span>Welcome, Admin!</span>
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
              onClick={() => router.push('/admin')}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-300"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12.78 4.22a.75.75 0 0 1 0 1.06L8.06 10l4.72 4.72a.75.75 0 0 1-1.06 1.06l-5.25-5.25a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Admin
            </button>
          </div>

          <section className="bg-white shadow rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Account Details</h2>
            <div className="flex items-center gap-4">
              {adminProfile?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${baseUrl}${adminProfile.avatar}`}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
              )}
              <label className="text-sm font-medium text-gray-700">
                <span className="block mb-2">Upload profile picture (PNG/JPG, max 5 MB)</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) updateAvatarMutation.mutate(file)
                  }}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="mt-2 block w-full rounded-full border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="mt-2 block w-full rounded-full border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 block w-full rounded-full border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm"
              />
            </div>
            <button
              className="rounded-full bg-[#2b36ff] px-6 py-2 text-sm font-semibold text-white"
              onClick={() => updateProfileMutation.mutate()}
            >
              Save Changes
            </button>
          </section>

          <section className="bg-white shadow rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Update Password</h2>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-md border border-gray-200 px-4 py-3 text-sm text-gray-900"
              placeholder="Current Password"
            />
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-md border border-gray-200 px-4 py-3 pr-10 text-sm text-gray-900"
                  placeholder="New Password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
                    <circle cx="12" cy="12" r="3.5" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                onClick={() => {
                  const generated = generatePassword()
                  setNewPassword(generated)
                  setRepeatPassword(generated)
                }}
              >
                Generate
              </button>
            </div>
            <input
              type="password"
              value={repeatPassword}
              onChange={(event) => setRepeatPassword(event.target.value)}
              className="w-full rounded-md border border-gray-200 px-4 py-3 text-sm text-gray-900"
              placeholder="Repeat Password"
            />
            {passwordStrength && (
              <p
                className={`text-xs font-medium ${
                  passwordStrength === 'Strong'
                    ? 'text-green-600'
                    : passwordStrength === 'Medium'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                Strength: {passwordStrength}
              </p>
            )}
            <button
              className="rounded-full bg-[#2b36ff] px-6 py-2 text-sm font-semibold text-white"
              onClick={() => {
                if (!currentPassword || !newPassword || !repeatPassword) {
                  toast.error('Please fill in all password fields')
                  return
                }
                if (newPassword !== repeatPassword) {
                  toast.error('Passwords do not match')
                  return
                }
                if (getPasswordStrength(newPassword) === 'Easy') {
                  toast.error('Password is too weak')
                  return
                }
                updatePasswordMutation.mutate()
              }}
            >
              Save Changes
            </button>
          </section>
        </div>
      </main>
    </div>
  )
}
