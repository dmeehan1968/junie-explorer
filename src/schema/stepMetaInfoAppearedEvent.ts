import * as z from "zod"

export const StepMetaInfoAppearedEvent = z.looseObject({
  type: z.literal('StepMetaInfoAppearedEvent'),
  stepName: z.string(),
  stepType: z.string(),
})