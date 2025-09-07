// Context Size Over Time Chart using Chart.js
// Shows cumulative max of (input + output + cache) tokens per provider over time
(function(){
  // simple locale for date adapter
  window._locale = window._locale || {
    code: 'en-US',
    formatLong: {
      date: (options) => options.width === 'short' ? 'MM/dd/yyyy' : 'MMMM d, yyyy'
    },
    localize: {
      month: (n) => ['January','February','March','April','May','June','July','August','September','October','November','December'][n],
      day: (n) => ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][n],
      dayPeriod: (n, options) => (options?.width === 'wide' ? ['AM','PM'] : ['AM','PM'])[n] || '',
      ordinalNumber: (n) => n
    },
    formatRelative: () => '',
    match: {},
    options: { weekStartsOn: 0 }
  };

  class ContextSizeChart {
    constructor(canvasId, apiUrl){
      this.canvas = document.getElementById(canvasId);
      this.apiUrl = apiUrl;
      this.colors = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#6366f1'];
      this.providers = [];
      this.visibleProviders = new Set();
      this.selectedProvider = 'both';
      this.chart = null;
      this.load();
    }
    async load(){
      try{
        const resp = await fetch(this.apiUrl);
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
    }
    createProviderFilters(){
      const container = document.getElementById('context-size-provider-filters');
      if (!container) return;
      container.innerHTML = '';
      const buttons = [];
      const setSelection = (value) => {
        this.selectedProvider = value;
        this.visibleProviders = value === 'both' ? new Set(this.providers) : new Set([value]);
        buttons.forEach(b => {
          const active = b.getAttribute('data-value') === value;
          b.classList.toggle('btn-primary', active);
          b.setAttribute('aria-pressed', String(active));
        });
        this.update();
      };
      const makeBtn = (label, value) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-sm join-item';
        btn.setAttribute('data-value', value);
        btn.setAttribute('aria-pressed', 'false');
        btn.textContent = label;
        btn.addEventListener('click', () => setSelection(value));
        return btn;
      };
      const both = makeBtn('Both', 'both');
      container.appendChild(both); buttons.push(both);
      this.providers.forEach((p) => { const b = makeBtn(p, p); container.appendChild(b); buttons.push(b); });
      setSelection(this.selectedProvider || 'both');
    }
    createChart(){
      if (!this.data || !this.data.contextData){ this.showError('No context data'); return; }
      const ctx = this.canvas.getContext('2d');
      const datasets = [];
      this.providers.forEach((provider, idx) => {
        const color = this.colors[idx % this.colors.length];
        const points = (this.data.providerGroups[provider] || []).map(item => ({ x: new Date(item.timestamp), y: item.contextSize, provider: item.provider, model: item.model }));
        datasets.push({
          label: provider + ' • Context Size',
          data: points,
          borderColor: color,
          backgroundColor: color + '20',
          fill: false,
          tension: 0.1,
          borderWidth: 2,
          yAxisID: 'yTokens',
          hidden: !this.visibleProviders.has(provider),
          _provider: provider
        });
      });
      const config = {
        type: 'line',
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          elements: {
            point: { radius: 3, hitRadius: 10, hoverRadius: 5 },
            line: { tension: 0.1 }
          },
          scales: {
            x: {
              type: 'time',
              time: {
                displayFormats: { hour: 'HH:mm', minute: 'HH:mm:ss', second: 'HH:mm:ss' },
                tooltipFormat: 'MMM d, yyyy HH:mm:ss'
              },
              adapters: { date: { locale: window._locale } },
              title: { display: true, text: 'Time' }
            },
            yTokens: {
              beginAtZero: true,
              title: { display: true, text: 'Context size (tokens)' }
            }
          },
          plugins: {
            title: { display: true, text: 'Context Size Over Time', font: { size: 16 } },
            legend: { display: true, position: 'top' },
            tooltip: {
              callbacks: {
                title: function(ctx){ return new Date(ctx[0].parsed.x).toLocaleString(); },
                label: function(context){
                  const dp = context.raw;
                  const value = context.parsed.y;
                  const formatted = (typeof value === 'number') ? value.toLocaleString() : value;
                  const lines = [ `${context.dataset._provider}`, `Model: ${dp.model}`, `Context: ${formatted} tokens` ];
                  return lines;
                }
              }
            }
          }
        }
      };
      this.chart = new Chart(ctx, config);
    }
    update(){ if (!this.chart) return; this.chart.data.datasets.forEach(ds => { ds.hidden = !this.visibleProviders.has(ds._provider); }); this.chart.update(); }
    showError(message){ const ctx = this.canvas.getContext('2d'); ctx.clearRect(0,0,this.canvas.width,this.canvas.height); ctx.font='16px sans-serif'; ctx.fillStyle='#ef4444'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(message, this.canvas.width/2, this.canvas.height/2); }
  }

  document.addEventListener('DOMContentLoaded', function(){
    const section = document.querySelector('[data-testid="context-size-section"]');
    if (!section) return;
    const header = section.querySelector('.collapsible-header');
    let initialized = false;
    header.addEventListener('click', function(){
      const content = section.querySelector('.collapsible-content');
      const isExpanded = !content.classList.contains('hidden');
      if (isExpanded && !initialized){
        setTimeout(() => {
          const parts = window.location.pathname.split('/');
          const projectName = parts[2];
          const issueId = parts[4];
          const taskId = parts[6];
          const apiUrl = `/api/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${encodeURIComponent(taskId)}/trajectories/context-size`;
          new ContextSizeChart('context-size-chart', apiUrl);
          initialized = true;
        }, 100);
      }
    });
  });
})();
