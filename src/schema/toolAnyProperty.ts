import * as z from "zod"
import { ToolArrayProperty } from "./toolArrayProperty.js"
import { ToolObjectProperty } from "./toolObjectProperty.js"
import { ToolPrimitiveProperty } from "./toolPrimitiveProperty.js"

export const ToolAnyProperty = z.union([
  ToolPrimitiveProperty,
  ToolArrayProperty,
  ToolObjectProperty,
])
export type ToolAnyProperty = z.infer<typeof ToolAnyProperty>