import { z } from "zod"

export const Trajectory = z.object({
  timestamp: z.number().int().transform(seconds => new Date(seconds * 1000)),
  subagent: z.object({
    agent_type: z.string(),
    agent_version: z.string(),
    agent_model_version: z.string(),
    agent_configuration: z.string().transform(s => JSON.parse(s)),
  }).passthrough(),
  content: z.string(),
  role: z.enum(['user', 'system', 'assistant']),
  is_demo: z.boolean().optional(),
}).passthrough()
export type Trajectory = z.infer<typeof Trajectory>
export const TrajectoryError = z.object({
  error: z.unknown(),
  data: z.unknown(),
})
export type TrajectoryError = z.infer<typeof TrajectoryError>