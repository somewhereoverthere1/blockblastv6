import React, { useState, useEffect } from 'react';

interface GameBoardProps {
  grid: (string | null)[][];
  selectedShape: { blocks: number[][], color: string } | null;
  onCellClick: (row: number, col: number) => void;
  showGrid?: boolean;
  draggablePieces?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  grid, 
  selectedShape, 
  onCellClick,
  showGrid = false,
  draggablePieces = false
}) => {
  const [previewGrid, setPreviewGrid] = useState<(string | null)[][]>([]);
  const [hoverPosition, setHoverPosition] = useState<[number, number] | null>(null);
  const [flashingCells, setFlashingCells] = useState<{row: number, col: number}[]>([]);

  useEffect(() => {
    if (hoverPosition && selectedShape) {
      const [hoverRow, hoverCol] = hoverPosition;
      
      // Create a copy of the current grid for preview
      const newPreviewGrid = grid.map(row => [...row]);
      
      // Find the visual center of the shape by calculating its bounding box
      let minRow = Infinity, minCol = Infinity, maxRow = -Infinity, maxCol = -Infinity;
      
      selectedShape.blocks.forEach(([r, c]) => {
        minRow = Math.min(minRow, r);
        minCol = Math.min(minCol, c);
        maxRow = Math.max(maxRow, r);
        maxCol = Math.max(maxCol, c);
      });
      
      // Calculate the center point of the bounding box
      const centerRowOffset = Math.floor((minRow + maxRow) / 2);
      const centerColOffset = Math.floor((minCol + maxCol) / 2);
      
      // Add preview of the shape, centered on the hover position
      let canPlace = true;
      const placementPositions: [number, number][] = [];
      
      selectedShape.blocks.forEach(([r, c]) => {
        const newRow = hoverRow + r - centerRowOffset;
        const newCol = hoverCol + c - centerColOffset;
        
        placementPositions.push([newRow, newCol]);
        
        // Check if the block is within grid bounds
        if (newRow >= 0 && newRow < grid.length && newCol >= 0 && newCol < grid[0].length) {
          // Check if the cell is already occupied
          if (grid[newRow][newCol] !== null) {
            canPlace = false;
          }
        } else {
          canPlace = false;
        }
      });
      
      // Now update the preview grid
      placementPositions.forEach(([newRow, newCol]) => {
        if (newRow >= 0 && newRow < grid.length && newCol >= 0 && newCol < grid[0].length) {
          newPreviewGrid[newRow][newCol] = canPlace ? `${selectedShape.color}-preview` : 'invalid';
        }
      });
      
      setPreviewGrid(newPreviewGrid);
    } else {
      setPreviewGrid([]);
    }
  }, [hoverPosition, selectedShape, grid]);

  // Check for completed rows or columns to add flashing effect
  useEffect(() => {
    const newFlashingCells: {row: number, col: number}[] = [];
    const gridSize = grid.length;
    
    // Check rows
    for (let row = 0; row < gridSize; row++) {
      const isRowFull = grid[row].every(cell => cell !== null);
      if (isRowFull) {
        for (let col = 0; col < gridSize; col++) {
          newFlashingCells.push({row, col});
        }
      }
    }
    
    // Check columns
    for (let col = 0; col < gridSize; col++) {
      const isColFull = Array.from({length: gridSize}, (_, row) => grid[row][col]).every(cell => cell !== null);
      if (isColFull) {
        for (let row = 0; row < gridSize; row++) {
          if (!newFlashingCells.some(cell => cell.row === row && cell.col === col)) {
            newFlashingCells.push({row, col});
          }
        }
      }
    }
    
    if (newFlashingCells.length > 0) {
      setFlashingCells(newFlashingCells);
      
      // Clear flashing cells after animation
      const timer = setTimeout(() => {
        setFlashingCells([]);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [grid]);

  const handleMouseEnter = (rowIndex: number, colIndex: number) => {
    if (selectedShape) {
      setHoverPosition([rowIndex, colIndex]);
    }
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
  };

  const getBlockColor = (color: string | null, rowIndex: number, colIndex: number) => {
    // Check if this cell is flashing
    const isFlashing = flashingCells.some(cell => cell.row === rowIndex && cell.col === colIndex);
    
    if (!color) return 'bg-gray-900';
    
    if (color === 'invalid') {
      return 'bg-red-500 bg-opacity-40';
    }
    
    if (color.endsWith('-preview')) {
      const baseColor = color.replace('-preview', '');
      return `${getBlockColor(baseColor, rowIndex, colIndex)} opacity-40`;
    }
    
    let baseColor = '';
    switch (color) {
      case 'red': baseColor = 'bg-red-500'; break;
      case 'blue': baseColor = 'bg-blue-500'; break;
      case 'green': baseColor = 'bg-green-500'; break;
      case 'yellow': baseColor = 'bg-yellow-400'; break;
      case 'purple': baseColor = 'bg-purple-500'; break;
      case 'orange': baseColor = 'bg-orange-500'; break;
      case 'cyan': baseColor = 'bg-cyan-400'; break;
      default: baseColor = 'bg-gray-500';
    }
    
    return isFlashing ? `${baseColor} animate-pulse` : baseColor;
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    if (selectedShape && !draggablePieces) {
      // Find the visual center of the shape by calculating its bounding box
      let minRow = Infinity, minCol = Infinity, maxRow = -Infinity, maxCol = -Infinity;
      
      selectedShape.blocks.forEach(([r, c]) => {
        minRow = Math.min(minRow, r);
        minCol = Math.min(minCol, c);
        maxRow = Math.max(maxRow, r);
        maxCol = Math.max(maxCol, c);
      });
      
      // Calculate the center point of the bounding box
      const centerRowOffset = Math.floor((minRow + maxRow) / 2);
      const centerColOffset = Math.floor((minCol + maxCol) / 2);
      
      // Adjust the click position to account for the center of the shape
      onCellClick(rowIndex - centerRowOffset, colIndex - centerColOffset);
    } else {
      onCellClick(rowIndex, colIndex);
    }
  };

  return (
    <div className={`w-full aspect-square bg-gray-900 rounded-lg overflow-hidden ${showGrid ? 'board-with-grid' : ''}`} style={{ minHeight: '350px', maxHeight: '450px' }}>
      <div className="grid grid-cols-8 grid-rows-8 h-full w-full gap-1 p-1">
        {grid.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            const isPreview = hoverPosition && previewGrid[rowIndex]?.[colIndex] !== undefined;
            const displayColor = isPreview ? previewGrid[rowIndex][colIndex] : cell;
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`${getBlockColor(displayColor, rowIndex, colIndex)} relative rounded-sm flex items-center justify-center transition-colors duration-100`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                onMouseLeave={handleMouseLeave}
              >
                {/* 3D effect for blocks */}
                {displayColor && !displayColor.includes('invalid') && (
                  <>
                    <div className="absolute inset-0 bg-black opacity-20 rounded-sm" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 15%, 15% 15%, 15% 85%, 0 100%)' }}></div>
                    <div className="absolute inset-0 bg-white opacity-30 rounded-sm" style={{ clipPath: 'polygon(100% 100%, 100% 0, 85% 15%, 85% 85%, 15% 85%, 0 100%)' }}></div>
                  </>
                )}
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
};