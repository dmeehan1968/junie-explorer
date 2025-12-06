import { ChangeObject, diffJson, diffLines } from "diff"
import { isRequestEvent } from "../schema/llmRequestEvent"
import { escapeHtml } from "../utils/escapeHtml"
import { TrajectoryEventRecord } from "./getTrajectoryEventRecords"
import { MessageDecorator } from "./messageDecorator"

export function getMessageDiffs({
  event: current,
  timestamp,
}: TrajectoryEventRecord, klass: string, showAllDiffs: boolean = false): JSX.Element[] {

  const getMarkup = (messagesDiff: ChangeObject<string>[], timestamp: Date, label: string, klass: string) => {
    const commonStyle = 'border-l-4 pl-4'
    const unchangedStyle = `${commonStyle} border-l-neutral-content`
    const additionStyle = `${commonStyle} border-l-info text-success`
    const deletionStyle = `${commonStyle} border-l-error text-error`

    let changeCount = 0

    const changes = messagesDiff.map((change) => {

      if (change.added) {
        changeCount++
        return <div class={additionStyle}>{escapeHtml(change.value)}</div>
      }

      if (change.removed) {
        changeCount++
        return <div class={deletionStyle}>{escapeHtml(change.value)}</div>
      }

      return <div class={unchangedStyle}>{escapeHtml(change.value)}</div>

    })

    if (changeCount > 0) {
      return (
        <MessageDecorator
          klass={klass}
          testId={`messages-diff`}
          left={true}
          label={
            <div class="flex gap-2">
              <div>{label}</div>
              <div>{timestamp.toISOString()}</div>
              <div class={additionStyle + ' px-2'}>additions</div>
              <div class={deletionStyle + ' px-2'}>deletions</div>
            </div>
          }
          content={changes}
        />
      )
    }
    return <></>

  }

  if (current.type !== 'LlmRequestEvent') {
    return []
  }

  const previous = isRequestEvent(current.previousRequest) && current.previousRequest.chat.agentType === current.chat.agentType
    ? current.previousRequest
    : undefined

  if (previous) {

    const markup: JSX.Element[] = []

    const systemDiff = diffLines(previous.chat.system, current.chat.system)
    markup.push(getMarkup(systemDiff, timestamp, `System Message (diff) ${current.id}`, klass))

    // number of messages to rewind the current history to match the previous history
    const rewind = current.modelParameters.model.provider === 'Anthropic' ? 3 : 2

    const currentMessagesForDiff = showAllDiffs
      ? current.chat.messages
      : current.chat.messages.slice(0, -rewind) // remove tool use and result

    const messagesDiff = diffJson(
      JSON.stringify(previous.chat.messages, null, 2),
      JSON.stringify(currentMessagesForDiff, null, 2),
    )

    markup.push(getMarkup(messagesDiff, timestamp, 'Message History (diff)', klass))

    return markup

  }

  return []
}