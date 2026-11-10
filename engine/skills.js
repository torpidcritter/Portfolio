// Interactive skills: filter cards by category; hovering, focusing or tapping a skill shows where it was used.
import { $, $$ } from "./core.js";

export function initSkills() {
  const box = $("[data-skills]");
  if (!box) return;
  const tabs = $$("[data-skill-tab]", box), cards = $$("[data-skill-group]", box);
  tabs.forEach((t) => t.addEventListener("click", () => {
    tabs.forEach((x) => x.setAttribute("aria-pressed", String(x === t)));
    const g = t.dataset.skillTab;
    cards.forEach((c) => { c.classList.toggle("is-dim", g !== "all" && c.dataset.skillGroup !== g); c.classList.toggle("is-focus", c.dataset.skillGroup === g); });
  }));
  const show = (chip) => {
    const tip = chip.closest("[data-skill-group]")?.querySelector("[data-skill-tip]");
    if (!tip) return;
    $$(".chip.is-hot", box).forEach((c) => c !== chip && c.classList.remove("is-hot"));
    chip.classList.add("is-hot");
    const used = chip.dataset.used;
    tip.textContent = chip.classList.contains("chip-familiar")
      ? `${chip.dataset.skill}: familiar, not yet in a shipped project.`
      : used ? `${chip.dataset.skill}: used in ${used}.` : `${chip.dataset.skill}: used across project work.`;
  };
  $$("[data-skill]", box).forEach((c) => {
    c.addEventListener("pointerenter", () => show(c));
    c.addEventListener("focus", () => show(c));
    c.addEventListener("click", () => show(c));
  });
}
