import React, { useState, useEffect } from 'react';

interface ShapeSelectorProps {
  shapes: Array<{
    id: string;
    blocks: number[][];
    color: string;
  }>;
  selectedIndex: number | null;
  onSelectShape: (index: number) => void;
  draggablePieces?: boolean;
  onDragPlace?: (row: number, col: number) => void;
}

export const ShapeSelector: React.FC<ShapeSelectorProps> = ({ 
  shapes, 
  selectedIndex, 
  onSelectShape,
  draggablePieces = false,
  onDragPlace
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [draggedShapeIndex, setDraggedShapeIndex] = useState<number | null>(null);

  // Clean up event listeners when component unmounts or when dragging state changes
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const getBlockColor = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-500';
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-400';
      case 'purple': return 'bg-purple-500';
      case 'orange': return 'bg-orange-500';
      case 'cyan': return 'bg-cyan-400';
      default: return 'bg-gray-500';
    }
  };

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    if (draggablePieces) {
      e.preventDefault();
      setIsDragging(true);
      setDraggedShapeIndex(index);
      setDragPosition({ 
        x: e.clientX, 
        y: e.clientY 
      });
      onSelectShape(index);
    } else {
      onSelectShape(index);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setDragPosition({ 
        x: e.clientX, 
        y: e.clientY 
      });
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (isDragging && draggedShapeIndex !== null && shapes[draggedShapeIndex]) {
      setIsDragging(false);
      
      // Find the board element
      const boardElement = document.querySelector('.grid-cols-8');
      if (boardElement) {
        const boardRect = boardElement.getBoundingClientRect();
        
        // Check if the drop is within the board
        if (
          e.clientX >= boardRect.left && 
          e.clientX <= boardRect.right && 
          e.clientY >= boardRect.top && 
          e.clientY <= boardRect.bottom
        ) {
          // Calculate the grid cell
          const cellWidth = boardRect.width / 8;
          const cellHeight = boardRect.height / 8;
          
          const col = Math.floor((e.clientX - boardRect.left) / cellWidth);
          const row = Math.floor((e.clientY - boardRect.top) / cellHeight);
          
          // Get the shape being dragged
          const shape = shapes[draggedShapeIndex];
          
          // Find the visual center of the shape by calculating its bounding box
          let minRow = Infinity, minCol = Infinity, maxRow = -Infinity, maxCol = -Infinity;
          
          shape.blocks.forEach(([r, c]) => {
            minRow = Math.min(minRow, r);
            minCol = Math.min(minCol, c);
            maxRow = Math.max(maxRow, r);
            maxCol = Math.max(maxCol, c);
          });
          
          // Calculate the center point of the bounding box
          const centerRowOffset = Math.floor((minRow + maxRow) / 2);
          const centerColOffset = Math.floor((minCol + maxCol) / 2);
          
          // Place the shape, adjusting for the center offset
          if (onDragPlace) {
            onDragPlace(row - centerRowOffset, col - centerColOffset);
          }
        }
      }
      
      setDraggedShapeIndex(null);
    }
  };

  const renderShape = (shape, index) => {
    if (!shape || !shape.blocks) return null;
    
    // Find the dimensions of the shape
    let minRow = 0, minCol = 0, maxRow = 0, maxCol = 0;
    
    shape.blocks.forEach(([r, c]) => {
      minRow = Math.min(minRow, r);
      minCol = Math.min(minCol, c);
      maxRow = Math.max(maxRow, r);
      maxCol = Math.max(maxCol, c);
    });
    
    const height = maxRow - minRow + 1;
    const width = maxCol - minCol + 1;
    
    // Create a grid for the shape
    const grid = Array(height).fill(null).map(() => Array(width).fill(false));
    
    // Fill in the grid
    shape.blocks.forEach(([r, c]) => {
      const adjustedRow = r - minRow;
      const adjustedCol = c - minCol;
      grid[adjustedRow][adjustedCol] = true;
    });
    
    return (
      <div 
        key={shape.id}
        className={`p-2 ${selectedIndex === index ? 'bg-gray-700 rounded-lg' : ''} ${draggablePieces ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
        onMouseDown={(e) => handleMouseDown(e, index)}
      >
        <div 
          className="grid gap-0.5"
          style={{ 
            gridTemplateColumns: `repeat(${width}, 1fr)`,
            gridTemplateRows: `repeat(${height}, 1fr)`,
          }}
        >
          {grid.map((row, rowIndex) => (
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`aspect-square ${cell ? getBlockColor(shape.color) : 'bg-transparent'} rounded-sm relative`}
                style={{ width: '24px', height: '24px' }}
              >
                {cell && (
                  <>
                    <div className="absolute inset-0 bg-black opacity-20 rounded-sm" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 15%, 15% 15%, 15% 85%, 0 100%)' }}></div>
                    <div className="absolute inset-0 bg-white opacity-30 rounded-sm" style={{ clipPath: 'polygon(100% 100%, 100% 0, 85% 15%, 85% 85%, 15% 85%, 0 100%)' }}></div>
                  </>
                )}
              </div>
            ))
          ))}
        </div>
      </div>
    );
  };

  // Render dragged shape
  const renderDraggedShape = () => {
    if (!isDragging || draggedShapeIndex === null || !shapes[draggedShapeIndex]) return null;
    
    const shape = shapes[draggedShapeIndex];
    if (!shape || !shape.blocks) return null;
    
    // Find the dimensions of the shape
    let minRow = 0, minCol = 0, maxRow = 0, maxCol = 0;
    
    shape.blocks.forEach(([r, c]) => {
      minRow = Math.min(minRow, r);
      minCol = Math.min(minCol, c);
      maxRow = Math.max(maxRow, r);
      maxCol = Math.max(maxCol, c);
    });
    
    const height = maxRow - minRow + 1;
    const width = maxCol - minCol + 1;
    
    // Create a grid for the shape
    const grid = Array(height).fill(null).map(() => Array(width).fill(false));
    
    // Fill in the grid
    shape.blocks.forEach(([r, c]) => {
      const adjustedRow = r - minRow;
      const adjustedCol = c - minCol;
      grid[adjustedRow][adjustedCol] = true;
    });
    
    // Use the same cell size as the game board
    const cellSize = 24; // Match the size used in the game board
    const shapeWidth = width * cellSize;
    const shapeHeight = height * cellSize;
    
    return (
      <div 
        className="fixed pointer-events-none z-50"
        style={{ 
          left: dragPosition.x - shapeWidth / 2, 
          top: dragPosition.y - shapeHeight / 2,
          opacity: 0.8
        }}
      >
        <div 
          className="grid gap-0.5"
          style={{ 
            gridTemplateColumns: `repeat(${width}, 1fr)`,
            gridTemplateRows: `repeat(${height}, 1fr)`,
          }}
        >
          {grid.map((row, rowIndex) => (
            row.map((cell, colIndex) => (
              <div
                key={`drag-${rowIndex}-${colIndex}`}
                className={`aspect-square ${cell ? getBlockColor(shape.color) : 'bg-transparent'} rounded-sm relative`}
                style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
              >
                {cell && (
                  <>
                    <div className="absolute inset-0 bg-black opacity-20 rounded-sm" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 15%, 15% 15%, 15% 85%, 0 100%)' }}></div>
                    <div className="absolute inset-0 bg-white opacity-30 rounded-sm" style={{ clipPath: 'polygon(100% 100%, 100% 0, 85% 15%, 85% 85%, 15% 85%, 0 100%)' }}></div>
                  </>
                )}
              </div>
            ))
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="w-full flex justify-around items-center">
        {shapes.map((shape, index) => renderShape(shape, index))}
      </div>
      {renderDraggedShape()}
    </>
  );
};