import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, HelpCircle } from 'lucide-react';

type Board = (number | null)[][];
type Difficulty = 'easy' | 'medium' | 'hard';

const EMPTY_BOARD: Board = Array(9).fill(null).map(() => Array(9).fill(null));

// Simple Sudoku puzzle generator
function generatePuzzle(difficulty: Difficulty): { puzzle: Board; solution: Board } {
  const solution: Board = Array(9).fill(null).map(() => Array(9).fill(0));
  
  // Fill diagonal 3x3 boxes (they're independent)
  const fillBox = (row: number, col: number) => {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    let idx = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        solution[row + i][col + j] = nums[idx++];
      }
    }
  };

  fillBox(0, 0);
  fillBox(3, 3);
  fillBox(6, 6);

  // Solve the rest
  const isValid = (board: Board, row: number, col: number, num: number): boolean => {
    for (let i = 0; i < 9; i++) {
      if (board[row][i] === num) return false;
      if (board[i][col] === num) return false;
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[boxRow + i][boxCol + j] === num) return false;
      }
    }
    return true;
  };

  const solve = (board: Board): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              if (solve(board)) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  solve(solution);

  // Create puzzle by removing cells
  const puzzle: Board = solution.map(row => [...row]);
  const cellsToRemove = difficulty === 'easy' ? 35 : difficulty === 'medium' ? 45 : 55;
  
  const positions: [number, number][] = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      positions.push([i, j]);
    }
  }
  positions.sort(() => Math.random() - 0.5);

  for (let i = 0; i < cellsToRemove; i++) {
    const [r, c] = positions[i];
    puzzle[r][c] = null;
  }

  return { puzzle, solution };
}

export default function SudokuGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [board, setBoard] = useState<Board>(EMPTY_BOARD);
  const [initial, setInitial] = useState<boolean[][]>(Array(9).fill(null).map(() => Array(9).fill(false)));
  const [solution, setSolution] = useState<Board>(EMPTY_BOARD);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(false);
  const [moves, setMoves] = useState(0);

  const startNewGame = useCallback((diff: Difficulty) => {
    const { puzzle, solution: sol } = generatePuzzle(diff);
    setBoard(puzzle);
    setSolution(sol);
    setInitial(puzzle.map(row => row.map(cell => cell !== null)));
    setSelectedCell(null);
    setErrors(new Set());
    setCompleted(false);
    setMoves(0);
    setDifficulty(diff);
  }, []);

  useEffect(() => {
    startNewGame('easy');
  }, [startNewGame]);

  const handleCellClick = (row: number, col: number) => {
    if (initial[row][col]) return;
    setSelectedCell([row, col]);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || completed) return;
    const [row, col] = selectedCell;
    if (initial[row][col]) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = num === 0 ? null : num;
    setBoard(newBoard);
    setMoves(prev => prev + 1);

    // Check for errors
    const newErrors = new Set<string>();
    if (num !== 0 && solution[row][col] !== num) {
      newErrors.add(`${row}-${col}`);
    }
    setErrors(newErrors);

    // Check completion
    if (num !== 0) {
      const isComplete = newBoard.every((r, ri) =>
        r.every((cell, ci) => cell === solution[ri][ci])
      );
      if (isComplete) setCompleted(true);
    }
  };

  return (
    <div className="py-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Sudoku</h2>
        <p className="text-xs text-gray-500 mt-1">Fill the grid so every row, column, and 3×3 box contains 1-9</p>
      </div>

      {/* Difficulty */}
      <div className="flex gap-2 justify-center mb-4">
        {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
          <button
            key={d}
            onClick={() => startNewGame(d)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
              difficulty === d
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-6 mb-4 text-xs text-gray-500">
        <span>Moves: {moves}</span>
        <span>Errors: {errors.size}</span>
      </div>

      {/* Board */}
      <div className="mx-auto w-fit">
        <div className="grid grid-cols-9 border-2 border-gray-800 rounded-lg overflow-hidden">
          {board.map((row, ri) =>
            row.map((cell, ci) => {
              const isSelected = selectedCell?.[0] === ri && selectedCell?.[1] === ci;
              const isInitial = initial[ri][ci];
              const isError = errors.has(`${ri}-${ci}`);
              const isSameRow = selectedCell?.[0] === ri;
              const isSameCol = selectedCell?.[1] === ci;
              const isSameBox = selectedCell && 
                Math.floor(selectedCell[0] / 3) === Math.floor(ri / 3) &&
                Math.floor(selectedCell[1] / 3) === Math.floor(ci / 3);
              const isHighlighted = isSameRow || isSameCol || isSameBox;

              return (
                <button
                  key={`${ri}-${ci}`}
                  onClick={() => handleCellClick(ri, ci)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-sm font-medium border-[0.5px] border-gray-300 transition-colors ${
                    isSelected ? 'bg-indigo-100' :
                    isError ? 'bg-red-50' :
                    isHighlighted ? 'bg-indigo-50/50' :
                    'bg-white'
                  } ${
                    (ci + 1) % 3 === 0 && ci < 8 ? 'border-r-2 border-r-gray-700' : ''
                  } ${
                    (ri + 1) % 3 === 0 && ri < 8 ? 'border-b-2 border-b-gray-700' : ''
                  } ${isInitial ? 'text-gray-900 font-bold' : 'text-indigo-600'}`}
                >
                  {cell || ''}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-9 gap-1.5 mt-4 max-w-sm mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            className="aspect-square bg-white border border-gray-200 rounded-lg font-bold text-gray-800 hover:bg-indigo-50 hover:border-indigo-200 transition text-sm"
          >
            {num}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4 justify-center">
        <button
          onClick={() => handleNumberInput(0)}
          className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition"
        >
          Erase
        </button>
        <button
          onClick={() => startNewGame(difficulty)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition"
        >
          <RotateCcw size={14} /> New Game
        </button>
      </div>

      {/* Completion */}
      {completed && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center"
        >
          <p className="text-4xl mb-2">🎉</p>
          <p className="font-bold text-emerald-700 text-lg">Puzzle Complete!</p>
          <p className="text-sm text-emerald-600 mt-1">Solved in {moves} moves</p>
        </motion.div>
      )}
    </div>
  );
}
