// Board tile
const BTILE_HOR = 10;
const BTILE_VER = 20;
const board = [];

// BGM & stuffs
const modal = document.getElementsByClassName("modal")[0];
const bgm = document.createElement("audio");
const tetris = document.createElement("audio");
const clear = document.createElement("audio");
const drop = document.createElement("audio");
const move = document.createElement("audio");
const rotate = document.createElement("audio");
const lvlup = document.createElement("audio");
const lock = document.createElement("audio");
const gameOver = document.createElement("audio");
let rotShape;

bgm.setAttribute("src", "./assets/bgmtetris.mp3");
bgm.muted = true;

tetris.setAttribute("src", "./assets/tetris.wav");
tetris.muted = true;

clear.setAttribute("src", "./assets/clear.wav");
clear.muted = true;

drop.setAttribute("src", "./assets/drop.wav");
drop.muted = true;

move.setAttribute("src", "./assets/move.wav");
move.muted = true;

rotate.setAttribute("src", "./assets/rotate.wav");
rotate.volume = 0.5;
rotate.muted = true;

lock.setAttribute("src", "./assets/lock.wav");
lock.muted = true;

lvlup.setAttribute("src", "./assets/lvlup.wav");
lvlup.muted = true;

gameOver.setAttribute("src", "./assets/gameover.wav");
gameOver.muted = true;

// Init board
for (let row = 0; row < BTILE_VER; row++) {
  board[row] = [];
  for (let col = 0; col < BTILE_HOR; col++) {
    board[row][col] = 0;
  }
}

// Tetrominoes obj
const tetrominoes = [
  {
    // box
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#ffd800",
  },
  {
    // t
    shape: [
      [0, 2, 0],
      [2, 2, 2],
    ],
    color: "#7925DD",
  },
  {
    // s
    shape: [
      [0, 3, 3],
      [3, 3, 0],
    ],
    color: "orange",
  },
  {
    // z
    shape: [
      [4, 4, 0],
      [0, 4, 4],
    ],
    color: "red",
  },
  {
    // j
    shape: [
      [5, 0, 0],
      [5, 5, 5],
    ],
    color: "green",
  },
  {
    // l
    shape: [
      [0, 0, 6],
      [6, 6, 6],
    ],
    color: "#ff6400",
  },
  {
    // I
    shape: [[7, 7, 7, 7]],
    color: "#35dbfc",
  },
];

// Rand tetrominoes
function randTetromino() {
  // generate random tetromino
  const index = Math.floor(Math.random() * tetrominoes.length);
  const tetromino = tetrominoes[index];

  return {
    shape: tetromino.shape,
    color: tetromino.color,
    // Spawn tetromino in the middle of the board
    row: 0,
    col: 4,
  };
}

// Current tetromino
let currentTetromino = randTetromino();
let currentGhostTetromino;

// console.log(currentTetromino);

// Draw tetromino
function drawTetromino() {
  const shape = currentTetromino.shape;
  const color = currentTetromino.color;
  const row = currentTetromino.row;
  const col = currentTetromino.col;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      // Generate the element and class for the blocks
      if (shape[r][c]) {
        const block = document.createElement("div");
        block.classList.add("block");
        block.style.backgroundColor = color;
        block.style.top = (row + r) * 24 + "px";
        block.style.left = (col + c) * 24 + "px";
        block.setAttribute("id", `block-${row + r}-${col + c}`);
        document.getElementById("gBoard").appendChild(block);
      }
    }
  }
}

// Erase tetromino
function eraseTetromino() {
  for (let i = 0; i < currentTetromino.shape.length; i++) {
    for (let j = 0; j < currentTetromino.shape[i].length; j++) {
      if (currentTetromino.shape[i][j] !== 0) {
        let row = currentTetromino.row + i;
        let col = currentTetromino.col + j;
        let block = document.getElementById(`block-${row}-${col}`);

        if (block) {
          document.getElementById("gBoard").removeChild(block);
        }
      }
    }
  }
}

