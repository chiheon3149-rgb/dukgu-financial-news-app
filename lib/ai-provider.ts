/**
 * lib/ai-provider.ts
 * ==================
 * AI Provider 추상화 레이어
 *
 * 환경변수 AI_PROVIDER 로 provider를 선택합니다:
 *   AI_PROVIDER=claude  → Anthropic Claude API (기본값)
 *   AI_PROVIDER=ollama  → Ollama 로컬 LLM
 *
 * 사용법:
 *   const ai = getAIProvider()
 *   const text = await ai.complete("시스템 프롬프트", "유저 메시지")
 */

export interface AIProvider {
  /** 단순 텍스트 완성 */
  complete(systemPrompt: string, userMessage: string): Promise<string>
  /** 스트리밍 완성 (선택적 구현) */
  stream?(systemPrompt: string, userMessage: string): AsyncIterable<string>
}

// =============================================================================
// Claude (Anthropic) Provider
// =============================================================================

class ClaudeProvider implements AIProvider {
  private apiKey: string
  private model: string

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY ?? ""
    this.model  = process.env.CLAUDE_MODEL ?? "claude-opus-4-6"
  }

  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":            "application/json",
        "x-api-key":               this.apiKey,
        "anthropic-version":       "2023-06-01",
      },
      body: JSON.stringify({
        model:      this.model,
        max_tokens: 4096,
        system:     systemPrompt,
        messages:   [{ role: "user", content: userMessage }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Claude API 오류 (${res.status}): ${err}`)
    }

    const data = await res.json()
    return data.content?.[0]?.text ?? ""
  }

  async *stream(systemPrompt: string, userMessage: string): AsyncIterable<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      this.model,
        max_tokens: 4096,
        stream:     true,
        system:     systemPrompt,
        messages:   [{ role: "user", content: userMessage }],
      }),
    })

    if (!res.ok || !res.body) throw new Error(`Claude stream 오류: ${res.status}`)

    const reader  = res.body.getReader()
    const decoder = new TextDecoder()
    let   buffer  = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        const raw = line.slice(6).trim()
        if (raw === "[DONE]") return
        try {
          const event = JSON.parse(raw)
          if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
            yield event.delta.text
          }
        } catch { /* SSE 파싱 무시 */ }
      }
    }
  }
}

// =============================================================================
// Ollama (로컬 LLM) Provider
// =============================================================================

class OllamaProvider implements AIProvider {
  private baseUrl: string
  private model:   string

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"
    this.model   = process.env.OLLAMA_MODEL    ?? "llama3.2"
  }

  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model:  this.model,
        stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userMessage  },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Ollama API 오류 (${res.status}): ${err}`)
    }

    const data = await res.json()
    return data.message?.content ?? ""
  }

  async *stream(systemPrompt: string, userMessage: string): AsyncIterable<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model:  this.model,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userMessage  },
        ],
      }),
    })

    if (!res.ok || !res.body) throw new Error(`Ollama stream 오류: ${res.status}`)

    const reader  = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder.decode(value, { stream: true }).split("\n").filter(Boolean)
      for (const line of lines) {
        try {
          const event = JSON.parse(line)
          if (event.message?.content) yield event.message.content
          if (event.done) return
        } catch { /* NDJSON 파싱 무시 */ }
      }
    }
  }
}

// =============================================================================
// Factory — 환경변수로 provider 선택
// =============================================================================

let _provider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (_provider) return _provider

  const providerName = process.env.AI_PROVIDER ?? "claude"

  switch (providerName) {
    case "ollama":
      _provider = new OllamaProvider()
      break
    case "claude":
    default:
      _provider = new ClaudeProvider()
      break
  }

  return _provider
}

/** 테스트/개발용: provider를 수동으로 주입 */
export function setAIProvider(provider: AIProvider): void {
  _provider = provider
}
