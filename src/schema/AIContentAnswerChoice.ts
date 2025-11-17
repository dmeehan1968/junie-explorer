import * as z from "zod"
import { ContentChoice } from "./contentChoice"

export const AIContentAnswerChoice = ContentChoice.extend({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.AIContentAnswerChoice'),
})