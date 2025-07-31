import * as z from "zod"

export const BeforeArtifactBuildingStarted = z.looseObject({
  type: z.literal('BeforeArtifactBuildingStarted'),
  requestId: z.looseObject({
    data: z.string(),
  }),
})