import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // Get redirect path and pending data flag from query params
  const redirectPath = requestUrl.searchParams.get('redirect') || '/profile'
  const pendingData = requestUrl.searchParams.get('pending_data') === 'true'

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Construct the redirect URL with pending data flag if needed
  const redirectUrl = new URL(redirectPath, request.url)
  if (pendingData) {
    redirectUrl.searchParams.set('pending_data', 'true')
  }

  return NextResponse.redirect(redirectUrl)
} 