/** @jsxImportSource @kitajs/html */

import { ActionRequestBuildingFailed } from "../schema/actionRequestBuildingFailed"
import { AgentActionExecutionFinished } from "../schema/agentActionExecutionFinished"
import { EventRecord } from "../schema/eventRecord"
import { LlmRequestEvent } from "../schema/llmRequestEvent"
import { LlmResponseEvent } from "../schema/llmResponseEvent"
import { escapeHtml } from "../utils/escapeHtml"
import { ChatMessageDecorator } from "./chatMessageDecorator"
import { Divider } from "./divider"
import { MessageDecorator } from "./messageDecorator"
import { ToolCallDecorator } from "./toolCallDecorator"
import { ToolDecorator } from "./toolDecorator"

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
      {filteredEvents.map((current, index, records) => {
        const messages: JSX.Element[] = []

        if (current.event.type === 'LlmRequestEvent') {
          if (!didOutputInitialContext) {

            messages.push(<Divider id="history">Start of Context/History</Divider>)

            messages.push(
              <MessageDecorator
                klass={klass}
                testId="system-message"
                left={true}
                label="System Message"
                content={escapeHtml(current.event.chat.system)}
              />,
            )

            messages.push(
              <MessageDecorator
                klass={klass}
                testId="user-tools"
                left={true}
                label="Tools"
                content={
                  current.event.chat.tools.length ? (
                    <>
                      {current.event.chat.tools.map((tool) => (
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
              ...current.event.chat.messages.map((message) => (
                <ChatMessageDecorator klass={klass} message={message}/>
              )).filter(Boolean),
            )

            messages.push(<Divider id="current-session">Current Session</Divider>)

            didOutputInitialContext = true
          }
        } else if (current.event.type === 'LlmResponseEvent') {
          if (current.event.answer.llm.isSummarizer) {
            for (const choice of current.event.answer.contentChoices) {
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
            const latency = current.event.answer.time
            const previous = records.slice(0, index).reverse().find((rec): rec is {
                event: LlmRequestEvent,
                timestamp: Date
              } =>
                rec.event.type === 'LlmRequestEvent' && rec.event.id === current.event.id,
            )

            if (current.event.answer.webSearchCount > 0) {
              messages.push(
                <MessageDecorator
                  klass={klass}
                  testId="web-search-assistant"
                  left={false}
                  label={`Web Search`}
                  content={escapeHtml(`Count: ${current.event.answer.webSearchCount}`)}
                />,
              )
            }

            for (const choice of current.event.answer.contentChoices) {
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
        } else if (current.event.type === 'AgentActionExecutionFinished') {
          messages.push(
            <MessageDecorator
              klass={klass}
              testId="tool-result"
              left={true}
              label="Tool Result"
              content={escapeHtml(current.event.result.text)}
            />,
          )

          if (current.event.result.images && current.event.result.images.length) {
            // TODO: handle images as well (when we know what the shape is)
            console.log('Unhandled tool result image', current.event.result.images)
          }
        } else if (current.event.type === 'ActionRequestBuildingFailed') {
          messages.push(
            <MessageDecorator
              klass={klass + ' bg-error text-error-content'}
              testId="tool-error"
              left={true}
              label="Tool Error"
              content={escapeHtml(current.event.serializableThrowable?.message ?? 'Unspecified error')}
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