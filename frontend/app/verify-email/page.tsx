'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      return
    }

    api
      .get(`/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success')
        toast.success('Email verified successfully!')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      })
      .catch(() => {
        setStatus('error')
        toast.error('Email verification failed')
      })
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        {status === 'verifying' && (
          <div>
            <h2 className="text-2xl font-bold">Verifying your email...</h2>
            <p className="mt-2 text-gray-600">Please wait</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <h2 className="text-2xl font-bold text-green-600">Email Verified!</h2>
            <p className="mt-2 text-gray-600">Redirecting to login...</p>
          </div>
        )}
        {status === 'error' && (
          <div>
            <h2 className="text-2xl font-bold text-red-600">Verification Failed</h2>
            <p className="mt-2 text-gray-600">The verification link is invalid or expired.</p>
            <a
              href="/login"
              className="mt-4 inline-block text-primary-600 hover:text-primary-500"
            >
              Go to Login
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
