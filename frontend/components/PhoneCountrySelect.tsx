'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { phoneCountries } from '@/lib/phoneCountries'

type PhoneCountry = (typeof phoneCountries)[number]

type PhoneCountrySelectProps = {
  country: PhoneCountry
  onCountryChange: (country: PhoneCountry) => void
  number: string
  onNumberChange: (value: string) => void
  placeholder?: string
  compact?: boolean
}

export default function PhoneCountrySelect({
  country,
  onCountryChange,
  number,
  onNumberChange,
  placeholder = 'Phone',
  compact = false,
}: PhoneCountrySelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const filteredCountries = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return phoneCountries
    return phoneCountries.filter((item) => {
      const name = item.name.toLowerCase()
      return (
        name.startsWith(trimmed) ||
        item.code.toLowerCase().startsWith(trimmed) ||
        item.dial.startsWith(trimmed)
      )
    })
  }, [query])

  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent) => {
      const target = event.target as Node
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  return (
    <div
      ref={containerRef}
      className="mt-2 flex w-full items-center rounded-full border border-gray-200 bg-white shadow-sm focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-200"
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`flex h-full items-center gap-2 bg-transparent py-3 pl-4 pr-8 text-sm text-gray-900 ${
            compact ? 'w-24' : 'w-28'
          }`}
        >
          <span>{country.flag}</span>
          <span className="font-medium">{country.dial}</span>
        </button>
        <svg
          className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
        {open && (
          <div className="absolute left-0 z-20 mt-2 w-72 rounded-md border border-gray-200 bg-white shadow-lg">
            <div className="p-2">
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search country"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <div className="max-h-64 overflow-auto py-1">
              {filteredCountries.length === 0 ? (
                <p className="px-4 py-2 text-sm text-gray-500">No matches</p>
              ) : (
                filteredCountries.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      onCountryChange(item)
                      setQuery('')
                      setOpen(false)
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span>{item.flag}</span>
                    <span className="flex-1 text-left">{item.name}</span>
                    <span className="text-gray-500">{item.dial}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      <div className="h-6 w-px bg-gray-200" />
      <input
        type="tel"
        value={number}
        onChange={(event) => onNumberChange(event.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
      />
    </div>
  )
}
