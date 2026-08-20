import { Component } from "react";
import { createRoot } from "react-dom/client";

import { readCredential } from "./credential.mjs";
import { LanyardScene } from "./Scenes.jsx";

const roots = new Map();

class LanyardErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    delete this.props.host.dataset.lanyardMounted;
    console.error("The desktop lanyard could not start.", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const selectEvent = (id) => {
  const button = document.querySelector(
    `[data-lanyard-event][data-event-id="${CSS.escape(id)}"]`,
  );
  button?.focus({ preventScroll: true });
  button?.click();
};

const findHosts = (root, selector) => {
  const hosts = [...root.querySelectorAll(selector)];
  if (root instanceof Element && root.matches(selector)) hosts.unshift(root);
  return hosts;
};

const renderScene = (host, credentials, mode, onSelect) => {
  if (roots.has(host)) return;
  host.classList.add("lanyard-react-root");
  const root = createRoot(host);
  roots.set(host, root);
  const markReady = () => {
    host.dataset.lanyardMounted = "true";
  };
  root.render(
    <LanyardErrorBoundary host={host}>
      <LanyardScene
        credentials={credentials}
        mode={mode}
        onReady={markReady}
        onSelect={onSelect}
      />
    </LanyardErrorBoundary>,
  );
};

export function mountLanyards(root = document) {
  for (const host of findHosts(root, "[data-lanyard-home]")) {
    const credentials = [...document.querySelectorAll("[data-lanyard-event]")].map(
      readCredential,
    );
    if (credentials.length) renderScene(host, credentials, "home", selectEvent);
  }

  for (const host of findHosts(root, "[data-lanyard-dialog]")) {
    renderScene(host, [readCredential(host)], "dialog");
  }
}

mountLanyards();

document.body.addEventListener("htmx:afterSwap", (event) => {
  mountLanyards(event.detail?.target || event.target);
});

const observer = new MutationObserver(() => {
  for (const [host, root] of roots) {
    if (!host.isConnected) {
      root.unmount();
      roots.delete(host);
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
