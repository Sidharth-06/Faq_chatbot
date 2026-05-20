'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  chart: string;
}

export default function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && chart) {
      mermaid.contentLoaded();
    }
  }, [chart]);

  return (
    <div 
      ref={containerRef}
      className="mermaid my-4 flex justify-center overflow-x-auto p-4 bg-zinc-50 rounded-lg border border-zinc-200"
    >
      {chart}
    </div>
  );
}
