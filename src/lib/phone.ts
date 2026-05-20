/**
 * Validação e máscara de telefone por país.
 *
 * Estratégia:
 *  - Locale default (sem +): assume Brasil. Aceita (XX) XXXX-XXXX (fixo)
 *    ou (XX) XXXXX-XXXX (celular). Auto-formata enquanto o user digita.
 *  - Com +: usa formato internacional E.164 leve (sem libphonenumber, que
 *    pesaria ~80kb no bundle). Aceita +DD <restante>, normaliza, valida
 *    comprimento mínimo (8) e máximo (15) dígitos.
 *
 * Anti-spam: rejeita números com 5+ dígitos repetidos em sequência
 * (999999, 000000, 111111, etc.) ou sequências triviais (12345678).
 */

const SUSPICIOUS_REPEATS = /(\d)\1{4,}/; // 5+ do mesmo dígito em sequência
const SUSPICIOUS_SEQUENCE = /(0123456789|9876543210|12345678|87654321)/;

export interface PhoneValidationResult {
  ok: boolean;
  /** Normalizado (apenas dígitos + opcionalmente "+" no início). */
  normalized: string | null;
  /** Mensagem amigável quando inválido. */
  error?: string;
  /** Pista do país detectado (heurística). */
  country?: "BR" | "INT";
}

/**
 * Valida e normaliza um telefone digitado pelo usuário.
 *
 * Regras:
 *  - Vazio ou < 8 dígitos: inválido.
 *  - Dígitos repetidos em massa (999999, 000000): rejeita.
 *  - BR (sem +): aceita 10 ou 11 dígitos (DDD + 8 ou 9 dígitos do número).
 *  - INT (com +): aceita 8-15 dígitos após o "+".
 */
export function validatePhone(input: string): PhoneValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, normalized: null, error: "Informe seu WhatsApp." };
  }

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length < 8) {
    return { ok: false, normalized: null, error: "Número muito curto. Digite com DDD." };
  }
  if (digits.length > 15) {
    return { ok: false, normalized: null, error: "Número muito longo." };
  }

  if (SUSPICIOUS_REPEATS.test(digits)) {
    return { ok: false, normalized: null, error: "Esse número parece inválido (dígitos repetidos)." };
  }
  if (SUSPICIOUS_SEQUENCE.test(digits)) {
    return { ok: false, normalized: null, error: "Esse número parece inválido (sequência trivial)." };
  }

  // Brasil sem +: precisa ter DDD válido (11-99). Aceita 10 (fixo) ou 11 (celular) dígitos.
  if (!hasPlus) {
    if (digits.length === 10 || digits.length === 11) {
      const ddd = parseInt(digits.slice(0, 2), 10);
      if (ddd < 11 || ddd > 99) {
        return { ok: false, normalized: null, error: "DDD inválido. Use 11 a 99." };
      }
      // Celular brasileiro novo: 9° dígito obrigatório como '9' quando tem 11 dígitos
      if (digits.length === 11 && digits[2] !== "9") {
        return { ok: false, normalized: null, error: "Celular brasileiro deve começar com 9 após o DDD." };
      }
      return { ok: true, normalized: `+55${digits}`, country: "BR" };
    }
    // Pode ser número internacional sem o + (ex: copiou e colou)
    if (digits.length >= 11) {
      return { ok: true, normalized: `+${digits}`, country: "INT" };
    }
    return { ok: false, normalized: null, error: "Número inválido. Use formato (XX) XXXXX-XXXX." };
  }

  // Internacional com +
  return { ok: true, normalized: `+${digits}`, country: "INT" };
}

/**
 * Máscara dinâmica para input — aplica formato conforme o user digita.
 *
 * Heurística:
 *  - Começa com "+": formato internacional → "+DD XXX XXX XXXX" (espaços a cada 3-4 dígitos)
 *  - Sem "+": assume BR
 *    - 10 dígitos: (XX) XXXX-XXXX
 *    - 11 dígitos: (XX) XXXXX-XXXX
 *
 * Sempre limita ao tamanho máximo plausível pra evitar lixo.
 */
