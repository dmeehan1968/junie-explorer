/** @jsxImportSource @kitajs/html */

import { ActionRequestBuildingFailed } from "../schema/actionRequestBuildingFailed.js"
import { AgentActionExecutionFinished } from "../schema/agentActionExecutionFinished.js"
import { EventRecord } from "../schema/eventRecord.js"
import { LlmRequestEvent, MatterhornMessage } from "../schema/llmRequestEvent.js"
import { LlmResponseEvent } from "../schema/llmResponseEvent.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { Conditional } from "./conditional.js"
import { MessageDecorator } from "./messageDecorator.js"
import { MultiPartMessage } from "./multiPartMessage.js"
import { ToolCallDecorator } from "./toolCallDecorator.js"
import { ToolDecorator } from "./toolDecorator.js"

const Divider = (props: { id: string, children: JSX.Element }) => (
  <div id={props.id} class={'divider divider-secondary m-8'}>
    <span class={'text-lg bg-secondary text-secondary-content rounded p-2'}>{props.children}</span>
  </div>
)

const ChatMessageDecorator = ({ klass, message }: {
  klass: string,
  message: MatterhornMessage
}) => {
  if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage') {
    return (
      <MessageDecorator
        klass={klass}
        testId={message.kind === 'User' ? 'user-chat-message' : 'assistant-chat-message'}
        left={message.kind === 'User'}
        label={message.kind === 'User' ? 'Message' : 'Model Response'}
        content={escapeHtml(message.content)}
      />
    )
  } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornMultiPartChatMessage') {
    return (
      <>
        {message.parts.map((part) => (
          <MessageDecorator
            klass={klass}
            testId={message.kind === 'User' ? 'user-chat-multipart' : 'assistant-chat-multipart'}
            left={message.kind === 'User'}
            label={part.type === 'image' ? 'Image' : 'Message'}
            content={<MultiPartMessage part={part}/>}
          />
        ))}
      </>
    )
    } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornAssistantChatMessageWithToolUses') {
      return (
        <>
          {message.content && (
            <MessageDecorator
              klass={klass}
              testId="assistant-message"
              left={false}
              label="Assistant Response"
              content={escapeHtml(message.content)}
            />
          )}
          {message.toolUses.map((toolUse) => (
            <ToolCallDecorator
              klass={klass}
              testId="assistant-tool-use"
              tool={{
                name: toolUse.name,
                params: toolUse.input.rawJsonObject,
                label: 'Tool Use',
              }}
            />
          ))}
        </>
      )
    } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornUserChatMessageWithToolResults') {
      return (
        <>
          {message.toolResults.map((toolResult, resultIndex) => (
            <MessageDecorator
              klass={klass}
              testId="user-tool-result"
              left={true}
              label={toolResult.isError ? 'Tool Result (Error)' : 'Tool Result'}
              content={escapeHtml(toolResult.content)}
            />
          ))}
        </>
      )
  }
  return null
}

export const MessageTrajectoriesSection = ({ events }: { events: EventRecord[] }) => {
  return (
    <div class="bg-base-200 text-base-content rounded-lg p-4 border border-base-300" data-testid="message-trajectories">
      <h3 class="text-xl font-bold text-primary mb-8">
        Message Trajectories
        &#32;
        <span class="text-sm">
          (<a href={'#current-session'}>Jump to start of current session</a>)
        </span>
      </h3>
      <ProcessedEvents events={events}/>
    </div>
  )
}

export const ImageModal = () => {
  return (
    <div id="imageModal" class="fixed inset-0 bg-black/80 hidden items-center justify-center z-50">
      <div class="relative w-[95vw] h-[95vh] max-w-6xl">
        <button id="closeImageModal"
                class="absolute -top-3 -right-3 bg-base-100 text-base-content rounded-full w-10 h-10 flex items-center justify-center shadow"
                aria-label="Close image viewer">&times;</button>
        <img id="imageModalImg" src="" alt="Full Image" class="w-full h-full object-contain rounded"/>
      </div>
    </div>
  )
}

const ProcessedEvents = ({ events }: { events: EventRecord[] }) => {
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
            messages.push(
              ...record.event.answer.contentChoices.map((choice) => (
                <Conditional condition={!!choice.content}>
                  <MessageDecorator
                    klass={klass + (!!choice.content ? '' : ' bg-warning text-warning-content')}
                    testId="summarizer-assistant"
                    left={false}
                    label="Summary"
                    content={escapeHtml(choice.content)}
                  />
                </Conditional>
              )),
            )
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

            messages.push(
              ...record.event.answer.contentChoices.map((choice) => {
                const toolUses = choice.type === 'com.intellij.ml.llm.matterhorn.llm.AIToolUseAnswerChoice'
                  ? choice.usages.map((tool) => (
                    <ToolCallDecorator
                      klass={klass}
                      testId="tool-use"
                      tool={{
                        name: tool.toolName,
                        params: tool.toolParams.rawJsonObject,
                        label: 'Tool Request',
                      }}
                    />
                  ))
                  : []

                return (
                  <div>
                    <Conditional condition={!!choice.content}>
                      <MessageDecorator
                        klass={klass + (!!choice.content ? '' : ' bg-warning text-warning-content')}
                        testId="chat-assistant"
                        left={false}
                        label={`Model Response <span class="text-primary-content/50">${(latency / 1000).toFixed(2)}s/${previous?.event.modelParameters.reasoning_effort}</span>`}
                        content={escapeHtml(choice.content)}
                      />
                    </Conditional>
                    {toolUses}
                  </div>
                )
              }),
            )
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