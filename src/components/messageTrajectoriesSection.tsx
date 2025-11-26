/** @jsxImportSource @kitajs/html */

import { EventRecord } from "../schema/eventRecord"
import { TrajectoriesView } from "./trajectoriesView"

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
      <TrajectoriesView events={events}/>
    </div>
  )
}

