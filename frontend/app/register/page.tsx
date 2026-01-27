'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Image from 'next/image'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

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

const registerSchema = z
  .object({
    accountType: z.enum(['individual', 'company']),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    companyName: z.string().optional(),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Repeat password is required'),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      })
    }

    const strength = getPasswordStrength(data.password)
    if (strength === 'Easy') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'Password is too weak. Use upper/lowercase, numbers, and symbols.',
      })
    }
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: 'individual',
    },
  })

  const accountType = watch('accountType')
  const passwordValue = watch('password') || ''
  const passwordStrength = passwordValue ? getPasswordStrength(passwordValue) : null

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const { confirmPassword, ...payload } = data
      const response = await api.post('/auth/register', payload)
      const { accessToken, refreshToken, user } = response.data

      Cookies.set('accessToken', accessToken)
      Cookies.set('refreshToken', refreshToken)

      toast.success('Registration successful! Welcome to your account.')
      if (user?.role === 'AFFILIATE') {
        router.push('/dashboard')
      } else {
        router.push('/admin')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#2b36ff] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        <div className="overflow-hidden rounded-[28px] bg-white shadow-2xl grid md:grid-cols-2">
          <div className="p-10 sm:p-12">
            <div className="flex items-center gap-3">
              <Image
                src="/af-logo-short-dark.svg"
                alt="Access Financial"
                width={120}
                height={60}
                className="h-10 w-auto"
                priority
              />
            </div>

            <div className="mt-8">
              <h1 className="text-3xl font-semibold text-gray-900">Register a New Account</h1>
              <p className="mt-2 text-sm text-gray-500">Please enter your details.</p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Account Type
                  </label>
                  <select
                    {...register('accountType')}
                    className="mt-2 block w-full rounded-full border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      First Name *
                    </label>
                    <input
                      {...register('firstName')}
                      type="text"
                      className="mt-2 block w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Last Name *
                    </label>
                    <input
                      {...register('lastName')}
                      type="text"
                      className="mt-2 block w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {accountType === 'company' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Company Name
                    </label>
                    <input
                      {...register('companyName')}
                      type="text"
                      className="mt-2 block w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Email *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="mt-2 block w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Phone *
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="mt-2 block w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Password *
                  </label>
                  <input
                    {...register('password')}
                    type="password"
                    className="mt-2 block w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                  {passwordStrength && (
                    <p
                      className={`mt-2 text-xs font-medium ${
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
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                {passwordValue.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Repeat password *
                    </label>
                    <input
                      {...register('confirmPassword')}
                      type="password"
                      className="mt-2 block w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-[#2b36ff] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[#2330f0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-200 disabled:opacity-50"
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>

              <div className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <a href="/login" className="font-semibold text-primary-600 hover:text-primary-500">
                  Sign in
                </a>
              </div>
            </form>
          </div>

          <div className="hidden md:block p-4">
            <div
              className="h-full w-full rounded-[24px] bg-[#0f1ccf] relative overflow-hidden"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 70% 20%, #7b86ff 0%, #2b36ff 35%, #0b1a8f 100%)',
              }}
            >
              <div className="absolute inset-0 opacity-30">
                <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/20 blur-2xl" />
                <div className="absolute -right-8 bottom-10 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
