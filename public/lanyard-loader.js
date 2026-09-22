(() => {
  "use strict";

  // Precisa casar com a media query da cena em styles.css.
  const desktop = window.matchMedia("(min-width: 1041px)");
  let requested = false;

  const load = () => {
    if (!desktop.matches || requested) return;
    requested = true;
    import("/build/lanyard-desktop.js?v=20260922-2").catch((error) => {
      requested = false;
      console.error("The desktop lanyard could not start.", error);
    });
  };

  desktop.addEventListener("change", load);
  load();
})();
