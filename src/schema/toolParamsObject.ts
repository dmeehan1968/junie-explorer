import { z } from "zod"

export const ToolParamsObject = z.record(z.string(), z.any())
export type ToolParamsObject = z.infer<typeof ToolParamsObject>