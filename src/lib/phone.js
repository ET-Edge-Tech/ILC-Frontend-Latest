// Only digits (and a leading +) so the phone app understands the number.
export const telLink = (phone) => `tel:${String(phone).replace(/[^\d+]/g, '')}`;

// WhatsApp links break with spaces or dashes, so strip everything except digits.
// A bare 10-digit number is treated as Indian (+91); a leading 0 is dropped.
export function whatsappLink(phone) {
  let digits = String(phone).replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length === 10) digits = `91${digits}`;
  return `https://wa.me/${digits}`;
}