export function maskPhone(input: string): string {
  if (!input) return "";
  const startsWithPlus = input.trim().startsWith("+");
  const digits = input.replace(/\D/g, "").slice(0, startsWithPlus ? 15 : 11);

  if (startsWithPlus) {
    // +DD (xxx) xxxx-xxxx pra países com 10 dígitos, ou genérico em blocos
    if (digits.length <= 2) return `+${digits}`;
    if (digits.length <= 5) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 9) return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}-${digits.slice(9)}`;
  }

  // BR
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  // 11 dígitos (celular novo)
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

// ============================================================
// E-mail anti-bot / anti-pegadinha
// ============================================================

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Domínios e padrões obviamente falsos. Não bloqueia free providers
 * legítimos como gmail, yahoo, etc — apenas o que é typicamente lixo
 * de quem tenta burlar formulário.
 */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "throwaway.email",
  "tempmail.com",
  "yopmail.com",
  "trashmail.com",
  "fakeinbox.com",
  "dispostable.com",
  "getnada.com",
  "maildrop.cc",
  "sharklasers.com",
  "spambox.us",
  "tempr.email",
  "tempmail.io",
  "tempinbox.com",
]);

const SUSPICIOUS_EMAIL_PATTERNS = [
  /^(test|teste|asdf|qwer|abc|xyz|fake|aaa+|nome|admin|noreply|no-reply)@/i,
  /^[a-z]@[a-z]\.[a-z]{2,4}$/i,        // a@b.com
  /^\d+@\d+\./,                          // 123@456.com
  /(\d)\1{5,}/,                          // 6+ do mesmo dígito (000000@...)
  /^(.)\1{4,}@/,                         // 5+ do mesmo char no local part (aaaaa@)
];

export interface EmailValidationResult {
  ok: boolean;
  normalized: string | null;
  error?: string;
}

export function validateEmail(input: string): EmailValidationResult {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return { ok: false, normalized: null, error: "Informe um e-mail." };
  }
  if (!EMAIL_RE.test(trimmed)) {
    return { ok: false, normalized: null, error: "Formato de e-mail inválido." };
  }

  for (const pattern of SUSPICIOUS_EMAIL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { ok: false, normalized: null, error: "Esse e-mail parece inválido. Use seu e-mail real." };
    }
  }

  const domain = trimmed.split("@")[1] ?? "";
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, normalized: null, error: "E-mails descartáveis não são aceitos. Use seu e-mail real." };
  }

  // Domínio precisa ter pelo menos um ponto e TLD com 2+ chars
  const tld = domain.split(".").pop() ?? "";
  if (tld.length < 2) {
    return { ok: false, normalized: null, error: "Domínio do e-mail inválido." };
  }

  return { ok: true, normalized: trimmed };
}

// ============================================================
// Nome
// ============================================================

export interface NameValidationResult {
  ok: boolean;
  normalized: string | null;
  error?: string;
}

// ============================================================
// CPF / CNPJ — validação de dígitos verificadores + máscara
// ============================================================

function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i], 10) * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== parseInt(cpf[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i], 10) * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  return d2 === parseInt(cpf[10], 10);
}

function isValidCnpj(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (len: number): number => {
    const weights = len === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(cnpj[i], 10) * weights[i];
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === parseInt(cnpj[12], 10) && calc(13) === parseInt(cnpj[13], 10);
}

export interface CpfCnpjValidationResult {
  ok: boolean;
  /** Apenas dígitos (11 para CPF, 14 para CNPJ). */
  normalized: string | null;
  error?: string;
}

/**
 * Valida CPF (11 dígitos) ou CNPJ (14 dígitos) checando os dígitos
 * verificadores. Pega documentos malformados antes de bater na ASAAS.
 */
export function validateCpfCnpj(input: string): CpfCnpjValidationResult {
  const digits = input.replace(/\D/g, "");
  if (!digits) {
    return { ok: false, normalized: null, error: "Informe o CPF ou CNPJ." };
  }
  if (digits.length === 11) {
    if (!isValidCpf(digits)) {
      return { ok: false, normalized: null, error: "CPF inválido — confira os números digitados." };
    }
    return { ok: true, normalized: digits };
  }
  if (digits.length === 14) {
    if (!isValidCnpj(digits)) {
      return { ok: false, normalized: null, error: "CNPJ inválido — confira os números digitados." };
    }
    return { ok: true, normalized: digits };
  }
  return { ok: false, normalized: null, error: "CPF precisa de 11 dígitos; CNPJ de 14." };
}

/**
 * Máscara dinâmica para CPF/CNPJ — aplica conforme o usuário digita.
 * Até 11 dígitos: 000.000.000-00. Acima: 00.000.000/0000-00.
 */
export function maskCpfCnpj(input: string): string {
  const d = input.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    // CPF: 000.000.000-00
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  }
  // CNPJ: 00.000.000/0000-00
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}

export function validateName(input: string): NameValidationResult {
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return { ok: false, normalized: null, error: "Informe seu nome." };
  }
  if (trimmed.length < 2) {
    return { ok: false, normalized: null, error: "Nome muito curto." };
  }
  // Rejeita lixo óbvio
  if (/^[a-z]{1,2}$/i.test(trimmed) || /^[\d\W]+$/.test(trimmed)) {
    return { ok: false, normalized: null, error: "Nome inválido." };
  }
  if (/(.)\1{6,}/i.test(trimmed)) {
    return { ok: false, normalized: null, error: "Nome inválido (caracteres repetidos)." };
  }
  // Precisa ter pelo menos uma letra
  if (!/[a-záàâãéèêíïóôõöúüçñA-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇÑ]/.test(trimmed)) {
    return { ok: false, normalized: null, error: "Nome precisa conter letras." };
  }
  return { ok: true, normalized: trimmed };
}
