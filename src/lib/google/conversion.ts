/**
 * Conversão do Google Ads no navegador.
 *
 * A tag base (`GoogleAdsTag`) só conta VISITA. Sem o disparo daqui, a campanha entrega
 * clique e nunca sabe quais viraram contato — que é o estado em que a conta do Google da
 * Pólitan gastou R$ 1.669 em 30 dias com "0 conversões" (ver `project_politan_rastreio_bloqueado`
 * no YESHUA). Repetir esse erro aqui custaria o mesmo dinheiro.
 *
 * Três cuidados que fazem a diferença entre medir e parecer medir:
 *
 * 1. **`transaction_id`** — leva o MESMO id de evento que o lead carrega no YESHUA. É o que
 *    permite subir a conversão offline depois (quando o lead vira cliente) sem que o Google
 *    conte duas vezes o mesmo negócio: ele casa o `transaction_id` e deduplica.
 *
 * 2. **Enhanced Conversions** — e-mail e telefone vão junto, e o próprio gtag os transforma
 *    em hash antes de sair do navegador. É o que recupera a conversão de quem bloqueia
 *    cookie de terceiro, hoje a maioria do tráfego móvel.
 *
 * 3. **Silêncio quando não configurado** — sem `NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL` nada
 *    dispara. Ambiente de desenvolvimento não pode injetar conversão falsa numa conta que
 *    decide onde o dinheiro é gasto.
 */

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim();
const LEAD_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL?.trim();

/** O rótulo é opaco e vem de env; um valor torto viraria `send_to` inválido e falha muda. */
const CONFIGURADO =
  !!ADS_ID && /^AW-\d{9,15}$/.test(ADS_ID) && !!LEAD_LABEL && /^[\w-]{10,40}$/.test(LEAD_LABEL);

type DadosConversao = {
  /** Mesmo id do evento do lead — a chave da deduplicação com a conversão offline. */
  eventId?: string | null;
  email?: string | null;
  telefone?: string | null;
  /** Valor estimado do lead. Sem ele o Google otimiza por volume, não por retorno. */
  valor?: number;
};

type GtagFn = (...args: unknown[]) => void;

function gtagDisponivel(): GtagFn | null {
  if (typeof window === "undefined") return null;

  const g = (window as unknown as { gtag?: GtagFn }).gtag;

  return typeof g === "function" ? g : null;
}

/**
 * Telefone em E.164, que é o único formato que o Google casa nas Enhanced Conversions.
 * "(62) 99247-1544" e "5562992471544" são a mesma pessoa e precisam virar o mesmo hash.
 */
function paraE164(telefone: string): string | null {
  const digitos = telefone.replace(/\D/g, "");

  if (digitos.length < 10) return null;

  return `+${digitos.length <= 11 ? `55${digitos}` : digitos}`;
}

export function dispararConversaoGoogle(dados: DadosConversao = {}): void {
  if (!CONFIGURADO) return;

  const gtag = gtagDisponivel();
  if (!gtag) return;

  const email = dados.email?.trim().toLowerCase();
  const telefone = dados.telefone ? paraE164(dados.telefone) : null;

  try {
    // Precisa vir ANTES do evento: o gtag lê o `user_data` corrente no momento do disparo.
    if (email || telefone) {
      gtag("set", "user_data", {
        ...(email ? { email } : {}),
        ...(telefone ? { phone_number: telefone } : {}),
      });
    }

    gtag("event", "conversion", {
      send_to: `${ADS_ID}/${LEAD_LABEL}`,
      ...(dados.eventId ? { transaction_id: dados.eventId } : {}),
      ...(dados.valor !== undefined ? { value: dados.valor, currency: "BRL" } : {}),
    });
  } catch {
    // Conversão é medição, não função do site: um erro aqui não pode derrubar o envio do
    // formulário nem impedir a pessoa de chegar ao WhatsApp.
  }
}
