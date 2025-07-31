import * as z from "zod"

export const MultiPartChatMessage = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.MatterhornMultiPartChatMessage'),
  parts: z.discriminatedUnion('type', [
    z.looseObject({
      type: z.literal('text'),
      text: z.string(),
    }),
    z.looseObject({
      type: z.literal('image'),
      contentType: z.string(),
      base64: z.string(),
    }),
  ]).array(),
  kind: z.enum(['User', 'Assistant']).optional(),
})