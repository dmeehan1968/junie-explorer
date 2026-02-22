/** @jsxImportSource @kitajs/html */

import { Component } from "@kitajs/html"
import { AssistantChatMessageWithToolUses } from "../schema/assistantChatMessageWithToolUses"
import { ChatMessage } from "../schema/chatMessage"
import { AssistantSimpleMessage, MatterhornMessage } from "../schema/llmRequestEvent"
import { MultiPartChatMessage } from "../schema/multiPartChatMessage"
import { UserChatMessage, UserChatMessageWithToolResults } from "../schema/userChatMessageWithToolResults"
import { escapeHtml } from "../utils/escapeHtml"
import { MessageDecorator } from "./messageDecorator"
import { MultiPartMessage } from "./multiPartMessage"
import { ToolCallDecorator } from "./toolCallDecorator"

export const ChatMessageDecorator: Component<{ klass: string; message: MatterhornMessage }> = ({ klass, message }) => {
  if (message.type === ChatMessage.shape.type.value) {
    return (
      <MessageDecorator
        klass={klass}
        testId={message.kind === 'User' ? 'user-chat-message' : 'assistant-chat-message'}
        left={message.kind === 'User'}
        label={message.kind === 'User' ? 'Message' : 'Model Response'}
        content={escapeHtml(message.content)}
      />
    )
  } else if (message.type === MultiPartChatMessage.shape.type.value) {
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
  } else if (message.type === AssistantChatMessageWithToolUses.shape.type.value) {
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
              params: toolUse.input?.rawJsonObject ?? {},
              label: 'Tool Use',
            }}
          />
        ))}
      </>
    )
  } else if (message.type === UserChatMessageWithToolResults.shape.type.value) {
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
  } else if (message.type === UserChatMessage.shape.type.value) {
    return (
      <>
        {message.parts.map((part) => {
          if (part.type === 'text') {
            return <MessageDecorator
              klass={klass}
              testId={'user-chat-message'}
              left={true}
              label={'Message'}
              content={escapeHtml(part.text)}
            />
          }
          return <MessageDecorator
            klass={klass}
            testId="user-tool-result"
            left={true}
            label={part.toolResult.isError ? 'Tool Result (Error)' : 'Tool Result'}
            content={escapeHtml(part.toolResult.content)}
          />
        })}
      </>
    )
  } else if (message.type === AssistantSimpleMessage.shape.type.value) {
    return <MessageDecorator
      klass={klass}
      testId={'assistant-message'}
      left={false}
      label={'Assistant Response'}
      content={escapeHtml(message.content)}
    />
  }
  return <></>
}