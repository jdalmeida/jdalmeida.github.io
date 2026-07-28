(() => {
  "use strict";

  const sourceURL = "/assets/signature-animation-workbench.svg";
  const signatureURL = "/assets/logo-signature-animated.svg";
  const stage = { width: 1100, height: 760 };
  const signature = { width: 997.815, height: 707.444 };
  const signatureOffset = { x: -35.25734, y: -48.309492 };
  const ns = "http://www.w3.org/2000/svg";

  const canvas = document.querySelector("#signature-canvas");
  const context = canvas.getContext("2d");
  const pathLab = document.querySelector("#path-lab");
  const loading = document.querySelector("#loading");
  const status = document.querySelector("#status");
  const sequence = document.querySelector("#sequence");
  const timeline = document.querySelector("#timeline");
  const time = document.querySelector("#time");
  const speed = document.querySelector("#speed");
  const speedValue = document.querySelector("#speed-value");
  const togglePlay = document.querySelector("#toggle-play");
  const replay = document.querySelector("#replay");
  const reload = document.querySelector("#reload");
  const showReference = document.querySelector("#show-reference");
  const showMask = document.querySelector("#show-mask");
  const showGuides = document.querySelector("#show-guides");
  const loop = document.querySelector("#loop");
  const sixBNote = document.querySelector("#six-b-note");

  const maskCanvas = document.createElement("canvas");
  const maskContext = maskCanvas.getContext("2d");
  const inkCanvas = document.createElement("canvas");
  const inkContext = inkCanvas.getContext("2d");
  maskCanvas.width = inkCanvas.width = canvas.width;
  maskCanvas.height = inkCanvas.height = canvas.height;

  const signatureImage = new Image();
  let imageReady = false;
  let strokes = [];
  let totalDuration = 0;
  let currentTime = 0;
  let previousFrame = 0;
  let playing = true;
  let ready = false;

  const seconds = (milliseconds) =>
    `${(milliseconds / 1000).toFixed(2).replace(".", ",")} s`;

  const parseSeconds = (value) => Number.parseFloat(value || "0") * 1000;

  const timingFor = (css, id) => {
    const escapedID = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const block = css.match(new RegExp(`#${escapedID}\\s*\\{([^}]*)\\}`))?.[1] || "";
    const delay = block.match(/animation-delay\s*:\s*([\d.]+)s/)?.[1] || "0";
    const duration = block.match(/animation-duration\s*:\s*([\d.]+)s/)?.[1] || ".3";
    return {
      delay: parseSeconds(delay),
      duration: parseSeconds(duration),
    };
  };

  const styleNumber = (element, property) => {
    const style = element?.getAttribute("style") || "";
    const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const value = style.match(
      new RegExp(`(?:^|;)\\s*${escapedProperty}\\s*:\\s*([\\d.]+)`),
    )?.[1];
    return value ? Number.parseFloat(value) : null;
  };

  const attributeNumber = (element, attribute) => {
    const value = element?.getAttribute(attribute);
    return value ? Number.parseFloat(value) : null;
  };

  const maskWidthFor = (pen, coverage) =>
    styleNumber(coverage, "stroke-width") ??
    styleNumber(pen, "stroke-width") ??
    attributeNumber(coverage, "stroke-width") ??
    attributeNumber(pen, "stroke-width") ??
    1;

  const pathSamples = (path) => {
    const length = path.getTotalLength();
    const matrix = path.getCTM();
    const samples = [];
    const step = Math.max(1.7, length / 460);

    for (let distance = 0; distance < length; distance += step) {
      const point = path.getPointAtLength(distance);
      const transformed = new DOMPoint(point.x, point.y).matrixTransform(matrix);
      samples.push({ x: transformed.x, y: transformed.y });
    }

    const last = path.getPointAtLength(length);
    const transformedLast = new DOMPoint(last.x, last.y).matrixTransform(matrix);
    samples.push({ x: transformedLast.x, y: transformedLast.y });

    return { length, samples };
  };

  const drawStroke = (target, stroke, progress, color) => {
    if (progress <= 0 || stroke.samples.length < 2) return;

    const lastIndex = Math.max(
      1,
      Math.min(stroke.samples.length - 1, Math.ceil((stroke.samples.length - 1) * progress)),
    );

    target.save();
    target.beginPath();
    target.moveTo(stroke.samples[0].x, stroke.samples[0].y);
    for (let index = 1; index <= lastIndex; index += 1) {
      target.lineTo(stroke.samples[index].x, stroke.samples[index].y);
    }
    target.strokeStyle = color;
    target.lineWidth = stroke.width;
    target.lineCap = "round";
    target.lineJoin = "round";
    target.stroke();
    target.restore();
  };

  const drawGuide = (target, stroke) => {
    if (stroke.samples.length < 2) return;

    target.save();
    target.beginPath();
    target.moveTo(stroke.samples[0].x, stroke.samples[0].y);
    for (let index = 1; index < stroke.samples.length; index += 1) {
      target.lineTo(stroke.samples[index].x, stroke.samples[index].y);
    }
    target.setLineDash([10, 7]);
    target.lineDashOffset = -currentTime / 28;
    target.strokeStyle = "#087ea4";
    target.lineWidth = 3;
    target.lineCap = "round";
    target.lineJoin = "round";
    target.stroke();
    target.setLineDash([]);

    const start = stroke.samples[0];
    const end = stroke.samples.at(-1);
    target.fillStyle = "#278f78";
    target.beginPath();
    target.arc(start.x, start.y, 7, 0, Math.PI * 2);
    target.fill();
    target.fillStyle = "#c95843";
    target.beginPath();
    target.arc(end.x, end.y, 6, 0, Math.PI * 2);
    target.fill();
    target.restore();
  };

  const progressFor = (stroke) =>
    Math.max(0, Math.min(1, (currentTime - stroke.delay) / stroke.duration));

  const render = () => {
    if (!ready) return;

    maskContext.clearRect(0, 0, stage.width, stage.height);
    for (const stroke of strokes) {
      drawStroke(maskContext, stroke, progressFor(stroke), "#fff");
    }

    inkContext.clearRect(0, 0, stage.width, stage.height);
    inkContext.globalCompositeOperation = "source-over";
    inkContext.drawImage(signatureImage, 0, 0, signature.width, signature.height);
    inkContext.globalCompositeOperation = "destination-in";
    inkContext.drawImage(maskCanvas, 0, 0);
    inkContext.globalCompositeOperation = "source-over";

    context.clearRect(0, 0, stage.width, stage.height);

    if (showReference.checked) {
      context.save();
      context.globalAlpha = .1;
      context.drawImage(signatureImage, 0, 0, signature.width, signature.height);
      context.restore();
    }

    context.drawImage(inkCanvas, 0, 0);

    if (showMask.checked) {
      for (const stroke of strokes) {
        drawStroke(context, stroke, progressFor(stroke), "rgb(233 161 38 / 24%)");
      }
    }

    if (showGuides.checked) {
      for (const stroke of strokes) drawGuide(context, stroke);
    }

    timeline.value = totalDuration ? Math.round((currentTime / totalDuration) * 1000) : 0;
    time.value = `${seconds(currentTime)} / ${seconds(totalDuration)}`;
    togglePlay.textContent = playing ? "Pausar" : "Continuar";
  };

  const makePath = (documentPath, transformSource) => {
    const outer = document.createElementNS(ns, "g");
    outer.setAttribute("transform", `translate(${signatureOffset.x} ${signatureOffset.y})`);

    const inner = document.createElementNS(ns, "g");
    const useTransform = transformSource?.getAttribute("transform");
    if (useTransform) inner.setAttribute("transform", useTransform);

    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", documentPath.getAttribute("d"));
    inner.append(path);
    outer.append(inner);
    pathLab.append(outer);
    return path;
  };

  const loadWorkbench = async () => {
    ready = false;
    playing = false;
    loading.classList.remove("is-hidden");
    loading.textContent = "Preparando os traços…";
    status.textContent = "Lendo o SVG ajustado…";
    pathLab.replaceChildren();
    sequence.replaceChildren();

    try {
      const response = await fetch(`${sourceURL}?time=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`O SVG respondeu com status ${response.status}.`);

      const source = await response.text();
      const documentSVG = new DOMParser().parseFromString(source, "image/svg+xml");
      const parserError = documentSVG.querySelector("parsererror");
      if (parserError) throw new Error("O SVG ajustado contém XML inválido.");

      const css = [...documentSVG.querySelectorAll("style")]
        .map((element) => element.textContent)
        .join("\n");

      const maskPens = [...documentSVG.querySelectorAll(".mask-pen")];
      const coverageUses = [...documentSVG.querySelectorAll("#mask-coverage use")];
      const parsed = [];

      for (const pen of maskPens) {
        const reference = pen.getAttribute("href") || pen.getAttribute("xlink:href");
        if (!reference?.startsWith("#")) continue;

        const guide = documentSVG.getElementById(reference.slice(1));
        if (!guide) continue;

        const coverage = coverageUses.find((element) => {
          const coverageReference =
            element.getAttribute("href") || element.getAttribute("xlink:href");
          return coverageReference === reference;
        });
        const timing = timingFor(css, pen.id);
        const path = makePath(guide, coverage || pen);
        parsed.push({
          id: guide.id,
          penID: pen.id,
          path,
          width: maskWidthFor(pen, coverage),
          delay: timing.delay,
          duration: timing.duration,
        });
      }

      await Promise.resolve();

      strokes = parsed
        .map((stroke) => ({ ...stroke, ...pathSamples(stroke.path) }))
        .sort((first, second) => first.delay - second.delay);

      totalDuration = Math.max(
        1,
        ...strokes.map((stroke) => stroke.delay + stroke.duration),
      );

      for (const stroke of strokes) {
        const item = document.createElement("li");
        item.innerHTML = `
          <strong>${stroke.id.replace("guide-", "")}</strong>
          <span>${stroke.width}px · ${seconds(stroke.delay)} + ${seconds(stroke.duration)}</span>
        `;
        sequence.append(item);
      }

      const hasSixB = strokes.some((stroke) => stroke.id === "guide-06b");
      sixBNote.textContent = hasSixB
        ? "O canvas encontrou o guia 6b entre as máscaras ativas."
        : "O canvas confirmou dez traços ativos. O guia 6b não participa da prévia.";

      status.textContent = `${strokes.length} traços · ${seconds(totalDuration)} · ${hasSixB ? "6b ativo" : "6b removido"}`;
      currentTime = 0;
      previousFrame = performance.now();
      playing = true;
      ready = true;
      loading.classList.add("is-hidden");
      render();
    } catch (error) {
      loading.textContent = error.message;
      status.textContent = "Não foi possível carregar a prévia.";
      throw error;
    }
  };

  const frame = (timestamp) => {
    const delta = previousFrame ? timestamp - previousFrame : 0;
    previousFrame = timestamp;

    if (ready && playing) {
      currentTime += delta * Number(speed.value);
      if (currentTime >= totalDuration) {
        if (loop.checked) {
          currentTime %= totalDuration;
        } else {
          currentTime = totalDuration;
          playing = false;
        }
      }
      render();
    }

    requestAnimationFrame(frame);
  };

  signatureImage.addEventListener("load", async () => {
    imageReady = true;
    await loadWorkbench();
  });

  signatureImage.addEventListener("error", () => {
    loading.textContent = "Não foi possível carregar a assinatura original.";
    status.textContent = "A assinatura original não foi encontrada.";
  });

  replay.addEventListener("click", () => {
    currentTime = 0;
    previousFrame = performance.now();
    playing = true;
    render();
  });

  togglePlay.addEventListener("click", () => {
    playing = !playing;
    previousFrame = performance.now();
    render();
  });

  timeline.addEventListener("input", () => {
    currentTime = (Number(timeline.value) / 1000) * totalDuration;
    playing = false;
    render();
  });

  speed.addEventListener("input", () => {
    speedValue.value = `${Number(speed.value).toLocaleString("pt-BR")}×`;
  });

  for (const control of [showReference, showMask, showGuides]) {
    control.addEventListener("change", render);
  }

  reload.addEventListener("click", async () => {
    if (!imageReady) return;
    await loadWorkbench();
  });

  signatureImage.src = `${signatureURL}?preview=${Date.now()}`;
  requestAnimationFrame(frame);
})();
