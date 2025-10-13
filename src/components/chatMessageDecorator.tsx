/** @jsxImportSource @kitajs/html */

import { Component } from "@kitajs/html"
import { MatterhornMessage } from "../schema/llmRequestEvent.js"
import { escapeHtml } from "../utils/escapeHtml.js"
import { MessageDecorator } from "./messageDecorator.js"
import { MultiPartMessage } from "./multiPartMessage.js"
import { ToolCallDecorator } from "./toolCallDecorator.js"

export const ChatMessageDecorator: Component<{ klass: string; message: MatterhornMessage }> = ({ klass, message }) => {
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
  return <></>
}