const MIN_SIZE = 10;
const MAX_SIZE = 50;
const CELL_SIZE = 24;
const MINE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
  <path d="M0 0h24v24H0z" fill="none" />
  <path fill="#000" d="M23 13v-2h-3.07a8 8 0 0 0-1.62-3.9l2.19-2.17l-1.43-1.43l-2.17 2.19A8 8 0 0 0 13 4.07V1h-2v3.07c-1.42.18-2.77.74-3.9 1.62L4.93 3.5L3.5 4.93L5.69 7.1A8 8 0 0 0 4.07 11H1v2h3.07c.18 1.42.74 2.77 1.62 3.9L3.5 19.07l1.43 1.43l2.17-2.19c1.13.88 2.48 1.44 3.9 1.62V23h2v-3.07c1.42-.18 2.77-.74 3.9-1.62l2.17 2.19l1.43-1.43l-2.19-2.17a8 8 0 0 0 1.62-3.9zM12 8a4 4 0 0 0-4 4H6a6 6 0 0 1 6-6z" />
</svg>
`;
const FLAG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="display:block;">
  <path d="M0 0h24v24H0z" fill="none" />
  <path fill="#f20707" d="M5 21V4h9l.4 2H20v10h-7l-.4-2H7v7z" />
</svg>`;
const RESTART_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
  <path d="M0 0h24v24H0z" fill="none" />
  <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.252 4v5H9M5.07 8a8 8 0 1 1-.818 6" />
