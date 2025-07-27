// Reload page function
function reloadPage() {
  const button = document.getElementById('reload-button');
  if (button) {
    button.disabled = true;
    button.classList.add('btn-disabled');
    button.innerHTML = '<span class="loading loading-spinner loading-sm"></span>Reloading...';
    setTimeout(() => {
      window.location.href = '/refresh';
    }, 100);
  }
}