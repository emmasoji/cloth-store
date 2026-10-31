import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

type Currency = 'NGN' | 'USD' | 'GBP' | 'EUR'

interface CurrencyContextValue {
  currency: Currency
  rates: Record<string, number>
  setCurrency: (c: Currency) => void
  convert: (amountNGN: number) => number
  format: (amountNGN: number) => string
}

const symbols: Record<Currency, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    return (localStorage.getItem('neon-currency') as Currency) || 'NGN'
  })
  const [rates, setRates] = useState<Record<string, number>>({
    NGN: 1,
    USD: 0.00067,
    GBP: 0.00052,
    EUR: 0.00061,
  })

  useEffect(() => {
    api.get('/api/currency/rates').then((data) => {
      if (data?.rates) setRates(data.rates)
    }).catch(() => {})
  }, [])

  const setCurrency = (c: Currency) => {
    setCurrencyState(c)
    localStorage.setItem('neon-currency', c)
  }

  const convert = (amountNGN: number) => {
    const rate = rates[currency] ?? 1
    return amountNGN * rate
  }

  const format = (amountNGN: number) => {
    const value = convert(amountNGN)
    const sym = symbols[currency]
    if (currency === 'NGN') {
      return `${sym}${Math.round(value).toLocaleString()}`
    }
    return `${sym}${value.toFixed(2)}`
  }

  return (
    <CurrencyContext.Provider value={{ currency, rates, setCurrency, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}