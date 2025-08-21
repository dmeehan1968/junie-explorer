import { EventRecord } from "../schema/eventRecord.js"

export interface LoadEventsOutput {
  events: EventRecord[]
}