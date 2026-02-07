'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [canReset, setCanReset] = useState(false)

  const handleCheck = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }
    setIsChecking(true)
    try {
      const response = await api.post('/auth/forgot-password/check', { email })
      if (response.data?.exists) {
        setCanReset(true)
      } else {
        setCanReset(false)
        toast.error('Email not found')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check email')
    } finally {
      setIsChecking(false)
    }
  }

  const handleReset = async () => {
    setIsSending(true)
    try {
      const response = await api.post('/auth/forgot-password', { email })
      if (response.data?.exists) {
        toast.success('Temporary password sent to your email')
        router.push('/login')
      } else {
        toast.error('Email not found')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send temporary password')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#2b36ff] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="text-2xl font-semibold text-gray-900">Forgot Password</h1>
        <p className="mt-2 text-sm text-gray-500">
          Enter the email you used during registration.
        </p>

        <div className="mt-6 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setCanReset(false)
            }}
            className="block w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            placeholder="Email"
          />
          {!canReset ? (
            <button
              type="button"
              onClick={handleCheck}
              disabled={isChecking}
              className="w-full rounded-full bg-[#2b36ff] px-4 py-3 text-sm font-semibold text-white hover:bg-[#2330f0] disabled:opacity-70"
            >
              {isChecking ? 'Checking...' : 'Continue'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              disabled={isSending}
              className="w-full rounded-full bg-[#2b36ff] px-4 py-3 text-sm font-semibold text-white hover:bg-[#2330f0] disabled:opacity-70"
            >
              {isSending ? 'Sending...' : 'Reset Password'}
            </button>
          )}
        </div>

        {canReset && (
          <p className="mt-4 text-sm text-gray-500">
            Click Reset Password to receive a temporary password by email.
          </p>
        )}
      </div>
    </div>
  )
}
