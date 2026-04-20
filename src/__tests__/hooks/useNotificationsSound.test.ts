/**
 * Tests pour useNotificationsSound.ts
 *
 * Couverture :
 * - Respect de la préférence soundEnabled
 * - Utilisation de Web Audio API (AudioContext synthétisé)
 * - Gestion de l'Autoplay Policy (AudioContext suspendu → resume)
 * - Compatibilité cross-browser (webkitAudioContext fallback)
 * - Graceful degradation si AudioContext absent
 * - Tous les types de sons (y compris syncCompleted)
 * - Nettoyage du contexte à l'unmount
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useNotificationsSound, {
  type SoundType,
} from "../../hooks/useNotificationsSound";

// ─── Variables de mock (réinitialisées dans beforeEach) ───────────────────────

let mockSoundEnabled = true;
let mockAudioCtxState: AudioContextState = "running";

// Références aux fonctions mockées accessibles dans les assertions
let mockResume: ReturnType<typeof vi.fn>;
let mockClose: ReturnType<typeof vi.fn>;
let mockOscillatorConnect: ReturnType<typeof vi.fn>;
let mockOscillatorStart: ReturnType<typeof vi.fn>;
let mockOscillatorStop: ReturnType<typeof vi.fn>;
let mockGainConnect: ReturnType<typeof vi.fn>;
let mockCreateOscillator: ReturnType<typeof vi.fn>;
let mockCreateGain: ReturnType<typeof vi.fn>;
let AudioContextMock: ReturnType<typeof vi.fn>;

// ─── Mock Zustand useUIStore ──────────────────────────────────────────────────

vi.mock("../../store/useUIStore", () => ({
  default: () => ({ soundEnabled: mockSoundEnabled }),
}));

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

/**
 * Stratégie : créer des mocks FRAIS à chaque test pour éviter la contamination
 * entre tests (Vitest 4.x efface les implementations avec vi.clearAllMocks).
 */
