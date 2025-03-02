import { v4 as uuidv4 } from 'uuid';

// Define the shape templates
const shapeTemplates = [
  // Single block
  { blocks: [[0, 0]], weight: 1 },
  
  // 2-block shapes
  { blocks: [[0, 0], [0, 1]], weight: 2 }, // Horizontal line of 2
  { blocks: [[0, 0], [1, 0]], weight: 2 }, // Vertical line of 2
  
  // 3-block shapes
  { blocks: [[0, 0], [0, 1], [0, 2]], weight: 3 }, // Horizontal line of 3
  { blocks: [[0, 0], [1, 0], [2, 0]], weight: 3 }, // Vertical line of 3
  { blocks: [[0, 0], [0, 1], [1, 0]], weight: 3 }, // L shape
  { blocks: [[0, 0], [0, 1], [1, 1]], weight: 3 }, // Reverse L shape
  
  // 4-block shapes (Tetrominos)
  { blocks: [[0, 0], [0, 1], [0, 2], [0, 3]], weight: 2 }, // I shape horizontal
  { blocks: [[0, 0], [1, 0], [2, 0], [3, 0]], weight: 2 }, // I shape vertical
  { blocks: [[0, 0], [0, 1], [1, 0], [1, 1]], weight: 3 }, // O shape (square)
  { blocks: [[0, 1], [1, 0], [1, 1], [1, 2]], weight: 2 }, // T shape
  { blocks: [[0, 0], [1, 0], [1, 1], [2, 1]], weight: 2 }, // Z shape
  { blocks: [[0, 1], [1, 0], [1, 1], [2, 0]], weight: 2 }, // S shape
  { blocks: [[0, 0], [1, 0], [2, 0], [2, 1]], weight: 2 }, // L shape
  { blocks: [[0, 1], [1, 1], [2, 0], [2, 1]], weight: 2 }, // J shape
  
  // 5-block shapes
  { blocks: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]], weight: 1 }, // Big L
  { blocks: [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]], weight: 1 }, // Reverse big L
  { blocks: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]], weight: 1 }, // Plus sign
];

// Available colors
const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan'];

// Function to generate random shapes
export const generateShapes = (count: number) => {
  const shapes = [];
  
  for (let i = 0; i < count; i++) {
    // Create a weighted selection of shapes
    const totalWeight = shapeTemplates.reduce((sum, template) => sum + template.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    
    let selectedTemplate = shapeTemplates[0];
    for (const template of shapeTemplates) {
      randomWeight -= template.weight;
      if (randomWeight <= 0) {
        selectedTemplate = template;
        break;
      }
    }
    
    // Randomly rotate the shape (0, 90, 180, or 270 degrees)
    const rotations = Math.floor(Math.random() * 4);
    let rotatedBlocks = [...selectedTemplate.blocks];
    
    for (let r = 0; r < rotations; r++) {
      rotatedBlocks = rotateShape(rotatedBlocks);
    }
    
    // Normalize the shape so it starts at 0,0
    const normalizedBlocks = normalizeShape(rotatedBlocks);
    
    // Select a random color
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    shapes.push({
      id: uuidv4(),
      blocks: normalizedBlocks,
      color
    });
  }
  
  return shapes;
};

// Function to rotate a shape 90 degrees clockwise
const rotateShape = (blocks: number[][]) => {
  return blocks.map(([row, col]) => [-col, row]);
};

// Function to normalize a shape so it starts at 0,0
const normalizeShape = (blocks: number[][]) => {
  // Find the minimum row and column
  const minRow = Math.min(...blocks.map(([row]) => row));
  const minCol = Math.min(...blocks.map(([, col]) => col));
  
  // Shift all blocks so the shape starts at 0,0
  return blocks.map(([row, col]) => [row - minRow, col - minCol]);
};