(() => {
  "use strict";

  const header = document.querySelector("[data-site-header]");
  const menuButton = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-site-nav]");
  const progress = document.querySelector("[data-reading-progress]");
  const intro = document.querySelector("[data-intro]");
  const homeContent = document.querySelector("[data-home-content]");

  if (intro && homeContent) {
    let introTimer;
    const finishIntro = () => {
      window.clearTimeout(introTimer);
      intro.classList.add("is-dismissed");
      homeContent.classList.add("is-ready");
      document.body.classList.remove("intro-active");
      window.setTimeout(() => intro.remove(), 450);
    };

    intro.addEventListener("click", finishIntro, { once: true });
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 50
      : 3400;
    introTimer = window.setTimeout(finishIntro, delay);
  }

  const syncHeader = () => {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    }
    if (progress) {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const value = height > 0 ? Math.min(window.scrollY / height, 1) : 0;
      progress.style.transform = `scaleX(${value})`;
    }
  };

  const closeMenu = () => {
    if (!menuButton || !menu || !header) return;
    menuButton.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
    header.classList.remove("menu-open");
  };

  menuButton?.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    menu?.classList.toggle("is-open", !open);
    header?.classList.toggle("menu-open", !open);
  });

  menu?.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  let scheduled = false;
  window.addEventListener(
    "scroll",
    () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        syncHeader();
        document.querySelectorAll("[data-parallax]").forEach((element) => {
          const rate = Number(element.dataset.parallax || 0);
          element.style.translate = `0 ${window.scrollY * -rate}px`;
        });
        scheduled = false;
      });
    },
    { passive: true },
  );

  const closeDialog = () => {
    document.querySelector("#event-layer")?.replaceChildren();
    document.body.classList.remove("dialog-open");
  };

  const startAutoplayVideos = (root = document) => {
    root.querySelectorAll("[data-autoplay-video]").forEach((video) => {
      video.defaultMuted = true;
      video.muted = true;
      video.loop = true;
      const playRequest = video.play();
      playRequest?.catch(() => {
        video.addEventListener("canplay", () => video.play().catch(() => {}), {
          once: true,
        });
      });
    });
  };

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-dialog-close]")) closeDialog();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDialog();
  });

  document.addEventListener("htmx:afterSwap", (event) => {
    if (event.target.id === "event-layer" && event.target.children.length > 0) {
      document.body.classList.add("dialog-open");
      startAutoplayVideos(event.target);
      event.target.querySelector("[data-dialog-close]:last-child")?.focus();
    }
  });

  const slugify = (value) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  document.addEventListener("input", (event) => {
    if (event.target.matches("[data-slug-input]")) {
      event.target.dataset.touched = "true";
      return;
    }
    if (!event.target.matches("[data-title-input]")) return;
    const form = event.target.closest("form");
    const slug = form?.querySelector("[data-slug-input]");
    if (slug && !slug.dataset.touched && !slug.value) {
      slug.value = slugify(event.target.value);
    }
  });

  const showToast = (message) => {
    let toast = document.querySelector("[data-admin-toast]");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "admin-toast";
      toast.dataset.adminToast = "";
      toast.setAttribute("role", "status");
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
  };

  document.addEventListener("articleDeleted", (event) => {
    showToast(event.detail.value || "O artigo foi excluído.");
    document.querySelector("#editor-panel")?.dispatchEvent(
      new CustomEvent("refreshEditor"),
    );
  });

  const initialToast = document.querySelector("[data-admin-toast].is-visible");
  if (initialToast) {
    window.setTimeout(() => initialToast.classList.remove("is-visible"), 3200);
  }

  startAutoplayVideos();
  syncHeader();
})();
