import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Pagamento confirmado | Agathas Web",
  robots: { index: false, follow: false },
};

const STRINGS: Record<Locale, {
  badge: string;
  heading: string;
  lead: string;
  voyiaTitle: string;
  voyiaBody: string;
  trafegoTitle: string;
  trafegoBody: string;
  genericTitle: string;
  genericBody: string;
  emailNote: string;
  ctaHome: string;
}> = {
  "pt-BR": {
    badge: "Pagamento confirmado",
    heading: "Recebemos o seu pagamento! 🎉",
    lead: "Obrigado por contratar a Agathas Web. Está tudo certo com a sua assinatura.",
    voyiaTitle: "Próximo passo: criar sua conta Voyia",
    voyiaBody: "Enviamos um e-mail com um link seguro e exclusivo para você criar a sua conta no Voyia. Confira sua caixa de entrada (e o spam, por via das dúvidas).",
    trafegoTitle: "Próximo passo: nosso time entra em contato",
    trafegoBody: "Nossa equipe de tráfego pago vai falar com você pelo WhatsApp em até 1 dia útil para iniciar o onboarding — alinhamento de metas, acessos e configuração.",
    genericTitle: "Próximos passos",
    genericBody: "Você vai receber um e-mail de confirmação com todos os detalhes da sua assinatura.",
    emailNote: "Não recebeu o e-mail em alguns minutos? Verifique a caixa de spam ou fale com a gente no WhatsApp.",
    ctaHome: "Voltar ao site",
  },
  es: {
    badge: "Pago confirmado",
    heading: "¡Recibimos tu pago! 🎉",
    lead: "Gracias por contratar a Agathas Web. Tu suscripción está confirmada.",
    voyiaTitle: "Próximo paso: crear tu cuenta Voyia",
    voyiaBody: "Te enviamos un correo con un enlace seguro y exclusivo para crear tu cuenta en Voyia. Revisa tu bandeja de entrada (y el spam).",
    trafegoTitle: "Próximo paso: nuestro equipo te contacta",
    trafegoBody: "Nuestro equipo te contactará por WhatsApp en hasta 1 día hábil para iniciar el onboarding.",
    genericTitle: "Próximos pasos",
    genericBody: "Recibirás un correo de confirmación con todos los detalles de tu suscripción.",
    emailNote: "¿No recibiste el correo? Revisa el spam o háblanos por WhatsApp.",
    ctaHome: "Volver al sitio",
  },
  "en-US": {
    badge: "Payment confirmed",
    heading: "We received your payment! 🎉",
    lead: "Thank you for choosing Agathas Web. Your subscription is confirmed.",
    voyiaTitle: "Next step: create your Voyia account",
    voyiaBody: "We sent you an email with a secure, exclusive link to create your Voyia account. Check your inbox (and spam folder).",
    trafegoTitle: "Next step: our team reaches out",
    trafegoBody: "Our paid traffic team will contact you on WhatsApp within 1 business day to start onboarding.",
    genericTitle: "Next steps",
    genericBody: "You'll receive a confirmation email with all your subscription details.",
    emailNote: "Didn't get the email? Check your spam folder or message us on WhatsApp.",
    ctaHome: "Back to site",
  },
  "en-GB": {
    badge: "Payment confirmed",
    heading: "We received your payment! 🎉",
    lead: "Thank you for choosing Agathas Web. Your subscription is confirmed.",
    voyiaTitle: "Next step: create your Voyia account",
    voyiaBody: "We sent you an email with a secure, exclusive link to create your Voyia account. Check your inbox (and spam folder).",
    trafegoTitle: "Next step: our team reaches out",
    trafegoBody: "Our paid traffic team will contact you on WhatsApp within 1 working day to start onboarding.",
    genericTitle: "Next steps",
    genericBody: "You'll receive a confirmation email with all your subscription details.",
    emailNote: "Didn't get the email? Check your spam folder or message us on WhatsApp.",
    ctaHome: "Back to site",
  },
};

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: PageProps<"/[lang]/pagamento/sucesso">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const sp = await searchParams;
  const categoria = typeof sp.categoria === "string" ? sp.categoria : "";
  const t = STRINGS[lang];

  const next =
    categoria === "voyia"
      ? { title: t.voyiaTitle, body: t.voyiaBody }
      : categoria === "trafego"
        ? { title: t.trafegoTitle, body: t.trafegoBody }
        : { title: t.genericTitle, body: t.genericBody };

  return (
    <main id="main-content" role="main">
      <section className="relative overflow-hidden bg-black min-h-[80vh] flex items-center py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 via-black to-black" />
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 50% 30%, rgba(34,197,94,0.35), transparent 55%)" }} />
        <div className="relative mx-auto max-w-2xl px-6 lg:px-8 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 border border-green-500/40">
            <svg className="h-10 w-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6">
            {t.badge}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">{t.heading}</h1>
          <p className="text-lg text-gray-300 mb-10">{t.lead}</p>

          <div className="bg-voyia-gray rounded-2xl border border-gray-700 p-7 text-left mb-8">
            <h2 className="text-lg font-semibold text-white mb-2">{next.title}</h2>
            <p className="text-sm text-gray-300 leading-relaxed">{next.body}</p>
          </div>

          <p className="text-xs text-gray-500 mb-8">{t.emailNote}</p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black px-7 py-3.5 rounded-lg font-bold transition-colors"
          >
            {t.ctaHome}
          </Link>
        </div>
      </section>
    </main>
  );
}
