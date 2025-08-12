// Compare Modal & Chart Logic (extracted from inline script)
// Initializes after window load and safely no-ops if elements are missing.
(function(){
  function init(){
    const selectAll = document.getElementById('selectAllIssues');
    const compareBtn = document.getElementById('compareBtn');
    const modal = document.getElementById('compareModal');
    const closeBtn = document.getElementById('closeCompareModal');

    // If critical elements don't exist on this page, do nothing.
    if (!compareBtn || !modal) return;

    function getSelected(){
      return Array.from(document.querySelectorAll('.issue-select:checked')).map(cb => ({
        id: cb.dataset.issueId,
        label: cb.dataset.issueName,
        input: Number(cb.dataset.inputTokens||0),
        output: Number(cb.dataset.outputTokens||0),
        cache: Number(cb.dataset.cacheTokens||0),
        cost: Number(cb.dataset.cost||0),
        time: Number(cb.dataset.timeMs||0)
      }));
    }

    function updateButton(){
      const count = getSelected().length;
      compareBtn.disabled = count < 2;
    }

    // Determine storage key per project
    const projectId = (document.body && document.body.dataset && document.body.dataset.projectId) || '';
    const storageKey = projectId ? `junie-explorer-${projectId}-selectedIssues` : '';

    // Persist current selection to localStorage
    function saveSelectedToStorage(){
      try {
        if (storageKey) {
          const selectedIds = getSelected().map(s => s.id);
          localStorage.setItem(storageKey, JSON.stringify(selectedIds));
        }
      } catch (e) { /* ignore storage errors */ }
    }

    if (selectAll){
      selectAll.addEventListener('change', () => {
        document.querySelectorAll('.issue-select').forEach(cb => {
          cb.checked = selectAll.checked;
        });
        // After toggling all, sync and persist
        updateButton();
        saveSelectedToStorage();
      });
    }

    document.addEventListener('change', (e) => {
      const t = e.target;
      if (t && t.classList && t.classList.contains('issue-select')){
        // When any individual issue selection changes, update select-all state, button, and persist
        if (selectAll){
          const all = Array.from(document.querySelectorAll('.issue-select'));
          const checked = all.filter(cb => cb.checked).length;
          selectAll.checked = (all.length > 0 && checked === all.length);
        }
        updateButton();
        saveSelectedToStorage();
      }
    });

    function openModal(){
      // Save selections to localStorage only when Compare is pressed
      try {
        if (storageKey) {
          const selectedIds = getSelected().map(s => s.id);
          localStorage.setItem(storageKey, JSON.stringify(selectedIds));
        }
      } catch (e) { /* ignore storage errors */ }
      setActiveMetric('time');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      renderChart();
    }
    function closeModal(){
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    compareBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Metric button group handling
    const metricButtons = Array.from(document.querySelectorAll('.metric-btn'));
    function setActiveMetric(metric){
      metricButtons.forEach(btn => {
        const isActive = btn.dataset.metric === metric;
        btn.classList.toggle('btn-primary', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
      renderChart();
    }
    if (metricButtons.length){
      metricButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const metric = btn.dataset.metric;
          if (metric) setActiveMetric(metric);
        });
      });
    }

    let chartInstance;
    function renderChart(){
      const canvas = document.getElementById('compareChart');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const selected = getSelected();
      const activeBtn = document.querySelector('.metric-btn[aria-pressed="true"]');
      const metric = (activeBtn && activeBtn.dataset && activeBtn.dataset.metric) || 'time';
      const labels = selected.map(s => s.label);
      const rawData = selected.map(s => s[metric]);
      const data = metric === 'time' ? rawData.map(v => v / 1000) : rawData; // seconds for time

      function fmtMinSec(totalSeconds){
        if (!isFinite(totalSeconds)) return '0:00';
        const sign = totalSeconds < 0 ? '-' : '';
        const s = Math.max(0, Math.floor(Math.abs(totalSeconds)));
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return sign + m + ':' + (sec < 10 ? '0' + sec : sec);
      }

      const dsLabel = metric === 'input' ? 'Input Tokens' : metric === 'output' ? 'Output Tokens' : metric === 'cache' ? 'Cache Tokens' : metric === 'cost' ? 'Cost (USD)' : 'Time (mm:ss)';
      const yAxisLabel = (metric === 'input' || metric === 'output' || metric === 'cache') ? 'Tokens' : metric === 'cost' ? 'USD' : 'Time (mm:ss)';

      if (chartInstance){ chartInstance.destroy(); }
      if (window.Chart){
        chartInstance = new window.Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: dsLabel,
              data,
              backgroundColor: labels.map((_, i) => 'hsl(' + ((i*137)%360) + ',70%,60%)')
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true },
              tooltip: {
                callbacks: {
                  label: function(context){
                    const v = context.parsed && typeof context.parsed.y !== 'undefined' ? context.parsed.y : context.parsed;
                    if (metric === 'time') return (context.dataset.label ? context.dataset.label + ': ' : '') + fmtMinSec(v);
                    if (metric === 'cost') return (context.dataset.label ? context.dataset.label + ': ' : '') + '$' + Number(v).toFixed(4);
                    return (context.dataset.label ? context.dataset.label + ': ' : '') + v;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: yAxisLabel },
                ticks: metric === 'time' ? {
                  callback: function(value){ return fmtMinSec(Number(value)); }
                } : (metric === 'cost' ? {
                  callback: function(value){ return '$' + Number(value).toFixed(2); }
                } : {})
              }
            }
          }
        });
      } else {
        // Fallback: simple text
        ctx.canvas.parentElement.innerHTML = '<div class="p-4">Chart library not available.</div>';
      }
    }

    // Restore selection from localStorage on load (if any)
    try {
      if (storageKey) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const ids = JSON.parse(saved);
          if (Array.isArray(ids)) {
            document.querySelectorAll('.issue-select').forEach(cb => {
              if (ids.includes(cb.dataset.issueId)) cb.checked = true;
            });
          }
        }
      }
    } catch (e) { /* ignore storage errors */ }

    // Sync select-all checkbox state after restore
    if (selectAll){
      const all = Array.from(document.querySelectorAll('.issue-select'));
      const checked = all.filter(cb => cb.checked).length;
      selectAll.checked = (all.length > 0 && checked === all.length);
    }

    // Initialize button state
    updateButton();
  }

  // Delay initialization until window load to ensure Chart.js and DOM are available
  if (document.readyState === 'complete') {
    setTimeout(init, 0);
  } else {
    window.addEventListener('load', () => setTimeout(init, 0));
  }
})();
