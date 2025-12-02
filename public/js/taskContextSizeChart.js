(function(){
  window._locale = window._locale || {
    code: 'en-US',
    formatLong: { date: function(options){ return options.width === 'short' ? 'MM/dd/yyyy' : 'MMMM d, yyyy' } },
    localize: {
      month: function(n){ return ['January','February','March','April','May','June','July','August','September','October','November','December'][n] },
      day: function(n){ return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][n] },
      dayPeriod: function(n, options){ var arr = (options && options.width === 'wide') ? ['AM','PM'] : ['AM','PM']; return arr[n] || '' },
      ordinalNumber: function(n){ return n }
    },
    formatRelative: function(){ return '' },
    match: {},
    options: { weekStartsOn: 0 }
  }
  function ContextSizeChart(canvasId, apiUrl){
    this.canvas = document.getElementById(canvasId)
    this.apiUrl = apiUrl
    this.colors = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#6366f1']
    this.providers = []
    this.visibleProviders = new Set()
    this.selectedProvider = 'all'
    this.chart = null
    this.load()
  }
  ContextSizeChart.prototype.reload = async function(newUrl){
    if (newUrl) { this.apiUrl = newUrl }
    if (this.chart) { this.chart.destroy(); this.chart = null }
    await this.load()
  }
  ContextSizeChart.prototype.load = async function(){
    try{
      var resp = await fetch(this.apiUrl)
      if (!resp.ok) throw new Error('HTTP ' + resp.status)
      this.data = await resp.json()
      this.providers = this.data.providers || []
      this.visibleProviders = new Set(this.providers)
      this.createProviderFilters()
      this.createChart()
    }catch(e){
      console.error('Context size load error', e)
      this.showError('Failed to load Context Size data')
    }
  }
  ContextSizeChart.prototype.createProviderFilters = function(){
    var container = document.getElementById('context-size-provider-filters')
    if (!container) return
    container.innerHTML = ''
    var buttons = []
    var self = this
    function setSelection(value){
      self.selectedProvider = value
      self.visibleProviders = value === 'all' ? new Set(self.providers) : new Set([value])
      buttons.forEach(function(b){
        var active = b.getAttribute('data-value') === value
        b.classList.toggle('btn-primary', active)
        b.setAttribute('aria-pressed', String(active))
      })
      self.update()
    }
    function makeBtn(label, value){
      var btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'btn btn-sm join-item'
      btn.setAttribute('data-value', value)
      btn.setAttribute('aria-pressed', 'false')
      btn.textContent = label
      btn.addEventListener('click', function(){ setSelection(value) })
      return btn
    }
    var allBtn = makeBtn('All', 'all')
    container.appendChild(allBtn); buttons.push(allBtn)
    this.providers.forEach(function(p){ var b = makeBtn(p, p); container.appendChild(b); buttons.push(b) })
    setSelection(this.selectedProvider || 'all')
  }
  ContextSizeChart.prototype.createChart = function(){
    if (!this.data || !this.data.contextData){ this.showError('No context data'); return }
    var ctx = this.canvas.getContext('2d')
    var datasets = []
    var self = this
    this.providers.forEach(function(provider, idx){
      var color = self.colors[idx % self.colors.length]
      var raw = (self.data.providerGroups[provider] || [])
      var points = []
      for (var i = 0; i < raw.length; i++){
        var item = raw[i]
        if (self.data.includeAllTasks && i > 0 && raw[i-1].taskIndex !== item.taskIndex){
          // Insert a gap between tasks so lines are not connected across task boundaries
          // Use an object with y: null to avoid Chart.js parse errors with raw nulls
          points.push({ x: new Date(item.timestamp), y: null })
        }
        points.push({ x: new Date(item.timestamp), y: item.contextSize, provider: item.provider, model: item.model, description: item.description, reasoning: item.reasoning })
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
      })
    })
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
              title: function(ctx){ return new Date(ctx[0].parsed.x).toLocaleString() },
              label: function(context){
                var dp = context.raw; var value = context.parsed.y
                var formatted = (typeof value === 'number') ? value.toLocaleString() : value
                var lines = [ String(context.dataset._provider), 'Model: ' + dp.model ]
                if (dp.description) { lines.push('Description: ' + dp.description) }
                if (dp.reasoning) { lines.push('Reasoning: ' + dp.reasoning) }
                lines.push('Context: ' + formatted + ' tokens')
                return lines
              }
            }
          }
        }
      }
    }
    this.chart = new Chart(ctx, config)
  }
  ContextSizeChart.prototype.update = function(){ if (!this.chart) return; this.chart.data.datasets.forEach(function(ds){ ds.hidden = !this.visibleProviders.has(ds._provider) }, this); this.chart.update() }
  ContextSizeChart.prototype.showError = function(message){ var ctx = this.canvas.getContext('2d'); ctx.clearRect(0,0,this.canvas.width,this.canvas.height); ctx.font='16px sans-serif'; ctx.fillStyle='#ef4444'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(message, this.canvas.width/2, this.canvas.height/2) }
  document.addEventListener('DOMContentLoaded', function(){
    var section = document.querySelector('[data-testid="context-size-section"]')
    if (!section) return
    var header = section.querySelector('.collapsible-header')
    var initialized = false
    header.addEventListener('click', function(){
      var content = section.querySelector('.collapsible-content')
      var isExpanded = !content.classList.contains('hidden')
      if (isExpanded && !initialized){
        setTimeout(function(){
          var parts = window.location.pathname.split('/')
          var projectName = parts[2]
          var issueId = parts[4]
          var taskId = parts[6]
          var checkbox = document.getElementById('context-size-all-tasks-toggle')
          function buildApiUrl(){
            var base = '/api/project/' + encodeURIComponent(projectName) + '/issue/' + encodeURIComponent(issueId) + '/task/' + encodeURIComponent(taskId) + '/trajectories/context-size'
            var includeAll = checkbox && checkbox.checked
            return includeAll ? (base + '?allTasks=1') : base
          }
          var chartInstance = new ContextSizeChart('context-size-chart', buildApiUrl())
          if (checkbox) {
            checkbox.addEventListener('change', function(){
              chartInstance.reload(buildApiUrl())
            })
          }
          initialized = true
        }, 100)
      }
    })
  })
})()