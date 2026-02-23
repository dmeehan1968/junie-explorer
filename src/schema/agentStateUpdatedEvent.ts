import * as z from "zod"
import { IdeInitialState } from "./IdeInitialState"

export const AgentStateUpdatedEvent = z.looseObject({
  type: z.literal('AgentStateUpdatedEvent'),
  state: z.object({
    issue: z.looseObject({
      description: z.string().optional(),
      editorContext: z.object({
        recentFiles: z.string().array(),
        openFiles: z.string().array(),
      }),
    }),
    observations: z.looseObject({
      // TODO
    }).array().optional(),
    ideInitialState: IdeInitialState,
  }),
})

