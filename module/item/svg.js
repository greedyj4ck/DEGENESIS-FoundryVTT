export function injectSVGIcons(html, mapping) {
  mapping.forEach(({ selector, className }) => {
    html.querySelectorAll(selector).forEach((el) => {
      const url = el.dataset[el.dataset && Object.keys(el.dataset)[0]];

      fetch(url)
        .then((r) => r.text())
        .then((svgText) => {
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
          const svgEl = svgDoc.documentElement;
          svgEl.classList.add(className);
          el.replaceWith(svgEl);
        })
        .catch((err) =>
          console.error(`SVG inject failed for ${selector}:`, err),
        );
    });
  });
}
