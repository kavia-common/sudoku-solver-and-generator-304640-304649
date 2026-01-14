import React, { useEffect, useMemo, useRef, useState } from "react";
import "../shared/common.css";

/**
 * Create a blank 9x9 puzzle (0 means empty).
 * @returns {number[][]}
 */
function createEmptyGrid() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function cloneGrid(grid) {
  return grid.map((r) => r.slice());
}

function isValidPlacement(grid, row, col, val) {
  for (let i = 0; i < 9; i++) {
    if (i !== col && grid[row][i] === val) return false;
    if (i !== row && grid[i][col] === val) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c] === val) return false;
    }
  }
  return true;
}

function findEmpty(grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) return [r, c];
    }
  }
  return null;
}

function shuffledDigits() {
  const arr = DIGITS.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function solveSudoku(grid) {
  const g = cloneGrid(grid);

  function backtrack() {
    const pos = findEmpty(g);
    if (!pos) return true;
    const [r, c] = pos;

    for (const val of DIGITS) {
      g[r][c] = val;
      if (isValidPlacement(g, r, c, val) && backtrack()) return true;
      g[r][c] = 0;
    }
    return false;
  }

  const solved = backtrack();
  return { solved, grid: g };
}

function generateSudoku({ givens = 32 } = {}) {
  const solution = createEmptyGrid();

  function fill() {
    const pos = findEmpty(solution);
    if (!pos) return true;
    const [r, c] = pos;
    const candidates = shuffledDigits();
    for (const val of candidates) {
      solution[r][c] = val;
      if (isValidPlacement(solution, r, c, val) && fill()) return true;
      solution[r][c] = 0;
    }
    return false;
  }

  fill();
  const puzzle = cloneGrid(solution);

  // Remove cells randomly until givens remain.
  const indices = Array.from({ length: 81 }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const keep = Math.max(17, Math.min(81, givens));
  const toRemove = 81 - keep;
  for (let k = 0; k < toRemove; k++) {
    const idx = indices[k];
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    puzzle[r][c] = 0;
  }

  return { puzzle, solution };
}

function gridHasConflicts(grid) {
  // Checks if any filled cell violates Sudoku constraints.
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = grid[r][c];
      if (val === 0) continue;
      // temporarily clear and validate
      const copy = cloneGrid(grid);
      copy[r][c] = 0;
      if (!isValidPlacement(copy, r, c, val)) return true;
    }
  }
  return false;
}

