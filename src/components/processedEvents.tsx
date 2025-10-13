/** @jsxImportSource @kitajs/html */

import { ActionRequestBuildingFailed } from "../schema/actionRequestBuildingFailed.js"
import { AgentActionExecutionFinished } from "../schema/agentActionExecutionFinished.js"
import { EventRecord } from "../schema/eventRecord.js"
import { LlmRequestEvent } from "../schema/llmRequestEvent.js"
import { LlmResponseEvent } from "../schema/llmResponseEvent.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { ChatMessageDecorator } from "./chatMessageDecorator.js"
import { Divider } from "./divider.js"
import { MessageDecorator } from "./messageDecorator.js"
import { ToolCallDecorator } from "./toolCallDecorator.js"
import { ToolDecorator } from "./toolDecorator.js"

export const ProcessedEvents = ({ events }: { events: EventRecord[] }) => {
  if (events.length === 0) {
    return (
      <div class="p-4 text-center text-base-content/70" data-testid="no-events-message">
        No events found for this task
      </div>
    )
  }

  let didOutputInitialContext = false
  const klass = 'p-4 mt-4 bg-base-content/10'

  const filteredEvents = events.filter((record: EventRecord): record is {
    event: LlmRequestEvent | LlmResponseEvent | ActionRequestBuildingFailed | AgentActionExecutionFinished,
    timestamp: Date
  } => {
    return (
      (record.event.type === 'LlmRequestEvent' && !record.event.modelParameters.model.isSummarizer)
      || (record.event.type === 'LlmResponseEvent')
      || record.event.type === 'AgentActionExecutionFinished'
      || record.event.type === 'ActionRequestBuildingFailed'
    )
  })

  return (
    <>
      {filteredEvents.map((record, index, records) => {
        const messages: JSX.Element[] = []

        if (record.event.type === 'LlmRequestEvent') {
          if (!didOutputInitialContext) {

            messages.push(<Divider id="history">Start of Context/History</Divider>)

            messages.push(
              <MessageDecorator
                klass={klass}
                testId="system-message"
                left={true}
                label="System Message"
                content={escapeHtml(record.event.chat.system)}
              />,
            )

            messages.push(
              <MessageDecorator
                klass={klass}
                testId="user-tools"
                left={true}
                label="Tools"
                content={
                  record.event.chat.tools.length ? (
                    <>
                      {record.event.chat.tools.map((tool) => (
                        <ToolDecorator tool={tool}/>
                      ))}
                    </>
                  ) : (
                    'No tools listed'
                  )
                }
              />,
            )

            messages.push(
              ...record.event.chat.messages.map((message) => (
                <ChatMessageDecorator klass={klass} message={message}/>
              )).filter(Boolean),
            )

            messages.push(<Divider id="current-session">Current Session</Divider>)

            didOutputInitialContext = true
          }
        } else if (record.event.type === 'LlmResponseEvent') {
          if (record.event.answer.llm.isSummarizer) {
            for (const choice of record.event.answer.contentChoices) {
              if (choice.content) {
                messages.push(
                  <MessageDecorator
                    klass={klass}
                    testId="summarizer-assistant"
                    left={false}
                    label="Summary"
                    content={escapeHtml(choice.content)}
                  />,
                )
              }
            }
          } else {
            const latency = record.event.answer.time
            const previous = records.slice(0, index).reverse().find((rec): rec is {
                event: LlmRequestEvent,
                timestamp: Date
              } =>
                rec.event.type === 'LlmRequestEvent' && rec.event.id === record.event.id,
            )

            if (record.event.answer.webSearchCount > 0) {
              messages.push(
                <MessageDecorator
                  klass={klass}
                  testId="web-search-assistant"
                  left={false}
                  label={`Web Search`}
                  content={escapeHtml(`Count: ${record.event.answer.webSearchCount}`)}
                />,
              )
            }

            for (const choice of record.event.answer.contentChoices) {
              if (choice.type === 'com.intellij.ml.llm.matterhorn.llm.AIContentAnswerChoice') {
                if (choice.content) {
                  messages.push(
                    <MessageDecorator
                      klass={klass}
                      testId="chat-assistant"
                      left={false}
                      label={`Model Response <span class="text-primary-content/50">${(latency / 1000).toFixed(2)}s/${previous?.event.modelParameters.reasoning_effort}</span>`}
                      content={escapeHtml(choice.content)}
                    />,
                  )
                }
              } else if (choice.type === 'com.intellij.ml.llm.matterhorn.llm.AIToolUseAnswerChoice') {
                for (const tool of choice.usages) {
                  messages.push(
                    <ToolCallDecorator
                      klass={klass}
                      testId="tool-use"
                      tool={{
                        name: tool.toolName,
                        params: tool.toolParams.rawJsonObject,
                        label: 'Tool Request',
                      }}
                    />,
                  )
                }
              }
            }
          }
        } else if (record.event.type === 'AgentActionExecutionFinished') {
          messages.push(
            <MessageDecorator
              klass={klass}
              testId="tool-result"
              left={true}
              label="Tool Result"
              content={escapeHtml(record.event.result.text)}
            />,
          )

          if (record.event.result.images && record.event.result.images.length) {
            // TODO: handle images as well (when we know what the shape is)
            console.log('Unhandled tool result image', record.event.result.images)
          }
        } else if (record.event.type === 'ActionRequestBuildingFailed') {
          messages.push(
            <MessageDecorator
              klass={klass + ' bg-error text-error-content'}
              testId="tool-error"
              left={true}
              label="Tool Error"
              content={escapeHtml(record.event.serializableThrowable?.message ?? 'Unspecified error')}
            />,
          )
        }

        return (
          <div class="font-mono text-xs">
            {messages}
          </div>
        )
      })}
    </>
  )
}