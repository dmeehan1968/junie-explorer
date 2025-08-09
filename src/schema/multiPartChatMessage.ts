import * as z from "zod"

export const TextMessagePart = z.looseObject({
  type: z.literal('text'),
  text: z.string(),
})
export type TextMessagePart = z.infer<typeof TextMessagePart>

export const ImageMessagePart = z.looseObject({
  type: z.literal('image'),
  contentType: z.string(),
  base64: z.string(),
})
export type ImageMessagePart = z.infer<typeof ImageMessagePart>

export const ChatMessagePart = z.discriminatedUnion('type', [
  TextMessagePart,
  ImageMessagePart,
])
export type ChatMessagePart = z.infer<typeof ChatMessagePart>

export const MultiPartChatMessage = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.MatterhornMultiPartChatMessage'),
  parts: ChatMessagePart.array(),
  kind: z.enum(['User', 'Assistant']).optional(),
})
export type MultiPartChatMessage = z.infer<typeof MultiPartChatMessage>