</svg>
`;
const state = {
  rows: 15,
  columns: 18,
  mines: 35,
  timer: 0,
  timerId: null,
  hasStarted: false,
};

const elements = {
  title: document.querySelector(".header"),
  gameShell: document.querySelector(".game-shell"),
  main: document.querySelector(".main"),
  inputRow: document.querySelector(".input-row"),
  inputColumn: document.querySelector(".input-column"),
  inputMines: document.querySelector(".input-mines"),
  confirmBtn: document.querySelector(".confirm-btn"),
  restartBtn: document.querySelector(".restart-btn"),
  timer: document.querySelector(".timer"),
  minesLeft: document.querySelector(".mines-left"),
};

const limitSize = (value) => {
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, value));
};

const limitMineCount = (value) => {
  const nextMineCount = Number.isFinite(value) ? value : 0;
  return Math.min(state.rows * state.columns - 1, Math.max(0, nextMineCount));
};

const createBoard = () => {
  stopTimer();
  setTitle("Mini Minesweeper");
  initTimer();
  resetFlagsLeft();

  const grids = resetMain();
  resetGridData(grids);
  return grids;
};

const resetMain = () => {
  elements.main.innerHTML = "";
  elements.main.style.width = `${state.columns * CELL_SIZE}px`;
  elements.main.style.height = `${state.rows * CELL_SIZE}px`;
  state.hasStarted = false;
  elements.gameShell.style.setProperty(
    "--board-width",
    `${state.columns * CELL_SIZE}px`,
  );

  // create grids
  for (let i = 0; i < state.rows; i++) {
    const submain = document.createElement("div");
    elements.main.appendChild(submain);
    for (let j = 0; j < state.columns; j++) {
      const cell = document.createElement("div");
      submain.appendChild(cell);
    }
  }
  return elements.main.querySelectorAll(":scope > div > div");
};

const resetFlagsLeft = () => {
  elements.minesLeft.innerHTML = state.mines;
};

const resetGridData = (grids) => {
  grids.forEach((grid, index) => {
    grid.dataset.isMine = "false";
    grid.dataset.isClicked = "false";
    grid.dataset.isFlagged = "false";
    grid.dataset.aroundMines = "0";
    grid.dataset.index = index;
    grid.dataset.row = Math.floor(index / state.columns);
    grid.dataset.column = index % state.columns;
  });
};

// Fisher-Yates shuffle
const shuffle = (items) => {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
};

const placeMines = (grids, firstClickedGrid) => {
  // new arr
  const candidateGrids = Array.from(grids).filter(
    (grid) => grid !== firstClickedGrid,
  );
  const nextMineCount = Math.min(state.mines, candidateGrids.length);

  shuffle(candidateGrids)
    .slice(0, nextMineCount)
    .forEach((grid) => {
      grid.dataset.isMine = "true";
    });
};

const setTitle = (text, color = "black") => {
  elements.title.textContent = text;
  elements.title.style.color = color;
};

const initTimer = () => {
  elements.timer.innerHTML = "000";
  state.timer = 0;
};

const startTimer = () => {
  initTimer();
  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    state.timer++;
    elements.timer.innerHTML = String(state.timer).padStart(3, "0");
  }, 1000);
};

const stopTimer = () => {
  clearInterval(state.timerId);
  state.timerId = null;
};

const countAroundMinesNumber = (grids, grid) => {
  if (Number(grid.dataset.aroundMines)) return;
  let aroundMines = 0;
  const row = Number(grid.dataset.row);
  const column = Number(grid.dataset.column);
  // 8 directions check
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const ni = row + i,
        nj = column + j;
      if (ni < 0 || ni >= state.rows || nj < 0 || nj >= state.columns)
        continue;
      if (grids[ni * state.columns + nj].dataset.isMine === "true") {
        aroundMines++;
      }
    }
  }
  grid.dataset.aroundMines = String(aroundMines);
};

// BFS flood Fill Reveal
const floodFill = (grids, grid) => {
  const queue = [grid];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const row = Number(cur.dataset.row);
    const column = Number(cur.dataset.column);
    // 8 directions transmission
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if ((i | j) === 0) continue;
        const ni = row + i,
          nj = column + j;
        if (ni < 0 || ni >= state.rows || nj < 0 || nj >= state.columns)
          continue;
        const nxt = grids[ni * state.columns + nj];
        if (
          nxt.dataset.isMine === "true" ||
          nxt.dataset.isClicked === "true" ||
          nxt.dataset.isFlagged === "true"
        )
          continue;
        // nxt here must not be clickable directly
        countAroundMinesNumber(grids, nxt);
        nxt.style.background = "white";
        nxt.dataset.isClicked = "true";
        if (Number(nxt.dataset.aroundMines) > 0) {
          nxt.innerHTML = nxt.dataset.aroundMines;
          nxt.classList.add(`count-${Number(nxt.dataset.aroundMines)}`);
        } else {
          queue.push(nxt);
        }
      }
    }
  }
};

const postTerminate = (grids, grid) => {
  setTitle("Game Over!", "red");
  grids.forEach((cell) => {
    if (cell.dataset.isMine === "true") {
      if (cell.dataset.isFlagged === "true") {
        cell.classList.add("flagged-mine");
      } else {
        cell.innerHTML = MINE_SVG;
        if (cell === grid) cell.style.background = "red";
      }
    }
    // ban clicking on every grid
    cell.dataset.isClicked = "true";
  });
};

const checkWin = (grids) => {
  return Array.from(grids).every((grid) => {
    // check unclicked regular grids
    return (
      grid.dataset.isMine === "true" || grid.dataset.isClicked === "true"
    );
  });
};

const postWin = (grids) => {
  setTitle("You Win!", "red");
  grids.forEach((cell) => {
    if (cell.dataset.isMine === "true") {
      if (cell.dataset.isFlagged === "true") {
        cell.classList.add("flagged-mine");
      } else {
        cell.innerHTML = MINE_SVG;
      }
    }
    // ban clicking on every grid
    cell.dataset.isClicked = "true";
  });
};

const init = () => {
  elements.inputRow.min = MIN_SIZE;
  elements.inputRow.max = MAX_SIZE;
  elements.inputColumn.min = MIN_SIZE;
  elements.inputColumn.max = MAX_SIZE;
  elements.inputMines.min = 0;
  elements.inputRow.value = state.rows;
  elements.inputColumn.value = state.columns;
  elements.inputMines.max = state.rows * state.columns - 1;
  elements.inputMines.value = state.mines;
  elements.restartBtn.innerHTML = `${RESTART_SVG}`;

  let grids = createBoard();
  const refreshBoard = () => {
    state.rows = limitSize(Number(elements.inputRow.value));
    state.columns = limitSize(Number(elements.inputColumn.value));
    elements.inputMines.max = state.rows * state.columns - 1;
    state.mines = limitMineCount(Number(elements.inputMines.value));
    elements.inputRow.value = state.rows;
    elements.inputColumn.value = state.columns;
    elements.inputMines.value = state.mines;
    grids = createBoard();
  };

  elements.confirmBtn.addEventListener("click", refreshBoard);

  [elements.inputRow, elements.inputColumn, elements.inputMines].forEach(
    (input) => {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") refreshBoard();
      });
    },
  );

  elements.restartBtn.addEventListener("click", () => {
    stopTimer();
    grids = createBoard();
  });

  elements.main.addEventListener("click", (e) => {
    const grid = e.target.closest(".main > div > div");
    if (!grid || !elements.main.contains(grid)) return;
    if (
      grid.dataset.isClicked === "true" ||
      grid.dataset.isFlagged === "true"
    )
      return;

    grid.dataset.isClicked = "true";
    // start game by first click, placing mines after first click
    if (!state.hasStarted) {
      startTimer();
      state.hasStarted = true;
      placeMines(grids, grid);
    }
    // terminate by touching a mine
    if (grid.dataset.isMine === "true") {
      postTerminate(grids, grid);
      stopTimer();
      // click a regular grid
    } else {
      grid.style.background = "white";
      countAroundMinesNumber(grids, grid);
      // gt 0 mines in 8 directions
      if (Number(grid.dataset.aroundMines) > 0) {
        grid.innerHTML = grid.dataset.aroundMines;
        grid.classList.add(`count-${Number(grid.dataset.aroundMines)}`);
        // 0 mines in 8 directions
      } else {
        floodFill(grids, grid);
      }
      if (checkWin(grids)) {
        postWin(grids);
        stopTimer();
      }
    }
  });

  elements.main.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const grid = e.target.closest(".main > div > div");
    if (!grid || !elements.main.contains(grid)) return;

    // clicked grid can not be flagged
    if (grid.dataset.isClicked === "true") return;
    // cancel flag
    if (grid.dataset.isFlagged === "true") {
      grid.dataset.isFlagged = "false";
      grid.innerHTML = "";
      elements.minesLeft.innerHTML = Number(elements.minesLeft.innerHTML) + 1;
      // flag unclicked grid
    } else if (grid.dataset.isClicked === "false") {
      grid.dataset.isFlagged = "true";
      grid.innerHTML = FLAG_SVG;
      elements.minesLeft.innerHTML = Number(elements.minesLeft.innerHTML) - 1;
    }
  });
};

init();
