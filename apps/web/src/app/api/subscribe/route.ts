import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { sendConfirmationEmail } from '@/lib/resend'
import { createSubscriber, getSubscriberByEmail } from '@/lib/subscribers'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if already subscribed
    const existing = await getSubscriberByEmail(normalizedEmail)
    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json(
          { message: 'Email này đã được đăng ký!' },
          { status: 200 }
        )
      }
      // If pending, resend confirmation
      if (existing.status === 'pending' && existing.confirm_token) {
        await sendConfirmationEmail(normalizedEmail, existing.confirm_token)
        return NextResponse.json({
          message: 'Vui lòng kiểm tra email để xác nhận đăng ký',
        })
      }
    }

    // Create new subscriber with confirmation token
    const token = randomBytes(32).toString('hex')
    const subscriber = await createSubscriber(normalizedEmail, token)

    if (!subscriber) {
      return NextResponse.json(
        { message: 'Email này đã được đăng ký!' },
        { status: 200 }
      )
    }

    // Send confirmation email
    await sendConfirmationEmail(normalizedEmail, token)

    return NextResponse.json({
      message: 'Vui lòng kiểm tra email để xác nhận đăng ký',
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' },
      { status: 500 }
    )
  }
}
