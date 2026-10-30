import site from "@/content/site.json";

export const EMAIL = site.enquiryEmail;
export const WHATSAPP_NUMBER = site.whatsappNumber.replace(/\D/g, "");
export const WHATSAPP_PREFILL = "Hello DeboisTech, I have a question.";

/** Null when no WhatsApp number is configured: callers then fall back to the email address. */
export const whatsappLink = (text: string) =>
  WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}` : null;

export const gmailLink = (body: string) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL)}&su=${encodeURIComponent("Enquiry from DeboisTech website")}&body=${encodeURIComponent(body)}`;
