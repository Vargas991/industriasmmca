function createLightbox() {
  function buildOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'product-lightbox-overlay';

    overlay.innerHTML = `
      <div class="product-lightbox-backdrop" data-lightbox-close></div>
      <div class="product-lightbox-frame">
        <button class="product-lightbox-close" aria-label="Cerrar">×</button>
        <button class="product-lightbox-prev" aria-label="Anterior">‹</button>
        <div class="product-lightbox-content">
          <img class="product-lightbox-image" src="" alt="" />
        </div>
        <button class="product-lightbox-next" aria-label="Siguiente">›</button>
      </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  const overlay = buildOverlay();
  const imgEl = overlay.querySelector<HTMLImageElement>('.product-lightbox-image')!;
  const closeBtn = overlay.querySelector<HTMLButtonElement>('.product-lightbox-close')!;
  const prevBtn = overlay.querySelector<HTMLButtonElement>('.product-lightbox-prev')!;
  const nextBtn = overlay.querySelector<HTMLButtonElement>('.product-lightbox-next')!;
  const backdrop = overlay.querySelector<HTMLElement>('[data-lightbox-close]')!;

  let currentImages: string[] = [];
  let currentIndex = 0;

  function show(index: number) {
    currentIndex = index;
    const src = currentImages[currentIndex];
    if (!src) return;
    imgEl.src = src;
    overlay.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('is-open');
    imgEl.src = '';
    document.documentElement.style.overflow = '';
  }

  function prev() {
    show((currentIndex - 1 + currentImages.length) % currentImages.length);
  }

  function next() {
    show((currentIndex + 1) % currentImages.length);
  }

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); next(); });

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });

  return {
    open(images: string[], index = 0) {
      currentImages = images.slice();
      show(index);
    },
    close,
  };
}

const lightbox = createLightbox();

const galleries = Array.from(document.querySelectorAll<HTMLElement>('[data-product-gallery]'));
galleries.forEach((gallery) => {
  const mainImage = gallery.querySelector<HTMLImageElement>('[data-product-gallery-main]');
  const thumbs = Array.from(gallery.querySelectorAll<HTMLButtonElement>('[data-product-gallery-thumb]'));
  const images = thumbs.map((t) => t.dataset.image!).filter(Boolean);
  if (mainImage && images.length > 0) {
    // include main image as first if not present
    if (!images.includes(mainImage.src)) images.unshift(mainImage.src);

    mainImage.style.cursor = 'zoom-in';
    mainImage.addEventListener('click', () => {
      const index = images.indexOf(mainImage.src);
      lightbox.open(images, index >= 0 ? index : 0);
    });

    thumbs.forEach((thumb, i) => {
      thumb.addEventListener('click', () => {
        lightbox.open(images, images.indexOf(thumb.dataset.image as string));
      });
    });
  }
});

export {};
