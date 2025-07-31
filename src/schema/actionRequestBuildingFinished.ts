import * as z from "zod"

export const ActionRequestBuildingFinished = z.looseObject({
  type: z.literal('ActionRequestBuildingFinished'),
  attemptNumber: z.number(),
  actionRequest: z.looseObject({
    // TODO
  }),
})