import * as z from "zod"
import { AnthropicSonnet37 } from "./anthropicSonnet37.js"
import { AnthropicSonnet4 } from "./anthropicSonnet4.js"
import { AutoSelectedLlm } from "./AutoSelectedLlm.js"
import { LLMTransformer } from "./LLMTransformer.js"
import { OpenAI4oMini } from "./openAI4oMini.js"
import { OpenAIo3 } from "./openAIo3.js"

export const LLM = LLMTransformer.transform(data => z.discriminatedUnion('jbai', [
  OpenAIo3,
  OpenAI4oMini,
  AnthropicSonnet37,
  AnthropicSonnet4,
  AutoSelectedLlm,
]).parse(data)).transform((data => ({
  ...data,
  groupName: `${ data.isSummarizer ? 'Summarizer' : 'Assistant' } (${ data.jbai })`
})))