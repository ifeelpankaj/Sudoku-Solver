"use client";

import React, { useRef, useState } from "react";

type Board = string[][];

const emptyBoard = (): Board =>
  Array.from({ length: 9 }, () => Array(9).fill("."));

export default function SudokuSolver() {
  const [board, setBoard] = useState<Board>(emptyBoard());

  const [initial, setInitial] = useState<Board>(emptyBoard());
  const [running, setRunning] = useState(false);
  const [speedMs, setSpeedMs] = useState(40);
  const [highlight, setHighlight] = useState<{ r: number; c: number } | null>(
    null
  );
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const runAbortRef = useRef({ abort: false });

  const cloneBoard = (b: Board) => b.map((row) => [...row]);

  function handleChange(r: number, c: number, value: string) {
    if (running) return;
    const v = value.replace(/[^1-9]/g, "");
    const newBoard = cloneBoard(board);
    newBoard[r][c] = v === "" ? "." : v;
    setBoard(newBoard);
    setError("");
    setSuccess(false);
  }

  function resetToInitial() {
    if (running) return;
    setBoard(cloneBoard(initial));
    setError("");
    setSuccess(false);
  }

  function clearBoard() {
    if (running) return;
    setBoard(emptyBoard());
    setInitial(emptyBoard());
    setError("");
    setSuccess(false);
  }

  function isValid(b: Board, row: number, col: number, ch: string): boolean {
    for (let i = 0; i < 9; i++) {
      if (b[row][i] === ch) return false;
      if (b[i][col] === ch) return false;
      const drow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
      const dcol = 3 * Math.floor(col / 3) + (i % 3);
      if (b[drow][dcol] === ch) return false;
    }
    return true;
  }

  function validateInitialBoard(b: Board): { valid: boolean; message: string } {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const val = b[i][j];
        if (val !== ".") {
          b[i][j] = ".";
          if (!isValid(b, i, j, val)) {
            b[i][j] = val;
            return {
              valid: false,
              message: `Invalid Sudoku: Duplicate ${val} at row ${
                i + 1
              }, column ${j + 1}`,
            };
          }
          b[i][j] = val;
        }
      }
    }

    let hasEmpty = false;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (b[i][j] === ".") {
          hasEmpty = true;
          break;
        }
      }
      if (hasEmpty) break;
    }

    if (!hasEmpty) {
      return { valid: false, message: "Board is already complete!" };
    }

    return { valid: true, message: "" };
  }

  function solveInstant(b: Board): boolean {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (b[i][j] === ".") {
          for (let chCode = 49; chCode <= 57; chCode++) {
            const ch = String.fromCharCode(chCode);
            if (isValid(b, i, j, ch)) {
              b[i][j] = ch;
              if (solveInstant(b)) return true;
              b[i][j] = ".";
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  async function solveAnimated(startBoard: Board) {
    runAbortRef.current.abort = false;
    setRunning(true);
    setError("");
    setSuccess(false);
    const b = cloneBoard(startBoard);

    async function delay(ms: number) {
      return new Promise((res) => setTimeout(res, ms));
    }

    async function recurse(): Promise<boolean> {
      if (runAbortRef.current.abort) return false;

      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (b[i][j] === ".") {
            for (let chCode = 49; chCode <= 57; chCode++) {
              const ch = String.fromCharCode(chCode);

              if (runAbortRef.current.abort) return false;

              if (isValid(b, i, j, ch)) {
                b[i][j] = ch;
                setHighlight({ r: i, c: j });
                setBoard(cloneBoard(b));
                await delay(speedMs);

                if (await recurse()) return true;

                if (runAbortRef.current.abort) return false;

                b[i][j] = ".";
                setHighlight({ r: i, c: j });
                setBoard(cloneBoard(b));
                await delay(speedMs);
              }
            }
            return false;
          }
        }
      }
      return true;
    }

    const solved = await recurse();
    setRunning(false);
    setHighlight(null);

    if (runAbortRef.current.abort) {
      setError("Solving aborted by user");
    } else if (solved) {
      setSuccess(true);
    } else {
      setError("No solution exists for this Sudoku puzzle");
      setBoard(cloneBoard(startBoard));
    }

    return solved;
  }

  async function onSolveAnimatedClick() {
    if (running) return;

    const validation = validateInitialBoard(cloneBoard(board));
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setInitial(cloneBoard(board));
    await solveAnimated(cloneBoard(board));
  }

  function onSolveInstantClick() {
    if (running) return;

    const validation = validateInitialBoard(cloneBoard(board));
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    const b = cloneBoard(board);
    const solved = solveInstant(b);

    if (solved) {
      setBoard(b);
      setInitial(cloneBoard(board));
      setSuccess(true);
      setError("");
    } else {
      setError("No solution exists for this Sudoku puzzle");
    }
  }

  function onAbort() {
    runAbortRef.current.abort = true;
  }

  const ariaCellId = (r: number, c: number) => `cell-${r}-${c}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Sudoku Solver
          </h1>
          <p className="text-gray-600">
            Animated backtracking algorithm visualizer
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 p-6 rounded-2xl shadow-xl bg-white border border-gray-100">
            {error && (
              <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-start gap-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">
                  Puzzle solved successfully!
                </span>
              </div>
            )}

            <div className="flex justify-center mb-6">
              <div
                className="inline-grid grid-cols-9 gap-0 border-4 border-gray-800 rounded-lg overflow-hidden shadow-md bg-white"
                role="grid"
                aria-label="sudoku-grid"
              >
                {board.map((row, r) =>
                  row.map((val, c) => {
                    const isPrefilled = initial[r] && initial[r][c] !== ".";
                    const isHighlighted =
                      highlight && highlight.r === r && highlight.c === c;
                    const blockRight = (c + 1) % 3 === 0 && c !== 8;
                    const blockBottom = (r + 1) % 3 === 0 && r !== 8;

                    return (
                      <div
                        key={`${r}-${c}`}
                        role="gridcell"
                        aria-describedby={ariaCellId(r, c)}
                        className={`relative border border-gray-300 ${
                          blockRight ? "border-r-4 border-r-gray-800" : ""
                        } ${
                          blockBottom ? "border-b-4 border-b-gray-800" : ""
                        } ${
                          isHighlighted
                            ? "bg-yellow-200"
                            : (r % 6 < 3 && c % 6 < 3) ||
                              (r % 6 >= 3 && c % 6 >= 3)
                            ? "bg-gray-50"
                            : "bg-white"
                        }`}
                      >
                        <input
                          id={ariaCellId(r, c)}
                          value={val === "." ? "" : val}
                          onChange={(e) => handleChange(r, c, e.target.value)}
                          onFocus={(e) => e.currentTarget.select()}
                          inputMode="numeric"
                          maxLength={1}
                          disabled={running}
                          className={`w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-semibold outline-none bg-transparent ${
                            isPrefilled
                              ? "text-gray-900 font-bold"
                              : "text-indigo-600"
                          } ${
                            isHighlighted ? "animate-pulse" : ""
                          } disabled:cursor-not-allowed`}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                className={`px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all ${
                  running
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                }`}
                onClick={onSolveAnimatedClick}
                disabled={running}
              >
                {running ? "Solving..." : "Solve (Animate)"}
              </button>

              <button
                className={`px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all ${
                  running
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
                onClick={onSolveInstantClick}
                disabled={running}
              >
                Solve (Instant)
              </button>

              <button
                className={`px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all text-white ${
                  running
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-yellow-500 hover:bg-yellow-600"
                }`}
                onClick={resetToInitial}
                disabled={running}
              >
                Reset
              </button>

              <button
                className={`px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all text-white ${
                  running
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600"
                }`}
                onClick={clearBoard}
                disabled={running}
              >
                Clear
              </button>

              {running && (
                <button
                  className="px-5 py-2.5 rounded-lg font-medium shadow-sm bg-gray-700 hover:bg-gray-800 text-white transition-all"
                  onClick={onAbort}
                >
                  Abort
                </button>
              )}

              <div className="ml-auto flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg">
                <label className="text-sm font-medium text-gray-700">
                  Speed
                </label>
                <input
                  type="range"
                  min={5}
                  max={200}
                  value={speedMs}
                  onChange={(e) => setSpeedMs(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm font-medium text-gray-600 w-12 text-right">
                  {speedMs}ms
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Fill in some numbers and click{" "}
                <strong>Solve (Animate)</strong> to watch the backtracking
                algorithm in action. Invalid puzzles will be detected
                automatically.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-80 p-6 rounded-2xl shadow-xl bg-white border border-gray-100">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Example Puzzles
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Click any example to load it into the grid
            </p>

            <div className="flex flex-col gap-2">
              <ExampleButton
                title="Easy Puzzle"
                difficulty="Easy"
                onLoad={() => {
                  const ex = [
                    "53..7....",
                    "6..195...",
                    ".98....6.",
                    "8...6...3",
                    "4..8.3..1",
                    "7...2...6",
                    ".6....28.",
                    "...419..5",
                    "....8..79",
                  ];
                  const b = ex.map((row) => row.split(""));
                  setBoard(b);
                  setInitial(cloneBoard(b));
                  setError("");
                  setSuccess(false);
                }}
              />

              <ExampleButton
                title="Medium Puzzle"
                difficulty="Medium"
                onLoad={() => {
                  const ex = [
                    "..9..5.1.",
                    "5...1.3..",
                    "...8....9",
                    ".2...7..6",
                    "...6.1...",
                    "1..9...4.",
                    "9....4...",
                    "..6.2...5",
                    ".4.5..2..",
                  ];
                  const b = ex.map((row) => row.split(""));
                  setBoard(b);
                  setInitial(cloneBoard(b));
                  setError("");
                  setSuccess(false);
                }}
              />

              <ExampleButton
                title="Hard Puzzle"
                difficulty="Hard"
                onLoad={() => {
                  const ex = [
                    ".......1.",
                    ".4.8..2..",
                    "..3..9..6",
                    "..7.5.6..",
                    ".2.....4.",
                    "..6.1.3..",
                    "5..2..8..",
                    "..9..7.3.",
                    ".1.......",
                  ];
                  const b = ex.map((row) => row.split(""));
                  setBoard(b);
                  setInitial(cloneBoard(b));
                  setError("");
                  setSuccess(false);
                }}
              />

              <ExampleButton
                title="Invalid Puzzle (Test)"
                difficulty="Invalid"
                onLoad={() => {
                  const ex = [
                    "55.......",
                    ".........",
                    ".........",
                    ".........",
                    ".........",
                    ".........",
                    ".........",
                    ".........",
                    ".........",
                  ];
                  const b = ex.map((row) => row.split(""));
                  setBoard(b);
                  setInitial(cloneBoard(b));
                  setError("");
                  setSuccess(false);
                }}
              />
            </div>

            <button
              className="mt-6 w-full px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-all"
              onClick={() => {
                const exported = board.map((r) => r.join(""));
                navigator.clipboard?.writeText(exported.join("\n"));
                alert("Board copied to clipboard!");
                console.log("Exported board:", exported);
              }}
            >
              📋 Export to Clipboard
            </button>
          </div>
        </div>

        <footer className="mt-8 text-center text-sm text-gray-500">
          Built with React & TypeScript • Backtracking algorithm visualization
        </footer>
      </div>
    </div>
  );
}

function ExampleButton({
  title,
  difficulty,
  onLoad,
}: {
  title: string;
  difficulty: string;
  onLoad: () => void;
}) {
  const colorMap: Record<string, string> = {
    Easy: "border-green-200 hover:bg-green-50",
    Medium: "border-yellow-200 hover:bg-yellow-50",
    Hard: "border-red-200 hover:bg-red-50",
    Invalid: "border-gray-200 hover:bg-gray-50",
  };

  return (
    <button
      onClick={onLoad}
      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
        colorMap[difficulty] || "border-gray-200 hover:bg-gray-50"
      }`}
    >
      <div className="font-medium text-gray-800">{title}</div>
      <div className="text-xs text-gray-500 mt-1">{difficulty}</div>
    </button>
  );
}
