/** @jsxImportSource @kitajs/html */

import { EventRecord } from "../schema/eventRecord"
import { TrajectoriesView } from "./trajectoriesView"

export const MessageTrajectoriesSection = ({
  events,
  showAllDiffs = false,
  toggleHref,
}: {
  events: EventRecord[],
  showAllDiffs?: boolean,
  toggleHref?: string,
}) => {
  return (
    <div class="bg-base-200 text-base-content rounded-lg p-4 border border-base-300" data-testid="message-trajectories">
      <div class="flex items-center justify-between mb-8">
        <h3 class="text-xl font-bold text-primary">
          Message Trajectories
          &#32;
          <span class="text-sm">
            (<a href={'#current-session'}>Jump to start of current session</a>)
          </span>
        </h3>
        <label class="label cursor-pointer gap-2 text-sm" data-testid="show-all-diffs-toggle">
          <span>Show All Diffs</span>
          <input
            type="checkbox"
            class="toggle toggle-sm"
            checked={showAllDiffs}
            data-href={toggleHref}
            onchange="if (this.dataset.href) window.location.href = this.dataset.href"
          />
        </label>
      </div>
      <TrajectoriesView events={events} showAllDiffs={showAllDiffs}/>
    </div>
  )
}

