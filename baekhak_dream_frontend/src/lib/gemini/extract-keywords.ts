/**
 * 꿈 문장에서 해몽 키워드 추출 (Gemini API)
 * 동음이의어는 문맥에 맞게 sense 구분하여 word(sense) 형식으로 반환
 * homonyms가 있으면 DB에 등재된 sense만 사용하도록 제한
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT_BASE = `당신은 꿈 해몽 사전용 키워드 추출기입니다.
해몽 사전에는 "명사"와 "구체적 사물/현상" 위주의 키워드만 등재되어 있습니다.
일반 동사(먹다, 가다, 나오다, 내리다 등)나 추상적 표현은 제외하고,
해몽에 해석 가능한 "사물·동물·자연현상·몸 부위" 등을 추출하세요.

규칙:
1. 반드시 명사 위주로 추출하세요. 동사는 제외.
   - "눈이 내린다" → 눈(설), 눈(눈물) 등 해당하는 명사
   - "고구마를 먹다" → 고구마만 (먹다 제외)
   - "춥다" → 추위 또는 해당하는 추상 명사
2. 동음이의어는 문맥에 맞는 sense만 괄호로 붙이세요.
3. 해몽 사전에 있을 법한 키워드만 추출. 애매하면 생략.
4. 결과는 반드시 JSON 배열로만 응답하세요. 다른 설명 없이 배열만 출력.
   형식: ["키워드1", "키워드2(sense)", ...]`;

/** homonym 맵을 프롬프트용 문자열로 변환 (길이 제한) */
function formatHomonymsForPrompt(homonyms: Record<string, string[]>): string {
  const entries = Object.entries(homonyms)
    .map(([word, senses]) => `${word}: ${senses.join(", ")}`)
    .join(" | ");
  const maxLen = 1500;
  return entries.length > maxLen ? entries.slice(0, maxLen) + "..." : entries;
}

export interface ExtractKeywordsResult {
  keywords: string[];
  raw?: string;
}

export interface ExtractKeywordsOptions {
  /** DB에 등재된 동음이의어: word -> [sense1, sense2, ...] */
  homonyms?: Record<string, string[]>;
}

/**
 * 꿈 문장에서 해몽 키워드 추출 (Gemini)
 * @param sentence 사용자 꿈 문장
 * @param options homonyms: DB 유효 sense 목록 (제공 시 해당 sense만 사용)
 */
export async function extractKeywordsFromDream(
  sentence: string,
  options?: ExtractKeywordsOptions
): Promise<ExtractKeywordsResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY가 설정되지 않았습니다. .env.local에 GEMINI_API_KEY를 추가해주세요."
    );
  }

  let systemPrompt = SYSTEM_PROMPT_BASE;
  const homonyms = options?.homonyms;
  if (homonyms && Object.keys(homonyms).length > 0) {
    const list = formatHomonymsForPrompt(homonyms);
    systemPrompt += `

[필수] 아래 목록에 있는 단어는 sense 없이 절대 출력하지 마세요. 반드시 괄호 안에 목록의 sense 중 하나를 붙여야 합니다.
- 잘못: "말" (X) → 올바름: "말(동물)" 또는 "말(사람)" (문맥에 맞는 것 선택)
- 예: 말을 탄다/말이 나온다 → 말(동물), 말을 하다/말이 나오다(언어) → 말(사람)
- 예: 눈이 온다 → 눈(설), 눈이 아프다 → 눈(몸)
유효 sense 목록: ${list}`;
  } else {
    systemPrompt += `

2-1. 동음이의어 sense 예: 배(선박), 배(과일), 눈(설), 눈(몸)`;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(sentence);
  const response = result.response;
  const text = response.text()?.trim() ?? "";

  const keywords = parseJsonArray(text);
  return { keywords, raw: text };
}

/** JSON 배열 파싱 (마크다운 코드블록 등 제거) */
function parseJsonArray(text: string): string[] {
  let cleaned = text.trim();

  // ```json ... ``` 또는 ``` ... ``` 제거
  const codeBlock = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    cleaned = codeBlock[1].trim();
  }

  try {
    const parsed = JSON.parse(cleaned) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((v): v is string => typeof v === "string")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    // JSON 파싱 실패 시 쉼표/공백으로 분리 시도
    const fallback = cleaned
      .replace(/^\[|\]$/g, "")
      .split(/[,，]/)
      .map((s) => s.replace(/^["'\s]+|["'\s]+$/g, "").trim())
      .filter(Boolean);
    return fallback;
  }
}
