import { z } from "zod"
import { Gemini3Pro } from "./Gemini3Pro"

export const Gemini31Pro = Gemini3Pro.extend({
  jbai: z.literal('google-gemini-3-1-pro'),
})