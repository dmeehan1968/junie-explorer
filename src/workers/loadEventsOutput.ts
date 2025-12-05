import { EventRecord } from "../schema/eventRecord"

export interface EventParserError {
  eventsFile: string
  lineNumber: number
  message: string
  path: (string | number)[]
  json: unknown
}

export interface LoadEventsOutput {
  events: EventRecord[]
  errors: EventParserError[]
}