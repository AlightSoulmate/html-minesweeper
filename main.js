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
let rowCount = 15;
let columnCount = 18;
let mineCount = 35;
let timer = 0;
let timerId = null;

const limitSize = (value) => {
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, value));
};

const limitMineCount = (value) => {
  const nextMineCount = Number.isFinite(value) ? value : 0;
  return Math.min(rowCount * columnCount - 1, Math.max(0, nextMineCount));
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
  const main = document.querySelector(".main");
  main.innerHTML = "";
  main.style.width = `${columnCount * CELL_SIZE}px`;
  main.style.height = `${rowCount * CELL_SIZE}px`;
  main.dataset.isClicked = "false";
  document
    .querySelector(".game-shell")
    .style.setProperty("--board-width", `${columnCount * CELL_SIZE}px`);

  // create grids
  for (let i = 0; i < rowCount; i++) {
    const submain = document.createElement("div");
    main.appendChild(submain);
    for (let j = 0; j < columnCount; j++) {
      const cell = document.createElement("div");
      submain.appendChild(cell);
    }
  }
  return document.querySelectorAll(".main > div > div");
};

const resetFlagsLeft = () => {
  const flagsLeftStatus = document.querySelector(
    ".status-value.mines-left",
  );
  flagsLeftStatus.innerHTML = mineCount;
};

const resetGridData = (grids) => {
  grids.forEach((grid, index) => {
    grid.dataset.isMine = "false";
    grid.dataset.isClicked = "false";
    grid.dataset.isFlagged = "false";
    grid.dataset.aroundMines = "0";
    grid.dataset.index = index;
    grid.dataset.row = Math.floor(index / columnCount);
    grid.dataset.column = index % columnCount;
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
  const nextMineCount = Math.min(mineCount, candidateGrids.length);

  shuffle(candidateGrids)
    .slice(0, nextMineCount)
    .forEach((grid) => {
      grid.dataset.isMine = "true";
    });
};

const setTitle = (text, color = "black") => {
  const title = document.querySelector(".header");
  title.textContent = text;
  title.style.color = color;
};

const initTimer = () => {
  let timerStatus = document.querySelector(".status-value.timer");
  timerStatus.innerHTML = "000";
  timer = 0;
  return timerStatus;
};

const startTimer = () => {
  let timerStatus = initTimer();
  clearInterval(timerId);
  timerId = setInterval(() => {
    timer++;
    timerStatus.innerHTML = String(timer).padStart(3, "0");
  }, 1000);
};

const stopTimer = () => {
  clearInterval(timerId);
  timerId = null;
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
      if (ni < 0 || ni >= rowCount || nj < 0 || nj >= columnCount)
        continue;
      if (grids[ni * columnCount + nj].dataset.isMine === "true") {
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
        if (ni < 0 || ni >= rowCount || nj < 0 || nj >= columnCount)
          continue;
        const nxt = grids[ni * columnCount + nj];
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
  const main = document.querySelector(".main");
  const inputRow = document.querySelector(".input-row");
  const inputColumn = document.querySelector(".input-column");
  const inputMines = document.querySelector(".input-mines");
  const confirmBtn = document.querySelector(".confirm-btn");
  const flagsLeftStatus = document.querySelector(".mines-left");
  const restartBtn = document.querySelector(".restart-btn");

  inputRow.min = MIN_SIZE;
  inputRow.max = MAX_SIZE;
  inputColumn.min = MIN_SIZE;
  inputColumn.max = MAX_SIZE;
  inputMines.min = 0;
  inputMines.max = rowCount * columnCount - 1;
  inputMines.value = mineCount;
  restartBtn.innerHTML = `${RESTART_SVG}`;

  let grids = createBoard();
  const refreshBoard = () => {
    rowCount = limitSize(Number(inputRow.value));
    columnCount = limitSize(Number(inputColumn.value));
    inputMines.max = rowCount * columnCount - 1;
    mineCount = limitMineCount(Number(inputMines.value));
    inputRow.value = rowCount;
    inputColumn.value = columnCount;
    inputMines.value = mineCount;
    grids = createBoard();
  };

  confirmBtn.addEventListener("click", refreshBoard);

  [inputRow, inputColumn, inputMines].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") refreshBoard();
    });
  });

  restartBtn.addEventListener("click", () => {
    stopTimer();
    grids = createBoard();
  });

  main.addEventListener("click", (e) => {
    const grid = e.target.closest(".main > div > div");
    if (!grid || !main.contains(grid)) return;
    if (
      grid.dataset.isClicked === "true" ||
      grid.dataset.isFlagged === "true"
    )
      return;

    grid.dataset.isClicked = "true";
    // start game by first click, placing mines after first click
    if (main.dataset.isClicked === "false") {
      startTimer();
      main.dataset.isClicked = "true";
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

  main.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const grid = e.target.closest(".main > div > div");
    if (!grid || !main.contains(grid)) return;

    // clicked grid can not be flagged
    if (grid.dataset.isClicked === "true") return;
    // cancel flag
    if (grid.dataset.isFlagged === "true") {
      grid.dataset.isFlagged = "false";
      grid.innerHTML = "";
      flagsLeftStatus.innerHTML = Number(flagsLeftStatus.innerHTML) + 1;
      // flag unclicked grid
    } else if (grid.dataset.isClicked === "false") {
      grid.dataset.isFlagged = "true";
      grid.innerHTML = FLAG_SVG;
      flagsLeftStatus.innerHTML = Number(flagsLeftStatus.innerHTML) - 1;
    }
  });
};

init();