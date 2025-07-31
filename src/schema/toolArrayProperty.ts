import * as z from "zod"
import { AbstractToolProperty } from "./abstractToolProperty.js"
import { ToolAnyProperty } from "./toolAnyProperty.js"

export const ToolArrayProperty = AbstractToolProperty.extend({
  MatterhornToolProperty: z.literal('MatterhornToolArrayProperty'),
  get itemType() {
    return ToolAnyProperty
  },
})