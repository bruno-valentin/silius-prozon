import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const PASSWORD = process.env.AUTH_PASSWORD ?? ''

export async function POST(request: Request) {
  const { password } = await request.json()
  
  if (password === PASSWORD) {
    const cookieStore = cookies()
    cookieStore.set('demo-access', PASSWORD, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    })
    return NextResponse.json({ ok: true })
  }
  
  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}
