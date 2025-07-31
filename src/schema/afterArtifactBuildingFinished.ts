import * as z from "zod"

export const AfterArtifactBuildingFinished = z.looseObject({
  type: z.literal('AfterArtifactBuildingFinished'),
  requestId: z.looseObject({
    data: z.string(),
  }),
})