// Need to do manual discrimination because there are multiple data formats and models and not a singular way to
// discriminate and then transform them.  So this is a two part process, transform them into common formats
// and then use a discriminated union to parse them so that the output type narrows correctly.
import * as z from "zod"
import { AnthropicClaude45Opus } from "./anthropicClaude45Opus"
import { AnthropicSonnet37 } from "./anthropicSonnet37"
import { AnthropicSonnet4 } from "./anthropicSonnet4"
import { AnthropicSonnet45 } from "./anthropicSonnet45"
import { OpenAI4o } from "./openAI4o"
import { OpenAI5 } from "./openAI5"
import { Gemini3Pro } from "./Gemini3Pro"
import { OpenAI41 } from "./openAI41"
import { OpenAI41Mini } from "./openAI41Mini"
import { OpenAI4oMini } from "./openAI4oMini"
import { OpenAI51 } from "./openAI51"
import { OpenAI51CodexMax } from "./openAI51CodexMax"
import { OpenAIo3 } from "./openAIo3"

function safeParseOrAddIssues<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  ctx: z.RefinementCtx
): z.infer<T> | typeof z.NEVER {
  const result = schema.safeParse(data)
  if (!result.success) {
    result.error.issues.forEach(issue => ctx.addIssue({
      code: 'custom',
      message: issue.message,
      path: issue.path,
    }))
    return z.NEVER
  }
  return result.data
}

export const LLMTransformer = z.any().transform((data, ctx) => {
  if (!('jbai' in data) && !('capabilities' in data)) {
    if (/4o-mini/i.test(data.name)) {
      return safeParseOrAddIssues(OpenAI4oMini, {
        jbai: 'openai-gpt-4o-mini',
        name: data.name,
        provider: data.provider,
        capabilities: {
          inputPrice: data.inputPrice ?? 0,
          outputPrice: data.outputPrice ?? 0,
          cacheInputPrice: data.cacheInputPrice ?? 0,
        },
      }, ctx)
    }
    return safeParseOrAddIssues(AnthropicSonnet37, {
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
    }, ctx)
  }
  if (OpenAI4oMini.shape.jbai.value === data.jbai && !('capabilities' in data)) {
    return safeParseOrAddIssues(OpenAI4oMini, {
      name: data.name,
      provider: data.provider,
      jbai: 'openai-gpt-4o-mini',
      capabilities: {
        inputPrice: data.inputPrice ?? 0,
        outputPrice: data.outputPrice ?? 0,
        cacheInputPrice: data.cacheInputPrice ?? 0,
      },
    }, ctx)
  }
  if (OpenAIo3.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return safeParseOrAddIssues(OpenAIo3, data, ctx)
  }
  if (OpenAI4oMini.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return safeParseOrAddIssues(OpenAI4oMini, data, ctx)
  }
  if (OpenAI4o.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return safeParseOrAddIssues(OpenAI4o, data, ctx)
  }
  if (OpenAI41Mini.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return safeParseOrAddIssues(OpenAI41Mini, data, ctx)
  }
  if (OpenAI41.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return safeParseOrAddIssues(OpenAI41, data, ctx)
  }
  if (OpenAI51.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return safeParseOrAddIssues(OpenAI51, data, ctx)
  }
  if (OpenAI51CodexMax.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return safeParseOrAddIssues(OpenAI51CodexMax, data, ctx)
  }
  if (Gemini3Pro.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return safeParseOrAddIssues(Gemini3Pro, data, ctx)
  }
  if (AnthropicSonnet37.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return safeParseOrAddIssues(AnthropicSonnet37, data, ctx)
  }
  if (AnthropicSonnet37.shape.jbai.value === data.jbai && !('capabilities' in data)) {
    return safeParseOrAddIssues(AnthropicSonnet37, {
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
    }, ctx)
  }
  if (AnthropicSonnet4.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return safeParseOrAddIssues(AnthropicSonnet4, data, ctx)
  }
  if (AnthropicSonnet45.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return safeParseOrAddIssues(AnthropicSonnet45, data, ctx)
  }
  if (AnthropicClaude45Opus.shape.jbai.value === data.jbai && 'capabilities' in data) {
    return safeParseOrAddIssues(AnthropicClaude45Opus, data, ctx)
  }
  if (OpenAI5.shape.jbai.options.includes(data.jbai) && 'capabilities' in data) {
    return safeParseOrAddIssues(OpenAI5, {
      name: data.name,
      provider: data.provider,
      jbai: data.jbai,
      capabilities: {
        inputPrice: data.capabilities.inputPrice ?? 0,
        outputPrice: data.capabilities.outputPrice ?? 0,
        cacheInputPrice: data.capabilities.cacheInputPrice ?? 0,
      }
    }, ctx)
  }
  ctx.addIssue({
    code: 'custom',
    message: `Unknown LLM format: ${JSON.stringify(data)}`,
  })
  return z.NEVER
})