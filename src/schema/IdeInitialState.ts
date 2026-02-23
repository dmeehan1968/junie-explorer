import { z } from "zod"
import { UserChatMessage } from "./userChatMessageWithToolResults"

export const IdeInitialState = z.union([
  UserChatMessage,
  z.looseObject({
    content: z.string(),
    kind: z.enum(['User', 'Assistant']),
  }).optional(),
])