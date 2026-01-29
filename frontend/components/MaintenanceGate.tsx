'use client'

import { useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

const shouldBypass = (path: string) => path.startsWith('/admin')

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const bypass = useMemo(() => shouldBypass(pathname), [pathname])

  const { data } = useQuery({
    queryKey: ['maintenance-status'],
    queryFn: async () => {
      const response = await api.get('/settings-public/maintenance')
      return response.data
    },
    enabled: !bypass,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (bypass) return
  }, [bypass])

  if (!bypass && data?.maintenance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Maintenance</h1>
          <p className="text-gray-600">
            The portal is under maintenance and will be available soon. We apologize for the
            temporary inconvenience.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
