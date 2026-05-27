function singularOrPluralDozen(dozens: number): string {
  return dozens === 1 ? "dozen" : "dozens";
}

export function formatBooks(dozens: number): string {
  return `${dozens} ${singularOrPluralDozen(dozens)}`;
}

export function formatAmountINR(amount: number): string {
  return `Rs ${amount}`;
}

export function getTemplateName(key: "booking" | "payment"): string {
  if (key === "booking") {
    return process.env.WHATSAPP_TEMPLATE_BOOKING ?? "notebook_booking_confirmation";
  }
  return process.env.WHATSAPP_TEMPLATE_PAYMENT ?? "notebook_payment_confirmation";
}

export function getEventDetails() {
  return {
    date: process.env.EVENT_DATE ?? "8th June 2025",
    time: process.env.EVENT_TIME ?? "9:00 AM to 12:00 PM",
    venue:
      process.env.EVENT_VENUE ??
      "Shri Sambhavnath Jain Mandir, Carter Road No. 4, Borivali East",
    contact:
      process.env.EVENT_CONTACT ??
      "Sambhav Shanti Yuva Group - https://wa.me/919082557642",
  };
}
