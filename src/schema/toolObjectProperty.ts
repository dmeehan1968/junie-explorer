import * as z from "zod"
import { AbstractToolProperty } from "./abstractToolProperty.js"
import { ToolAnyProperty } from "./toolAnyProperty.js"

export const ToolObjectProperty = AbstractToolProperty.extend({
  MatterhornToolProperty: z.literal('MatterhornToolObjectProperty'),
  get properties() {
    return ToolAnyProperty.array()
  },
})
export type ToolObjectProperty = z.infer<typeof ToolObjectProperty>