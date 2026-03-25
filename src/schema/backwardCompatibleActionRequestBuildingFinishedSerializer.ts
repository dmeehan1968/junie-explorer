import { z } from "zod"
import { ActionToExecute } from "./actionToExecute"

export const BackwardCompatibleActionRequestBuildingFinishedSerializer = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.agent.BackwardCompatibleActionRequestBuildingFinishedSerializer.Surrogate'),
  attemptNumber: z.number(),
  actionRequests: z.array(ActionToExecute),
})