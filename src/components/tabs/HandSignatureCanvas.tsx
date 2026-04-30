import { Eraser, Save, Undo, MousePointer2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface HandSignatureCanvasProps {
  onSave: (svgData: string) => void;
  initialSignature?: string;
}

export const HandSignatureCanvas: React.FC<HandSignatureCanvasProps> = ({
  onSave,
  initialSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<{ x: number; y: number }[][]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pos = getCoordinates(e);
    setCurrentPath([pos]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getCoordinates(e);
    setCurrentPath((prev) => [...prev, pos]);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    const lastPos = currentPath[currentPath.length - 1];
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 1) {
      setPaths((prev) => [...prev, currentPath]);
    }
    setCurrentPath([]);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Ajustement pour le scaling du canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPaths([]);
  };

  const undo = () => {
    const newPaths = [...paths];
    newPaths.pop();
    setPaths(newPaths);
    redraw(newPaths);
  };

  const redraw = (pathsToDraw: { x: number; y: number }[][]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    pathsToDraw.forEach(path => {
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      path.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    });
  };

  const generateSVG = () => {
    if (paths.length === 0) return;

    const width = 400;
    const height = 200;
    
    const pathData = paths.map(path => {
      const d = path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      return `<path d="${d}" fill="none" stroke="black" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`;
    }).join('\n');

    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        ${pathData}
      </svg>
    `;
    
    // On encode en Base64 pour le stockage ou on envoie le XML
    const base64 = `data:image/svg+xml;base64,${btoa(svg)}`;
    onSave(base64);
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-brand-50/50 dark:bg-brand-900/20 rounded-2xl border border-brand-100 dark:border-brand-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
          <MousePointer2 size={20} className="text-brand-500" />
          <span className="font-semibold text-sm">Signature manuscrite</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={undo}
            className="p-2 hover:bg-white dark:hover:bg-brand-800 rounded-lg transition-colors text-brand-600 dark:text-brand-400"
            title="Annuler le dernier trait"
          >
            <Undo size={18} />
          </button>
          <button 
            onClick={clear}
            className="p-2 hover:bg-white dark:hover:bg-brand-800 rounded-lg transition-colors text-red-500"
            title="Effacer tout"
          >
            <Eraser size={18} />
          </button>
        </div>
      </div>

      <div className="relative touch-none">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="bg-white border-2 border-dashed border-brand-200 dark:border-brand-700 rounded-xl w-full h-50 cursor-crosshair shadow-inner"
        />
        {paths.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <p className="text-sm font-medium text-brand-400">Signez ici...</p>
          </div>
        )}
      </div>

      <button
        onClick={generateSVG}
        disabled={paths.length === 0}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-bold shadow-sm"
      >
        <Save size={18} />
        Valider la signature
      </button>

      <p className="text-[10px] text-brand-500 dark:text-brand-500 text-center italic">
        Format vectoriel SVG haute résolution pour une impression parfaite sur PDF.
      </p>
    </div>
  );
};
