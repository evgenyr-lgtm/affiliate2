'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Image from 'next/image'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { setAuthCookies } from '@/lib/authCookies'
import { phoneCountries } from '@/lib/phoneCountries'
import PhoneCountrySelect from '@/components/PhoneCountrySelect'

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
    accountType: z.enum(['individual', 'company']).optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    companyName: z.string().optional(),
    jobTitle: z.string().optional(),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Reset password is required'),
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
  const [phoneCountry, setPhoneCountry] = useState(
    phoneCountries.find((item) => item.code === 'US') || phoneCountries[0]
  )
  const [phoneNumber, setPhoneNumber] = useState('')
  const [hasSelectedCountry, setHasSelectedCountry] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  useEffect(() => {
    let active = true
    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/')
        if (!response.ok) return
        const data = await response.json()
        const code = String(data?.country_code || '').toUpperCase()
        if (!active || !code || hasSelectedCountry) return
        const match = phoneCountries.find((item) => item.code === code)
        if (match) setPhoneCountry(match)
      } catch (error) {
        // Ignore geolocation failures silently
      }
    }

    detectCountry()
    return () => {
      active = false
    }
  }, [hasSelectedCountry])

  useEffect(() => {
    const trimmed = phoneNumber.trim()
    setValue('phone', trimmed ? `${phoneCountry.dial} ${trimmed}` : '')
  }, [phoneCountry, phoneNumber, setValue])

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const { confirmPassword, phone, accountType: typeFromForm, ...payload } = data
      const phoneValue = phone?.trim()
      const response = await api.post('/auth/register', {
        ...payload,
        accountType: typeFromForm || 'individual',
        phone: phoneValue || undefined,
      })
      const { accessToken, refreshToken, user } = response.data

      setAuthCookies(accessToken, refreshToken)

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
                  <div className="relative">
                    <select
                      {...register('accountType')}
                      className="mt-2 block w-full appearance-none rounded-full border border-gray-200 bg-white px-4 py-3 pr-12 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                    </select>
                    <svg
                      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Job Title
                      </label>
                      <input
                        {...register('jobTitle')}
                        type="text"
                        className="mt-2 block w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      />
                    </div>
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
                    Phone
                  </label>
                  <input {...register('phone')} type="hidden" />
                  <PhoneCountrySelect
                    country={phoneCountry}
                    onCountryChange={(next) => {
                      setHasSelectedCountry(true)
                      setPhoneCountry(next)
                    }}
                    number={phoneNumber}
                    onNumberChange={setPhoneNumber}
                    placeholder="Phone number"
                    compact
                  />
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
                      Repeat Password *
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
              className="h-full w-full rounded-[24px] bg-[#0f1ccf] relative overflow-hidden animate-soft-pink"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 70% 20%, #7b86ff 0%, #2b36ff 35%, #0b1a8f 100%)',
              }}
            >
              <div className="absolute inset-0 opacity-30">
                <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/20 blur-2xl animate-float-slow" />
                <div className="absolute -right-8 bottom-10 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-float-fast" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.02);
          }
        }
        @keyframes softPink {
          0%,
          100% {
            filter: hue-rotate(0deg) saturate(1);
          }
          50% {
            filter: hue-rotate(25deg) saturate(1.15);
          }
        }
        .animate-float-slow {
          animation: float 10s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: float 8s ease-in-out infinite;
        }
        .animate-soft-pink {
          animation: softPink 12s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
