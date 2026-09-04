const showcase = document.querySelector<HTMLElement>("[data-service-showcase]");

if (showcase) {
  const title = showcase.querySelector<HTMLElement>("[data-service-title]");
  const description = showcase.querySelector<HTMLElement>("[data-service-description]");
  const image = showcase.querySelector<HTMLImageElement>("[data-service-image]");
  const link = showcase.querySelector<HTMLAnchorElement>("[data-service-link]");
  const options = Array.from(showcase.querySelectorAll<HTMLElement>("[data-service-option]"));
  let activeIndex = 0;
  let timer: number | undefined;
  let fadeTimer: number | undefined;

  const setActive = (option: HTMLElement) => {
    if (options[activeIndex] === option) return;

    options.forEach((item) => {
      const active = item === option;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", active ? "true" : "false");
    });

    if (fadeTimer) window.clearTimeout(fadeTimer);
    showcase.classList.add("is-changing");

    fadeTimer = window.setTimeout(() => {
      activeIndex = Math.max(0, options.indexOf(option));
      if (title) title.textContent = option.dataset.serviceTitle ?? "";
      if (description) description.textContent = option.dataset.serviceDescription ?? "";
      if (image) {
        image.src = option.dataset.serviceImage ?? "";
        image.alt = option.dataset.serviceAlt ?? "";
      }
      if (link) link.href = option.dataset.serviceLink ?? "#";

      showcase.classList.remove("is-changing");
    }, 180);
  };

  const restart = () => {
    if (timer) window.clearInterval(timer);
    if (options.length <= 1) return;

    timer = window.setInterval(() => {
      const nextOption = options[(activeIndex + 1) % options.length];
      if (nextOption) setActive(nextOption);
    }, 4200);
  };

  options.forEach((option) => {
    option.addEventListener("click", () => {
      setActive(option);
      restart();
    });
  });

  showcase.addEventListener("mouseenter", () => {
    if (timer) window.clearInterval(timer);
  });
  showcase.addEventListener("mouseleave", restart);
  restart();
}

const slider = document.querySelector<HTMLElement>("[data-service-slider]");
const track = document.querySelector<HTMLElement>("[data-service-track]");
const progressFill = document.querySelector<HTMLElement>("[data-service-progress-fill]");
const previousButton = document.querySelector<HTMLButtonElement>("[data-service-prev]");
const nextButton = document.querySelector<HTMLButtonElement>("[data-service-next]");

if (slider && track && progressFill) {
  const cards = Array.from(track.children) as HTMLElement[];
  let index = 0;
  let timer: number | undefined;
  let scrollFrame: number | undefined;

  const getMaxIndex = () => Math.max(0, cards.length - 1);

  const updateProgressAndControls = () => {
    const maxIndex = getMaxIndex();
    const progress = maxIndex === 0 ? 1 : (index + 1) / (maxIndex + 1);
    progressFill.style.width = `${Math.max(18, progress * 100)}%`;
    previousButton?.toggleAttribute("disabled", maxIndex === 0);
    nextButton?.toggleAttribute("disabled", maxIndex === 0);
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

  const restart = () => {
    if (timer) window.clearInterval(timer);
    if (cards.length <= 1) {
      update(0, "auto");
      return;
    }

    timer = window.setInterval(() => {
      update(index >= getMaxIndex() ? 0 : index + 1);
    }, 3800);
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
    updateProgressAndControls();
  };

  previousButton?.addEventListener("click", () => {
    update(index <= 0 ? getMaxIndex() : index - 1);
    restart();
  });
  nextButton?.addEventListener("click", () => {
    update(index >= getMaxIndex() ? 0 : index + 1);
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

  window.addEventListener("resize", () => {
    updateProgressAndControls();
    restart();
  });

  updateProgressAndControls();
  restart();
}

export {};
