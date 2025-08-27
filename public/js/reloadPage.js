// Reload page function with modal-based messaging and abort option (no hard timeout)
async function reloadPage() {
  const button = document.getElementById('reload-button');
  const loading = button?.querySelector('.loading');

  // ensure function is globally accessible for event delegation and re-entry
  if (typeof window !== 'undefined') {
    window.reloadPage = reloadPage;
  }

  // Modal helpers (DaisyUI compatible)
  const ensureModal = () => {
    let modal = document.getElementById('reload-modal');
    if (!modal) {
      modal = document.createElement('dialog');
      modal.id = 'reload-modal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-box max-w-lg bg-base-200 shadow-xl">
          <h3 id="reload-modal-title" class="font-bold text-lg">Reload</h3>
          <div id="reload-modal-body" class="py-2"></div>
          <div id="reload-modal-actions" class="modal-action"></div>
        </div>
        <form method="dialog" class="modal-backdrop bg-base-300/80"><button>close</button></form>`;
      document.body.appendChild(modal);

      // Event delegation for modal action buttons to avoid missing handlers on re-render
      modal.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.id === 'reload-try-again') {
          e.preventDefault();
          hideModal();
          // Restart reload
          reloadPage();
        } else if (target.id === 'reload-abort') {
          e.preventDefault();
          aborted = true;
          controller.abort();
        }
      });
    }
    return modal;
  };

  const showModal = ({ title, bodyHtml, actionsHtml, tone = 'info' }) => {
    const modal = ensureModal();
    const box = modal.querySelector('.modal-box');
    const titleEl = modal.querySelector('#reload-modal-title');
    const bodyEl = modal.querySelector('#reload-modal-body');
    const actionsEl = modal.querySelector('#reload-modal-actions');

    // apply tone styles with no transparency in content box
    const toneMap = {
      info: 'border',
      warn: 'border border-warning',
      error: 'border border-error',
      success: 'border border-success',
    };
    box.className = `modal-box max-w-lg bg-base-200 shadow-xl ${toneMap[tone] || ''}`;
    titleEl.textContent = title || 'Reload';
    bodyEl.innerHTML = bodyHtml || '';
    actionsEl.innerHTML = actionsHtml || '';

    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', 'true');

    return modal;
  };

  const hideModal = () => {
    const modal = document.getElementById('reload-modal');
    if (modal) {
      if (typeof modal.close === 'function') modal.close();
      else modal.removeAttribute('open');
    }
  };

  const setLoading = (isLoading) => {
    if (button) button.disabled = !!isLoading;
    if (loading) loading.classList.toggle('hidden', !isLoading);
  };

  const controller = new AbortController();
  let slowTimerId;
  let aborted = false;

  // After 10s, show a non-blocking modal with Abort button; do not abort automatically
  const showSlowModal = () => {
    showModal({
      title: 'This is taking a while...',
      bodyHtml: `
        <div class="flex items-start gap-2">
          <span class="loading loading-spinner loading-sm mt-1"></span>
          <div>
            <div>Please wait while we reload project data. You can abort if needed.</div>
          </div>
        </div>`,
      actionsHtml: `
        <button id="reload-abort" type="button" class="btn btn-outline btn-sm">Abort</button>
      `,
      tone: 'warn',
    });
  };

  setLoading(true);

  // Start slow timer (10s) to reveal modal; no hard timeout on the request
  slowTimerId = setTimeout(showSlowModal, 10000);

  try {
    const response = await fetch('/refresh', { signal: controller.signal, redirect: 'follow' });

    if (response.ok && response.redirected) {
      hideModal();
      window.location.href = response.url;
      return;
    }

    if (!response.ok) {
      let details = '';
      try {
        const text = await response.text();
        if (text) details = `<pre class=\"mt-2 whitespace-pre-wrap text-xs\">${text}</pre>`;
      } catch { /* ignore */ }

      showModal({
        title: `Reload failed: ${response.status} ${response.statusText}`,
        bodyHtml: `
          <ul class="list-disc list-inside mt-1 text-sm">
            <li>Ensure the server is running (bun run dev or bun start).</li>
            <li>Check terminal/server logs for errors during reload.</li>
            <li>If data is large, wait a bit and try again.</li>
            <li>If the issue persists, refresh the browser or clear cache.</li>
          </ul>
          ${details}
        `,
        actionsHtml: `<button id=\"reload-try-again\" type=\"button\" class=\"btn btn-sm\">Try again</button>`,
        tone: 'error',
      });
      return;
    }

    // Fallback: successful response without redirect, reload the current page
    hideModal();
    window.location.reload();
  } catch (err) {
    const isAbort = err && (err.name === 'AbortError' || err.code === 'ABORT_ERR');
    const title = isAbort ? (aborted ? 'Reload aborted by user.' : 'Reload cancelled.') : 'Reload failed.';
    const guidance = isAbort ? `You cancelled the operation. You can try again when ready.` : `
      Check your internet connection and ensure the local server is running.
      Review terminal logs for any errors during the reload.
      If the problem continues, try reloading the page or restarting the server.`;

    showModal({
      title,
      bodyHtml: `<div class="mt-1 text-sm whitespace-pre-line">${guidance}</div>`,
      actionsHtml: `<button id=\"reload-try-again\" type=\"button\" class=\"btn btn-sm\">Try again</button>`,
      tone: isAbort ? 'info' : 'error',
    });
  } finally {
    if (slowTimerId) clearTimeout(slowTimerId);
    setLoading(false);
  }
}

// ensure function is attached globally when script is loaded (for onclick or external bindings)
if (typeof window !== 'undefined') {
  window.reloadPage = reloadPage;
}