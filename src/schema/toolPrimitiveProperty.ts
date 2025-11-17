import * as z from "zod"
import { AbstractToolProperty } from "./abstractToolProperty"

export const ToolPrimitiveProperty = AbstractToolProperty.extend({
  MatterhornToolProperty: z.literal('MatterhornToolPrimitiveProperty'),
  primitiveType: z.enum(['STRING', 'INTEGER', 'NUMBER', 'BOOLEAN']).optional(),
})