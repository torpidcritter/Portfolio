// Interactive skills: filter by category, and show where each skill was actually used.
import { $, $$ } from "./core.js";

export function initSkills() {
  const box = $("[data-skills]");
  if (!box) return;
  const tabs = $$("[data-skill-tab]", box), groups = $$("[data-skill-group]", box), tip = $("[data-skill-tip]", box);
  tabs.forEach((t) => t.addEventListener("click", () => {
    tabs.forEach((x) => x.setAttribute("aria-pressed", String(x === t)));
    const g = t.dataset.skillTab;
    groups.forEach((el) => el.classList.toggle("is-dim", g !== "all" && el.dataset.skillGroup !== g));
  }));
  const show = (chip) => {
    const used = chip.dataset.used;
    tip.textContent = chip.classList.contains("chip-familiar")
      ? `${chip.dataset.skill}: familiar, not yet in a shipped project.`
      : used ? `${chip.dataset.skill}: used in ${used}.` : `${chip.dataset.skill}: used across project work.`;
  };
  $$("[data-skill]", box).forEach((c) => { c.addEventListener("pointerenter", () => show(c)); c.addEventListener("focus", () => show(c)); });
}
