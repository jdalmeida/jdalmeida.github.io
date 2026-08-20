(() => {
  "use strict";

  const desktop = window.matchMedia("(min-width: 821px)");
  let requested = false;

  const loadStylesheet = () =>
    new Promise((resolve, reject) => {
      const stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = "/build/lanyard-desktop.css?v=20260820-1";
      stylesheet.dataset.lanyardStyles = "true";
      stylesheet.addEventListener("load", resolve, { once: true });
      stylesheet.addEventListener(
        "error",
        () => {
          stylesheet.remove();
          reject(new Error("The desktop lanyard stylesheet could not load."));
        },
        { once: true },
      );
      document.head.append(stylesheet);
    });

  const load = () => {
    if (!desktop.matches || requested) return;
    requested = true;
    loadStylesheet()
      .then(() => import("/build/lanyard-desktop.js?v=20260820-1"))
      .catch((error) => {
        requested = false;
        console.error("The desktop lanyard could not start.", error);
      });
  };

  desktop.addEventListener("change", load);
  load();
})();
