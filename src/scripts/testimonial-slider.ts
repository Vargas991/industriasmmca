const slider = document.querySelector<HTMLElement>("[data-testimonial-slider]");

if (slider) {
  const cards = Array.from(slider.children) as HTMLElement[];
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileQuery = window.matchMedia("(max-width: 900px)");
  let index = 0;
  let timer: number | undefined;
  let scrollFrame: number | undefined;

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = undefined;
  };

  const getMaxIndex = () => Math.max(0, cards.length - 1);

  const update = (nextIndex: number, behavior: ScrollBehavior = "smooth") => {
    index = Math.max(0, Math.min(nextIndex, getMaxIndex()));
    const target = cards[index];

    if (target) {
      slider.scrollTo({
        left: target.offsetLeft,
        behavior,
      });
    }
  };

  const start = () => {
    stop();

    if (!mobileQuery.matches || motionQuery.matches || cards.length <= 1) return;

    timer = window.setInterval(() => {
      update(index >= getMaxIndex() ? 0 : index + 1);
    }, 4200);
  };

  const syncIndexFromScroll = () => {
    let nearest = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, cardIndex) => {
      const distance = Math.abs(slider.scrollLeft - card.offsetLeft);
      if (distance < nearestDistance) {
        nearest = cardIndex;
        nearestDistance = distance;
      }
    });

    index = nearest;
  };

  slider.addEventListener("scroll", () => {
    if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(syncIndexFromScroll);
  });

  slider.addEventListener("touchstart", stop, { passive: true });
  slider.addEventListener("touchend", start, { passive: true });
  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);

  mobileQuery.addEventListener("change", start);
  motionQuery.addEventListener("change", start);

  start();
}

export {};
