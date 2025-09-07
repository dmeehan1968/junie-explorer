import { Html } from "@kitajs/html"
import express from 'express'
import { AppBody } from "../../components/appBody.js"
import { AppHead } from "../../components/appHead.js"
import { AppHeader } from "../../components/appHeader.js"
import { Breadcrumb } from '../../components/breadcrumb.js'
import { CollapseIcon } from "../../components/collapseIcon.js"
import { Conditional } from "../../components/conditional.js"
import { ExpandIcon } from "../../components/expandIcon.js"
import { HtmlPage } from "../../components/htmlPage.js"
import { ReloadButton } from '../../components/reloadButton.js'
import { StatsButton } from '../../components/statsButton.js'
import { TaskCard } from '../../components/taskCard.js'
import { ThemeSwitcher } from '../../components/themeSwitcher.js'
import { ToggleComponent } from '../../components/toggleComponent.js'
import { VersionBanner } from '../../components/versionBanner.js'
import { ActionRequestBuildingFailed } from "../../schema/actionRequestBuildingFailed.js"
import { ToolUseAnswer } from "../../schema/AIToolUseAnswerChoice.js"
import { AgentActionExecutionFinished } from "../../schema/agentActionExecutionFinished.js"
import { EventRecord } from "../../schema/eventRecord.js"
import { LlmRequestEvent, MatterhornMessage } from "../../schema/llmRequestEvent.js"
import { LlmResponseEvent } from "../../schema/llmResponseEvent.js"
import { ChatMessagePart } from "../../schema/multiPartChatMessage.js"
import { Tool } from "../../schema/tools.js"
import { escapeHtml } from "../../utils/escapeHtml.js"
import { getLocaleFromRequest } from "../../utils/getLocaleFromRequest.js"
import { entityLookupMiddleware } from "../middleware/entityLookupMiddleware.js"
import { AppRequest, AppResponse } from "../types.js"

const router = express.Router({ mergeParams: true })

router.use('/project/:projectId/issue/:issueId/task/:taskId*', entityLookupMiddleware)

