import * as z from "zod"

export const ActionRequestBuildingStarted = z.looseObject({
  type: z.literal('ActionRequestBuildingStarted'),
  attemptNumber: z.number(),
})