beforeEach(() => {
  mockSoundEnabled = true;
  mockAudioCtxState = "running";

  // Mocks frais par test
  mockResume = vi.fn().mockResolvedValue(undefined);
  mockClose = vi.fn().mockResolvedValue(undefined);
  mockOscillatorConnect = vi.fn();
  mockOscillatorStart = vi.fn();
  mockOscillatorStop = vi.fn();
  mockGainConnect = vi.fn();

  mockCreateOscillator = vi.fn().mockReturnValue({
    connect: mockOscillatorConnect,
    type: "sine" as OscillatorType,
    frequency: { setValueAtTime: vi.fn() },
    start: mockOscillatorStart,
    stop: mockOscillatorStop,
  });

  mockCreateGain = vi.fn().mockReturnValue({
    connect: mockGainConnect,
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
  });

  const mockAudioContext = {
    get state() {
      return mockAudioCtxState;
    },
    currentTime: 0,
    resume: mockResume,
    close: mockClose,
    createOscillator: mockCreateOscillator,
    createGain: mockCreateGain,
    destination: { _type: "AudioDestination" },
  };

  // Utiliser une REGULAR FUNCTION (pas arrow function) dans mockImplementation :
  // les arrow functions ne peuvent pas être des constructeurs en JS.
  // Vitest intercepte `new vi.fn()` et appelle l'implémentation comme constructeur ;
  // seule une regular function qui retourne un objet garantit que `new fn()` retourne cet objet.

  AudioContextMock = vi.fn().mockImplementation(function AudioContextCtor() {
    return mockAudioContext;
  });

  vi.stubGlobal("AudioContext", AudioContextMock);
  vi.stubGlobal("webkitAudioContext", undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useNotificationsSound", () => {
  describe("soundEnabled = false", () => {
    it("ne crée pas de AudioContext et ne joue aucun son", async () => {
      mockSoundEnabled = false;
      const { result } = renderHook(() => useNotificationsSound());

      await act(async () => {
        await result.current.playSound("success");
      });

      expect(AudioContextMock).not.toHaveBeenCalled();
      expect(mockOscillatorStart).not.toHaveBeenCalled();
    });
  });

  describe("soundEnabled = true — comportement nominal", () => {
    it("crée un AudioContext et joue un son success (2 tonalités)", async () => {
      const { result } = renderHook(() => useNotificationsSound());

      await act(async () => {
        await result.current.playSound("success");
      });

      expect(AudioContextMock).toHaveBeenCalledTimes(1);
      // success = 2 tonalités → 2 oscillateurs
      expect(mockCreateOscillator).toHaveBeenCalledTimes(2);
      expect(mockOscillatorStart).toHaveBeenCalledTimes(2);
    });

    it("joue un son notification (1 tonalité)", async () => {
      const { result } = renderHook(() => useNotificationsSound());

      await act(async () => {
        await result.current.playSound("notification");
      });

      expect(mockCreateOscillator).toHaveBeenCalledTimes(1);
    });

    it("joue un son error (2 tonalités)", async () => {
      const { result } = renderHook(() => useNotificationsSound());

      await act(async () => {
        await result.current.playSound("error");
      });

      expect(mockCreateOscillator).toHaveBeenCalledTimes(2);
    });

    it("joue un son click (1 tonalité courte)", async () => {
      const { result } = renderHook(() => useNotificationsSound());

      await act(async () => {
        await result.current.playSound("click");
      });

      expect(mockCreateOscillator).toHaveBeenCalledTimes(1);
    });

    it("joue un son syncCompleted (3 tonalités — arpège ascendant)", async () => {
      const { result } = renderHook(() => useNotificationsSound());

      await act(async () => {
        await result.current.playSound("syncCompleted");
      });

      // syncCompleted = 3 notes : Do5 → Mi5 → Sol5
      expect(mockCreateOscillator).toHaveBeenCalledTimes(3);
      expect(mockOscillatorStart).toHaveBeenCalledTimes(3);
    });

    it("connecte chaque oscillateur à un GainNode puis à destination", async () => {
      const { result } = renderHook(() => useNotificationsSound());

      await act(async () => {
        await result.current.playSound("click");
      });

      expect(mockOscillatorConnect).toHaveBeenCalledTimes(1);
      // gain connecté à ctx.destination
      expect(mockGainConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe("Autoplay Policy — AudioContext suspendu", () => {
    it("appelle ctx.resume() si le contexte est suspendu avant de jouer", async () => {
      mockAudioCtxState = "suspended";
      const { result } = renderHook(() => useNotificationsSound());

      await act(async () => {
        await result.current.playSound("notification");
      });

      expect(mockResume).toHaveBeenCalledTimes(1);
    });

    it("ne rappelle pas resume() si le contexte est déjà running", async () => {
      mockAudioCtxState = "running";
      const { result } = renderHook(() => useNotificationsSound());

      await act(async () => {
        await result.current.playSound("success");
      });

      expect(mockResume).not.toHaveBeenCalled();
    });
  });

  describe("Compatibilité cross-browser", () => {
    it("utilise webkitAudioContext si AudioContext est absent (Safari)", async () => {
      // vi.stubGlobal gère la restauration automatique via afterEach → vi.unstubAllGlobals()
      vi.stubGlobal("AudioContext", undefined);
      const mockWebkitCtx = {
        state: "running" as AudioContextState,
        currentTime: 0,
        resume: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
        createOscillator: vi.fn().mockImplementation(() => ({
          connect: vi.fn(),
          type: "sine" as OscillatorType,
          frequency: { setValueAtTime: vi.fn() },
          start: vi.fn(),
          stop: vi.fn(),
        })),
        createGain: vi.fn().mockImplementation(() => ({
          connect: vi.fn(),
          gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        })),
        destination: {},
      };

      const WebkitMock = vi
        .fn()
        .mockImplementation(function WebkitAudioContextCtor() {
          return mockWebkitCtx;
        });
      vi.stubGlobal("webkitAudioContext", WebkitMock);

      const { result } = renderHook(() => useNotificationsSound());

      await act(async () => {
        await result.current.playSound("click");
      });

      expect(WebkitMock).toHaveBeenCalledTimes(1);
    });

    it("ne lève pas d'exception si AudioContext et webkitAudioContext sont absents", async () => {
      vi.stubGlobal("AudioContext", undefined);
      vi.stubGlobal("webkitAudioContext", undefined);

      const { result } = renderHook(() => useNotificationsSound());

      await expect(
        act(async () => {
          await result.current.playSound("success");
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("Réutilisation du contexte audio", () => {
    it("réutilise le même AudioContext sur des appels successifs", async () => {
      const { result } = renderHook(() => useNotificationsSound());

      await act(async () => {
        await result.current.playSound("click");
        await result.current.playSound("notification");
      });

      // Le constructeur ne doit être appelé qu'une seule fois
      expect(AudioContextMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Nettoyage à l'unmount", () => {
    it("ferme le AudioContext lors du démontage du hook", async () => {
      const { result, unmount } = renderHook(() => useNotificationsSound());

      await act(async () => {
        await result.current.playSound("success");
      });

      unmount();

      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it("ne lève pas d'exception si le contexte n'a jamais été créé (unmount sans play)", () => {
      const { unmount } = renderHook(() => useNotificationsSound());
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Tous les types de sons sont définis", () => {
    const allTypes: SoundType[] = [
      "success",
      "notification",
      "error",
      "click",
      "syncCompleted",
    ];

    allTypes.forEach((type) => {
      it(`joue le type "${type}" sans erreur`, async () => {
        const { result } = renderHook(() => useNotificationsSound());

        await expect(
          act(async () => {
            await result.current.playSound(type);
          }),
        ).resolves.not.toThrow();

        expect(mockCreateOscillator).toHaveBeenCalled();
      });
    });
  });
});
