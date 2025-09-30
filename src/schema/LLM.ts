import * as z from "zod"
import { AnthropicSonnet37 } from "./anthropicSonnet37.js"
import { AnthropicSonnet4 } from "./anthropicSonnet4.js"
import { AnthropicSonnet45 } from "./anthropicSonnet45.js"
import { AutoSelectedLlm } from "./AutoSelectedLlm.js"
import { LLMTransformer } from "./LLMTransformer.js"
import { OpenAI41Mini } from "./openAI41Mini.js"
import { OpenAI4oMini } from "./openAI4oMini.js"
import { OpenAIo3 } from "./openAIo3.js"

export const LLM = LLMTransformer.transform(data => z.discriminatedUnion('jbai', [
  OpenAIo3,
  OpenAI4oMini,
  OpenAI41Mini,
  AnthropicSonnet37,
  AnthropicSonnet4,
  AnthropicSonnet45,
  AutoSelectedLlm,
]).parse(data)).transform((({ inputPrice, outputPrice, cacheInputPrice, cacheCreateInputPrice, capabilities, ...data }) => ({
  ...data,
  groupName: `${ data.isSummarizer ? 'Summarizer' : 'Assistant' } (${ data.jbai })`,
  capabilities: {
    ...capabilities,
    inputPrice: inputPrice ?? capabilities?.inputPrice ?? 0,
    outputPrice: outputPrice ?? capabilities?.outputPrice ?? 0,
    cacheInputPrice: cacheInputPrice ?? capabilities?.cacheInputPrice ?? 0,
    cacheCreateInputPrice: cacheCreateInputPrice ?? capabilities?.cacheCreateInputPrice ?? capabilities?.cacheInputPrice ?? 0,
  },
})))
export type LLM = z.infer<typeof LLM>