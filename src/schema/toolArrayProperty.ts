import * as z from "zod"
import { AbstractToolProperty } from "./abstractToolProperty"
import { ToolAnyProperty } from "./toolAnyProperty"

export const ToolArrayProperty = AbstractToolProperty.extend({
  MatterhornToolProperty: z.literal('MatterhornToolArrayProperty'),
  get itemType() {
    return ToolAnyProperty
  },
})