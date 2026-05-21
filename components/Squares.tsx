'use client';

import { useEffect, useRef } from 'react';

interface SquaresProps {
  direction?: 'diagonal' | 'up' | 'right' | 'down' | 'left';
  speed?: number;
  borderColor?: string;
  squareSize?: number;
  hoverFillColor?: string;
}

export default function Squares({
  direction = 'diagonal',
  speed = 0.4,
  borderColor = 'rgba(0, 0, 0, 0.04)',
  squareSize = 48,
  hoverFillColor = 'rgba(168, 44, 36, 0.06)', // Soft brand-red hover trail
}: SquaresProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let offset = { x: 0, y: 0 };
    
    let cols = 0;
    let rows = 0;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
      cols = Math.ceil(rect.width / squareSize) + 2;
      rows = Math.ceil(rect.height / squareSize) + 2;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track active mouse trails
    interface TrailSquare {
      x: number;
      y: number;
      opacity: number;
    }
    let trails: TrailSquare[] = [];

    const drawGrid = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;

      // Draw grids
      for (let i = -1; i < cols; i++) {
        for (let j = -1; j < rows; j++) {
          const x = i * squareSize + (offset.x % squareSize);
          const y = j * squareSize + (offset.y % squareSize);

          ctx.strokeRect(x, y, squareSize, squareSize);

          // Find and draw trail for this coordinate
          const trail = trails.find(t => t.x === i && t.y === j);
          if (trail) {
            // Replace the alpha channel of hoverFillColor with the trailing opacity
            const colorWithAlpha = hoverFillColor.replace(
              /rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/,
              `rgba($1, $2, $3, ${trail.opacity * 0.08})`
            );
            ctx.fillStyle = colorWithAlpha;
            ctx.fillRect(x + 1, y + 1, squareSize - 2, squareSize - 2);
          }
        }
      }

      // Update offsets based on direction
      if (direction === 'diagonal') {
        offset.x -= speed;
        offset.y -= speed;
      } else if (direction === 'up') {
        offset.y -= speed;
      } else if (direction === 'down') {
        offset.y += speed;
      } else if (direction === 'left') {
        offset.x -= speed;
      } else if (direction === 'right') {
        offset.x += speed;
      }

      // Update trails (fade out)
      trails = trails
        .map(t => ({ ...t, opacity: t.opacity - 0.03 }))
        .filter(t => t.opacity > 0);

      animationFrameId = requestAnimationFrame(drawGrid);
    };

    drawGrid();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - (offset.x % squareSize);
      const mouseY = e.clientY - rect.top - (offset.y % squareSize);

      const col = Math.floor(mouseX / squareSize);
      const row = Math.floor(mouseY / squareSize);

      // Add or update active hover trail
      const existingTrailIndex = trails.findIndex(t => t.x === col && t.y === row);
      if (existingTrailIndex > -1) {
        trails[existingTrailIndex].opacity = 1.0;
      } else {
        trails.push({ x: col, y: row, opacity: 1.0 });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [direction, speed, borderColor, squareSize, hoverFillColor]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none block"
    />
  );
}
