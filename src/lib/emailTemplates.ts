/** Escape text for HTML email bodies (seat labels, emails, etc.). */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const EVENT = {
  name: "NAACH '26",
  theme: 'Mumbai Meri Jaan',
  dateLine: '25th April | 🕖 7 PM',
  venue: '📍 Ghatkopar Auditorium',
  whatsapp: '+91-7738612015',
  footer: '© 2026 GNS Booking',
} as const

/** OTP validity matches `send-otp` (10 minutes). */
export function buildOtpEmailHtml(code: string): string {
  const c = escapeHtml(code)
  return `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px; margin:0;">
  <div style="max-width:500px; margin:auto; background:#fff; padding:24px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <h2 style="text-align:center; color:#333; margin-top:0;">GNS Booking 🎉</h2>
    <p>Hi,</p>
    <p>Thank you for logging in.</p>
    <p>Your OTP is:</p>
    <h1 style="text-align:center; color:#1a56db; font-size:32px; letter-spacing:4px; margin:16px 0;">${c}</h1>
    <p style="color:#555;">This OTP is valid for <strong>10 minutes</strong>.</p>
    <p style="color:#555;">If you did not request this, ignore this email.</p>
    <hr style="border:none; border-top:1px solid #eee; margin:24px 0;" />
    <p style="font-size:12px; color:#777; text-align:center; margin-bottom:0;">${EVENT.footer}</p>
  </div>
</body>
</html>`
}

export function buildOtpEmailText(code: string): string {
  return `Your OTP is: ${code}\n\nIt expires in 10 minutes. If you did not request this, ignore this email.`
}

export function buildBookingCreatedEmailHtml(params: {
  bookingId: number
  seats: string[]
  total: number
  upiId: string
}): string {
  const { bookingId, seats, total, upiId } = params
  const seatList = seats.map(escapeHtml).join(', ')
  const upi = escapeHtml(upiId)
  const wa = escapeHtml(EVENT.whatsapp)
  return `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:20px; margin:0;">
  <div style="max-width:500px; margin:auto; background:#ffffff; padding:24px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <h2 style="text-align:center; color:#333; margin-top:0;">GNS Booking Confirmation 🎉</h2>
    <p>Hi,</p>
    <p>Your booking has been successfully created. Please find the details below:</p>
    <div style="background:#f9f9f9; padding:15px; border-radius:8px; margin:16px 0;">
      <p style="margin:8px 0;"><b>📌 Booking ID:</b> ${bookingId}</p>
      <p style="margin:8px 0;"><b>🎟️ Ticket Numbers:</b> ${seatList}</p>
      <p style="margin:8px 0;"><b>💰 Total Amount:</b> ₹${total}</p>
    </div>
    <p>Please complete your payment using the UPI ID below:</p>
    <div style="text-align:center; margin:20px 0;">
      <p style="font-size:18px; font-weight:bold; color:#007bff; margin:0;">UPI ID: ${upi}</p>
    </div>
    <p>After completing the payment, kindly send your payment receipt along with:</p>
    <ul style="color:#444;">
      <li>📧 Your Booking Email ID</li>
      <li>🆔 Booking ID</li>
    </ul>
    <p>Send the details on WhatsApp:</p>
    <p style="font-size:16px; font-weight:bold; color:#333;">📱 ${wa}</p>
    <p style="margin-top:20px;">Once verified, your booking will be confirmed.</p>
    <p>Thank you for booking with us! 🙌</p>
    <hr style="border:none; border-top:1px solid #eee; margin:24px 0;" />
    <p style="font-size:12px; color:#777; text-align:center; margin-bottom:0;">${EVENT.footer}. All rights reserved.</p>
  </div>
</body>
</html>`
}

export function buildBookingCreatedEmailText(params: {
  bookingId: number
  seats: string[]
  total: number
  upiId: string
}): string {
  const { bookingId, seats, total, upiId } = params
  return `Booking ID: ${bookingId}\nSeats: ${seats.join(', ')}\nTotal: ₹${total}\nUPI: ${upiId}\nWhatsApp: ${EVENT.whatsapp}`
}

/** Approved / paid — same style as Java `getApprovedTicketTemplate`. */
export function buildApprovedTicketEmailHtml(bookingId: number, seats: string[], totalAmount: number): string {
  const perSeat =
    seats.length > 0 ? Math.max(1, Math.round(totalAmount / seats.length)) : totalAmount
  const blocks = seats
    .map((seat) => {
      const s = escapeHtml(seat)
      return `<div style="background:#1a1a1a; border-radius:15px; padding:20px; margin:15px 0; color:white; border:1px solid #333;">
  <h2 style="margin:0; color:#FFD700;">🎟️ ${escapeHtml(EVENT.name)}</h2>
  <p style="margin:5px 0; color:#ccc;">Theme: ${escapeHtml(EVENT.theme)}</p>
  <div style="margin:15px 0; padding:10px; background:#2a2a2a; border-radius:10px; text-align:center;">
    <p style="margin:0; font-size:14px; color:#aaa;">SEAT</p>
    <p style="font-size:28px; font-weight:bold; color:#00BFFF; margin:5px 0;">${s}</p>
  </div>
  <p style="margin:5px 0;"><b>Amount:</b> ₹${perSeat}</p>
  <p style="font-size:12px; color:#bbb;">📅 ${escapeHtml(EVENT.dateLine)}</p>
  <p style="font-size:12px; color:#bbb;">${escapeHtml(EVENT.venue)}</p>
</div>`
    })
    .join('')

  return `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background:#0d0d0d; padding:20px; margin:0;">
  <div style="max-width:600px; margin:auto;">
    <h1 style="text-align:center; color:#FFD700; margin-top:0;">🎉 Booking Confirmed</h1>
    <p style="color:white; text-align:center; margin:8px 0;">Your payment is verified successfully</p>
    <p style="color:#ccc; text-align:center; margin:8px 0;">Booking ID: ${bookingId}</p>
    ${blocks}
    <p style="color:white; text-align:center; margin-top:20px;">Show this email at entry gate</p>
    <hr style="border-color:#333; margin:24px 0;" />
    <p style="font-size:12px; color:#777; text-align:center; margin-bottom:0;">${EVENT.footer}</p>
  </div>
</body>
</html>`
}

export function buildApprovedTicketEmailText(bookingId: number, seats: string[], totalAmount: number): string {
  return `Booking confirmed — ID ${bookingId}\nSeats: ${seats.join(', ')}\nTotal: ₹${totalAmount}\n\nShow this at the entry gate.\n${EVENT.theme} — ${EVENT.dateLine.replace(/🕖/g, '')}\n${EVENT.venue}`
}

/** Short acknowledgement if client calls `/api/booking/notify-paid` (optional; full ticket comes when admin marks PAID). */
export function buildPaymentNotificationEmailHtml(payload: {
  bookingId: number
  seats: string[]
  totalAmount: number
}): string {
  const seatList = payload.seats.map(escapeHtml).join(', ')
  return `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px; margin:0;">
  <div style="max-width:500px; margin:auto; background:#fff; padding:24px; border-radius:10px;">
    <h2 style="color:#333; margin-top:0;">Payment notification received</h2>
    <p>We logged your message for <strong>booking #${payload.bookingId}</strong>.</p>
    <p style="color:#555;">Seats: ${seatList}<br/>Amount: ₹${payload.totalAmount}</p>
    <p style="color:#555;">Final confirmation with ticket layout is emailed when an admin marks your booking as paid.</p>
    <p style="font-size:12px; color:#777;">${EVENT.footer}</p>
  </div>
</body>
</html>`
}
