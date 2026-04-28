/**
 * Tests — src/hooks/useEmailTimer.ts
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEmailTimer } from "../../hooks/useEmailTimer";

describe("useEmailTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initialise avec le temps restant correct", () => {
    const { result } = renderHook(() => useEmailTimer({ linkExpirySeconds: 60 }));
    expect(result.current.timeLeftSeconds).toBe(60);
    expect(result.current.isExpired).toBe(false);
  });

  it("formate le temps restant en MM:SS", () => {
    const { result } = renderHook(() => useEmailTimer({ linkExpirySeconds: 125 }));
    expect(result.current.formattedTimeLeft).toBe("2:05");
  });

  it("décrémente timeLeftSeconds chaque seconde", () => {
    const { result } = renderHook(() => useEmailTimer({ linkExpirySeconds: 10 }));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.timeLeftSeconds).toBe(7);
  });

  it("expire quand timeLeftSeconds atteint 0", () => {
    const { result } = renderHook(() => useEmailTimer({ linkExpirySeconds: 3 }));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.isExpired).toBe(true);
    expect(result.current.timeLeftSeconds).toBe(0);
  });

  it("appelle onLinkExpiry quand le lien expire", () => {
    const onLinkExpiry = vi.fn();
    renderHook(() => useEmailTimer({ linkExpirySeconds: 2, onLinkExpiry }));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onLinkExpiry).toHaveBeenCalledOnce();
  });

  it("resetTimer remet le timer à la valeur initiale", () => {
    const { result } = renderHook(() => useEmailTimer({ linkExpirySeconds: 60 }));
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.timeLeftSeconds).toBe(50);

    act(() => {
      result.current.resetTimer();
    });
    expect(result.current.timeLeftSeconds).toBe(60);
    expect(result.current.isExpired).toBe(false);
  });

  it("canResend est true initialement (cooldown = 0, pas de max envois)", () => {
    const { result } = renderHook(() =>
      useEmailTimer({ resendCooldownInitialSeconds: 30, maxResends: 3 }),
    );
    expect(result.current.canResend).toBe(true);
    expect(result.current.resendCooldownSeconds).toBe(0);
  });

  it("startResendCooldown démarre le cooldown et incrémente resendCount", () => {
    const { result } = renderHook(() =>
      useEmailTimer({ resendCooldownInitialSeconds: 60 }),
    );
    act(() => {
      result.current.startResendCooldown();
    });
    expect(result.current.resendCooldownSeconds).toBe(60);
    expect(result.current.resendCount).toBe(1);
    expect(result.current.canResend).toBe(false);
  });

  it("le cooldown de resend décrémente chaque seconde", () => {
    const { result } = renderHook(() =>
      useEmailTimer({ resendCooldownInitialSeconds: 10 }),
    );
    act(() => {
      result.current.startResendCooldown();
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.resendCooldownSeconds).toBe(5);
  });

  it("canResend redevient true quand le cooldown se termine", () => {
    const { result } = renderHook(() =>
      useEmailTimer({ resendCooldownInitialSeconds: 3, maxResends: 5 }),
    );
    act(() => {
      result.current.startResendCooldown();
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.canResend).toBe(true);
  });

  it("appelle onResendCooldownEnd quand le cooldown se termine", () => {
    const onResendCooldownEnd = vi.fn();
    const { result } = renderHook(() =>
      useEmailTimer({
        resendCooldownInitialSeconds: 2,
        onResendCooldownEnd,
      }),
    );
    act(() => {
      result.current.startResendCooldown();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onResendCooldownEnd).toHaveBeenCalled();
  });

  it("isMaxResendsReached devient true après maxResends envois", () => {
    const { result } = renderHook(() =>
      useEmailTimer({ maxResends: 2, resendCooldownInitialSeconds: 1 }),
    );
    act(() => result.current.startResendCooldown());
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current.startResendCooldown());
    act(() => vi.advanceTimersByTime(1000));

    expect(result.current.isMaxResendsReached).toBe(true);
    expect(result.current.canResend).toBe(false);
  });
});
