'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Image from 'next/image'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/login', data)
      const { accessToken, refreshToken, user } = response.data

      Cookies.set('accessToken', accessToken)
      Cookies.set('refreshToken', refreshToken)

      // Redirect based on role
      if (user.role === 'AFFILIATE') {
        router.push('/dashboard')
      } else {
        router.push('/admin')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed')
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
              <h1 className="text-3xl font-semibold text-gray-900">Login</h1>
              <p className="mt-2 text-sm text-gray-500">Please enter your details.</p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className="block w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="Email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    {...register('password')}
                    type="password"
                    autoComplete="current-password"
                    className="block w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    placeholder="Password"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-500">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                  Remember for 30 days
                </label>
                <a href="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-[#2b36ff] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[#2330f0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-200 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Login'}
              </button>

              <div className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <a href="/register" className="font-semibold text-primary-600 hover:text-primary-500">
                  Register
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
        .animate-float-slow {
          animation: float 10s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: float 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
