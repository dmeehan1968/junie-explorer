// Reload page function
async function reloadPage() {
  const button = document.getElementById('reload-button');
  const loading = button?.querySelector('.loading');
  if (button) {
    button.disabled = true;
    button.classList.add('btn-disabled');
    loading?.classList.remove('hidden');
    const response = await fetch('/refresh');
    if (response.ok && response.redirected) {
      window.location.href = response.url;
    }
  }
}