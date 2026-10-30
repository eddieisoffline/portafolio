(() => {
  const layer = document.querySelector("[data-letters]");
  const sheet = layer?.parentElement;

  if (!layer || !sheet) {
    return;
  }

  const wide = JSON.parse(layer.dataset.wide ?? "[]");
  const narrow = JSON.parse(layer.dataset.narrow ?? "[]");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const draw = () => {
    const cell = 24;
    const cols = Math.ceil(sheet.offsetWidth / cell);
    const rows = Math.ceil(sheet.offsetHeight / cell);
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

    for (const [text, slot, rowOffset, alignRight] of cols < 30 ? narrow : wide) {
      const row = rowOffset < 0 ? rows + rowOffset : rowOffset;
      const length = text.length;

      if (length + 4 > cols || row < 0 || row >= rows) {
        continue;
      }

      const col = alignRight
        ? cols - length - 3 - (slot % 2) * 2
        : 3 + (slot % 3) * Math.max(0, Math.floor((cols - length - 6) / 3));

      for (let i = 0; i < length; i++) {
        grid[row][col + i] = { char: text[i], word: true };
      }

      marks += `<b style="left:${col * cell + 2}px;top:${row * cell + 2}px;width:${length * cell - 4}px"></b>`;
    }

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
