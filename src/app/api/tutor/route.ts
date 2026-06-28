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
  if (mode === "tutor" || mode === "backtrack") {
    return `Você é Euler, um tutor de matemática direto e encorajador.
Você nunca menciona que é uma IA, modelo de linguagem ou qualquer tecnologia.
Comunique-se em português do Brasil, de forma conversacional e objetiva.
Nunca dê a resposta diretamente. Não faça perguntas além da que já foi apresentada.`;
  }
  return `Você é um avaliador preciso de respostas matemáticas.
Responda SOMENTE com JSON válido, sem texto adicional, sem markdown.
Seja tolerante com linguagem informal — o que importa é se o conceito foi demonstrado.`;
}

function buildUserPrompt(payload: LLMPayload): string {
  switch (payload.mode) {
    case "diagnostic": {
      return `Avalie se o aluno demonstrou compreensão do conceito.

PERGUNTA: ${payload.question}
RESPOSTA ESPERADA: ${payload.expectedAnswer}
RESPOSTA DO ALUNO: ${payload.studentAnswer}

Responda SOMENTE com este JSON (sem mais nada):
{"correct": true, "justification": "frase curta em português"}`;
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
- NÃO explique, resuma ou antecipe o conceito
- NÃO use "você já sabe que...", "lembre-se que..." ou qualquer pista da resposta
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
      return `${historyText ? `HISTÓRICO:\n${historyText}\n\n` : ""}Avalie a resposta do aluno.

CONCEITO: ${payload.conceptName}
PERGUNTA: ${payload.question}
RESPOSTA ESPERADA: ${payload.expectedAnswer}
RESPOSTA DO ALUNO: ${payload.studentAnswer}
NÍVEL DE HINT: ${payload.hintLevel}/3

Responda SOMENTE com este JSON (sem mais nada):
{"correct": true, "feedback": "1-2 frases diretas em português", "hint": "dica se errou"}

${payload.hintLevel >= 3 ? "A dica pode ser quase explícita, mas sem dar a resposta completa." : "A dica deve ser leve e instigante."}
Se acertou, omita o campo hint.`;
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
        temperature: payload.mode === "tutor" || payload.mode === "backtrack" ? 0.7 : 0.1,
        max_tokens: payload.mode === "tutor" || payload.mode === "backtrack" ? 1024 : 512,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Groq] Erro HTTP:", response.status, err);
      return NextResponse.json(
        { error: `Erro da API: ${response.status}` },
        { status: 502 }
      );
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
  if (payload.mode === "tutor" || payload.mode === "backtrack") {
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
