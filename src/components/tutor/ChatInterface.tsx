"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ChatMessage, ConceptId } from "@/types/domain";
import { CONCEPTS } from "@/lib/domain";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  activeConceptId: ConceptId | null;
  conceptScore: number;
  isLoading: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onRetry: () => void;
  sessionGoal: string;
}

export function ChatInterface({
  messages,
  activeConceptId,
  conceptScore,
  isLoading,
  error,
  onSend,
  onRetry,
  sessionGoal,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    onSend(text);
  }

  const conceptName = activeConceptId ? CONCEPTS[activeConceptId].name : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header do chat */}
      <div className="flex-none px-4 py-3 border-b border-border space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {conceptName ?? "Carregando…"}
          </span>
          {activeConceptId && (
            <span className="text-xs text-muted-foreground">
              {conceptScore}/100
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground/60 truncate">{sessionGoal}</p>
      </div>

      {/* Mensagens */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-4">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {isLoading && (
            <div className="flex gap-2 items-start">
              <Avatar />
              <div className="space-y-2 flex-1 max-w-xs">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-3 rounded border border-destructive/30 bg-destructive/5">
              <p className="text-xs text-destructive flex-1">{error}</p>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 text-destructive hover:text-destructive"
                onClick={onRetry}
              >
                Tentar novamente
              </Button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex-none px-4 py-3 border-t border-border">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Responda aqui…"
            rows={2}
            className="resize-none text-sm flex-1"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="h-9 px-3 shrink-0"
          >
            Enviar
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 mt-1">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isTutor = message.role === "tutor";
  return (
    <div className={cn("flex gap-2 items-start", !isTutor && "flex-row-reverse")}>
      {isTutor && <Avatar />}
      <div
        className={cn(
          "max-w-[75%] rounded px-3 py-2 text-sm leading-relaxed",
          isTutor
            ? "bg-secondary text-foreground"
            : "bg-primary text-primary-foreground"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 mt-0.5">
      <span className="text-[10px] font-medium text-muted-foreground">E</span>
    </div>
  );
}
