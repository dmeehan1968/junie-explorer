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
        time: Number(cb.dataset.timeMs||0)
      }));
    }

    function updateButton(){
      const count = getSelected().length;
      compareBtn.disabled = count < 2;
    }

    if (selectAll){
      selectAll.addEventListener('change', () => {
        document.querySelectorAll('.issue-select').forEach(cb => {
          cb.checked = selectAll.checked;
        });
        updateButton();
      });
    }

    document.addEventListener('change', (e) => {
      const t = e.target;
      if (t && t.classList && t.classList.contains('issue-select')){
        updateButton();
      }
    });

    function openModal(){
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

    document.addEventListener('change', (e) => {
      const t = e.target;
      if (t && t.name === 'metricChoice'){
        renderChart();
      }
    });

    let chartInstance;
    function renderChart(){
      const canvas = document.getElementById('compareChart');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const selected = getSelected();
      const metricRadio = document.querySelector('input[name="metricChoice"]:checked');
      const metric = (metricRadio && metricRadio.value) || 'time';
      const labels = selected.map(s => s.label);
      const rawData = selected.map(s => s[metric]);
      const data = metric === 'time' ? rawData.map(v => v / 1000) : rawData; // seconds for time

      const dsLabel = metric === 'input' ? 'Input Tokens' : metric === 'output' ? 'Output Tokens' : metric === 'cache' ? 'Cache Tokens' : 'Time (s)';
      const yAxisLabel = (metric === 'input' || metric === 'output' || metric === 'cache') ? 'Tokens' : 'Time (s)';

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
            plugins: { legend: { display: true } },
            scales: { y: { beginAtZero: true, title: { display: true, text: yAxisLabel } } }
          }
        });
      } else {
        // Fallback: simple text
        ctx.canvas.parentElement.innerHTML = '<div class="p-4">Chart library not available.</div>';
      }
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
