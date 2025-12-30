import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'

type Props = {
  onLogin: () => void
}

export const Login: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (res.ok) {
        onLogin()
      } else {
        const data = await res.json()
        setError(data.error || 'Błąd logowania')
      }
    } catch (err) {
      setError('Błąd sieci')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
      <form onSubmit={handleSubmit} className="bg-card border border-border p-6 rounded-lg w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Zaloguj się do aplikacji</h2>
        {error && <div className="text-destructive text-sm mb-3">{error}</div>}
        <div className="mb-3">
          <Input placeholder="Użytkownik" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="mb-4">
          <Input placeholder="Hasło" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Logowanie...' : 'Zaloguj'}</Button>
      </form>
    </div>
  )
}

export default Login
