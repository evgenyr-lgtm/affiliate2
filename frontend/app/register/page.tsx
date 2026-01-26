'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import api from '@/lib/api'
import toast from 'react-hot-toast'

const registerSchema = z.object({
  accountType: z.enum(['individual', 'company']),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { executeRecaptcha } = useGoogleReCaptcha()

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

  const onSubmit = async (data: RegisterForm) => {
    if (!executeRecaptcha) {
      toast.error('reCAPTCHA not loaded')
      return
    }

    setIsLoading(true)
    try {
      const recaptchaToken = await executeRecaptcha('register')

      await api.post('/auth/register', {
        ...data,
        recaptchaToken,
      })

      toast.success('Registration successful! Please check your email to verify your account.')
      router.push('/login')
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
              <img src="/af-logo.png" alt="Access Financial" className="h-10 w-auto" />
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
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
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
