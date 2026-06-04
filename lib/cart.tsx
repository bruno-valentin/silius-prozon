'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { Product } from './supabase'

type CartItem = Product & { quantity: number }

type CartState = { items: CartItem[] }

type CartAction =
  | { type: 'ADD'; product: Product }
  | { type: 'REMOVE'; id: string }
  | { type: 'INCREMENT'; id: string }
  | { type: 'DECREMENT'; id: string }
  | { type: 'CLEAR' }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find(i => i.id === action.product.id)
      if (existing) {
        return { items: state.items.map(i => i.id === action.product.id ? { ...i, quantity: i.quantity + 1 } : i) }
      }
      return { items: [...state.items, { ...action.product, quantity: 1 }] }
    }
    case 'REMOVE':
      return { items: state.items.filter(i => i.id !== action.id) }
    case 'INCREMENT':
      return { items: state.items.map(i => i.id === action.id ? { ...i, quantity: i.quantity + 1 } : i) }
    case 'DECREMENT':
      return { items: state.items.map(i => i.id === action.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i) }
    case 'CLEAR':
      return { items: [] }
    default:
      return state
  }
}

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
  total: number
  count: number
} | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })
  const total = state.items.reduce((s, i) => s + i.price_ht * i.quantity, 0)
  const count = state.items.reduce((s, i) => s + i.quantity, 0)
  return <CartContext.Provider value={{ state, dispatch, total, count }}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
