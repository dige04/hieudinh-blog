import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { confirmSubscriber } from '@/lib/subscribers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'Token không hợp lệ' },
      { status: 400 }
    )
  }

  const subscriber = await confirmSubscriber(token)

  if (!subscriber) {
    // Token not found or already used
    return redirect('/blog?error=invalid-token')
  }

  // Successfully confirmed
  return redirect('/blog?subscribed=true')
}
