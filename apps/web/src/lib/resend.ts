import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendConfirmationEmail(email: string, token: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const confirmUrl = `${siteUrl}/api/confirm?token=${token}`

  await resend.emails.send({
    from: 'VN AI Weekly <noreply@hieudinh.com>',
    to: email,
    subject: 'Xác nhận đăng ký VN AI Weekly',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; margin-bottom: 24px;">Xác nhận đăng ký</h1>
          <p style="color: #666; line-height: 1.6;">
            Cảm ơn bạn đã đăng ký nhận VN AI Weekly!
          </p>
          <p style="color: #666; line-height: 1.6;">
            Vui lòng click vào nút bên dưới để xác nhận địa chỉ email của bạn:
          </p>
          <a href="${confirmUrl}"
             style="display: inline-block; background: #000; color: #fff; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; margin: 24px 0;">
            Xác nhận đăng ký
          </a>
          <p style="color: #999; font-size: 14px; margin-top: 32px;">
            Nếu bạn không đăng ký, vui lòng bỏ qua email này.
          </p>
        </body>
      </html>
    `,
  })
}
