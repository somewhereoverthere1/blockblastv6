import React, { useEffect, useState } from 'react';

interface LineAnimationProps {
  lines: number;
  streak: number;
  points: number;
  intersection?: boolean;
}

export const LineAnimation: React.FC<LineAnimationProps> = ({ lines, streak, points, intersection = false }) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // Start animation
    setVisible(true);
    
    // Hide after animation completes
    const timer = setTimeout(() => {
      setVisible(false);
    }, 1400);
    
    return () => clearTimeout(timer);
  }, [lines, streak]);
  
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
      <div className="flex flex-col items-center animate-lineAnimation">
        {intersection ? (
          <div className="text-6xl font-bold text-pink-400 mb-2 text-shadow-lg">
            INTERSECTION!
          </div>
        ) : (
          <div className="text-6xl font-bold text-white mb-2 text-shadow-lg">
            {lines} {lines === 1 ? 'LINE' : 'LINES'}!
          </div>
        )}
        
        {streak > 1 && (
          <div className="text-4xl font-bold text-yellow-300 mb-2 text-shadow-lg">
            {streak}x STREAK!
          </div>
        )}
        
        <div className="text-5xl font-bold text-green-400 text-shadow-lg">
          +{points} PTS
        </div>
      </div>
    </div>
  );
};