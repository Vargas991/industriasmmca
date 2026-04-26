const galleries = Array.from(document.querySelectorAll<HTMLElement>("[data-product-gallery]"));

galleries.forEach((gallery) => {
  const mainImage = gallery.querySelector<HTMLImageElement>("[data-product-gallery-main]");
  const thumbs = Array.from(gallery.querySelectorAll<HTMLButtonElement>("[data-product-gallery-thumb]"));

  if (!mainImage || thumbs.length === 0) return;

  const setActiveThumb = (thumb: HTMLButtonElement) => {
    const image = thumb.dataset.image;
    const alt = thumb.dataset.alt;

    if (!image) return;

    mainImage.src = image;
    if (alt) mainImage.alt = alt;

    thumbs.forEach((item) => {
      const isActive = item === thumb;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  };

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => setActiveThumb(thumb));
  });
});
