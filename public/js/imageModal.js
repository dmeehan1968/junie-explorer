(function(){
  function init(){
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('imageModalImg');
    const closeBtn = document.getElementById('closeImageModal');

    if (!modal || !modalImg) return;

    function open(src){
      modalImg.src = src || '';
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.style.overflow = 'hidden';
    }
    function close(){
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      modalImg.src = '';
      document.body.style.overflow = '';
    }

    document.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.classList.contains('chat-image-thumb')){
        const src = t.getAttribute('data-fullsrc') || t.getAttribute('src');
        if (src) open(src);
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  if (document.readyState === 'complete') {
    setTimeout(init, 0);
  } else {
    window.addEventListener('load', () => setTimeout(init, 0));
  }
})();
