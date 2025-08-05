// Need to do manual discrimination because there are multiple data formats and models and not a singular way to
// discriminate and then transform them.  So this is a two part process, transform them into common formats
// and then use a discriminated union to parse them so that the output type narrows correctly.
import * as z from "zod"
import { AnthropicSonnet37 } from "./anthropicSonnet37.js"
import { AnthropicSonnet4 } from "./anthropicSonnet4.js"
import { AutoSelectedLlm } from "./AutoSelectedLlm.js"
import { OpenAI4oMini } from "./openAI4oMini.js"
import { OpenAIo3 } from "./openAIo3.js"

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
  if (data.jbai === 'openai-gpt-4o-mini' && !('capabilities' in data)) {
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
  if (data.jbai === 'openai-o3' && 'capabilities' in data) {
    return OpenAIo3.parse(data)
  }
  if (data.jbai === 'openai-gpt-4o-mini' && 'capabilities' in data) {
    return OpenAI4oMini.parse(data)
  }
  if (data.jbai === 'anthropic-claude-3.7-sonnet' && 'capabilities' in data) {
    return AnthropicSonnet37.parse(data)
  }
  if (data.jbai === 'anthropic-claude-3.7-sonnet' && !('capabilities' in data)) {
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
  if (data.jbai === 'anthropic-claude-4-sonnet' && 'capabilities' in data) {
    return AnthropicSonnet4.parse(data)
  }
  if (data.jbai === '<UNKNOWN>' && 'capabilities' in data) {
    return AutoSelectedLlm.parse({
      name: data.name,
      provider: data.provider,
      jbai: '<UNKNOWN>',
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