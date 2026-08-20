(() => {
  "use strict";

  const desktop = window.matchMedia("(min-width: 821px)");
  let requested = false;

  const load = () => {
    if (!desktop.matches || requested) return;
    requested = true;
    import("/build/lanyard-desktop.js?v=20260820-9").catch((error) => {
      requested = false;
      console.error("The desktop lanyard could not start.", error);
    });
  };

  desktop.addEventListener("change", load);
  load();
})();
