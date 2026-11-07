// AMU impact graph: select a node, see what depends on it (directly and transitively),
// the source-backed path, related tests and docs, coverage and confidence.
import { env, $, $$ } from "./core.js";

export function initGraph() {
  const box = $("[data-graph]");
  if (!box) return;
  const data = JSON.parse($("script[data-graph-data]", box).textContent);
  const nodes = Object.fromEntries(data.nodes.map((n) => [n.id, n]));
  const dependents = {};
  for (const [from, to, flag] of data.edges) (dependents[to] ||= []).push({ from, uncertain: !!flag });
  const els = Object.fromEntries($$("[data-node]", box).map((g) => [g.dataset.node, g]));
  const edges = $$(".g-edge", box);
  const R = (k) => $(`[data-r="${k}"]`, box);
  const list = (arr) => arr.length ? `<ul>${arr.map((x) => `<li>${x}</li>`).join("")}</ul>` : "None found";

  function select(id) {
    // Breadth-first walk over reverse edges = everything that could break.
    const depth = { [id]: 0 }, parent = {}, q = [id];
    let uncertain = false;
    while (q.length) {
      const cur = q.shift();
      for (const { from, uncertain: u } of dependents[cur] || []) {
        if (from in depth) continue;
        depth[from] = depth[cur] + 1; parent[from] = cur; if (u) uncertain = true; q.push(from);
      }
    }
    const impacted = Object.keys(depth).filter((k) => k !== id);
    const direct = impacted.filter((k) => depth[k] === 1), indirect = impacted.filter((k) => depth[k] > 1);

    Object.entries(els).forEach(([k, g]) => {
      g.classList.remove("is-src", "is-d1", "is-d2");
      g.setAttribute("aria-pressed", String(k === id));
      if (k === id) g.classList.add("is-src");
      else if (depth[k] === 1) g.classList.add("is-d1");
      else if (depth[k] > 1) g.classList.add("is-d2");
      if (!env.reduce && depth[k] > 0) { g.style.animationDelay = `${(depth[k] - 1) * 260}ms`; }
    });
    edges.forEach((e) => {
      const f = e.dataset.from, t = e.dataset.to;
      e.classList.remove("is-d1", "is-d2");
      if (f in depth && t in depth && depth[f] === depth[t] + 1) e.classList.add(depth[f] === 1 ? "is-d1" : "is-d2");
    });

    const far = impacted.sort((a, b) => depth[b] - depth[a])[0];
    const chain = []; for (let k = far; k; k = parent[k]) chain.push(k);
    const scope = [id, ...impacted];
    const tests = [...new Set(scope.flatMap((k) => nodes[k].tests))];
    const docs = [...new Set(scope.flatMap((k) => nodes[k].docs))];
    const covered = scope.filter((k) => nodes[k].tests.length).length / scope.length;
    const conf = uncertain ? "Medium: one inferred call on this path" : covered >= 0.7 ? "High: static calls, well tested" : covered >= 0.4 ? "Medium: partial test coverage" : "Low: most impacted code is untested";

    R("name").textContent = nodes[id].label;
    R("direct").innerHTML = list(direct.map((k) => nodes[k].label));
    R("indirect").innerHTML = list(indirect.map((k) => nodes[k].label));
    R("path").innerHTML = far ? list(chain.map((k) => `${nodes[k].label} <span class="muted">${nodes[k].file}</span>`)) : "Nothing depends on this.";
    R("tests").innerHTML = list(tests);
    R("docs").innerHTML = list(docs);
    R("coverage").textContent = `${Math.round(covered * 100)}% of ${scope.length} impacted units have tests`;
    R("meter").style.width = `${Math.round(covered * 100)}%`;
    R("confidence").textContent = conf;
  }

  Object.entries(els).forEach(([id, g]) => {
    g.addEventListener("click", () => select(id));
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(id); } });
  });
  select(data.defaultNode);
}
