/** @jsxImportSource @kitajs/html */

import { Component } from "@kitajs/html"
import { ChatMessagePart } from "../schema/multiPartChatMessage.js"

export const MultiPartMessage: Component<{ part: ChatMessagePart }> = ({ part }) => {
  if (part.type === 'text') {
    return <>{part.text}</>
  } else if (part.type === 'image') {
    const src = `data:${part.contentType};base64,${part.base64}`
    return (
      <img
        src={src}
        data-fullsrc={src}
        alt="Image"
        class="chat-image-thumb max-w-64 max-h-64 rounded shadow cursor-zoom-in"
      />
    )
  }
  return <></>
}