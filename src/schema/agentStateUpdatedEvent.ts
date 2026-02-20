import * as z from "zod"
import { UserChatMessage } from "./userChatMessageWithToolResults"

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
    ideInitialState: z.union([
      UserChatMessage,
      z.looseObject({
        content: z.string(),
        kind: z.enum(['User', 'Assistant']),
      }).optional(),
    ]),
  }),
})