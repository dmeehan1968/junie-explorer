import * as z from "zod"
import { ToolAnyProperty } from "./toolAnyProperty.js"

const McpToolParameters = z.looseObject({
  type: z.literal('com.intellij.ml.llm.matterhorn.llm.ToolParametersSchema.McpToolParametersSchema'),
  rawJsonObject: z.record(z.string(), z.looseObject({
    type: z.string(),
    description: z.string().optional(),
  })),
  required: z.string().array(),
  description: z.string().optional(),
})
export type McpToolParameters = z.infer<typeof McpToolParameters>

export const Tool = z.looseObject({
  name: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
  ToolType: z.enum(['UserTool']).optional(),
  params: z.union([

    ToolAnyProperty.array().default(() => ([])).transform(params => {
      return {
        type: 'com.intellij.ml.llm.matterhorn.llm.ToolParametersSchema.McpToolParametersSchema',
        parameters: params.reduce((acc, param) => {
          if (param.MatterhornToolProperty === 'MatterhornToolPrimitiveProperty') {
            acc[param.name] = {
              name: param.name,
              type: param.primitiveType?.toLowerCase() ?? 'string',
              description: param.description
            }
          } else if (param.MatterhornToolProperty === 'MatterhornToolObjectProperty') {
            acc[param.name] = {
              name: param.name,
              type: 'object',
              description: param.description,
              properties: param.properties,
            }
          } else if (param.MatterhornToolProperty === 'MatterhornToolArrayProperty') {
            acc[param.name] = {
              name: param.name,
              type: 'array',
              description: param.description,
              itemType: param.itemType.MatterhornToolProperty === 'MatterhornToolPrimitiveProperty'
                ? param.itemType.primitiveType?.toLowerCase() ?? 'string'
                : param.itemType.MatterhornToolProperty === 'MatterhornToolObjectProperty'
                  ? 'object'
                  : 'array',
            }
          }
          return acc
        }, {} as Record<string, { name: string, type: string, description?: string, properties?: object, itemType?: string }>),
        required: params.filter(param => param.required).map(param => param.name),
      }
    }).transform(({ parameters, ...params }) => {
      return {
        ...params,
        type: 'com.intellij.ml.llm.matterhorn.llm.ToolParametersSchema.McpToolParametersSchema',
        rawJsonObject: parameters,
      } satisfies McpToolParameters
    }),

    z.looseObject({
      type: z.literal('com.intellij.ml.llm.matterhorn.llm.ToolParametersSchema.MatterhornToolParametersSchema'),
      parameters: ToolAnyProperty.array().default(() => ([])),
    }).transform(({ parameters }) => {
      return {
        type: 'com.intellij.ml.llm.matterhorn.llm.ToolParametersSchema.McpToolParametersSchema',
        rawJsonObject: parameters.reduce((acc, param) => {
          if (param.MatterhornToolProperty === 'MatterhornToolPrimitiveProperty') {
            acc[param.name] = {
              name: param.name,
              type: param.primitiveType?.toLowerCase() ?? 'string',
              description: param.description
            }
          } else if (param.MatterhornToolProperty === 'MatterhornToolObjectProperty') {
            acc[param.name] = {
              name: param.name,
              type: 'object',
              description: param.description,
              properties: param.properties,
            }
          } else if (param.MatterhornToolProperty === 'MatterhornToolArrayProperty') {
            acc[param.name] = {
              name: param.name,
              type: 'array',
              description: param.description,
              itemType: param.itemType.MatterhornToolProperty === 'MatterhornToolPrimitiveProperty'
                ? param.itemType.primitiveType?.toLowerCase() ?? 'string'
                : param.itemType.MatterhornToolProperty === 'MatterhornToolObjectProperty'
                  ? 'object'
                  : 'array',
            }
          }
          return acc
        }, {} as Record<string, { name: string, type: string, description?: string, properties?: object, itemType?: string }>),
        required: parameters.filter(param => param.required).map(param => param.name),
      } satisfies McpToolParameters
    }),

    McpToolParameters,
  ]),
}).transform(({ type, ToolType, params, ...tool }) => ({
  ...tool,
  ToolType: ToolType ?? type ?? 'UserTool',
  parameters: Object.fromEntries(Object.entries(params.rawJsonObject).map(([name, param]) => ([name, {
    ...param,
  }]))),
}))
export type Tool = z.infer<typeof Tool>

export const Tools = Tool.array().default(() => ([]))
export type Tools = z.infer<typeof Tools>

