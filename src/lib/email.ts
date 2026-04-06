import nodemailer from 'nodemailer'
import {
  buildApprovedTicketEmailHtml,
  buildApprovedTicketEmailText,
  buildBookingCreatedEmailHtml,
  buildBookingCreatedEmailText,
  buildOtpEmailHtml,
  buildOtpEmailText,
  buildPaymentNotificationEmailHtml,
} from '@/lib/emailTemplates'

/** Gmail app passwords are often pasted with spaces; SMTP expects the 16 chars without spaces. */
function normalizeSmtpPassword(pass: string): string {
  return pass.replace(/\s+/g, '').trim()
}

/**
 * Same idea as Spring Boot:
 * spring.mail.host / port / username / password + smtp.auth + starttls (port 587).
 */
function getTransport() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const passRaw = process.env.SMTP_PASS
  if (!host || !user || !passRaw) {
    return null
  }
  const pass = normalizeSmtpPassword(passRaw)
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    requireTLS: port === 587,
  })
}

const fromAddress = () => process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@localhost'

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const transport = getTransport()
  const subject = 'GNS Booking - Your OTP Verification Code'
  const html = buildOtpEmailHtml(code)
  const text = buildOtpEmailText(code)
  if (!transport) {
    console.warn('[email] SMTP not configured; OTP for', to, ':', code)
    return
  }
  await transport.sendMail({
    from: fromAddress(),
    to,
    subject,
    text,
    html,
  })
}

/** After POST /booking/save — same idea as Spring `sendBookingConfirm`. */
export async function sendBookingCreatedEmail(
  to: string,
  payload: { bookingId: number; seats: string[]; totalAmount: number; upiId: string }
): Promise<void> {
  const transport = getTransport()
  const subject = '🎉 Your Booking is Created - GNS Event'
  const html = buildBookingCreatedEmailHtml({
    bookingId: payload.bookingId,
    seats: payload.seats,
    total: payload.totalAmount,
    upiId: payload.upiId,
  })
  const text = buildBookingCreatedEmailText({
    bookingId: payload.bookingId,
    seats: payload.seats,
    total: payload.totalAmount,
    upiId: payload.upiId,
  })
  if (!transport) {
    console.warn('[email] SMTP not configured; booking created email would go to', to, payload)
    return
  }
  await transport.sendMail({
    from: fromAddress(),
    to,
    subject,
    text,
    html,
  })
}

/** After admin marks booking PAID — same idea as `getApprovedTicketTemplate`. */
export async function sendApprovedTicketEmail(
  to: string,
  payload: { bookingId: number; seats: string[]; totalAmount: number }
): Promise<void> {
  const transport = getTransport()
  const subject = `🎉 Payment verified — NAACH '26 booking #${payload.bookingId}`
  const html = buildApprovedTicketEmailHtml(payload.bookingId, payload.seats, payload.totalAmount)
  const text = buildApprovedTicketEmailText(payload.bookingId, payload.seats, payload.totalAmount)
  if (!transport) {
    console.warn('[email] SMTP not configured; approved ticket email would go to', to, payload)
    return
  }
  await transport.sendMail({
    from: fromAddress(),
    to,
    subject,
    text,
    html,
  })
}

/** Optional: POST `/api/booking/notify-paid` — short acknowledgement (full ticket email is sent when admin marks PAID). */
export async function sendPaymentReceivedEmail(
  to: string,
  payload: { bookingId: number; seats: string[]; totalAmount: number }
): Promise<void> {
  const transport = getTransport()
  const subject = `Payment recorded — booking #${payload.bookingId}`
  const html = buildPaymentNotificationEmailHtml(payload)
  const text = `We logged your payment notification for booking #${payload.bookingId}. Seats: ${payload.seats.join(', ')}. Amount: ₹${payload.totalAmount}. You will receive the full ticket email when an admin confirms payment.`
  if (!transport) {
    console.warn('[email] SMTP not configured; payment notice would go to', to, payload)
    return
  }
  await transport.sendMail({
    from: fromAddress(),
    to,
    subject,
    text,
    html,
  })
}
