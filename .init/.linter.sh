#!/bin/bash
cd /home/kavia/workspace/code-generation/sudoku-solver-and-generator-304640-304649/sudoku_solver_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

