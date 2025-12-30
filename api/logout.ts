export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  // Clear cookie
  const cookie = `token=deleted; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=0`
  res.setHeader('Set-Cookie', cookie)
  res.status(200).json({ success: true })
}
