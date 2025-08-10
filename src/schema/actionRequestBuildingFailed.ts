import { z } from "zod"

export const ActionRequestBuildingFailed = z.looseObject({
  type: z.literal('ActionRequestBuildingFailed'),
  attemptNumber: z.number(),
  serializableThrowable: z.looseObject({
    exceptionClassName: z.string(),
    message: z.string(),
    stackTrace: z.string(),
  }).optional()
})
export type ActionRequestBuildingFailed = z.infer<typeof ActionRequestBuildingFailed>