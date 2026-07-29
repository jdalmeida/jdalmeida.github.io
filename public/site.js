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

  const galleryImagesSettled = (root) => {
    const pending = Array.from(root.querySelectorAll(".event-gallery img")).filter(
      (image) => !image.complete,
    );
    if (pending.length === 0) return Promise.resolve();
    const loaded = Promise.all(
      pending.map(
        (image) =>
          new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          }),
      ),
    );
    return Promise.race([
      loaded,
      new Promise((resolve) => window.setTimeout(resolve, 1500)),
    ]);
  };

  // The videos only start downloading after the photos, so the gallery fills in
  // first instead of sharing the connection with a few megabytes of MP4.
  const startAutoplayVideos = (root = document) => {
    const videos = Array.from(root.querySelectorAll("[data-autoplay-video]"));
    if (videos.length === 0) return;
    galleryImagesSettled(root).then(() => {
      videos.forEach((video) => {
        video.defaultMuted = true;
        video.muted = true;
        video.loop = true;
        const source = video.dataset.videoSrc;
        if (source && !video.src) {
          video.preload = "auto";
          video.src = source;
        }
        const playRequest = video.play();
        playRequest?.catch(() => {
          video.addEventListener("canplay", () => video.play().catch(() => {}), {
            once: true,
          });
        });
      });
    });
  };

  // Warming the gallery while the badge is hovered means the photos are usually
  // decoded by the time the dialog opens.
  const preloadGallery = (button) => {
    if (!button || button.dataset.galleryWarm) return;
    const sources = button.dataset.galleryPreload;
    if (!sources) return;
    button.dataset.galleryWarm = "true";
    const sizes =
      button.closest("[data-gallery-sizes]")?.dataset.gallerySizes || "";
    sources.split("|").forEach((srcset) => {
      const image = new Image();
      image.decoding = "async";
      if (sizes) image.sizes = sizes;
      image.srcset = srcset;
    });
  };

  ["pointerenter", "focusin", "touchstart"].forEach((name) => {
    document.addEventListener(
      name,
      (event) => preloadGallery(event.target.closest?.("[data-gallery-preload]")),
      { capture: true, passive: true },
    );
  });

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
