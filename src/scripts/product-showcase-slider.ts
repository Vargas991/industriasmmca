const slider = document.querySelector<HTMLElement>("[data-product-slider]");
const track = document.querySelector<HTMLElement>("[data-product-track]");
const progressFill = document.querySelector<HTMLElement>("[data-product-progress-fill]");
const previousButton = document.querySelector<HTMLButtonElement>("[data-product-prev]");
const nextButton = document.querySelector<HTMLButtonElement>("[data-product-next]");

if (slider && track && progressFill) {
  const cards = Array.from(track.children) as HTMLElement[];
  let index = 0;
  let timer: number | undefined;
  let scrollFrame: number | undefined;

  const getVisibleCards = (): number => {
    if (window.innerWidth < 900) return 1;
    if (window.innerWidth < 1200) return 2;
    return 3;
  };

  const getMaxIndex = (): number => {
    const visibleCards = getVisibleCards();
    return Math.max(0, cards.length - visibleCards);
  };

  const updateProgressAndControls = () => {
    const maxIndex = getMaxIndex();
    const progress = maxIndex === 0 ? 1 : (index + 1) / (maxIndex + 1);
    progressFill.style.width = `${Math.max(18, progress * 100)}%`;

    const canSlide = maxIndex > 0;
    previousButton?.toggleAttribute("disabled", !canSlide);
    nextButton?.toggleAttribute("disabled", !canSlide);
  };

  const update = (nextIndex: number, behavior: ScrollBehavior = "smooth") => {
    const maxIndex = getMaxIndex();
    index = Math.max(0, Math.min(nextIndex, maxIndex));
    const target = cards[index];

    if (target) {
      slider.scrollTo({
        left: target.offsetLeft,
        behavior,
      });
    }

    updateProgressAndControls();
  };

  const goToPrevious = () => {
    const maxIndex = getMaxIndex();
    update(index <= 0 ? maxIndex : index - 1);
    restart();
  };

  const goToNext = () => {
    const maxIndex = getMaxIndex();
    update(index >= maxIndex ? 0 : index + 1);
    restart();
  };

  const restart = () => {
    if (timer) window.clearInterval(timer);
    if (cards.length <= getVisibleCards()) {
      update(0, "auto");
      return;
    }

    timer = window.setInterval(() => {
      const maxIndex = getMaxIndex();
      update(index >= maxIndex ? 0 : index + 1);
    }, 3600);
  };

  const syncIndexFromScroll = () => {
    const maxIndex = getMaxIndex();
    if (maxIndex <= 0) {
      index = 0;
      updateProgressAndControls();
      return;
    }

    let nearest = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i <= maxIndex; i += 1) {
      const card = cards[i];
      if (!card) continue;
      const distance = Math.abs(slider.scrollLeft - card.offsetLeft);
      if (distance < nearestDistance) {
        nearest = i;
        nearestDistance = distance;
      }
    }

    index = nearest;
    updateProgressAndControls();
  };

  window.addEventListener("resize", () => {
    update(index, "auto");
    restart();
  });

  slider.addEventListener("scroll", () => {
    if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(syncIndexFromScroll);
  });

  slider.addEventListener("touchstart", () => {
    if (timer) window.clearInterval(timer);
  }, { passive: true });

  slider.addEventListener("touchend", restart, { passive: true });

  slider.addEventListener("mouseenter", () => {
    if (timer) window.clearInterval(timer);
  });

  slider.addEventListener("mouseleave", restart);
  previousButton?.addEventListener("click", goToPrevious);
  nextButton?.addEventListener("click", goToNext);

  update(0, "auto");
  restart();
}
