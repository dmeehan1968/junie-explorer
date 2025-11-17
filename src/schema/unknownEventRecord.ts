import * as z from "zod"
import { UnknownEvent } from "./unknownEvent"

export const UnknownEventRecord = z.looseObject({
  event: UnknownEvent,
  timestampMs: z.coerce.date(),
  parseError: z.any().optional(),
}).transform(({ timestampMs, ...rest }) => ({ timestamp: timestampMs, ...rest }))
export type UnknownEventRecord = z.infer<typeof UnknownEventRecord>