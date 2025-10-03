import * as z from "zod"

export const SerializableEventSerializationError = z.looseObject({
  type: z.literal('SerializableEventSerializationError'),
  eventClassName: z.string(),
  error: z.looseObject({
    exceptionClassName: z.string(),
    message: z.string(),
    stackTrace: z.string(),
  }),
})