const showcase = document.querySelector<HTMLElement>("[data-project-showcase]");

if (showcase) {
  const title = showcase.querySelector<HTMLElement>("[data-project-title]");
  const sector = showcase.querySelector<HTMLElement>("[data-project-sector]");
  const description = showcase.querySelector<HTMLElement>("[data-project-description]");
  const image = showcase.querySelector<HTMLImageElement>("[data-project-image]");
  const link = showcase.querySelector<HTMLAnchorElement>("[data-project-link]");
  const options = Array.from(showcase.querySelectorAll<HTMLElement>("[data-project-option]"));

  const setActive = (option: HTMLElement) => {
    options.forEach((item) => {
      const active = item === option;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", active ? "true" : "false");
    });

    if (title) title.textContent = option.dataset.projectTitle ?? "";
    if (sector) sector.textContent = option.dataset.projectSector ?? "";
    if (description) description.textContent = option.dataset.projectDescription ?? "";
    if (image) {
      image.src = option.dataset.projectImage ?? "";
      image.alt = option.dataset.projectAlt ?? "";
    }
    if (link) link.href = option.dataset.projectLink ?? "#";
  };

  options.forEach((option) => {
    option.addEventListener("click", () => setActive(option));
  });
}
