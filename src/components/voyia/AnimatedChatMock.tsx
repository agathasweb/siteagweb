"use client";

import { useEffect, useState } from "react";

export interface ChatMessage {
  /** "bot" para mensagens recebidas, "user" para enviadas. */
  from: string;
  text: string;
}

interface Props {
  messages: readonly ChatMessage[];
  inputPlaceholder: string;
  /** Tempo (ms) antes da próxima mensagem aparecer. Padrão 1800. */
  messageDelayMs?: number;
  /** Tempo (ms) que o indicador "digitando" fica visível antes da mensagem. Padrão 1100. */
  typingDelayMs?: number;
}

/**
 * Mockup animado de inbox WhatsApp — mensagens aparecem progressivamente
 * com indicador "digitando…" antes de cada bot reply. Loopa infinitamente.
 *
 * Visualmente simula um atendimento real para reforçar a proposta do Voyia.
 */
export default function AnimatedChatMock({
  messages,
  inputPlaceholder,
  messageDelayMs = 1800,
  typingDelayMs = 1100,
}: Props) {
  // visibleCount = quantas mensagens já apareceram (0..messages.length)
  const [visibleCount, setVisibleCount] = useState(0);
  // typing = true quando o próximo "bot" está digitando
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (visibleCount >= messages.length) {
      // Loop: depois de mostrar todas, espera 3s e reseta
      const resetTimer = setTimeout(() => {
        setVisibleCount(0);
        setTyping(false);
      }, 3000);
      return () => clearTimeout(resetTimer);
    }

    const nextMessage = messages[visibleCount];
    const isBot = nextMessage.from === "bot";

    if (isBot) {
      // Mostra "digitando…" antes da mensagem do bot
      setTyping(true);
      const typingTimer = setTimeout(() => {
        setTyping(false);
        setVisibleCount((c) => c + 1);
      }, typingDelayMs);
      return () => clearTimeout(typingTimer);
    } else {
      // User: mensagem aparece depois de um delay (simulando digitação humana)
      const userTimer = setTimeout(() => {
        setVisibleCount((c) => c + 1);
      }, messageDelayMs);
      return () => clearTimeout(userTimer);
    }
  }, [visibleCount, messages, messageDelayMs, typingDelayMs]);

  return (
    <div className="space-y-3 min-h-[260px]">
      {messages.slice(0, visibleCount).map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} animate-chat-pop`}
        >
          <div
            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-md ${
              msg.from === "user"
                ? "bg-green-500 text-black rounded-br-sm font-medium"
                : "bg-gray-800 text-gray-100 rounded-bl-sm"
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}
      {typing && (
        <div className="flex justify-start animate-chat-pop">
          <div className="bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-md flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-400 animate-typing-dot" />
            <span className="w-2 h-2 rounded-full bg-gray-400 animate-typing-dot" style={{ animationDelay: "0.2s" }} />
            <span className="w-2 h-2 rounded-full bg-gray-400 animate-typing-dot" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-gray-800 flex items-center gap-2">
        <div className="flex-1 bg-gray-900 rounded-full px-4 py-2 text-xs text-gray-500">
          {inputPlaceholder}
        </div>
        <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
