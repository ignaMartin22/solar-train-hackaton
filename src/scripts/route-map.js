// Station picker for the geographic route map. Selection state is shared by the
// index buttons and the markers overlaid on the SVG; keyboard arrows navigate.
// Without JS the server-rendered map, labels and list stay fully visible.

const section = document.getElementById("route");
if (section) {
  const all = [...section.querySelectorAll("[data-stop]")];
  const groups = {};
  all.forEach((el) => (groups[el.dataset.stop] ??= []).push(el));
  const ids = Object.keys(groups);
  const dk = section.querySelector(".rmap-dk");
  const dn = section.querySelector(".rmap-dn");
  const dd = section.querySelector(".rmap-dd");

  const select = (id, focus) => {
    ids.forEach((k) => groups[k].forEach((el) => {
      el.classList.toggle("sel", k === id);
      if (el.tagName === "BUTTON") el.setAttribute("aria-pressed", k === id ? "true" : "false");
    }));
    const ref = groups[id].find((el) => el.dataset.desc);
    if (ref) {
      if (dk) dk.textContent = `Estación ${ids.indexOf(id) + 1} de ${ids.length}`;
      if (dn) dn.textContent = ref.dataset.name;
      if (dd) dd.textContent = ref.dataset.desc;
    }
    if (focus) groups[id].find((el) => el.classList.contains("rmap-chip"))?.focus();
  };

  all.forEach((el) => {
    if (el.tagName === "BUTTON") el.addEventListener("click", () => select(el.dataset.stop));
  });
  section.addEventListener("keydown", (e) => {
    const b = e.target.closest?.("button[data-stop]");
    if (!b) return;
    const i = ids.indexOf(b.dataset.stop);
    let j = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") j = (i + 1) % ids.length;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") j = (i - 1 + ids.length) % ids.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = ids.length - 1;
    if (j >= 0) { e.preventDefault(); select(ids[j], true); }
  });
}

// little light that rides the route — skipped when the user prefers reduced motion
const svgMap = section && section.querySelector(".rmap-svg");
if (svgMap && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const NS = "http://www.w3.org/2000/svg";
  const g = document.createElementNS(NS, "g");
  g.setAttribute("class", "traveler");
  const halo = document.createElementNS(NS, "circle");
  halo.setAttribute("r", "9");
  halo.setAttribute("fill", "#ff5a1f");
  halo.setAttribute("opacity", ".35");
  const dot = document.createElementNS(NS, "circle");
  dot.setAttribute("r", "3.5");
  dot.setAttribute("fill", "#ffd9c4");
  const tail = document.createElementNS(NS, "circle");
  tail.setAttribute("r", "2");
  tail.setAttribute("fill", "#ff8a4c");
  tail.setAttribute("opacity", ".7");
  const move = document.createElementNS(NS, "animateMotion");
  move.setAttribute("dur", "9s");
  move.setAttribute("repeatCount", "indefinite");
  const mp = document.createElementNS(NS, "mpath");
  mp.setAttribute("href", "#rmap-path");
  mp.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#rmap-path");
  move.appendChild(mp);
  const moveTail = move.cloneNode(true);
  moveTail.setAttribute("begin", "-0.25s");
  g.append(halo, dot, move);
  tail.appendChild(moveTail);
  svgMap.append(tail, g);
}
