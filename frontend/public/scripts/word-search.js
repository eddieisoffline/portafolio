(() => {
  const layer = document.querySelector("[data-letters]");
  const sheet = layer?.parentElement;

  if (!layer || !sheet) {
    return;
  }

  // "Power BI" -> "POWERBI"; descarta lo que no cabe bien como palabra de sopa de letras.
  const pool = Array.from(
    new Set(
      JSON.parse(layer.dataset.tools ?? "[]")
        .map((tool) => tool.toUpperCase().replace(/[^A-Z0-9]/g, ""))
        .filter((word) => word.length >= 3 && word.length <= 10)
    )
  );

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Huecos libres de texto: [fila (negativa = desde abajo), alineada a la derecha, desplazamiento].
  const wideSlots = [
    [3, false, 0],
    [4, false, 1],
    [3, true, 0],
    [4, true, 1],
    [-3, false, 2],
    [-2, true, 0]
  ];
  const narrowSlots = [
    [3, false, 0],
    [-3, false, 0],
    [-2, true, 0]
  ];
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const draw = () => {
    const cell = 24;
    const cols = Math.ceil(sheet.offsetWidth / cell);
    const rows = Math.ceil(sheet.offsetHeight / cell);
    const narrow = cols < 30;
    const slots = narrow ? narrowSlots : wideSlots;
    const maxLength = narrow ? cols - 6 : Math.floor(cols / 2) - 6;
    const words = pool.filter((word) => word.length <= maxLength).slice(0, slots.length);
    let seed = 7;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const grid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        char: alphabet[Math.floor(random() * 26)],
        word: false
      }))
    );
    let marks = "";

    words.forEach((text, index) => {
      const [rowOffset, alignRight, shift] = slots[index];
      const row = rowOffset < 0 ? rows + rowOffset : rowOffset;
      const length = text.length;

      if (row < 0 || row >= rows) {
        return;
      }

      const col = alignRight
        ? cols - length - 3 - shift * 2
        : 3 + shift * Math.max(0, Math.floor((cols / 2 - length - 6) / 2));

      for (let i = 0; i < length; i++) {
        grid[row][col + i] = { char: text[i], word: true };
      }

      marks += `<b style="left:${col * cell + 2}px;top:${row * cell + 2}px;width:${length * cell - 4}px"></b>`;
    });

    let cells = "";
    grid.forEach((line, r) =>
      line.forEach((item, c) => {
        cells += `<span${item.word ? ' class="w"' : ""} style="left:${c * cell}px;top:${r * cell}px">${item.char}</span>`;
      })
    );
    layer.innerHTML = marks + cells;
  };

  draw();
  let timer;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(draw, 150);
  });
})();
