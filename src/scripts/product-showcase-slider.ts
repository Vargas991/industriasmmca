const slider = document.querySelector<HTMLElement>("[data-product-slider]");
const track = document.querySelector<HTMLElement>("[data-product-track]");
const progressFill = document.querySelector<HTMLElement>("[data-product-progress-fill]");
const previousButton = document.querySelector<HTMLButtonElement>("[data-product-prev]");
const nextButton = document.querySelector<HTMLButtonElement>("[data-product-next]");

if (slider && track && progressFill) {
  const cards = Array.from(track.children) as HTMLElement[];
  let index = 0;
  let timer: number | undefined;

  const getVisibleCards = (): number => {
    if (window.innerWidth < 900) return 1;
    if (window.innerWidth < 1200) return 2;
    return 3;
  };

  const update = (nextIndex: number, behavior: ScrollBehavior = "smooth") => {
    const visibleCards = getVisibleCards();
    const maxIndex = Math.max(0, cards.length - visibleCards);
    index = Math.max(0, Math.min(nextIndex, maxIndex));
    const target = cards[index];

    if (target) {
      slider.scrollTo({
        left: target.offsetLeft,
        behavior,
      });
    }

    const progress = maxIndex === 0 ? 1 : (index + 1) / (maxIndex + 1);
    progressFill.style.width = `${Math.max(18, progress * 100)}%`;

    const canSlide = maxIndex > 0;
    previousButton?.toggleAttribute("disabled", !canSlide);
    nextButton?.toggleAttribute("disabled", !canSlide);
  };

  const goToPrevious = () => {
    const visibleCards = getVisibleCards();
    const maxIndex = Math.max(0, cards.length - visibleCards);
    update(index <= 0 ? maxIndex : index - 1);
    restart();
  };

  const goToNext = () => {
    const visibleCards = getVisibleCards();
    const maxIndex = Math.max(0, cards.length - visibleCards);
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
      const visibleCards = getVisibleCards();
      const maxIndex = Math.max(0, cards.length - visibleCards);
      update(index >= maxIndex ? 0 : index + 1);
    }, 3600);
  };

  window.addEventListener("resize", () => {
    update(index, "auto");
    restart();
  });

  slider.addEventListener("mouseenter", () => {
    if (timer) window.clearInterval(timer);
  });

  slider.addEventListener("mouseleave", restart);
  previousButton?.addEventListener("click", goToPrevious);
  nextButton?.addEventListener("click", goToNext);

  update(0, "auto");
  restart();
}
