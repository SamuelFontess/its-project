import type { ConceptId, DiagnosticQuestion, TutorQuestion } from "@/types/domain";

// ─── Perguntas Diagnósticas (1 por conceito) ─────────────────────────────────
// Conteúdo pedagógico será revisado pelo Júlio. Estrutura definitiva.

export const DIAGNOSTIC_QUESTIONS: Record<ConceptId, DiagnosticQuestion> = {
  C1: {
    conceptId: "C1",
    question:
      "O que é uma função matemática? Explique com suas palavras.",
    expectedAnswer:
      "Uma função é uma relação entre dois conjuntos onde cada elemento do domínio está associado a exatamente um elemento do contradomínio.",
  },
  C2: {
    conceptId: "C2",
    question:
      "Cite duas formas de representar uma função além da expressão algébrica.",
    expectedAnswer:
      "Tabela de valores e gráfico cartesiano (também aceito: diagrama de setas, lista de pares ordenados).",
  },
  C3: {
    conceptId: "C3",
    question:
      "No plano cartesiano, o ponto (3, -2) está em qual quadrante?",
    expectedAnswer:
      "Quarto quadrante (x positivo, y negativo).",
  },
  C4: {
    conceptId: "C4",
    question:
      "Olhando para o gráfico de uma função, como você identifica o domínio?",
    expectedAnswer:
      "O domínio são os valores de x (eixo horizontal) para os quais o gráfico existe — a projeção do gráfico sobre o eixo x.",
  },
  C5: {
    conceptId: "C5",
    question:
      "Na função f(x) = 3x - 5, quais são o coeficiente angular e o coeficiente linear?",
    expectedAnswer:
      "Coeficiente angular (a) = 3; coeficiente linear (b) = -5.",
  },
  C6: {
    conceptId: "C6",
    question:
      "A função f(x) = 2x + 1 é crescente ou decrescente? Por quê?",
    expectedAnswer:
      "Crescente, pois o coeficiente angular é positivo (a = 2 > 0).",
  },
  C7: {
    conceptId: "C7",
    question:
      "O que diferencia uma função quadrática de uma função afim?",
    expectedAnswer:
      "Na função quadrática o termo de maior grau é x² (grau 2), enquanto na afim é x (grau 1). A quadrática tem a forma f(x) = ax² + bx + c com a ≠ 0.",
  },
  C8: {
    conceptId: "C8",
    question:
      "O gráfico de f(x) = x² - 4x + 3 abre para cima ou para baixo? Qual o vértice?",
    expectedAnswer:
      "Abre para cima (a = 1 > 0). Vértice: x = -b/2a = 2, y = f(2) = -1. Vértice = (2, -1).",
  },
  C9: {
    conceptId: "C9",
    question:
      "O que acontece com f(x) = 2^x quando x aumenta? E quando x tende a -∞?",
    expectedAnswer:
      "Quando x aumenta, f(x) cresce sem limite. Quando x tende a -∞, f(x) tende a 0 (assíntota horizontal y = 0).",
  },
  C10: {
    conceptId: "C10",
    question:
      "Qual o valor de log₂(8)?",
    expectedAnswer:
      "3, pois 2³ = 8.",
  },
  C11: {
    conceptId: "C11",
    question:
      "Se f(x) = 2x e g(x) = x + 1, qual é (f ∘ g)(3)?",
    expectedAnswer:
      "(f ∘ g)(3) = f(g(3)) = f(4) = 8.",
  },
  C12: {
    conceptId: "C12",
    question:
      "Qual é a função inversa de f(x) = 2x + 6?",
    expectedAnswer:
      "f⁻¹(x) = (x - 6) / 2.",
  },
};

// ─── Banco de Perguntas de Tutoria ───────────────────────────────────────────
// 3 perguntas por conceito (dificuldade 1, 2, 3).
// Conteúdo será revisado e expandido pelo Júlio.

