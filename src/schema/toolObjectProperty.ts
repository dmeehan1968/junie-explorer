import * as z from "zod"
import { AbstractToolProperty } from "./abstractToolProperty"
import { ToolAnyProperty } from "./toolAnyProperty"

export const ToolObjectProperty = AbstractToolProperty.extend({
  MatterhornToolProperty: z.literal('MatterhornToolObjectProperty'),
  get properties() {
    return ToolAnyProperty.array()
  },
})
export type ToolObjectProperty = z.infer<typeof ToolObjectProperty>