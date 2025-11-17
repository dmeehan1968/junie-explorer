// Need to do manual discrimination because there are multiple data formats and models and not a singular way to
// discriminate and then transform them.  So this is a two part process, transform them into common formats
// and then use a discriminated union to parse them so that the output type narrows correctly.
import * as z from "zod"
import { AnthropicSonnet37 } from "./anthropicSonnet37"
import { AnthropicSonnet4 } from "./anthropicSonnet4"
import { AnthropicSonnet45 } from "./anthropicSonnet45"
import { AutoSelectedLlm } from "./AutoSelectedLlm"
import { OpenAI41 } from "./openAI41"
import { OpenAI41Mini } from "./openAI41Mini"
import { OpenAI4oMini } from "./openAI4oMini"
import { OpenAI51 } from "./OpenAI51"
import { OpenAIo3 } from "./openAIo3"

export const LLMTransformer = z.any().transform(data => {
  if (!('jbai' in data) && !('capabilities' in data)) {
    if (/4o-mini/i.test(data.name)) {
      return OpenAI4oMini.parse({
        jbai: 'openai-gpt-4o-mini',
        name: data.name,
        provider: data.provider,
        capabilities: {
          inputPrice: data.inputPrice ?? 0,
          outputPrice: data.outputPrice ?? 0,
          cacheInputPrice: data.cacheInputPrice ?? 0,
        },
      })
    }
    return AnthropicSonnet37.parse({
      jbai: 'anthropic-claude-3.7-sonnet',
      name: data.name,
      provider: data.provider,
      capabilities: {
        inputPrice: data.inputPrice ?? 0,
        outputPrice: data.outputPrice ?? 0,
        cacheInputPrice: data.cacheInputPrice ?? 0,
        maxOutputTokens: data.maxOutputTokens ?? 0,
        vision: data.vision,
        supportsAssistantMessageResuming: data.supportsAssistantMessageResuming ?? false,
      },
    })
  }
  if (OpenAI4oMini.shape.jbai.value === data.jbai && !('capabilities' in data)) {
    return OpenAI4oMini.parse({
      name: data.name,
      provider: data.provider,
      jbai: 'openai-gpt-4o-mini',
      capabilities: {
        inputPrice: data.inputPrice ?? 0,
        outputPrice: data.outputPrice ?? 0,
        cacheInputPrice: data.cacheInputPrice ?? 0,
      },
    })
  }
  if (OpenAIo3.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return OpenAIo3.parse(data)
  }
  if (OpenAI4oMini.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return OpenAI4oMini.parse(data)
  }
  if (OpenAI41Mini.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return OpenAI41Mini.parse(data)
  }
  if (OpenAI41.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return OpenAI41.parse(data)
  }
  if (OpenAI51.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return OpenAI51.parse(data)
  }
  if (AnthropicSonnet37.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return AnthropicSonnet37.parse(data)
  }
  if (AnthropicSonnet37.shape.jbai.value === data.jbai && !('capabilities' in data)) {
    return AnthropicSonnet37.parse({
      name: data.name,
      provider: data.provider,
      jbai: 'anthropic-claude-3.7-sonnet',
      capabilities: {
        inputPrice: data.inputPrice ?? 0,
        outputPrice: data.outputPrice ?? 0,
        cacheInputPrice: data.cacheInputPrice ?? 0,
        maxOutputTokens: data.maxOutputTokens ?? 0,
        vision: data.vision,
        supportsAssistantMessageResuming: data.supportsAssistantMessageResuming ?? false,
      },
    })
  }
  if (AnthropicSonnet4.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return AnthropicSonnet4.parse(data)
  }
  if (AnthropicSonnet45.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return AnthropicSonnet45.parse(data)
  }
  if (AutoSelectedLlm.shape.jbai.options.includes(data.jbai) && 'capabilities' in data) {
    return AutoSelectedLlm.parse({
      name: data.name,
      provider: data.provider,
      jbai: data.jbai,
      capabilities: {
        inputPrice: data.capabilities.inputPrice ?? 0,
        outputPrice: data.capabilities.outputPrice ?? 0,
        cacheInputPrice: data.capabilities.cacheInputPrice ?? 0,
      }
    })
  }
  console.error(data)
  return {}
})