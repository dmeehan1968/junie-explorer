// Reload page function
function reloadPage() {
  const button = document.getElementById('reload-button');
  if (button) {
    button.disabled = true;
    button.classList.add('loading');
    setTimeout(() => {
      window.location.href = '/refresh';
    }, 100);
  }
}