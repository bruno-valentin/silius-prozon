'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          ⚠️ Maquette de démonstration — usage interne uniquement
        </div>
        <h1 className="text-xl font-semibold mb-4 text-gray-800">Accès restreint</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          {error && <p className="text-red-500 text-sm">Mot de passe incorrect</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700"
          >
            Accéder
          </button>
        </form>
      </div>
    </div>
  )
}
