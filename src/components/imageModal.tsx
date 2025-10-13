/** @jsxImportSource @kitajs/html */

export const ImageModal = () => {
  return (
    <div id="imageModal" class="fixed inset-0 bg-black/80 hidden items-center justify-center z-50">
      <div class="relative w-[95vw] h-[95vh] max-w-6xl">
        <button id="closeImageModal"
                class="absolute -top-3 -right-3 bg-base-100 text-base-content rounded-full w-10 h-10 flex items-center justify-center shadow"
                aria-label="Close image viewer">&times;</button>
        <img id="imageModalImg" src="" alt="Full Image" class="w-full h-full object-contain rounded"/>
      </div>
    </div>
  )
}