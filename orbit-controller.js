
/* ZIXOMA Section 03 — elliptical orbit controller */
(() => {
  function initOrbit() {
    const root = document.querySelector(".zx-evm-orbit");
    if (!root) return;

    const satellites = [
      ...root.querySelectorAll(
        ".zx-satellite-path .zx-satellite"
      )
    ];

    if (satellites.length !== 6) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const tilts = [-25, 25, 65];
    const periods = [18, 22, 26, 18, 22, 26];
    const phases = [0, 0, 0, Math.PI, Math.PI, Math.PI];

    let elapsed = 0;
    let lastTime = null;
    let frame = 0;
    let visible = true;

    function draw(seconds) {
      const width = root.getBoundingClientRect().width;

      const rx = width * 0.45;
      const ry = width * 0.34 * 0.46;

      satellites.forEach((satellite, i) => {
        const angle =
          phases[i] +
          seconds * 2 * Math.PI / periods[i];

        const tilt =
          tilts[i % 3] * Math.PI / 180;

        const ex = rx * Math.cos(angle);
        const ey = ry * Math.sin(angle);

        const x =
          ex * Math.cos(tilt) -
          ey * Math.sin(tilt);

        const y =
          ex * Math.sin(tilt) +
          ey * Math.cos(tilt);

        satellite.style.transform =
          `translate(
            calc(-50% + ${x.toFixed(2)}px),
            calc(-50% + ${y.toFixed(2)}px)
          )`;
      });
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

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = null;
    }

    function update() {
      stop();
      draw(elapsed);

      if (
        !reduced.matches &&
        visible &&
        !document.hidden
      ) {
        frame = requestAnimationFrame(tick);
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        update();
      },
      { threshold: 0 }
    );

    observer.observe(root);

    reduced.addEventListener("change", update);
    document.addEventListener(
      "visibilitychange",
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
      initOrbit,
      { once: true }
    );
  } else {
    initOrbit();
  }
})();
