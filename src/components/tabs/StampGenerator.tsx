import { Check, Download, RefreshCcw, ShieldCheck, Printer } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface StampGeneratorProps {
  companyName: string;
  siret: string;
  logoUrl?: string;
  onSave: (dataUrl: string) => void;
}

export const StampGenerator: React.FC<StampGeneratorProps> = ({
  companyName,
  siret,
  logoUrl,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stampColor, setStampColor] = useState("#1e40af"); // Bleu de France par défaut

  const generateStamp = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    // Fond transparent
    ctx.clearRect(0, 0, size, size);

    // Dessiner le cercle extérieur (style tampon)
    ctx.strokeStyle = stampColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
    ctx.stroke();

    // Deuxième cercle intérieur
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 15, 0, Math.PI * 2);
    ctx.stroke();

    // Effet de bord "usé" ou "tampon" (optionnel, on garde propre pour la version pro)
    
    // Texte "PAYÉ" au centre (légèrement incliné)
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(-Math.PI / 12);
    ctx.font = "bold 48px sans-serif";
    ctx.fillStyle = stampColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PAYÉ", 0, 0);
    
    // Cadre autour de PAYÉ
    ctx.strokeStyle = stampColor;
    ctx.lineWidth = 3;
    const textWidth = ctx.measureText("PAYÉ").width;
    ctx.strokeRect(-textWidth/2 - 10, -30, textWidth + 20, 60);
    ctx.restore();

    // Texte circulaire : Raison Sociale
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = stampColor;
    ctx.textAlign = "center";
    
    const radius = size / 2 - 35;
    const nameToDisplay = companyName.toUpperCase() || "VOTRE ENTREPRISE";
    
    // On répartit les caractères sur le haut du cercle
    const anglePerChar = Math.PI / 1.2 / nameToDisplay.length;
    const startAngle = -Math.PI / 2 - (anglePerChar * nameToDisplay.length) / 2;

    for (let i = 0; i < nameToDisplay.length; i++) {
        const char = nameToDisplay[i];
        const angle = startAngle + i * anglePerChar + anglePerChar / 2;
        ctx.save();
        ctx.rotate(angle);
        ctx.fillText(char, 0, -radius);
        ctx.restore();
    }
    
    // SIRET en bas
    const siretToDisplay = `SIRET : ${siret || "12345678900000"}`;
    const anglePerCharSiret = Math.PI / 1.5 / siretToDisplay.length;
    const startAngleSiret = Math.PI / 2 - (anglePerCharSiret * siretToDisplay.length) / 2;

    for (let i = 0; i < siretToDisplay.length; i++) {
        const char = siretToDisplay[i];
        const angle = startAngleSiret + i * anglePerCharSiret + anglePerCharSiret / 2;
        ctx.save();
        ctx.rotate(angle);
        ctx.fillText(char, 0, radius);
        ctx.restore();
    }
    
    ctx.restore();

    // Si un logo est présent, on pourrait l'intégrer, mais pour un tampon "Payé" 
    // classique, le nom + siret suffisent souvent. On reste sur cette base propre.

  }, [companyName, siret, stampColor]);

  useEffect(() => {
    generateStamp();
  }, [generateStamp]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL("image/png"));
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-brand-50/50 dark:bg-brand-900/20 rounded-2xl border border-brand-100 dark:border-brand-800">
      <div className="flex items-center gap-2 mb-2 self-start text-brand-700 dark:text-brand-300">
        <ShieldCheck size={20} className="text-brand-500" />
        <span className="font-semibold text-sm">Générateur de Tampon Pro</span>
      </div>
      
      <div className="relative group">
        <canvas 
          ref={canvasRef} 
          className="bg-white rounded-full shadow-inner border border-brand-200 dark:border-brand-700 w-48 h-48 md:w-64 md:h-64 cursor-crosshair"
          title="Aperçu du tampon professionnel"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 pointer-events-none rounded-full">
            <RefreshCcw size={32} className="text-white drop-shadow-md animate-spin-slow" />
        </div>
      </div>

      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                Couleur d'encre
            </label>
            <div className="flex gap-2">
                {["#1e40af", "#b91c1c", "#15803d", "#111827"].map(color => (
                    <button
                        key={color}
                        onClick={() => setStampColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${stampColor === color ? 'border-brand-400 scale-125' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Choisir la couleur ${color}`}
                    />
                ))}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <button
                onClick={generateStamp}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-brand-800 text-brand-700 dark:text-brand-200 rounded-xl border border-brand-200 dark:border-brand-700 hover:bg-brand-50 transition-colors text-sm font-medium"
            >
                <RefreshCcw size={16} />
                Actualiser
            </button>
            <button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium shadow-sm"
            >
                <Check size={16} />
                Utiliser ce tampon
            </button>
        </div>
        
        <p className="text-[10px] text-brand-500 dark:text-brand-500 text-center italic">
            Ce tampon sera automatiquement apposé sur vos factures marquées "Payées".
        </p>
      </div>
    </div>
  );
};