const ToolDecorator = ({ tool }: { tool: Tool }) => {
  return (
    <div class="flex flex-col gap-2 p-4 bg-base-content/10 rounded mt-4 mb-8 relative">
      <div class="absolute -top-4 left-4 py-2">
        <span class="bg-secondary text-secondary-content p-2 rounded shadow">{tool.name}</span>
      </div>
      <div class="flex flex-row pt-2">
        <div class="w-32 flex-shrink-0 text-base-content/50 pr-2 italic text-right p-2">Description</div>
        <div class="flex-grow p-2 bg-base-content/10 rounded">{escapeHtml(tool.description?.trim() ?? '')}</div>
      </div>
      {Object.entries(tool.parameters).length > 0 && (
        <div class="w-32 pr-2 text-base-content/50 italic text-right">Parameters</div>
      )}
      {Object.entries(tool.parameters).map(([name, { description, type, ...param }]) => (
        <div class="flex flex-row">
          <div class="w-32 flex-shrink-0 text-base-content/50 pr-2 italic text-right p-2">{name}</div>
          <div class="flex flex-row flex-grow gap-2">
            <div class="flex-grow bg-base-content/10 p-2 rounded">
              {escapeHtml(description ? description : JSON.stringify(param, null, 2))}
            </div>
            <div class="flex-shrink-0 bg-base-content/10 text-base-content/50 p-2 rounded">{type ?? JSON.stringify(param.anyOf)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

const ToolCallDecorator = ({ klass, index, testIdPrefix, tool }: {
  klass: string,
  index: number,
  testIdPrefix: string,
  tool: { name: string, params: Record<string, any>, label: string }
}) => {
  return (
    <div class="relative ml-48 mb-8">
      <ToggleComponent expandIcon={<ExpandIcon />} collapseIcon={<CollapseIcon />} testIdPrefix={testIdPrefix} index={index} />
      <div class="relative">
        <h3 class="absolute -top-3 left-4 bg-primary text-primary-content px-2 py-1 rounded shadow">{tool.label}</h3>
        <div class={`${klass} rounded shadow flex flex-col gap-1 pt-6 content-wrapper font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out`}>
          <div class="py-2">
            <span class="bg-secondary text-secondary-content p-2 rounded shadow">{tool.name}</span>
          </div>
          {Object.entries(tool.params).map(([key, value]) => (
            <div class="flex flex-row">
              <div class="w-32 flex-shrink-0 text-base-content/50 pr-2 italic text-right p-2">{key}:</div>
              <div class="flex-grow bg-info text-info-content p-2 rounded">
                {escapeHtml(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const ToolUseDecorator = ({ klass, index, tool }: { klass: string, index: number, tool: ToolUseAnswer }) => {
  return (
    <ToolCallDecorator
      klass={klass}
      index={index}
      testIdPrefix="tool-use-toggle"
      tool={{
        name: tool.toolName,
        params: tool.toolParams.rawJsonObject,
        label: 'Tool Request',
      }}
    />
  )
}

const MessageDecorator = (props: {
  klass: string,
  index: number,
  testIdPrefix: string,
  left: boolean,
  label?: string,
  content: string | JSX.Element
}) => {
  return (
    <div class={`relative mb-8 ${props.left ? 'mr-48' : 'ml-48'}`}>
      <ToggleComponent
        expandIcon={<ExpandIcon />}
        collapseIcon={<CollapseIcon />}
        testIdPrefix={props.testIdPrefix}
        index={props.index}
      />
      <div class="relative">
        <h3 class="absolute -top-3 left-4 bg-primary text-primary-content px-2 py-1 rounded shadow z-50">
          {props.label}
        </h3>
        <div class={`${props.klass} rounded shadow pt-6 content-wrapper font-mono text-xs leading-relaxed max-h-[200px] overflow-auto whitespace-pre-wrap break-words transition-all duration-300 ease-in-out`}>
          {typeof props.content === 'string' ? props.content : props.content}
        </div>
      </div>
    </div>
  )
}

const MultiPartMessage = ({ part }: { part: ChatMessagePart }) => {
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
  return null
}

const ChatMessageDecorator = ({ klass, index, message }: { klass: string, index: number, message: MatterhornMessage }) => {
  if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornChatMessage') {
    return (
      <MessageDecorator
        klass={klass}
        index={index}
        testIdPrefix="chat-message-toggle"
        left={message.kind === 'User'}
        label={message.kind === 'User' ? 'Message' : 'Model Response'}
        content={escapeHtml(message.content)}
      />
    )
  } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornMultiPartChatMessage') {
    return (
      <>
        {message.parts.map((part, partIndex) => (
          <MessageDecorator
            klass={klass}
            index={index}
            testIdPrefix="chat-multipart-toggle"
            left={message.kind === 'User'}
            label={part.type === 'image' ? 'Image' : 'Message'}
            content={<MultiPartMessage part={part} />}
          />
        ))}
      </>
    )
  }
  return null
  // we don't process these, as they are covered by the response and action events
  // } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornAssistantChatMessageWithToolUses') {
  // } else if (message.type === 'com.intellij.ml.llm.matterhorn.llm.MatterhornUserChatMessageWithToolResults') {
}

// JSX Components for trajectory sections
const ActionTimelineSection = ({ hasActionEvents, actionCount }: { hasActionEvents: boolean, actionCount: number }) => {
  if (!hasActionEvents) return null

  return (
    <div class="collapsible-section collapsed mb-5 bg-base-200 rounded-lg border border-base-300 collapsed" data-testid="action-timeline-section">
      <div class="collapsible-header p-4 cursor-pointer select-none flex justify-between items-center bg-base-200 rounded-lg hover:bg-base-100 transition-colors duration-200" data-testid="action-timeline-header">
        <h3 class="text-xl font-bold text-primary m-0">Action Timeline <span class="font-medium text-base-content/70">({actionCount})</span></h3>
        <span class="collapsible-toggle text-sm text-base-content/70 font-normal">Click to expand</span>
      </div>
      <div class="collapsible-content p-4 hidden transition-all duration-300">
        <div class="w-full">
          <canvas id="action-timeline-chart" class="w-full max-w-full border border-base-300 rounded bg-base-100 shadow-sm"></canvas>
        </div>
      </div>
    </div>
  )
}

const ModelPerformanceSection = ({ hasMetrics }: { hasMetrics: boolean }) => {
  return (
    <div class="collapsible-section collapsed mb-5 bg-base-200 rounded-lg border border-base-300 collapsed" data-testid="model-performance-section" data-has-metrics={String(hasMetrics)}>
      <div class="collapsible-header p-4 cursor-pointer select-none flex justify-between items-center bg-base-200 rounded-lg hover:bg-base-100 transition-colors duration-200" data-testid="model-performance-header">
        <h3 class="text-xl font-bold text-primary m-0">Model Performance</h3>
        <span class="collapsible-toggle text-sm text-base-content/70 font-normal">Click to expand</span>
      </div>
      <div class="collapsible-content p-4 hidden transition-all duration-300">
        <div class="mb-4">
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-3 flex-wrap justify-between">
              <div id="model-performance-provider-filters" class="join flex flex-wrap">
                {/* Provider buttons will be populated by JavaScript */}
              </div>
              <div class="flex items-center gap-3 ml-auto">
                <div id="model-performance-metric-toggle" class="join">
                  <Conditional condition={hasMetrics}>
                    <button class="btn btn-sm join-item btn-primary" data-metric="both" aria-pressed="true">Both</button>
                    <button class="btn btn-sm join-item" data-metric="latency" aria-pressed="false">Latency</button>
                    <button class="btn btn-sm join-item" data-metric="tps" aria-pressed="false">Tokens/sec</button>
                  </Conditional>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="w-full">
          <canvas id="model-performance-chart" class="w-full max-w-full h-96 border border-base-300 rounded bg-base-100 shadow-sm"></canvas>
        </div>
      </div>
    </div>
  )
}

const ContextSizeSection = ({ showIncludeAllTasks }: { showIncludeAllTasks: boolean }) => {
  return (
    <div class="collapsible-section collapsed mb-5 bg-base-200 rounded-lg border border-base-300 collapsed" data-testid="context-size-section">
      <div class="collapsible-header p-4 cursor-pointer select-none flex justify-between items-center bg-base-200 rounded-lg hover:bg-base-100 transition-colors duration-200" data-testid="context-size-header">
        <h3 class="text-xl font-bold text-primary m-0">Context</h3>
        <span class="collapsible-toggle text-sm text-base-content/70 font-normal">Click to expand</span>
      </div>
      <div class="collapsible-content p-4 hidden transition-all duration-300">
        <div class="mb-4">
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-3 flex-wrap justify-between">
              <div id="context-size-provider-filters" class="join flex flex-wrap">
                {/* Provider buttons populated by JS */}
              </div>
              <Conditional condition={showIncludeAllTasks}>
                <label class="label cursor-pointer gap-2">
                  <input id="context-size-all-tasks-toggle" type="checkbox" class="toggle toggle-sm" />
                  <span class="label-text">Include all tasks in issue</span>
                </label>
              </Conditional>
            </div>
          </div>
        </div>
        <div class="w-full">
          <canvas id="context-size-chart" class="w-full max-w-full h-96 border border-base-300 rounded bg-base-100 shadow-sm"></canvas>
        </div>
      </div>
    </div>
  )
}

const MessageTrajectoriesSection = ({ events }: { events: EventRecord[] }) => {
  return (
    <div class="bg-base-200 text-base-content rounded-lg p-4 border border-base-300">
      <h3 class="text-xl font-bold text-primary mb-8">Message Trajectories</h3>
      <ProcessedEvents events={events} />
    </div>
  )
}

const ImageModal = () => {
  return (
    <div id="imageModal" class="fixed inset-0 bg-black/80 hidden items-center justify-center z-50">
      <div class="relative w-[95vw] h-[95vh] max-w-6xl">
        <button id="closeImageModal" class="absolute -top-3 -right-3 bg-base-100 text-base-content rounded-full w-10 h-10 flex items-center justify-center shadow" aria-label="Close image viewer">&times;</button>
        <img id="imageModalImg" src="" alt="Full Image" class="w-full h-full object-contain rounded" />
      </div>
    </div>
  )
}

// Task trajectories page route
router.get('/project/:projectId/issue/:issueId/task/:taskId/trajectories', async (req: AppRequest, res: AppResponse) => {
  try {
    const { jetBrains, project, issue, task } = req

    if (!project || !issue || !task) {
      return res.status(404).send('Task not found')
    }

    // Load events
    const events = await task.events

    // Check if there are action events for conditional rendering
    const hasActionEvents = events.some(e => e.event.type === 'AgentActionExecutionStarted')
    const actionCount = events.filter(e => e.event.type === 'AgentActionExecutionStarted').length
    const hasMetrics = project.hasMetrics
    
    const tasksCount = (await issue.tasks).size
    const tasksDescriptions = [...(await issue.tasks).values()].map(t => t?.context?.description ?? '')

    // Generate JSX page
    const page = <HtmlPage cookies={req.cookies}>
      <AppHead title={`${project.name} ${issue.name} ${task.id} Trajectories`}>
        <script src={"https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"}></script>
        <script src={"https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"}></script>
        <link rel="stylesheet" href={"https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.css"}/>
        <script src={"https://code.jquery.com/jquery-3.6.0.min.js"}></script>
        <script src={"https://cdn.jsdelivr.net/npm/jquery.json-viewer@1.5.0/json-viewer/jquery.json-viewer.js"}></script>
        <script src="/js/themeSwitcher.js"></script>
        <script src="/js/collapsibleSections.js"></script>
        <script src="/js/taskActionChart.js"></script>
        <script src="/js/taskModelPerformanceChart.js"></script>
        <script>{`
          (function(){
            window._locale = window._locale || {
              code: 'en-US',
              formatLong: { date: function(options){ return options.width === 'short' ? 'MM/dd/yyyy' : 'MMMM d, yyyy'; } },
              localize: {
                month: function(n){ return ['January','February','March','April','May','June','July','August','September','October','November','December'][n]; },
                day: function(n){ return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][n]; },
                dayPeriod: function(n, options){ var arr = (options && options.width === 'wide') ? ['AM','PM'] : ['AM','PM']; return arr[n] || ''; },
                ordinalNumber: function(n){ return n; }
              },
              formatRelative: function(){ return ''; },
              match: {},
              options: { weekStartsOn: 0 }
            };
            function ContextSizeChart(canvasId, apiUrl){
              this.canvas = document.getElementById(canvasId);
              this.apiUrl = apiUrl;
              this.colors = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#6366f1'];
              this.providers = [];
              this.visibleProviders = new Set();
              this.selectedProvider = 'both';
              this.chart = null;
              this.load();
            }
            ContextSizeChart.prototype.reload = async function(newUrl){
              if (newUrl) { this.apiUrl = newUrl; }
              if (this.chart) { this.chart.destroy(); this.chart = null; }
              await this.load();
            };
            ContextSizeChart.prototype.load = async function(){
              try{
                var resp = await fetch(this.apiUrl);
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                this.data = await resp.json();
                this.providers = this.data.providers || [];
                this.visibleProviders = new Set(this.providers);
                this.createProviderFilters();
                this.createChart();
              }catch(e){
                console.error('Context size load error', e);
                this.showError('Failed to load Context Size data');
              }
            };
            ContextSizeChart.prototype.createProviderFilters = function(){
              var container = document.getElementById('context-size-provider-filters');
              if (!container) return;
              container.innerHTML = '';
              var buttons = [];
              var self = this;
              function setSelection(value){
                self.selectedProvider = value;
                self.visibleProviders = value === 'both' ? new Set(self.providers) : new Set([value]);
                buttons.forEach(function(b){
                  var active = b.getAttribute('data-value') === value;
                  b.classList.toggle('btn-primary', active);
                  b.setAttribute('aria-pressed', String(active));
                });
                self.update();
              }
              function makeBtn(label, value){
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-sm join-item';
                btn.setAttribute('data-value', value);
                btn.setAttribute('aria-pressed', 'false');
                btn.textContent = label;
                btn.addEventListener('click', function(){ setSelection(value); });
                return btn;
              }
              var both = makeBtn('Both', 'both');
              container.appendChild(both); buttons.push(both);
              this.providers.forEach(function(p){ var b = makeBtn(p, p); container.appendChild(b); buttons.push(b); });
              setSelection(this.selectedProvider || 'both');
            };
            ContextSizeChart.prototype.createChart = function(){
              if (!this.data || !this.data.contextData){ this.showError('No context data'); return; }
              var ctx = this.canvas.getContext('2d');
              var datasets = [];
              var self = this;
              this.providers.forEach(function(provider, idx){
                var color = self.colors[idx % self.colors.length];
                var raw = (self.data.providerGroups[provider] || []);
                var points = [];
                for (var i = 0; i < raw.length; i++){
                  var item = raw[i];
                  if (self.data.includeAllTasks && i > 0 && raw[i-1].taskIndex !== item.taskIndex){
                    // Insert a gap between tasks so lines are not connected across task boundaries
                    // Use an object with y: null to avoid Chart.js parse errors with raw nulls
                    points.push({ x: new Date(item.timestamp), y: null });
                  }
                  points.push({ x: new Date(item.timestamp), y: item.contextSize, provider: item.provider, model: item.model, description: item.description, reasoning: item.reasoning });
                }
                datasets.push({
                  label: provider + ' • Context Size',
                  data: points,
                  borderColor: color,
                  backgroundColor: color + '20',
                  fill: false,
                  tension: 0.1,
                  borderWidth: 2,
                  yAxisID: 'yTokens',
                  hidden: !self.visibleProviders.has(provider),
                  _provider: provider
                });
              });
              var config = {
                type: 'line',
                data: { datasets: datasets },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  elements: { point: { radius: 3, hitRadius: 10, hoverRadius: 5 }, line: { tension: 0.1 } },
                  scales: {
                    x: {
                      type: 'time',
                      time: { displayFormats: { hour: 'HH:mm', minute: 'HH:mm:ss', second: 'HH:mm:ss' }, tooltipFormat: 'MMM d, yyyy HH:mm:ss' },
                      adapters: { date: { locale: window._locale } },
                      title: { display: true, text: 'Time' }
                    },
                    yTokens: { beginAtZero: true, title: { display: true, text: 'Context size (tokens)' } }
                  },
                  plugins: {
                    title: { display: true, text: 'Context Size Over Time', font: { size: 16 } },
                    legend: { display: true, position: 'top' },
                    tooltip: {
                      callbacks: {
                        title: function(ctx){ return new Date(ctx[0].parsed.x).toLocaleString(); },
                        label: function(context){
                          var dp = context.raw; var value = context.parsed.y;
                          var formatted = (typeof value === 'number') ? value.toLocaleString() : value;
                          var lines = [ String(context.dataset._provider), 'Model: ' + dp.model ];
                          if (dp.description) { lines.push('Description: ' + dp.description); }
                          if (dp.reasoning) { lines.push('Reasoning: ' + dp.reasoning); }
                          lines.push('Context: ' + formatted + ' tokens');
                          return lines;
                        }
                      }
                    }
                  }
                }
              };
              this.chart = new Chart(ctx, config);
            };
            ContextSizeChart.prototype.update = function(){ if (!this.chart) return; this.chart.data.datasets.forEach(function(ds){ ds.hidden = !this.visibleProviders.has(ds._provider); }, this); this.chart.update(); };
            ContextSizeChart.prototype.showError = function(message){ var ctx = this.canvas.getContext('2d'); ctx.clearRect(0,0,this.canvas.width,this.canvas.height); ctx.font='16px sans-serif'; ctx.fillStyle='#ef4444'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(message, this.canvas.width/2, this.canvas.height/2); };
            document.addEventListener('DOMContentLoaded', function(){
              var section = document.querySelector('[data-testid="context-size-section"]');
              if (!section) return;
              var header = section.querySelector('.collapsible-header');
              var initialized = false;
              header.addEventListener('click', function(){
                var content = section.querySelector('.collapsible-content');
                var isExpanded = !content.classList.contains('hidden');
                if (isExpanded && !initialized){
                  setTimeout(function(){
                    var parts = window.location.pathname.split('/');
                    var projectName = parts[2];
                    var issueId = parts[4];
                    var taskId = parts[6];
                    var checkbox = document.getElementById('context-size-all-tasks-toggle');
                    function buildApiUrl(){
                      var base = '/api/project/' + encodeURIComponent(projectName) + '/issue/' + encodeURIComponent(issueId) + '/task/' + encodeURIComponent(taskId) + '/trajectories/context-size';
                      var includeAll = checkbox && checkbox.checked;
                      return includeAll ? (base + '?allTasks=1') : base;
                    }
                    var chartInstance = new ContextSizeChart('context-size-chart', buildApiUrl());
                    if (checkbox) {
                      checkbox.addEventListener('change', function(){
                        chartInstance.reload(buildApiUrl());
                      });
                    }
                    initialized = true;
                  }, 100);
                }
              });
            });
          })();
          `}
        </script>
        <script src="/js/trajectoryToggle.js"></script>
        <script src="/js/taskRawData.js"></script>
        <script src="/js/imageModal.js"></script>
      </AppHead>
      <AppBody>
        <AppHeader title={project.name} actions={[<ThemeSwitcher/>, <StatsButton/>, <ReloadButton/>]}/>
        <VersionBanner version={jetBrains?.version}/>
        <Breadcrumb items={[
          { label: 'Projects', href: '/', testId: 'breadcrumb-projects' },
          { label: project.name, href: `/project/${encodeURIComponent(project.name)}`, testId: 'breadcrumb-project-name' },
          { label: issue.name, testId: 'breadcrumb-issue-name' },
        ]}/>

        <div class="flex gap-2 mb-5" data-testid="ide-icons">
          {project.ideNames.map((ide: string) => (
            <img src={jetBrains?.getIDEIcon(ide)} alt={ide} title={ide} class="w-8 h-8" />
          ))}
        </div>

        <div class="mb-5">
          {await TaskCard({
            projectName: project.name,
            issueId: issue.id,
            taskIndex: task.index,
            task,
            locale: getLocaleFromRequest(req),
            issueTitle: issue.name,
            actionsHtml: hasMetrics ? `<a href="/api/project/${encodeURIComponent(project.name)}/issue/${encodeURIComponent(issue.id)}/task/${encodeURIComponent(task.index)}/trajectories/download" class="btn btn-primary btn-sm">Download Trajectories as JSONL</a>` : '',
            tasksCount,
            tasksDescriptions,
            currentTab: 'trajectories',
          })}
        </div>

        <ActionTimelineSection hasActionEvents={hasActionEvents} actionCount={actionCount} />
        <ModelPerformanceSection hasMetrics={hasMetrics} />
        <ContextSizeSection showIncludeAllTasks={tasksCount > 1} />
        <MessageTrajectoriesSection events={events} />
      </AppBody>
      <ImageModal />
    </HtmlPage>

    res.send(await page)
  } catch (error) {
    console.error('Error generating task trajectories page:', error)
    res.status(500).send('An error occurred while generating the task trajectories page')
  }
})

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
            messages.push(
              <MessageDecorator
                klass={klass}
                index={index + 10000}
                testIdPrefix="system-request-toggle"
                left={true}
                label="System Message"
                content={escapeHtml(record.event.chat.system)}
              />
            )

            messages.push(
              <MessageDecorator
                klass={klass}
                index={index + 10001}
                testIdPrefix="user-tools-toggle"
                left={true}
                label="Tools"
                content={
                  record.event.chat.tools.length ? (
                    <>
                      {record.event.chat.tools.map((tool, toolIndex) => (
                        <ToolDecorator tool={tool} />
                      ))}
                    </>
                  ) : (
                    'No tools listed'
                  )
                }
              />
            )

            messages.push(
              ...record.event.chat.messages.map((message, msgIndex) => (
                <ChatMessageDecorator klass={klass} index={index * 100 + msgIndex} message={message} />
              )).filter(Boolean)
            )

            didOutputInitialContext = true
          }
        } else if (record.event.type === 'LlmResponseEvent') {
          if (record.event.answer.llm.isSummarizer) {
            messages.push(
              ...record.event.answer.contentChoices.map((choice, choiceIndex) => (
                <MessageDecorator
                  klass={klass + (!!choice.content ? '' : ' bg-warning text-warning-content')}
                  index={index}
                  testIdPrefix="summarizer-assistant-toggle"
                  left={false}
                  label="Summary"
                  content={escapeHtml(choice.content || '<unexpectedly_empty>')}
                />
              ))
            )
          } else {
            const latency = record.event.answer.time
            const previous = records.slice(0, index).reverse().find((rec): rec is { event: LlmRequestEvent, timestamp: Date } => 
              rec.event.type === 'LlmRequestEvent' && rec.event.id === record.event.id
            )

            messages.push(
              ...record.event.answer.contentChoices.map((choice, choiceIndex) => {
                const toolUses = choice.type === 'com.intellij.ml.llm.matterhorn.llm.AIToolUseAnswerChoice' 
                  ? choice.usages.map((tool, toolIndex) => (
                      <ToolUseDecorator klass={klass} index={index + toolIndex + 1000} tool={tool} />
                    ))
                  : []

                return (
                  <div>
                    <MessageDecorator
                      klass={klass + (!!choice.content ? '' : ' bg-warning text-warning-content')}
                      index={index}
                      testIdPrefix="chat-assistant-toggle"
                      left={false}
                      label={`Model Response <span class="text-primary-content/50">${(latency/1000).toFixed(2)}s/${previous?.event.modelParameters.reasoning_effort}</span>`}
                      content={escapeHtml(choice.content || '<unexpectedly_empty>')}
                    />
                    {toolUses}
                  </div>
                )
              })
            )
          }
        } else if (record.event.type === 'AgentActionExecutionFinished') {
          messages.push(
            <MessageDecorator
              klass={klass}
              index={index + 10002}
              testIdPrefix="chat-user-toggle"
              left={true}
              label="Tool Result"
              content={escapeHtml(record.event.result.text)}
            />
          )

          if (record.event.result.images && record.event.result.images.length) {
            // TODO: handle images as well (when we know what the shape is)
            console.log('Unhandled tool result image', record.event.result.images)
          }
        } else if (record.event.type === 'ActionRequestBuildingFailed') {
          messages.push(
            <MessageDecorator
              klass={klass + ' bg-error text-error-content'}
              index={index + 10002}
              testIdPrefix="chat-user-toggle"
              left={true}
              label="Tool Error"
              content={escapeHtml(record.event.serializableThrowable?.message ?? 'Unspecified error')}
            />
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

export default router