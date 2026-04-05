/** Standard UPI deep link for QR / “Pay with UPI” apps */
export function buildUpiPayUri(params: {
  payeeVpa: string
  payeeName: string
  amountRupee: number
  transactionNote: string
}): string {
  const am = Math.max(0, params.amountRupee).toFixed(2)
  const pn = params.payeeName.slice(0, 99)
  const tn = params.transactionNote.slice(0, 99)
  const q = new URLSearchParams({
    pa: params.payeeVpa.trim(),
    pn,
    am,
    cu: 'INR',
    tn,
  })
  return `upi://pay?${q.toString()}`
}
