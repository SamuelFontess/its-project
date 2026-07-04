import { NextRequest, NextResponse } from "next/server";
import type {
  LLMPayload,
  DiagnosticLLMResponse,
  EvaluationLLMResponse,
} from "@/types/domain";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

// ─── Builders de Prompt ───────────────────────────────────────────────────────

function buildSystemPrompt(mode: LLMPayload["mode"]): string {
  if (mode === "tutor" || mode === "backtrack" || mode === "conversation") {
    return `Você é Euler, um tutor de matemática direto e encorajador.
Você nunca menciona que é uma IA, modelo de linguagem ou qualquer tecnologia.
Comunique-se em português do Brasil, de forma conversacional e objetiva.
Nunca dê a resposta diretamente. Não faça perguntas além da que já foi apresentada.`;
  }
  return `Você é um avaliador de compreensão matemática.
Responda SOMENTE com JSON válido, sem texto adicional, sem markdown.
Avalie se o conceito foi compreendido — linguagem informal, resposta curta ou palavras diferentes do gabarito são irrelevantes se a ideia central estiver correta.
NUNCA revele, repita ou parafraseie o gabarito no campo feedback.`;
}

function buildUserPrompt(payload: LLMPayload): string {
  switch (payload.mode) {
    case "diagnostic": {
      return `Avalie se o aluno demonstrou compreensão do conceito.

PERGUNTA: ${payload.question}
RESPOSTA ESPERADA: ${payload.expectedAnswer}
RESPOSTA DO ALUNO: ${payload.studentAnswer}

Responda SOMENTE com este JSON (sem mais nada):
{"correct": true}`;
    }

    case "tutor": {
      const historyText =
        payload.history.length > 0
          ? payload.history
              .map((m) => `${m.role === "tutor" ? "Euler" : "Aluno"}: ${m.content}`)
              .join("\n")
          : "";

      const manualNote = payload.manualWithLowScore
        ? `\nOBSERVAÇÃO: o aluno escolheu explorar este conceito por conta própria, mas já tentou antes e o score está baixo. Reconheça brevemente a escolha com uma frase positiva ("você escolheu explorar X — vamos ver o que você já sabe") e siga para a pergunta. Não avise que pode ser difícil nem sugira outro caminho.`
        : "";

      return `${historyText ? `HISTÓRICO:\n${historyText}\n\n` : ""}CONTEXTO:
- Aluno: ${payload.studentName}
- Conceito em estudo: ${payload.conceptName}
- Score atual: ${payload.conceptScore}/100
- Tentativas: ${payload.attempts}
- Nível: ${payload.studentLevel}/5
- Meta da sessão: ${payload.sessionGoal}
${manualNote}
PERGUNTA A APRESENTAR: ${payload.question}

Apresente EXATAMENTE esta pergunta ao aluno, de forma conversacional. Regras obrigatórias:
- Escreva no máximo 1 frase de introdução e depois a pergunta literal do banco
- A frase de introdução fala apenas sobre o contexto da sessão (conceito, nome do aluno) — NUNCA menciona a resposta, a lógica por trás da pergunta ou qualquer pista do que o aluno deve responder
- NÃO explique, resuma ou antecipe o conceito
- NÃO use "você já sabe que...", "lembre-se que...", "vamos entender por que X acontece..." ou qualquer estrutura que revele a resposta
- NÃO termine sem incluir a pergunta completa
- Score < 40: tom acolhedor; score >= 60: tom desafiador`;
    }

    case "evaluation": {
      const historyText =
        payload.history.length > 0
          ? payload.history
              .map((m) => `${m.role === "tutor" ? "Euler" : "Aluno"}: ${m.content}`)
              .join("\n")
          : "";

      const nudge =
        payload.conversationalTurns >= 2
          ? "\n- Ao final da explicação, encoraje gentilmente o aluno a tentar responder agora"
          : "";

      return `${historyText ? `HISTÓRICO:\n${historyText}\n\n` : ""}CONCEITO: ${payload.conceptName}
PERGUNTA FEITA AO ALUNO: ${payload.question}
GABARITO (uso interno — NUNCA revelar): ${payload.expectedAnswer}
MENSAGEM DO ALUNO: ${payload.studentAnswer}
TENTATIVAS COM DICA: ${payload.hintLevel}/3

TAREFA: Determine se o aluno está tentando responder à pergunta OU pedindo ajuda/explicação/esclarecimento.

Se for TENTATIVA DE RESPOSTA (afirmação, resposta direta, mesmo que incerta):
- correct: true se demonstrou a ideia central, mesmo com palavras diferentes ou resposta curta
- correct: false se a resposta está errada conceitualmente, vaga ("não sei", "talvez") ou em branco
- Feedback de ACERTO: confirmação natural em 1 frase; varie o estilo (confirmação direta, elogio ao raciocínio, etc.)
- Feedback de ERRO: aponte o que está faltando ou errado — NUNCA cite o gabarito, nunca diga "a resposta correta é..."
Responda: {"type": "answer", "correct": true/false, "feedback": "..."}

Se for DÚVIDA ou PEDIDO DE EXPLICAÇÃO (pergunta, "não entendi", "pode explicar", "por que errei", etc.):
- Explique o conceito ou esclareça a dúvida sem revelar a resposta à pergunta
- Máximo 3 frases, tom de tutor direto e encorajador${nudge}
- NUNCA revele o gabarito nem a resposta esperada
Responda: {"type": "conversation", "response": "..."}

Responda SOMENTE com JSON válido, sem texto adicional.`;
    }

    case "conversation": {
      const historyText =
        payload.history.length > 0
          ? payload.history
              .map((m) => `${m.role === "tutor" ? "Euler" : "Aluno"}: ${m.content}`)
              .join("\n")
          : "";

      const nudge =
        payload.conversationalTurns >= 2
          ? "\n- Ao final, encoraje o aluno a tentar responder quando se sentir pronto"
          : "";

      return `${historyText ? `HISTÓRICO:\n${historyText}\n\n` : ""}CONTEXTO:
- Conceito em estudo: ${payload.conceptName}
- Pergunta que foi feita ao aluno: ${payload.question}
- Mensagem do aluno: ${payload.studentMessage}

O aluno está tirando uma dúvida ou pedindo explicação. Responda como Euler:
- Explique o CONCEITO GERAL (o que é, como funciona, por que importa) sem responder à pergunta diretamente
- Use analogia simples ou exemplo concreto se ajudar
- Máximo 3 frases${nudge}
- NUNCA responda à pergunta feita ao aluno — apenas prepare o terreno para que ele pense`;
    }

    case "backtrack": {
      return `Contexto:
- Aluno: ${payload.studentName}
- Conceito que tentou: ${payload.currentConceptName}
- Conceito para revisitar: ${payload.prereqConceptName}
- Score atual: ${payload.conceptScore}/100

Gere uma mensagem encorajadora (2-3 frases) explicando que vão revisitar o conceito anterior. Tom positivo, sem parecer punição. Use o nome do aluno.`;
    }
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY não configurada no .env.local" },
      { status: 500 }
    );
  }

  let payload: LLMPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const messages = [
    { role: "system", content: buildSystemPrompt(payload.mode) },
    { role: "user", content: buildUserPrompt(payload) },
  ];

  let raw: string;
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: payload.mode === "tutor" || payload.mode === "backtrack" || payload.mode === "conversation" ? 0.7 : 0.1,
        max_tokens: payload.mode === "tutor" || payload.mode === "backtrack" || payload.mode === "conversation" ? 1024 : 512,
      }),
    });

    if (!response.ok) {
      let groqMsg = "";
      try {
        const errBody = await response.json();
        groqMsg = errBody?.error?.message ?? JSON.stringify(errBody);
      } catch {
        groqMsg = await response.text().catch(() => "");
      }
      console.error("[Groq] Erro HTTP:", response.status, groqMsg);

      let userError = "Serviço de IA temporariamente indisponível. Tente novamente.";
      if (response.status === 429) {
        userError = "Limite de requisições atingido. Aguarde alguns segundos e tente novamente.";
      } else if (response.status === 401 || response.status === 403) {
        userError = "Erro de autenticação com o serviço de IA. Contate o suporte.";
      }

      return NextResponse.json({ error: userError }, { status: 502 });
    }

    const data = await response.json();
    raw = data.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    console.error("[Groq] Erro de rede:", err);
    return NextResponse.json(
      { error: "Erro de conexão com o serviço de IA" },
      { status: 502 }
    );
  }

  // Modos texto livre
  if (payload.mode === "tutor" || payload.mode === "backtrack" || payload.mode === "conversation") {
    return NextResponse.json({ text: raw });
  }

  // Modos JSON estruturado
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed: DiagnosticLLMResponse | EvaluationLLMResponse = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch {
    console.error("[Groq] JSON malformado:", raw);
    // Tenta extrair JSON embutido no texto
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return NextResponse.json(JSON.parse(match[0]));
      } catch { /* continua */ }
    }
    return NextResponse.json(
      { error: "Resposta inesperada do modelo", raw },
      { status: 502 }
    );
  }
}
