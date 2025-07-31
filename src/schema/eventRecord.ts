import * as z from "zod"
import { Event } from "./event.js"

export const EventRecord = z.looseObject({
  event: Event,
  timestampMs: z.coerce.date(),
  parseError: z.any().optional(),
}).transform(({ timestampMs, ...rest }) => ({ timestamp: timestampMs, ...rest }))
export type EventRecord = z.infer<typeof EventRecord>