// Collisions
function barrierBoard(rowOffset, colOffset) {
  for (let i = 0; i < currentTetromino.shape.length; i++) {
    for (let j = 0; j < currentTetromino.shape[i].length; j++) {
      if (currentTetromino.shape[i][j] !== 0) {
        let row = currentTetromino.row + i + rowOffset;
        let col = currentTetromino.col + j + colOffset;

        if (
          row >= BTILE_VER ||
          col < 0 ||
          col >= BTILE_HOR ||
          (row >= 0 && board[row][col] !== 0)
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

// Check if tetromino can rotate
function canTetrominoRotate() {
  for (let i = 0; i < rotShape.length; i++) {
    for (let j = 0; j < rotShape[i].length; j++) {
      if (rotShape[i][j] !== 0) {
        let row = currentTetromino.row + i;
        let col = currentTetromino.col + j;

        if (
          row >= BTILE_VER ||
          col < 0 ||
          col >= BTILE_HOR ||
          (row >= 0 && board[row][col] !== 0)
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

// Lock tetromino in place
function lockTetromino() {
  // add the tetromino to the board
  for (let i = 0; i < currentTetromino.shape.length; i++) {
    for (let j = 0; j < currentTetromino.shape[i].length; j++) {
      if (currentTetromino.shape[i][j] !== 0) {
        let row = currentTetromino.row + i;
        let col = currentTetromino.col + j;
        board[row][col] = currentTetromino.color;
        lock.muted = false;
        lock.play();
      }
    }
  }

  // Check row cleared then update score
  let rowsCleared = clearRows();
  if (rowsCleared > 0) {
    updateScore(rowsCleared);
  }

  // spawn new tetromino
  currentTetromino = randTetromino();
}

// TETRIS! (clear)
function clearRows() {
  let rowsCleared = 0;

  for (let y = BTILE_VER - 1; y >= 0; y--) {
    let rowFilled = true;

    for (let x = 0; x < BTILE_HOR; x++) {
      if (board[y][x] === 0) {
        rowFilled = false;
        break;
      }
    }

    if (rowFilled) {
      rowsCleared++;

      // Tetris!
      if (rowsCleared >= 3) {
        tetris.preload = "auto";
        tetris.muted = false;
        tetris.currentTime = 0.03;
        tetris.play();
      } else {
        clear.preload = "auto";
        clear.muted = false;
        clear.currentTime = 0.03;
        clear.play();
      }

      for (let yy = y; yy > 0; yy--) {
        for (let x = 0; x < BTILE_HOR; x++) {
          board[yy][x] = board[yy - 1][x];
        }
      }

      for (let x = 0; x < BTILE_HOR; x++) {
        board[0][x] = 0;
      }
      document.getElementById("gBoard").innerHTML = "";
      for (let row = 0; row < BTILE_VER; row++) {
        for (let col = 0; col < BTILE_HOR; col++) {
          if (board[row][col]) {
            const block = document.createElement("div");
            block.classList.add("block");
            block.style.backgroundColor = board[row][col];
            block.style.top = row * 24 + "px";
            block.style.left = col * 24 + "px";
            block.setAttribute("id", `block-${row}-${col}`);
            document.getElementById("gBoard").appendChild(block);
          }
        }
      }

      y++;
    }
  }

  // console.log(rowsCleared);
  return rowsCleared;
}

// Rotate fucntion
function rotateTetromino() {
  rotShape = [];
  for (let i = 0; i < currentTetromino.shape[0].length; i++) {
    let row = [];
    for (let j = currentTetromino.shape.length - 1; j >= 0; j--) {
      row.push(currentTetromino.shape[j][i]);
    }
    rotShape.push(row);
  }

  if (canTetrominoRotate()) {
    eraseTetromino();
    currentTetromino.shape = rotShape;
    drawTetromino();
  }

  moveGhostTetromino();
}

function moveTetromino(direction) {
  let row = currentTetromino.row;
  let col = currentTetromino.col;

  if (direction === "left") {
    if (barrierBoard(0, -1)) {
      eraseTetromino();
      col -= 1;
      currentTetromino.col = col;
      currentTetromino.row = row;
      drawTetromino();
    }
  } else if (direction === "right") {
    if (barrierBoard(0, 1)) {
      eraseTetromino();
      col += 1;
      currentTetromino.col = col;
      currentTetromino.row = row;
      drawTetromino();
    }
  } else {
    if (barrierBoard(1, 0)) {
      eraseTetromino();
      row++;
      currentTetromino.col = col;
      currentTetromino.row = row;
      drawTetromino();
    } else {
      lockTetromino();
    }
  }
  moveGhostTetromino();
}

interval = 800;

function updateScore(rowClear) {
  score = rowClear * 10;
  interval -= score * 2;
  console.log(score);
  console.log(interval);
}

// tanda
drawTetromino();
setInterval(moveTetromino, interval);
document.addEventListener("keydown", keyPressHandler);

function keyPressHandler(e) {
  switch (e.keyCode) {
    case 37: // left arrow
      moveTetromino("left");
      move.preload = "auto";
      move.muted = false;
      move.currentTime = 0.09;
      move.play();
      break;
    case 39: // right arrow
      moveTetromino("right");
      move.preload = "auto";
      move.muted = false;
      move.currentTime = 0.09;
      move.play();
      break;
    case 40: // down arrow
      moveTetromino("down");
      move.preload = "auto";
      move.muted = false;
      move.currentTime = 0.09;
      move.play();
      break;
    case 38: // up arrow
      rotateTetromino();
      move.preload = "auto";
      rotate.muted = false;
      rotate.currentTime = 0.02;
      rotate.play();
      break;
    case 32: // spacebar
      dropTetromino();
      drop.preload = "auto";
      drop.currentTime = 0.02;
      drop.muted = false;
      lock.pause();
      drop.play();
      break;
  }
  bgm.muted = false;
  bgm.volume = 0.25;
  bgm.loop = true;
  bgm.play();
}

function dropTetromino() {
  let row = currentTetromino.row;
  let col = currentTetromino.col;

  while (barrierBoard(1, 0)) {
    eraseTetromino();
    row++;
    currentTetromino.col = col;
    currentTetromino.row = row;
    drawTetromino();
  }
  lockTetromino();
}

// Ghost tetromino
function drawGhostTetromino() {
  const shape = currentGhostTetromino.shape;
  const color = "rgba(255, 255, 255, 0.5)";
  const row = currentGhostTetromino.row;
  const col = currentGhostTetromino.col;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const block = document.createElement("div");
        block.classList.add("ghost");
        block.style.backgroundColor = color;
        block.style.top = (row + r) * 24 + "px";
        block.style.left = (col + c) * 24 + "px";
        block.setAttribute("id", `ghost-${row + r}-${col + c}`);
        document.getElementById("gBoard").appendChild(block);
      }
    }
  }
}

function eraseGhostTetromino() {
  const ghost = document.querySelectorAll(".ghost");
  for (let i = 0; i < ghost.length; i++) {
    ghost[i].remove();
  }
}

function ghostTetrominoBarrier(rowOffset, colOffset) {
  for (let i = 0; i < currentGhostTetromino.shape.length; i++) {
    for (let j = 0; j < currentGhostTetromino.shape[i].length; j++) {
      if (currentGhostTetromino.shape[i][j] !== 0) {
        let row = currentGhostTetromino.row + i + rowOffset;
        let col = currentGhostTetromino.col + j + colOffset;

        if (
          row >= BTILE_VER ||
          col < 0 ||
          col >= BTILE_HOR ||
          (row >= 0 && board[row][col] !== 0)
        ) {
          if (row == 1) {
            gameOver.muted = false;
            gameOver.play();
            bgm.pause();
            move.pause();
            lock.pause();
            modal.style.display = "block";
            setTimeout(function () {
              location.reload();
            }, 5000);
          }
          return false;
        }
      }
    }
  }
  return true;
}

function moveGhostTetromino() {
  eraseGhostTetromino();

  currentGhostTetromino = { ...currentTetromino };
  while (ghostTetrominoBarrier(1, 0)) {
    currentGhostTetromino.row++;
  }

  drawGhostTetromino();
}
