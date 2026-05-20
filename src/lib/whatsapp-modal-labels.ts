import type { Locale } from "./i18n";

export interface WhatsAppModalLabels {
  modalTitle: string;
  modalLead: string;
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  privacy: string;
  cancel: string;
  submit: string;
  recaptchaNote: string;
}

export const WHATSAPP_MODAL_LABELS: Record<Locale, WhatsAppModalLabels> = {
  "pt-BR": {
    modalTitle: "Vamos conversar no WhatsApp",
    modalLead: "Deixe seus dados pra eu já chegar com contexto. Leva 15 segundos.",
    name: "Nome", namePlaceholder: "Seu nome completo",
    email: "E-mail", emailPlaceholder: "voce@empresa.com",
    phone: "WhatsApp", phonePlaceholder: "(XX) XXXXX-XXXX",
    privacy: "Aceito que meus dados sejam usados para contato sobre esta solicitação.",
    cancel: "Cancelar", submit: "Abrir WhatsApp",
    recaptchaNote: "Protegido por reCAPTCHA do Google.",
  },
  es: {
    modalTitle: "Hablemos por WhatsApp",
    modalLead: "Déjanos tus datos para llegar con contexto. 15 segundos.",
    name: "Nombre", namePlaceholder: "Tu nombre completo",
    email: "E-mail", emailPlaceholder: "tu@empresa.com",
    phone: "WhatsApp", phonePlaceholder: "+34 600 000 000",
    privacy: "Acepto que mis datos sean usados para contacto sobre esta solicitud.",
    cancel: "Cancelar", submit: "Abrir WhatsApp",
    recaptchaNote: "Protegido por reCAPTCHA de Google.",
  },
  "en-US": {
    modalTitle: "Let's chat on WhatsApp",
    modalLead: "Leave your details so I can arrive with context. 15 seconds.",
    name: "Name", namePlaceholder: "Your full name",
    email: "Email", emailPlaceholder: "you@company.com",
    phone: "WhatsApp", phonePlaceholder: "+1 555 123 4567",
    privacy: "I agree to my data being used to contact me about this request.",
    cancel: "Cancel", submit: "Open WhatsApp",
    recaptchaNote: "Protected by Google reCAPTCHA.",
  },
  "en-GB": {
    modalTitle: "Let's chat on WhatsApp",
    modalLead: "Leave your details so I can arrive with context. 15 seconds.",
    name: "Name", namePlaceholder: "Your full name",
    email: "Email", emailPlaceholder: "you@company.com",
    phone: "WhatsApp", phonePlaceholder: "+44 7700 900000",
    privacy: "I agree to my data being used to contact me about this request.",
    cancel: "Cancel", submit: "Open WhatsApp",
    recaptchaNote: "Protected by Google reCAPTCHA.",
  },
};
