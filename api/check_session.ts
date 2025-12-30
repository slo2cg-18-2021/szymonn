import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret'

function parseCookies(cookieHeader: string | undefined) {
  const obj: Record<string, string> = {}
  if (!cookieHeader) return obj
  const parts = cookieHeader.split(';')
  for (const p of parts) {
    const [k, ...rest] = p.trim().split('=')
    obj[k] = rest.join('=')
  }
  return obj
}

export default function handler(req: any, res: any) {
  const cookies = parseCookies(req.headers.cookie)
  const token = cookies['token']
  if (!token) {
    res.status(401).json({ authenticated: false })
    return
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    // @ts-ignore
    res.status(200).json({ authenticated: true, username: payload.username })
  } catch (err) {
    res.status(401).json({ authenticated: false })
  }
}