// PUBLIC_INTERFACE
export default function Regular() {
  /** Regular Sudoku screen: input, validate, solve, clear, and generate. */
  const [grid, setGrid] = useState(() => createEmptyGrid());
  const [givensMask, setGivensMask] = useState(() =>
    Array.from({ length: 9 }, () => Array(9).fill(false))
  );
  const [toast, setToast] = useState({
    message: "Enter digits 1–9. Use Backspace/Delete to clear a cell.",
    variant: "info",
  });

  const inputRefs = useRef(
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => null))
  );

  const invalidMask = useMemo(() => {
    const invalid = Array.from({ length: 9 }, () => Array(9).fill(false));
    // Mark each filled cell that causes conflict.
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = grid[r][c];
        if (v === 0) continue;
        const copy = cloneGrid(grid);
        copy[r][c] = 0;
        if (!isValidPlacement(copy, r, c, v)) invalid[r][c] = true;
      }
    }
    return invalid;
  }, [grid]);

  useEffect(() => {
    // Update document title for this screen.
    document.title = "Sudoku - Regular";
  }, []);

  function setCellValue(row, col, nextVal) {
    setGrid((prev) => {
      const next = cloneGrid(prev);
      next[row][col] = nextVal;
      return next;
    });
  }

  function focusCell(row, col) {
    const el = inputRefs.current?.[row]?.[col];
    if (el) el.focus();
  }

  function handleKeyDown(e, row, col) {
    const key = e.key;

    // Navigation (arrow keys)
    if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") {
      e.preventDefault();
      const dr = key === "ArrowUp" ? -1 : key === "ArrowDown" ? 1 : 0;
      const dc = key === "ArrowLeft" ? -1 : key === "ArrowRight" ? 1 : 0;
      const nr = Math.max(0, Math.min(8, row + dr));
      const nc = Math.max(0, Math.min(8, col + dc));
      focusCell(nr, nc);
      return;
    }

    // Clearing
    if (key === "Backspace" || key === "Delete" || key === "0") {
      e.preventDefault();
      if (givensMask[row][col]) return;
      setCellValue(row, col, 0);
      return;
    }

    // Digit entry
    if (/^[1-9]$/.test(key)) {
      e.preventDefault();
      if (givensMask[row][col]) return;
      setCellValue(row, col, Number(key));

      // Move to next cell for faster entry.
      const flat = row * 9 + col;
      const nextFlat = Math.min(80, flat + 1);
      focusCell(Math.floor(nextFlat / 9), nextFlat % 9);
    }
  }

  function handleSolve() {
    if (gridHasConflicts(grid)) {
      setToast({ message: "Fix conflicts before solving.", variant: "error" });
      return;
    }
    const { solved, grid: solvedGrid } = solveSudoku(grid);
    if (!solved) {
      setToast({ message: "No solution found. Check the puzzle inputs.", variant: "error" });
      return;
    }

    setGrid(solvedGrid);
    setToast({ message: "Solved.", variant: "success" });
  }

  function handleClear() {
    setGrid(createEmptyGrid());
    setGivensMask(Array.from({ length: 9 }, () => Array(9).fill(false)));
    setToast({ message: "Cleared.", variant: "info" });
    // focus first cell
    setTimeout(() => focusCell(0, 0), 0);
  }

  function handleGenerate() {
    const { puzzle } = generateSudoku({ givens: 32 });
    setGrid(puzzle);
    setGivensMask(puzzle.map((r) => r.map((v) => v !== 0)));
    setToast({ message: "Generated a new regular puzzle.", variant: "success" });
    setTimeout(() => focusCell(0, 0), 0);
  }

  return (
    <div className="page">
      <header className="page-header" role="banner">
        <div className="page-header-inner">
          <div className="page-title">
            <h1>Sudoku - Regular</h1>
            <p>Fill the grid, generate a new puzzle, or solve automatically.</p>
          </div>
          <div className="btn-row" aria-label="Primary actions">
            <button className="btn btn-success" type="button" onClick={handleGenerate}>
              Generate
            </button>
            <button className="btn btn-primary" type="button" onClick={handleSolve}>
              Solve
            </button>
            <button className="btn btn-danger" type="button" onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>
      </header>

      <main className="page-main" role="main">
        <section className="card" aria-label="Sudoku puzzle">
          <div className="card-body sudoku-wrap">
            <p className="small-note">
              Tip: Use arrow keys to move. Type 1–9 to enter. Backspace/Delete clears.
            </p>

            <div className="sudoku-grid" role="group" aria-label="9 by 9 Sudoku grid">
              <table aria-label="Sudoku input grid">
                <tbody>
                  {grid.map((row, r) => (
                    <tr key={`r-${r}`}>
                      {row.map((val, c) => {
                        const thickTop = r % 3 === 0;
                        const thickLeft = c % 3 === 0;
                        const thickRight = c === 2 || c === 5;
                        const thickBottom = r === 2 || r === 5;

                        const classes = [
                          thickTop ? "thick-top" : "",
                          thickLeft ? "thick-left" : "",
                          thickRight ? "thick-right" : "",
                          thickBottom ? "thick-bottom" : "",
                        ]
                          .filter(Boolean)
                          .join(" ");

                        const isGiven = givensMask[r][c];
                        const isInvalid = invalidMask[r][c];
                        const isSolved = !isGiven && val !== 0;

                        return (
                          <td key={`c-${c}`} className={classes}>
                            <input
                              ref={(el) => {
                                inputRefs.current[r][c] = el;
                              }}
                              className={[
                                "sudoku-cell",
                                isGiven ? "given" : "",
                                isSolved ? "solved" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              inputMode="numeric"
                              pattern="[1-9]"
                              autoComplete="off"
                              autoCorrect="off"
                              spellCheck={false}
                              aria-label={`Row ${r + 1} Column ${c + 1}`}
                              aria-invalid={isInvalid ? "true" : "false"}
                              disabled={isGiven}
                              value={val === 0 ? "" : String(val)}
                              onChange={() => {
                                // Intentionally no-op: we use key handling for stricter control.
                              }}
                              onKeyDown={(e) => handleKeyDown(e, r, c)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="small-note">
              {gridHasConflicts(grid)
                ? "There are conflicts in the current grid (highlighted)."
                : "No conflicts detected."}
            </p>
          </div>
        </section>

        <aside className="card" aria-label="Status">
          <div className="card-body">
            <h2 className="card-title">Status</h2>
            <p className="card-subtitle">Messages and feedback.</p>

            <div
              className="toast"
              role="status"
              aria-live="polite"
              data-variant={toast.variant}
            >
              {toast.message}
            </div>

            <div style={{ height: 12 }} />

            <h3 className="card-title" style={{ marginTop: 0 }}>
              Notes
            </h3>
            <p className="small-note">
              “Generate” creates a playable puzzle with ~32 givens. “Solve” uses a local backtracking solver.
              This implementation avoids external dependencies/services as requested.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
