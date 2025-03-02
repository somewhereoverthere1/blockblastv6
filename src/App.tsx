import React, { useState, useEffect, useCallback } from 'react';
import { Crown, Settings, X, Info, Trash2, RotateCcw, Grid, MousePointer, MousePointerClick } from 'lucide-react';
import Cookies from 'js-cookie';
import { GameBoard } from './components/GameBoard';
import { ShapeSelector } from './components/ShapeSelector';
import { LineAnimation } from './components/LineAnimation';
import { generateShapes } from './utils/shapeGenerator';
import { checkPlacement, clearLines, checkGameOver } from './utils/gameLogic';

function App() {
  const GRID_SIZE = 8;
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [grid, setGrid] = useState(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
  const [availableShapes, setAvailableShapes] = useState(generateShapes(3));
  const [selectedShape, setSelectedShape] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationData, setAnimationData] = useState({ lines: 0, streak: 0, points: 0, intersection: false });
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [scoreFlash, setScoreFlash] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [draggablePieces, setDraggablePieces] = useState(true);

  // Initialize the game and check for first-time user
  useEffect(() => {
    const savedHighScore = Cookies.get('blockPuzzleHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
    
    // Load saved game state
    const savedGrid = Cookies.get('blockPuzzleGrid');
    const savedScore = Cookies.get('blockPuzzleScore');
    const savedShapes = Cookies.get('blockPuzzleShapes');
    const savedStreak = Cookies.get('blockPuzzleStreak');
    const savedShowGrid = Cookies.get('blockPuzzleShowGrid');
    const savedDraggablePieces = Cookies.get('blockPuzzleDraggablePieces');
    
    if (savedGrid && savedScore && savedShapes) {
      try {
        setGrid(JSON.parse(savedGrid));
        setScore(parseInt(savedScore, 10));
        setAvailableShapes(JSON.parse(savedShapes));
        if (savedStreak) {
          setStreak(parseInt(savedStreak, 10));
        }
        if (savedShowGrid) {
          setShowGrid(savedShowGrid === 'true');
        }
        if (savedDraggablePieces) {
          setDraggablePieces(savedDraggablePieces === 'true');
        }
      } catch (e) {
        console.error("Error loading saved game:", e);
        resetGame();
      }
    } else {
      resetGame();
    }
    
    const firstTimeUser = !Cookies.get('blockPuzzleVisited');
    if (firstTimeUser) {
      setShowInstructions(true);
      Cookies.set('blockPuzzleVisited', 'true', { expires: 365 });
    }
  }, []);

  // Save high score whenever it changes
  useEffect(() => {
    if (highScore > 0) {
      Cookies.set('blockPuzzleHighScore', highScore.toString(), { expires: 365 });
    }
  }, [highScore]);

  // Save game state whenever it changes
  useEffect(() => {
    if (!gameOver) {
      Cookies.set('blockPuzzleGrid', JSON.stringify(grid), { expires: 1 });
      Cookies.set('blockPuzzleScore', score.toString(), { expires: 1 });
      Cookies.set('blockPuzzleShapes', JSON.stringify(availableShapes), { expires: 1 });
      Cookies.set('blockPuzzleStreak', streak.toString(), { expires: 1 });
      Cookies.set('blockPuzzleShowGrid', showGrid.toString(), { expires: 365 });
      Cookies.set('blockPuzzleDraggablePieces', draggablePieces.toString(), { expires: 365 });
    }
  }, [grid, score, availableShapes, streak, gameOver, showGrid, draggablePieces]);

  // Check for game over
  useEffect(() => {
    if (availableShapes.length > 0 && !gameOver) {
      const isGameOver = checkGameOver(grid, availableShapes);
      if (isGameOver) {
        setGameOver(true);
        
        // Update high score if needed
        if (score > highScore) {
          setHighScore(score);
        }
      }
    }
  }, [grid, availableShapes, gameOver, score, highScore]);

  // Flash score animation
  useEffect(() => {
    if (scoreFlash) {
      const timer = setTimeout(() => {
        setScoreFlash(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [scoreFlash]);

  const resetGame = () => {
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
    setScore(0);
    setStreak(0);
    setAvailableShapes(generateShapes(3));
    setSelectedShape(null);
    setGameOver(false);
    
    // Clear saved game state
    Cookies.remove('blockPuzzleGrid');
    Cookies.remove('blockPuzzleScore');
    Cookies.remove('blockPuzzleShapes');
    Cookies.remove('blockPuzzleStreak');
  };

  const handleShapeSelect = (index) => {
    setSelectedShape(index);
  };

  const handlePlaceShape = useCallback((rowIndex, colIndex) => {
    if (selectedShape === null || gameOver) return;

    const shape = availableShapes[selectedShape];
    const canPlace = checkPlacement(grid, shape, rowIndex, colIndex);

    if (canPlace) {
      // Place the shape on the grid
      const newGrid = [...grid];
      shape.blocks.forEach(([r, c]) => {
        const newRow = rowIndex + r;
        const newCol = colIndex + c;
        if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
          newGrid[newRow][newCol] = shape.color;
        }
      });

      // Award 10 points for placing a block
      const blockCount = shape.blocks.length;
      const placementPoints = blockCount * 10;
      
      // Check for completed lines and update score
      const { updatedGrid, clearedLines, clearedPositions, intersections } = clearLines(newGrid);
      
      // Calculate points with streak bonus
      let linePoints = 0;
      let newStreak = streak;
      let hasIntersection = intersections > 0;
      
      if (clearedLines > 0) {
        newStreak += 1;
        const streakBonus = (newStreak - 1) * 10; // Starts at 0 bonus, then 10, 20, etc.
        
        // Special bonus for intersections (horizontal + vertical clear at same position)
        if (hasIntersection) {
          linePoints = 250; // Base points for intersection
          newStreak = Math.max(2, newStreak); // Ensure at least 2x streak for intersections
        } else {
          linePoints = clearedLines * 100; // Regular line points
        }
        
        // Add streak bonus
        linePoints += linePoints * (streakBonus / 100);
        
        // Show animation
        setAnimationData({
          lines: clearedLines,
          streak: newStreak,
          points: Math.round(linePoints + placementPoints),
          intersection: hasIntersection
        });
        setShowAnimation(true);
        
        // Hide animation after 1.5 seconds
        setTimeout(() => {
          setShowAnimation(false);
        }, 1500);
      } else {
        // Reset streak if no lines were cleared
        newStreak = 0;
      }
      
      // Update score with both placement and line points
      const totalPointsScored = placementPoints + linePoints;
      setGrid(updatedGrid);
      const newScore = Math.round(score + totalPointsScored);
      setScore(newScore);
      
      // Update high score if needed
      if (newScore > highScore) {
        setHighScore(newScore);
      }
      
      setStreak(newStreak);
      
      // Flash score
      setScoreFlash(true);

      // Remove the used shape and generate a new one if needed
      const newAvailableShapes = [...availableShapes];
      newAvailableShapes.splice(selectedShape, 1);
      
      if (newAvailableShapes.length === 0) {
        const freshShapes = generateShapes(3);
        setAvailableShapes(freshShapes);
      } else {
        setAvailableShapes(newAvailableShapes);
      }
      
      setSelectedShape(null);
    }
  }, [availableShapes, grid, selectedShape, gameOver, streak, score, highScore]);

  const clearHighScore = () => {
    Cookies.remove('blockPuzzleHighScore');
    setHighScore(0);
  };

  return (
    <div className="min-h-screen bg-blue-800 flex flex-col items-center justify-center py-6 px-4">
      {/* Header with score */}
      <div className="w-full max-w-md flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Crown className="text-yellow-400 w-8 h-8" />
          <div className="ml-2">
            <span className="text-yellow-400 text-3xl font-bold">
              {score > highScore ? score : highScore}
            </span>
          </div>
        </div>
        <div className="flex items-center">
          {streak > 1 && (
            <div className="mr-4 bg-orange-500 text-white px-2 py-1 rounded-md text-sm font-bold">
              {streak}x STREAK
            </div>
          )}
          <button 
            onClick={() => setShowSettings(true)}
            className="focus:outline-none"
          >
            <Settings className="text-gray-300 w-8 h-8 hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* Game content - centered */}
      <div className="flex flex-col items-center justify-center w-full max-w-md">
        {/* Score display */}
        <div className="relative mb-4">
          <div className={`absolute inset-0 bg-pink-500 rounded-full opacity-20 blur-xl ${scoreFlash ? 'animate-pulse' : ''}`}></div>
          <div className={`relative text-white text-7xl font-bold ${scoreFlash ? 'animate-bounce' : ''}`}>{score}</div>
        </div>

        {/* Game board - centered */}
        <div className="w-full mb-6">
          <GameBoard 
            grid={grid} 
            selectedShape={selectedShape !== null ? availableShapes[selectedShape] : null}
            onCellClick={handlePlaceShape}
            showGrid={showGrid}
            draggablePieces={draggablePieces}
          />
        </div>

        {/* Shape selector */}
        <div className="w-full mb-4">
          <ShapeSelector 
            shapes={availableShapes} 
            selectedIndex={selectedShape}
            onSelectShape={handleShapeSelect}
            draggablePieces={draggablePieces}
            onDragPlace={handlePlaceShape}
          />
        </div>
      </div>

      {/* Line cleared animation */}
      {showAnimation && (
        <LineAnimation 
          lines={animationData.lines}
          streak={animationData.streak}
          points={animationData.points}
          intersection={animationData.intersection}
        />
      )}

      {/* Game over overlay */}
      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
            <p className="mb-2">Your score: {score}</p>
            {score >= highScore && score > 0 && (
              <p className="text-yellow-600 font-bold mb-4">New High Score!</p>
            )}
            <button 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              onClick={resetGame}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Instructions modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">How to Play</h2>
              <button 
                onClick={() => setShowInstructions(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="mb-6">
              <h3 className="font-bold mb-2">Game Rules:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Select a shape from the bottom of the screen</li>
                <li>Place it on the 8×8 grid by clicking</li>
                <li>Earn 10 points for each block placed</li>
                <li>Complete a full row or column to clear it and score points</li>
                <li>Each line cleared is worth 100 points</li>
                <li>Clear a row and column intersection for 250 points and 2x streak!</li>
                <li>Clear lines in consecutive turns to build a streak</li>
                <li>Each streak level adds 10% points per line</li>
                <li>Game ends when no more shapes can be placed</li>
                <li>Your progress is saved automatically</li>
              </ul>
            </div>
            <button 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 w-full"
              onClick={() => setShowInstructions(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Settings</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <div className="flex items-center">
                  <Grid className="mr-2" size={20} />
                  <span>Show Grid</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={showGrid}
                    onChange={() => setShowGrid(!showGrid)}
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <div className="flex items-center">
                  {draggablePieces ? (
                    <MousePointer className="mr-2" size={20} />
                  ) : (
                    <MousePointerClick className="mr-2" size={20} />
                  )}
                  <span>Draggable Pieces</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={draggablePieces}
                    onChange={() => setDraggablePieces(!draggablePieces)}
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <button 
                className="flex items-center justify-center w-full bg-blue-100 text-blue-800 p-3 rounded-lg hover:bg-blue-200"
                onClick={() => {
                  setShowInstructions(true);
                  setShowSettings(false);
                }}
              >
                <Info className="mr-2" size={20} />
                Show Instructions
              </button>
              <button 
                className="flex items-center justify-center w-full bg-orange-100 text-orange-800 p-3 rounded-lg hover:bg-orange-200"
                onClick={() => {
                  resetGame();
                  setShowSettings(false);
                }}
              >
                <RotateCcw className="mr-2" size={20} />
                Reset Game
              </button>
              <button 
                className="flex items-center justify-center w-full bg-red-100 text-red-800 p-3 rounded-lg hover:bg-red-200"
                onClick={() => {
                  clearHighScore();
                  setShowSettings(false);
                }}
              >
                <Trash2 className="mr-2" size={20} />
                Reset High Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;