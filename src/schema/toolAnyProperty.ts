import * as z from "zod"
import { ToolArrayProperty } from "./toolArrayProperty"
import { ToolObjectProperty } from "./toolObjectProperty"
import { ToolPrimitiveProperty } from "./toolPrimitiveProperty"

export const ToolAnyProperty = z.union([
  ToolPrimitiveProperty,
  ToolArrayProperty,
  ToolObjectProperty,
])
export type ToolAnyProperty = z.infer<typeof ToolAnyProperty>