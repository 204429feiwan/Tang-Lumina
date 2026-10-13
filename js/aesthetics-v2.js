const ENABLE_AESTHETICS_V2 = true;
const HOME_ENTRY = "../index-v2.html";
(() => {
  if (!ENABLE_AESTHETICS_V2) return;
  document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("a2-enabled");
    /* 自动隐藏导航：滚动态下鼠标移到页面顶部区域时滑出，离开后收起 */
    const navbar = document.querySelector(".navbar");
    if (navbar) {
      const NAV_REVEAL_Y = 90;
      document.addEventListener("mousemove", (e) => {
        navbar.classList.toggle("nav-revealed", e.clientY < NAV_REVEAL_Y);
      });
      document.addEventListener("mouseleave", () =>
        navbar.classList.remove("nav-revealed"),
      );
    }
    const hero = document.querySelector(".page-hero");
    if (hero && !hero.querySelector(".a2-hero")) {
      hero.innerHTML =
        '<div class="a2-hero"><div class="a2-hero-copy"><h1>唐风美学</h1><p>锦成其形 · 舞成其势 · 色成其韵</p></div><a class="a2-hero-enter" href="#brocadeSection">循锦入唐</a></div>';
    }
    const loom = document.querySelector("#brocadeLoom");
    if (loom) {
      const cards = [...loom.querySelectorAll(".brocade-card")],
        tabs = document.createElement("div");
      tabs.className = "a2-brocade-tabs";
      cards.forEach((card, i) => {
        const b = document.createElement("button");
        b.textContent = String(i + 1).padStart(2, "0");
        b.onclick = () => {
          const s = document.querySelector("#loomShuttle");
          s?.classList.remove("weaving");
          void s?.offsetWidth;
          s?.classList.add("weaving");
          cards.forEach((c, n) => c.classList.toggle("a2-active", n === i));
          [...tabs.children].forEach((x, n) =>
            x.classList.toggle("is-active", n === i),
          );
        };
        tabs.appendChild(b);
      });
      loom.after(tabs);
      tabs.children[0].click();
    }
  });
})();
