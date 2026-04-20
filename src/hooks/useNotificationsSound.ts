import { useCallback, useEffect, useRef } from "react";
import useUIStore from "../store/useUIStore";

export type SoundType =
  | "success"
  | "notification"
  | "error"
  | "click"
  | "syncCompleted";

// Compatibilité Safari (webkitAudioContext)
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

/**
 * Sons synthétisés via Web Audio API.
 * Chaque entrée est une séquence de tonalités :
 *   freq  : fréquence en Hz
 *   dur   : durée de la note en secondes
 *   gain  : volume de crête (0-1), gardé intentionnellement bas
 */
const SOUND_PRESETS: Record<
  SoundType,
  Array<{ freq: number; dur: number; gain: number }>
> = {
  // Accord ascendant Do5 → Sol5 (feedback positif)
  success: [
    { freq: 523, dur: 0.08, gain: 0.15 },
    { freq: 784, dur: 0.1, gain: 0.15 },
  ],
  // La4 neutre (cloche douce)
  notification: [{ freq: 440, dur: 0.12, gain: 0.12 }],
  // Mi4 → La3 descendant (signal d'alerte feutré)
  error: [
    { freq: 330, dur: 0.08, gain: 0.15 },
    { freq: 220, dur: 0.14, gain: 0.15 },
  ],
  // Clic court à 600 Hz (feedback tactile)
  click: [{ freq: 600, dur: 0.03, gain: 0.1 }],
  // Arpège Do5 → Mi5 → Sol5 (synchronisation cloud terminée)
  syncCompleted: [
    { freq: 523, dur: 0.07, gain: 0.1 },
    { freq: 659, dur: 0.07, gain: 0.1 },
    { freq: 784, dur: 0.09, gain: 0.1 },
  ],
};

/**
 * Hook utilitaire pour jouer des sons de notification discrets.
 *
 * Avantages par rapport à HTMLAudioElement + URLs externes :
 * - ✅ Aucune ressource externe → compatible offline (PWA)
 * - ✅ Pas de dépendance réseau ni de risque GDPR (ping tiers)
 * - ✅ Gestion de l'Autoplay Policy : AudioContext créé et repris
 *      automatiquement après une interaction utilisateur
 * - ✅ Compatible cross-browser via webkitAudioContext (Safari/iOS)
 * - ✅ Graceful degradation si Web Audio API indisponible
 */
export const useNotificationsSound = () => {
  const { soundEnabled } = useUIStore();
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Fermer le contexte lors du démontage pour libérer les ressources audio
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  /**
   * Renvoie le AudioContext existant ou en crée un nouveau.
   * Recrée le contexte s'il a été fermé (ex: après un unmount).
   */
  const getAudioContext = useCallback((): AudioContext | null => {
    try {
      const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtx();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  /**
   * Joue un son synthétisé.
   * Retourne une Promise pour pouvoir être attendu si nécessaire.
   *
   * AUTOPLAY POLICY : playSound est toujours déclenché depuis une interaction
   * utilisateur (clic bouton), ce qui débloque le contexte audio. En cas de
   * contexte suspendu (tab inactive, navigateur strict), un resume() est tenté.
   */
  const playSound = useCallback(
    async (type: SoundType): Promise<void> => {
      if (!soundEnabled) return;

      const ctx = getAudioContext();
      if (!ctx) return;

      try {
        // Résoudre la politique d'autoplay : reprendre si suspendu
        if (ctx.state === "suspended") {
          await ctx.resume();
        }

        const tones = SOUND_PRESETS[type];
        // Léger délai initial pour éviter le clic de démarrage
        let offset = ctx.currentTime + 0.01;

        for (const tone of tones) {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.type = "sine";
          osc.frequency.setValueAtTime(tone.freq, offset);

          // Enveloppe ADSR simplifiée : attaque 12 ms + release progressif
          gainNode.gain.setValueAtTime(0, offset);
          gainNode.gain.linearRampToValueAtTime(tone.gain, offset + 0.012);
          gainNode.gain.linearRampToValueAtTime(0, offset + tone.dur);

          osc.start(offset);
          osc.stop(offset + tone.dur + 0.005);

          // Délai de 20 ms entre les notes pour les arpèges
          offset += tone.dur + 0.02;
        }
      } catch {
        // Silencieux : Web Audio API bloquée ou indisponible (navigateur ancien)
      }
    },
    [soundEnabled, getAudioContext],
  );

  return { playSound };
};

export default useNotificationsSound;
