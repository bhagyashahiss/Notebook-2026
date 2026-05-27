function normalizeIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return digits;
  return digits;
}

export function buildTokenMessage(params: {
  name: string;
  tokenNumber: string;
  dozens: number;
  amount: number;
  date: string;
  time: string;
  venue: string;
  contact: string;
}): string {
  return [
    `🙏 Jai Jinendra ${params.name}!`,
    ``,
    `Your notebook booking is confirmed.`,
    ``,
    `📋 *Token Number:* ${params.tokenNumber}`,
    `📚 *Quantity:* ${params.dozens} dozen`,
    `💰 *Amount:* Rs ${params.amount}`,
    ``,
    `📅 *Date:* ${params.date}`,
    `🕐 *Time:* ${params.time}`,
    `📍 *Venue:* ${params.venue}`,
    ``,
    `Please carry exact cash. For queries contact:`,
    `${params.contact}`,
    ``,
    `Thank you! 🙏`,
  ].join("\n");
}

export function buildPaymentMessage(params: {
  name: string;
  tokenNumber: string;
  dozens: number;
  paymentMode: string;
  amount: number;
}): string {
  return [
    `🙏 Jai Jinendra ${params.name}!`,
    ``,
    `Thank you for your payment.`,
    ``,
    `📋 *Token:* ${params.tokenNumber}`,
    `📚 *Quantity:* ${params.dozens} dozen`,
    `💳 *Payment:* ${params.paymentMode} - Rs ${params.amount}`,
    ``,
    `Your notebooks have been handed over. Thank you for your support! 🙏`,
  ].join("\n");
}

export function getWhatsAppLink(phone: string, message: string): string {
  const normalized = normalizeIndianPhone(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encoded}`;
}
