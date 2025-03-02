// Check if a shape can be placed at the given position
export const checkPlacement = (
  grid: (string | null)[][],
  shape: { blocks: number[][], color: string },
  startRow: number,
  startCol: number
): boolean => {
  const gridSize = grid.length;
  
  // Check each block of the shape
  for (const [relRow, relCol] of shape.blocks) {
    const newRow = startRow + relRow;
    const newCol = startCol + relCol;
    
    // Check if the block is within grid bounds
    if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) {
      return false;
    }
    
    // Check if the cell is already occupied
    if (grid[newRow][newCol] !== null) {
      return false;
    }
  }
  
  return true;
};

// Clear completed rows and columns and return the updated grid and number of lines cleared
export const clearLines = (
  grid: (string | null)[][]
): { 
  updatedGrid: (string | null)[][], 
  clearedLines: number, 
  clearedPositions: {row: number, col: number}[],
  intersections: number
} => {
  const gridSize = grid.length;
  let clearedLines = 0;
  let intersections = 0;
  const updatedGrid = [...grid.map(row => [...row])];
  const clearedPositions: {row: number, col: number}[] = [];
  
  // Track which rows and columns are full
  const fullRows: number[] = [];
  const fullCols: number[] = [];
  
  // Check rows
  for (let row = 0; row < gridSize; row++) {
    if (updatedGrid[row].every(cell => cell !== null)) {
      fullRows.push(row);
      clearedLines++;
    }
  }
  
  // Check columns
  for (let col = 0; col < gridSize; col++) {
    if (Array.from({ length: gridSize }, (_, row) => updatedGrid[row][col]).every(cell => cell !== null)) {
      fullCols.push(col);
      clearedLines++;
    }
  }
  
  // Clear full rows
  for (const row of fullRows) {
    for (let col = 0; col < gridSize; col++) {
      updatedGrid[row][col] = null;
      clearedPositions.push({row, col});
    }
  }
  
  // Clear full columns and count intersections
  for (const col of fullCols) {
    for (let row = 0; row < gridSize; row++) {
      // Check if this is an intersection point (already cleared by a row)
      if (fullRows.includes(row) && updatedGrid[row][col] === null) {
        intersections++;
      }
      updatedGrid[row][col] = null;
      if (!clearedPositions.some(pos => pos.row === row && pos.col === col)) {
        clearedPositions.push({row, col});
      }
    }
  }
  
  return { updatedGrid, clearedLines, clearedPositions, intersections };
};

// Check if the game is over (no shapes can be placed)
export const checkGameOver = (
  grid: (string | null)[][],
  availableShapes: Array<{ blocks: number[][], color: string }>
): boolean => {
  const gridSize = grid.length;
  
  // For each shape
  for (const shape of availableShapes) {
    // Try to place it at every position on the grid
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (checkPlacement(grid, shape, row, col)) {
          // If the shape can be placed, the game is not over
          return false;
        }
      }
    }
  }
  
  // If no shape can be placed, the game is over
  return true;
};