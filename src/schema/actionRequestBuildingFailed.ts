import * as z from "zod"

export const ActionRequestBuildingFailed = z.looseObject({
  type: z.literal('ActionRequestBuildingFailed'),
  attemptNumber: z.number(),
})