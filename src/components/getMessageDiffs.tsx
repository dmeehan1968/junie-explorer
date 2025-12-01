import { diffJson } from "diff"
import { AgentType } from "../schema/agentType"
import { escapeHtml } from "../utils/escapeHtml"
import { getPreviousRequestRecord } from "./getPreviousRequestRecord"
import { TrajectoryEventRecord } from "./getTrajectoryEventRecords"
import { MessageDecorator } from "./messageDecorator"

export function getMessageDiffs(current: TrajectoryEventRecord, previousEventRecords: TrajectoryEventRecord[], klass: string) {

  if (current.event.type !== 'LlmRequestEvent') {
    return <></>
  }

  const previous = getPreviousRequestRecord(previousEventRecords, event => event.chat.agentType !== AgentType.TaskSummarizer && event.id !== current.event.id)

  if (previous) {
    if (current.event.chat.system !== previous.event.chat.system) {
      return (
        <MessageDecorator
          klass={klass}
          testId="system-message-diff"
          left={true}
          label="System Message (diff)"
          content={escapeHtml(current.event.chat.system)}
        />
      )
    }

    // number of messages to rewind the current history to match the previous history
    const rewind = current.event.modelParameters.model.provider === 'Anthropic' ? 3 : 2

    const messagesDiff = diffJson(
      JSON.stringify(previous.event.chat.messages, null, 2),
      JSON.stringify(current.event.chat.messages.slice(0, -rewind), null, 2), // remove tool use and result
    )

    let diffCount = 0
    const commonStyle = 'border-l-4 pl-4'
    const unchangedStyle = `${commonStyle} border-l-neutral-content`
    const additionStyle = `${commonStyle} border-l-info text-info`
    const deletionStyle = `${commonStyle} border-l-error text-error`

    const changes = messagesDiff.map(change => {

      if (change.added) {
        diffCount++
        return <div class={additionStyle}>{escapeHtml(change.value)}</div>
      }

      if (change.removed) {
        diffCount++
        return <div class={deletionStyle}>{escapeHtml(change.value)}</div>
      }

      return <div class={unchangedStyle}>{escapeHtml(change.value)}</div>

    })

    if (diffCount > 0) {
      return (
        <MessageDecorator
          klass={klass}
          testId={`messages-diff`}
          left={true}
          label={
            <div class="flex gap-2">
              <div>Message History (diff)</div>
              <div>{current.timestamp.toISOString()}</div>
              <div class={additionStyle + ' px-2'}>additions</div>
              <div class={deletionStyle + ' px-2'}>deletions</div>
            </div>
          }
          content={changes}
        />
      )
    }
  }

  return <></>
}