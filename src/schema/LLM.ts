import * as z from "zod"
import { AnthropicSonnet37 } from "./anthropicSonnet37"
import { AnthropicSonnet4 } from "./anthropicSonnet4"
import { AnthropicSonnet45 } from "./anthropicSonnet45"
import { AutoSelectedLlm } from "./AutoSelectedLlm"
import { LLMTransformer } from "./LLMTransformer"
import { OpenAI41 } from "./openAI41"
import { OpenAI41Mini } from "./openAI41Mini"
import { OpenAI4oMini } from "./openAI4oMini"
import { OpenAI51 } from "./OpenAI51"
import { OpenAIo3 } from "./openAIo3"

export const LLM = LLMTransformer.transform(data => z.discriminatedUnion('jbai', [
  OpenAIo3,
  OpenAI4oMini,
  OpenAI41Mini,
  OpenAI41,
  OpenAI51,
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
    webSearchPrice: capabilities?.webSearchPrice ?? 0,
  },
})))
export type LLM = z.infer<typeof LLM>