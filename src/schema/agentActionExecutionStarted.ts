import * as z from "zod"

export const AgentActionExecutionStarted = z.looseObject({
  type: z.literal('AgentActionExecutionStarted'),
  actionToExecute: z.looseObject({
    type: z.string(),
    name: z.string(),
    id: z.string().optional(),
    inputParams: z.looseObject({
      ParameterValue: z.string(),
      name: z.string(),
      value: z.any(),
    }).array().optional(),
    description: z.string(),
  }),
})