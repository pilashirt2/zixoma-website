
/*
 * ZIXOMA — 3D Planet Orbit Controller
 * Exact ellipse tracking + planet-edge occlusion
 */

(() => {
  function init() {
    const root = document.querySelector(".zx-evm-orbit");
    if (!root) return;

    const paths = [...root.querySelectorAll(".zx-satellite-path")];
    const satellites = paths.map(path =>
      path.querySelector(".zx-satellite")
    );

    if (satellites.length !== 6 || satellites.some(s => !s)) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    // Each pair shares a tilted orbit, opposite in phase.
    const tilts = [-25, 25, 65, -25, 25, 65];
    const periods = [18, 22, 26, 18, 22, 26];
    const phases = [0, 0, 0, Math.PI, Math.PI, Math.PI];

    // Neutralize previous CSS animation rules.
    paths.forEach(path => {
      path.style.setProperty("animation", "none", "important");
      path.style.setProperty("transform", "none", "important");
      path.style.inset = "0";
    });

    satellites.forEach(satellite => {
      satellite.style.setProperty("animation", "none", "important");
      satellite.style.left = "50%";
      satellite.style.top = "50%";
      satellite.style.margin = "0";
      satellite.style.willChange = "transform, opacity";
    });

    let elapsed = 0;
    let lastTime = null;
    let frame = null;
    let onScreen = false;

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function smoothstep(value) {
      const t = clamp(value, 0, 1);
      return t * t * (3 - 2 * t);
    }

    function draw(time) {
      const width = root.clientWidth;
      if (!width) return;

      // Match existing CSS orbit ring geometry:
      // inset: 16% 5%; scaleY(.46)
      const rx = width * 0.45;
      const ry = width * 0.34 * 0.46;

      // CSS planet inset: 24% -> radius: 26%
      const planetRadius = width * 0.26;

      satellites.forEach((satellite, i) => {
        const angle =
          phases[i] + time * Math.PI * 2 / periods[i];

        const tilt = tilts[i] * Math.PI / 180;

        // Position on ellipse before tilt
        const ex = rx * Math.cos(angle);
        const ey = ry * Math.sin(angle);

        // Rotate ellipse to match the visible ring
        const x =
          ex * Math.cos(tilt) -
          ey * Math.sin(tilt);

        const y =
          ex * Math.sin(tilt) +
          ey * Math.cos(tilt);

        // Simulated depth: positive = behind planet
        const z = Math.sin(angle);

        const distance = Math.hypot(x, y);

        // Satellite dimensions from CSS layout
        const satelliteRadius = satellite.offsetWidth / 2;

        // Begin fading only when its disk reaches
        // the visible edge of the planet.
        const outerEdge = planetRadius + satelliteRadius;

        // Completely hidden after entering this far.
        const innerEdge = Math.max(
          0,
          planetRadius - satelliteRadius * 0.65
        );

        const overlap = clamp(
          (outerEdge - distance) /
          Math.max(1, outerEdge - innerEdge),
          0,
          1
        );

        const edgeMask = smoothstep(overlap);

        // At the depth crossover, avoid abrupt changes.
        const depthMask = smoothstep(
          (z - 0.015) / 0.16
        );

        // Outside planet: always visible.
        // Behind planet + inside boundary: fade out.
        const opacity = 1 - edgeMask;
        
        satellite.style.transform =
          `translate(
            calc(-50% + ${x.toFixed(2)}px),
            calc(-50% + ${y.toFixed(2)}px)
          )`;

        satellite.style.opacity =
          clamp(opacity, 0, 1).toFixed(3);
      });
    }

    function stop() {
      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
      lastTime = null;
    }

    function tick(now) {
      if (lastTime !== null) {
        elapsed += Math.min(
          (now - lastTime) / 1000,
          0.05
        );
      }

      lastTime = now;
      draw(elapsed);

      frame = requestAnimationFrame(tick);
    }

    function update() {
      stop();
      draw(elapsed);

      if (
        onScreen &&
        !document.hidden &&
        !reducedMotion.matches
      ) {
        frame = requestAnimationFrame(tick);
      }
    }

    const observer = new IntersectionObserver(
      entries => {
        onScreen = entries[0].isIntersecting;
        update();
      },
      { threshold: 0 }
    );

    observer.observe(root);

    document.addEventListener(
      "visibilitychange",
      update
    );

    reducedMotion.addEventListener(
      "change",
      update
    );

    window.addEventListener(
      "resize",
      () => draw(elapsed),
      { passive: true }
    );

    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();
