import * as z from "zod"
import { AnthropicClaude45Opus } from "./anthropicClaude45Opus"
import { AnthropicClaude46Opus } from "./anthropicClaude46Opus"
import { AnthropicSonnet37 } from "./anthropicSonnet37"
import { AnthropicSonnet4 } from "./anthropicSonnet4"
import { AnthropicSonnet45 } from "./anthropicSonnet45"
import { AnthropicSonnet46 } from "./anthropicSonnet46"
import { Gemini31Pro } from "./Gemini31Pro"
import { Gemini3Flash } from "./Gemini3Flash"
import { Grok41Fast } from "./grok41fast"
import { OpenAI4o } from "./openAI4o"
import { OpenAI5 } from "./openAI5"
import { Gemini3Pro } from "./Gemini3Pro"
import { LLMTransformer } from "./LLMTransformer"
import { OpenAI41 } from "./openAI41"
import { OpenAI41Mini } from "./openAI41Mini"
import { OpenAI4oMini } from "./openAI4oMini"
import { OpenAI51 } from "./openAI51"
import { OpenAI52 } from "./openAI52"
import { OpenAI51CodexMax } from "./openAI51CodexMax"
import { OpenAI52Codex } from "./openAI52Codex"
import { OpenAIo3 } from "./openAIo3"

const LLMDiscriminatedUnion = z.discriminatedUnion('jbai', [
  OpenAIo3,
  OpenAI4oMini,
  OpenAI41Mini,
  OpenAI4o,
  OpenAI41,
  OpenAI5,
  OpenAI51,
  OpenAI52,
  OpenAI51CodexMax,
  OpenAI52Codex,
  AnthropicSonnet37,
  AnthropicSonnet4,
  AnthropicSonnet45,
  AnthropicSonnet46,
  AnthropicClaude45Opus,
  AnthropicClaude46Opus,
  Gemini3Flash,
  Gemini3Pro,
  Gemini31Pro,
  Grok41Fast,
])

export const LLM = LLMTransformer.transform((data, ctx) => {
  const result = LLMDiscriminatedUnion.safeParse(data)
  if (!result.success) {
    result.error.issues.forEach(issue => ctx.addIssue({
      code: 'custom',
      message: issue.message,
      path: issue.path,
    }))
    return z.NEVER
  }
  return result.data
}).transform((({ inputPrice, outputPrice, cacheInputPrice, cacheCreateInputPrice, capabilities, ...data }) => ({
  ...data,
  capabilities: {
    ...capabilities,
    inputPrice: inputPrice ?? capabilities?.inputPrice ?? 0,
    outputPrice: outputPrice ?? capabilities?.outputPrice ?? 0,
    cacheInputPrice: cacheInputPrice ?? capabilities?.cacheInputPrice ?? 0,
    cacheCreateInputPrice: cacheCreateInputPrice ?? capabilities?.cacheCreateInputPrice ?? capabilities?.cacheInputPrice ?? 0,
    webSearchPrice: capabilities?.webSearchPrice ?? 0,
  },
})))
export type LLM = z.infer<typeof LLM>