export const TUTOR_QUESTIONS: Record<ConceptId, TutorQuestion[]> = {
  C1: [
    {
      id: "C1-1",
      conceptId: "C1",
      question: "O conjunto A = {1, 2, 3} e B = {a, b, c}. A relação {(1,a), (2,b), (3,c)} é uma função? Por quê?",
      expectedAnswer: "Sim, pois cada elemento de A está associado a exatamente um elemento de B.",
      difficulty: 1,
      hints: [
        "Pense: todo elemento do domínio tem imagem?",
        "Verifique se algum elemento do domínio aparece mais de uma vez no primeiro elemento dos pares.",
        "Uma função exige que cada x tenha exatamente uma imagem. Aqui, 1→a, 2→b, 3→c — sem repetição.",
      ],
    },
    {
      id: "C1-2",
      conceptId: "C1",
      question: "A relação {(1,a), (1,b), (2,c)} é uma função? Justifique.",
      expectedAnswer: "Não é função, pois o elemento 1 está associado a dois elementos distintos (a e b).",
      difficulty: 2,
      hints: [
        "Olhe o elemento 1 — quantas imagens ele tem?",
        "Na definição de função, cada elemento do domínio deve ter UMA ÚNICA imagem.",
        "O par (1,a) e (1,b) mostram que 1 tem duas imagens. Isso viola a definição de função.",
      ],
    },
    {
      id: "C1-3",
      conceptId: "C1",
      question: "Por que uma relação onde dois elementos diferentes do domínio têm a mesma imagem PODE ser função, mas dois pares com o mesmo x e y diferentes NÃO pode?",
      expectedAnswer: "Porque a condição de função é que cada x tenha uma única imagem. Dois x diferentes podem mapear para o mesmo y (função não injetora). Mas um x com dois y diferentes viola a unicidade da imagem.",
      difficulty: 3,
      hints: [
        "Pense em f(x) = x². Tanto f(2) quanto f(-2) dão 4 — isso é função?",
        "A restrição é sobre o domínio: cada entrada tem exatamente uma saída. Não há restrição sobre as saídas serem únicas.",
        "f(2)=4 e f(-2)=4 é ok (dois x com mesmo y). Mas se f(2)=4 E f(2)=5, aí temos um problema — qual é a imagem de 2?",
      ],
    },
  ],
  C2: [
    {
      id: "C2-1",
      conceptId: "C2",
      question: "Represente a função f(x) = x + 2 por uma tabela para x ∈ {0, 1, 2, 3}.",
      expectedAnswer: "x: 0,1,2,3 → f(x): 2,3,4,5.",
      difficulty: 1,
      hints: [
        "Substitua cada valor de x na expressão f(x) = x + 2.",
        "f(0) = 0 + 2 = 2. Calcule os demais.",
        "f(0)=2, f(1)=3, f(2)=4, f(3)=5.",
      ],
    },
    {
      id: "C2-2",
      conceptId: "C2",
      question: "Dado o diagrama de setas: 1→3, 2→5, 3→7. Qual é a lei de formação f(x)?",
      expectedAnswer: "f(x) = 2x + 1.",
      difficulty: 2,
      hints: [
        "Observe o padrão: de x para f(x), o quanto cresce?",
        "De 1 para 2 (x cresce 1), f(x) vai de 3 para 5 (cresce 2). Taxa = 2.",
        "Se a taxa é 2, f(x) = 2x + b. Use x=1, f(1)=3: 2(1)+b=3 → b=1.",
      ],
    },
    {
      id: "C2-3",
      conceptId: "C2",
      question: "Quais das seguintes representações descrevem a mesma função? (A) f(x) = 3x; (B) tabela {(1,3),(2,6),(3,9)}; (C) gráfico passando pela origem com inclinação 3.",
      expectedAnswer: "Todas as três representam a mesma função f(x) = 3x.",
      difficulty: 3,
      hints: [
        "Verifique se a tabela satisfaz f(x) = 3x para cada par.",
        "Um gráfico com inclinação 3 passando pela origem tem equação y = 3x.",
        "f(1)=3, f(2)=6, f(3)=9 — todos satisfazem f(x)=3x. As três são equivalentes.",
      ],
    },
  ],
  C3: [
    {
      id: "C3-1",
      conceptId: "C3",
      question: "Em qual quadrante está o ponto (-4, 7)?",
      expectedAnswer: "Segundo quadrante (x negativo, y positivo).",
      difficulty: 1,
      hints: [
        "Lembre: Q1 (+,+), Q2 (-,+), Q3 (-,-), Q4 (+,-).",
        "x = -4 (negativo), y = 7 (positivo).",
        "Negativo e positivo corresponde ao segundo quadrante.",
      ],
    },
    {
      id: "C3-2",
      conceptId: "C3",
      question: "Qual a distância entre os pontos A(1, 2) e B(4, 6)?",
      expectedAnswer: "5. Usando d = √((4-1)² + (6-2)²) = √(9+16) = √25 = 5.",
      difficulty: 2,
      hints: [
        "Use a fórmula da distância: d = √((x₂-x₁)² + (y₂-y₁)²).",
        "Δx = 3, Δy = 4. Calcule √(9 + 16).",
        "√25 = 5.",
      ],
    },
    {
      id: "C3-3",
      conceptId: "C3",
      question: "O gráfico de uma função passa pelos pontos (0, 3) e (2, 7). O ponto (1, 5) também pertence a esse gráfico se a função for linear?",
      expectedAnswer: "Sim. A taxa é (7-3)/(2-0) = 2, então f(x) = 2x + 3. f(1) = 5.",
      difficulty: 3,
      hints: [
        "Calcule a taxa de variação entre os dois pontos conhecidos.",
        "Taxa = (7-3)/(2-0) = 2. A função é f(x) = 2x + 3.",
        "f(1) = 2(1) + 3 = 5. O ponto (1, 5) está no gráfico.",
      ],
    },
  ],
  C4: [
    {
      id: "C4-1",
      conceptId: "C4",
      question: "Um gráfico existe apenas para x entre -2 e 5. Qual é o domínio da função?",
      expectedAnswer: "Domínio = [-2, 5] ou -2 ≤ x ≤ 5.",
      difficulty: 1,
      hints: [
        "Domínio são os valores de x para os quais o gráfico existe.",
        "Identifique o menor e o maior valor de x no gráfico.",
        "Do x = -2 até x = 5.",
      ],
    },
    {
      id: "C4-2",
      conceptId: "C4",
      question: "O gráfico de uma função tem valores de y entre -1 e 4. Qual é a imagem?",
      expectedAnswer: "Imagem = [-1, 4] ou -1 ≤ y ≤ 4.",
      difficulty: 2,
      hints: [
        "Imagem são os valores de y (saídas) que a função realmente assume.",
        "Observe os valores de y no gráfico: mínimo e máximo.",
        "Os valores de y vão de -1 a 4.",
      ],
    },
    {
      id: "C4-3",
      conceptId: "C4",
      question: "Para f(x) = √(x - 3), determine o domínio analiticamente.",
      expectedAnswer: "Domínio = [3, +∞). O radicando deve ser ≥ 0: x - 3 ≥ 0 → x ≥ 3.",
      difficulty: 3,
      hints: [
        "A raiz quadrada só está definida para radicandos não negativos.",
        "Resolva a inequação x - 3 ≥ 0.",
        "x ≥ 3, portanto domínio = [3, +∞).",
      ],
    },
  ],
  C5: [
    {
      id: "C5-1",
      conceptId: "C5",
      question: "Identifique o coeficiente angular e o coeficiente linear de f(x) = -2x + 7.",
      expectedAnswer: "a = -2 (coeficiente angular); b = 7 (coeficiente linear).",
      difficulty: 1,
      hints: [
        "A forma padrão da função afim é f(x) = ax + b.",
        "O coeficiente de x é a; o termo constante é b.",
        "a = -2, b = 7.",
      ],
    },
    {
      id: "C5-2",
      conceptId: "C5",
      question: "Encontre a função afim que passa pelos pontos (1, 5) e (3, 11).",
      expectedAnswer: "a = (11-5)/(3-1) = 3. Usando (1,5): 5 = 3(1) + b → b = 2. f(x) = 3x + 2.",
      difficulty: 2,
      hints: [
        "Calcule o coeficiente angular: a = (y₂ - y₁)/(x₂ - x₁).",
        "a = (11-5)/(3-1) = 3. Agora encontre b usando um dos pontos.",
        "5 = 3(1) + b → b = 2. Logo f(x) = 3x + 2.",
      ],
    },
    {
      id: "C5-3",
      conceptId: "C5",
      question: "Uma função afim f(x) = ax + b tem f(0) = 4 e f(2) = 0. Para quais valores de x temos f(x) > 0?",
      expectedAnswer: "a = (0-4)/(2-0) = -2; b = 4. f(x) = -2x + 4 > 0 → x < 2.",
      difficulty: 3,
      hints: [
        "Use f(0) = 4 para encontrar b, e f(2) = 0 para encontrar a.",
        "b = 4; a = (0-4)/(2-0) = -2. f(x) = -2x + 4.",
        "-2x + 4 > 0 → -2x > -4 → x < 2.",
      ],
    },
  ],
  C6: [
    {
      id: "C6-1",
      conceptId: "C6",
      question: "Onde a reta f(x) = 2x - 4 corta o eixo x?",
      expectedAnswer: "x = 2. Faça f(x) = 0: 2x - 4 = 0 → x = 2.",
      difficulty: 1,
      hints: [
        "A reta corta o eixo x quando y = 0.",
        "Resolva 2x - 4 = 0.",
        "2x = 4 → x = 2.",
      ],
    },
    {
      id: "C6-2",
      conceptId: "C6",
      question: "Esboce mentalmente (ou descreva) o gráfico de f(x) = -x + 3. Ele é crescente ou decrescente?",
      expectedAnswer: "Decrescente, pois a = -1 < 0. Corta y em (0, 3) e x em (3, 0).",
      difficulty: 2,
      hints: [
        "O sinal de a determina se a reta sobe ou desce da esquerda para a direita.",
        "a = -1, portanto a função decresce.",
        "Corta eixo y em b = 3 e eixo x em x = 3.",
      ],
    },
    {
      id: "C6-3",
      conceptId: "C6",
      question: "Duas retas f(x) = 2x + 1 e g(x) = 2x - 3 são paralelas, perpendiculares ou se cruzam?",
      expectedAnswer: "Paralelas, pois têm o mesmo coeficiente angular (a = 2) e coeficientes lineares diferentes.",
      difficulty: 3,
      hints: [
        "Compare os coeficientes angulares das duas retas.",
        "Retas paralelas têm o mesmo coeficiente angular e nunca se cruzam.",
        "a₁ = a₂ = 2 e b₁ ≠ b₂ → retas paralelas.",
      ],
    },
  ],
  C7: [
    {
      id: "C7-1",
      conceptId: "C7",
      question: "f(x) = x² - 5x + 6. Identifique os coeficientes a, b e c.",
      expectedAnswer: "a = 1, b = -5, c = 6.",
      difficulty: 1,
      hints: [
        "A forma padrão é f(x) = ax² + bx + c.",
        "Compare com x² - 5x + 6.",
        "a = 1 (coef. de x²), b = -5 (coef. de x), c = 6 (constante).",
      ],
    },
    {
      id: "C7-2",
      conceptId: "C7",
      question: "Calcule o discriminante de f(x) = x² - 4x + 3 e diga quantas raízes reais ela tem.",
      expectedAnswer: "Δ = b² - 4ac = 16 - 12 = 4 > 0. Duas raízes reais distintas.",
      difficulty: 2,
      hints: [
        "Δ = b² - 4ac. Substitua a = 1, b = -4, c = 3.",
        "Δ = 16 - 12 = 4.",
        "Δ > 0 → duas raízes reais distintas.",
      ],
    },
    {
      id: "C7-3",
      conceptId: "C7",
      question: "Encontre as raízes de f(x) = 2x² - 8.",
      expectedAnswer: "2x² - 8 = 0 → x² = 4 → x = ±2.",
      difficulty: 3,
      hints: [
        "Não há termo em x, então isole x².",
        "2x² = 8 → x² = 4.",
        "x = √4 = ±2.",
      ],
    },
  ],
  C8: [
    {
      id: "C8-1",
      conceptId: "C8",
      question: "O gráfico de f(x) = x² abre para cima ou para baixo? Qual o vértice?",
      expectedAnswer: "Abre para cima (a = 1 > 0). Vértice em (0, 0).",
      difficulty: 1,
      hints: [
        "O sinal de a determina a abertura da parábola.",
        "a = 1 > 0 → abre para cima.",
        "Vértice: xv = -b/2a = 0, yv = f(0) = 0.",
      ],
    },
    {
      id: "C8-2",
      conceptId: "C8",
      question: "Encontre o vértice de f(x) = x² - 6x + 5.",
      expectedAnswer: "xv = 6/2 = 3; yv = 9 - 18 + 5 = -4. Vértice = (3, -4).",
      difficulty: 2,
      hints: [
        "xv = -b/2a.",
        "xv = 6/2 = 3. Agora calcule f(3).",
        "f(3) = 9 - 18 + 5 = -4. Vértice = (3, -4).",
      ],
    },
    {
      id: "C8-3",
      conceptId: "C8",
      question: "Uma parábola tem vértice em (2, -3) e passa pelo ponto (0, 1). Qual é sua equação?",
      expectedAnswer: "f(x) = a(x-2)² - 3. Usando (0,1): 1 = 4a - 3 → a = 1. f(x) = (x-2)² - 3 = x² - 4x + 1.",
      difficulty: 3,
      hints: [
        "Use a forma vértice: f(x) = a(x - xv)² + yv.",
        "Substitua o ponto (0, 1) para encontrar a.",
        "1 = a(0-2)² - 3 = 4a - 3 → a = 1.",
      ],
    },
  ],
  C9: [
    {
      id: "C9-1",
      conceptId: "C9",
      question: "Calcule f(3) para f(x) = 2^x.",
      expectedAnswer: "f(3) = 2³ = 8.",
      difficulty: 1,
      hints: [
        "Substitua x = 3 na expressão.",
        "2^3 = 2 × 2 × 2.",
        "= 8.",
      ],
    },
    {
      id: "C9-2",
      conceptId: "C9",
      question: "Para qual valor de x temos 3^x = 81?",
      expectedAnswer: "x = 4, pois 3⁴ = 81.",
      difficulty: 2,
      hints: [
        "Expresse 81 como potência de 3.",
        "81 = 3 × 27 = 3 × 3³ = 3⁴.",
        "3^x = 3⁴ → x = 4.",
      ],
    },
    {
      id: "C9-3",
      conceptId: "C9",
      question: "Compare as funções f(x) = 2^x e g(x) = (1/2)^x. O que acontece com cada uma quando x → +∞?",
      expectedAnswer: "f(x) = 2^x cresce sem limite (base > 1). g(x) = (1/2)^x tende a 0 (base < 1). São simétricas em relação ao eixo y.",
      difficulty: 3,
      hints: [
        "Uma base maior que 1 gera crescimento; base entre 0 e 1 gera decrescimento.",
        "Note que (1/2)^x = 2^(-x) — é o reflexo de f no eixo y.",
        "f(x) → +∞ e g(x) → 0 quando x → +∞.",
      ],
    },
  ],
  C10: [
    {
      id: "C10-1",
      conceptId: "C10",
      question: "Calcule log₁₀(1000).",
      expectedAnswer: "3, pois 10³ = 1000.",
      difficulty: 1,
      hints: [
        "log_b(x) = n significa b^n = x.",
        "Qual potência de 10 dá 1000?",
        "10³ = 1000, portanto log₁₀(1000) = 3.",
      ],
    },
    {
      id: "C10-2",
      conceptId: "C10",
      question: "Simplifique: log₂(32) - log₂(4).",
      expectedAnswer: "log₂(32/4) = log₂(8) = 3.",
      difficulty: 2,
      hints: [
        "Use a propriedade: logₐ(m) - logₐ(n) = logₐ(m/n).",
        "log₂(32/4) = log₂(8).",
        "2³ = 8, portanto log₂(8) = 3.",
      ],
    },
    {
      id: "C10-3",
      conceptId: "C10",
      question: "Resolva: log₃(x² - 2x) = 1.",
      expectedAnswer: "3¹ = x² - 2x → x² - 2x - 3 = 0 → (x-3)(x+1) = 0. x = 3 (x = -1 inválido pois log não aceita negativo).",
      difficulty: 3,
      hints: [
        "Converta para forma exponencial: 3¹ = x² - 2x.",
        "Resolva x² - 2x - 3 = 0.",
        "Raízes: x = 3 e x = -1. Verifique qual é válida no domínio do log.",
      ],
    },
  ],
  C11: [
    {
      id: "C11-1",
      conceptId: "C11",
      question: "Se f(x) = x + 3 e g(x) = 2x, calcule (f ∘ g)(4).",
      expectedAnswer: "(f ∘ g)(4) = f(g(4)) = f(8) = 11.",
      difficulty: 1,
      hints: [
        "f ∘ g significa aplicar g primeiro, depois f.",
        "g(4) = 8.",
        "f(8) = 8 + 3 = 11.",
      ],
    },
    {
      id: "C11-2",
      conceptId: "C11",
      question: "Se f(x) = x² e g(x) = x - 1, qual é (g ∘ f)(x)?",
      expectedAnswer: "(g ∘ f)(x) = g(f(x)) = g(x²) = x² - 1.",
      difficulty: 2,
      hints: [
        "g ∘ f significa aplicar f primeiro, depois g.",
        "f(x) = x². Agora aplique g.",
        "g(x²) = x² - 1.",
      ],
    },
    {
      id: "C11-3",
      conceptId: "C11",
      question: "Mostre que (f ∘ g) ≠ (g ∘ f) para f(x) = 2x e g(x) = x + 5.",
      expectedAnswer: "(f∘g)(x) = 2(x+5) = 2x+10. (g∘f)(x) = 2x+5. São diferentes (composição não é comutativa em geral).",
      difficulty: 3,
      hints: [
        "Calcule (f∘g)(x) = f(g(x)) e (g∘f)(x) = g(f(x)) separadamente.",
        "(f∘g)(x) = f(x+5) = 2(x+5) = 2x+10.",
        "(g∘f)(x) = g(2x) = 2x+5. Claramente 2x+10 ≠ 2x+5.",
      ],
    },
  ],
  C12: [
    {
      id: "C12-1",
      conceptId: "C12",
      question: "Qual é a função inversa de f(x) = x + 4?",
      expectedAnswer: "f⁻¹(x) = x - 4.",
      difficulty: 1,
      hints: [
        "Para encontrar a inversa, troque x por y e isole y.",
        "x = y + 4 → y = x - 4.",
        "f⁻¹(x) = x - 4.",
      ],
    },
    {
      id: "C12-2",
      conceptId: "C12",
      question: "Encontre a inversa de f(x) = 3x - 6.",
      expectedAnswer: "y = 3x - 6 → x = 3y - 6 → y = (x + 6)/3. f⁻¹(x) = (x + 6)/3.",
      difficulty: 2,
      hints: [
        "Escreva y = 3x - 6 e troque x e y.",
        "x = 3y - 6 → 3y = x + 6.",
        "y = (x + 6)/3.",
      ],
    },
    {
      id: "C12-3",
      conceptId: "C12",
      question: "Verifique se f⁻¹(x) = (x + 6)/3 é de fato a inversa de f(x) = 3x - 6.",
      expectedAnswer: "(f ∘ f⁻¹)(x) = f((x+6)/3) = 3·(x+6)/3 - 6 = x+6-6 = x. ✓ Também (f⁻¹ ∘ f)(x) = ((3x-6)+6)/3 = 3x/3 = x. ✓",
      difficulty: 3,
      hints: [
        "A inversa satisfaz (f ∘ f⁻¹)(x) = x e (f⁻¹ ∘ f)(x) = x.",
        "Calcule f(f⁻¹(x)) = f((x+6)/3).",
        "= 3·(x+6)/3 - 6 = x + 6 - 6 = x. ✓",
      ],
    },
  ],
};

/** Retorna as perguntas de tutoria de um conceito, ordenadas por dificuldade. */
export function getQuestionsForConcept(conceptId: ConceptId): TutorQuestion[] {
  return [...(TUTOR_QUESTIONS[conceptId] ?? [])].sort(
    (a, b) => a.difficulty - b.difficulty
  );
}

/** Seleciona uma pergunta não usada na sessão para um conceito.
 *  Se todas foram usadas, reinicia priorizando as de maior dificuldade. */
export function selectQuestion(
  conceptId: ConceptId,
  usedIds: Set<string>
): TutorQuestion {
  const questions = getQuestionsForConcept(conceptId);
  const unused = questions.filter((q) => !usedIds.has(q.id));

  if (unused.length > 0) return unused[0];

  // Banco esgotado: reinicia priorizando maior dificuldade
  return [...questions].sort((a, b) => b.difficulty - a.difficulty)[0];
}
