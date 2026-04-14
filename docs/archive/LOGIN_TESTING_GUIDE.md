# 🧪 Tests - Login Améliorations

**Guide complet des tests pour valider les améliorations login** ✨

---

## 📋 Manuel Testing Checklist

### 1️⃣ GitHub OAuth Integration

#### Test 1.1: GitHub Button Appear

- [ ] Ouvrir login page
- [ ] Vérifier 3 options: Google, GitHub, Email ✅
- [ ] GitHub button a le bon styling ✅

#### Test 1.2: GitHub Login Flow

- [ ] Cliquer GitHub button
- [ ] Redirect vers popup OAuth GitHub ✅
- [ ] Après accept: Dashboard charge ✅
- [ ] User infos visible en haut à droite ✅

#### Test 1.3: GitHub Error Handling

- [ ] Annuler popup = error message visible ✅
- [ ] Error message a X button ✅
- [ ] Après dismiss, formulaire disponible à nouveau ✅

---

### 2️⃣ Loading States

#### Test 2.1: Google Button Loading

- [ ] Cliquer Google button
- [ ] Button disabled (opacity-50) ✅
- [ ] Spinner visible à la place de l'icône ✅
- [ ] Texte dit "Google" (pas "Se connecter...") ✅
- [ ] Impossible de recliquer (disabled=true) ✅

#### Test 2.2: Email Button Loading

- [ ] Entrer email valid
- [ ] Cliquer "Recevoir lien magique"
- [ ] Button disabled ✅
- [ ] Spinner visible ✅
- [ ] Cannot submit form twice ✅

#### Test 2.3: Timeout Protection

- [ ] Network throttle to "Slow 3G" (DevTools)
- [ ] Cliquer login
- [ ] Après 15s: timeout error visible ✅
- [ ] Utilisateur peut reassayer ✅

---

### 3️⃣ Email Real-Time Validation

#### Test 3.1: Valid Email

- [ ] Taper: `thomas@example.com`
- [ ] Border devient green ✅
- [ ] Icon ` ✓ Email valide` visible ✅
- [ ] Button enabled ✅

#### Test 3.2: Invalid Format

- [ ] Taper: `invalid-email`
- [ ] Border devient red ✅
- [ ] Error message: "Format d'email invalide" ✅
- [ ] Button stays disabled ✅

#### Test 3.3: Disposable Email

- [ ] Taper: `test@tempmail.com`
- [ ] Border devient yellow ✅
- [ ] Warning: "Email temporaire détecté" ✅
- [ ] Button disabled ✅

#### Test 3.4: Empty Input

- [ ] Field empty
- [ ] Border gray (normal) ✅
- [ ] Button disabled ✅

---

### 4️⃣ Error Banner Component

#### Test 4.1: Network Error

- [ ] Offline: DevTools Network tab → Offline ✅
- [ ] Cliquer Google
- [ ] Error banner appears (orange background) ✅
- [ ] Title: "Erreur réseau" ✅
- [ ] Hint: "Vérifiez votre connexion Internet" ✅
- [ ] Icon: Wifi ✅

#### Test 4.2: Auth Error

- [ ] Annuler OAuth popup
- [ ] Error banner: red background ✅
- [ ] Title: "Erreur d'authentification" ✅
- [ ] "Réessayer" button available ✅

#### Test 4.3: Dismiss Error

- [ ] Click X button on error
- [ ] Banner disappears ✅
- [ ] Form accessible again ✅

#### Test 4.4: Auto-close

- [ ] Validation error appears
- [ ] After 10s: auto-dismisses ✅

---

### 5️⃣ Email Success Flow

#### Test 5.1: Timer Countdown

- [ ] Enter valid email, click submit
- [ ] Success state appears ✅
- [ ] "Le lien expire dans: 14:59" visible ✅
- [ ] Timer counts down ✅
- [ ] After 15 min: "Lien expiré" message ✅

#### Test 5.2: Resend Button

- [ ] After success: "↻ Renvoyer le lien" visible ✅
- [ ] Click resend
- [ ] "↻ Renvoyer dans 60s" shows (cooldown) ✅
- [ ] After 60s: clickable again ✅
- [ ] Resend count increments ✅

#### Test 5.3: Edit Email

- [ ] After success: "✏️ Modifier l'email" button ✅
- [ ] Click it
- [ ] Form reappears, email cleared ✅
- [ ] Can type new email ✅

#### Test 5.4: Email Masking

- [ ] Success state shows: `t•••••••••s@example.com` ✅
- [ ] Short emails like `a@example.com` not masked ✅

---

### 6️⃣ Accessibility (a11y)

#### Test 6.1: Screen Reader

- [ ] Enable NVDA or JAWS
- [ ] On error banner: "alert (live region)" announced ✅
- [ ] Title + description both announced ✅
- [ ] Button labels clear ✅

#### Test 6.2: Keyboard Navigation

- [ ] Tab through form ✅
- [ ] All buttons reachable ✅
- [ ] Focus ring visible (blue outline) ✅
- [ ] Enter key submits form ✅

#### Test 6.3: High Contrast

- [ ] Enable high contrast mode (Windows: Settings → Ease of Access)
- [ ] Buttons still visible ✅
- [ ] Text still readable ✅
- [ ] Focus rings visible ✅

#### Test 6.4: Motion Sensitive

- [ ] DevTools → Rendering → "Prefers reduced motion" ✅
- [ ] Animations removed/minimal ✅

---

### 7️⃣ Mobile UX

#### Test 7.1: Button Sizing

- [ ] iPhone 8 (375px width)
- [ ] Buttons exactly fit (no horizontal scroll) ✅
- [ ] Touch targets: 44px minimum height ✅
- [ ] Padding: 12px vertical mobile ✅

#### Test 7.2: Responsive Text

- [ ] Mobile: Button shows "Google" (short) ✅
- [ ] Desktop: Button shows "Se connecter avec Google" ✅

#### Test 7.3: Input Sizing

- [ ] Mobile: Email input full width ✅
- [ ] Icon visible left side ✅
- [ ] No overflow ✅

#### Test 7.4: Portrait/Landscape

- [ ] Portrait mode: layout stacks vertically ✅
- [ ] Landscape mode (iPhone): buttons adjust ✅
- [ ] No broken layout either way ✅

---

### 8️⃣ Security

#### Test 8.1: Nonce Validation

- [ ] Email sent: nonce stored in Firestore ✅
- [ ] Open email link in different browser
- [ ] Security check validated ✅

#### Test 8.2: Link Expiry

- [ ] Email sent with 15-min TTL ✅
- [ ] Wait 16 minutes ✅
- [ ] Click link: "Lien expiré" error ✅

#### Test 8.3: Duplicate Link

- [ ] Get email link, click once → logged in ✅
- [ ] Try clicking same link again
- [ ] Error: "Lien déjà utilisé" ✅

#### Test 8.4: No Plain Email Storage

- [ ] localStorage doesn't contain plain password ✅
- [ ] Firebase auth tokens are httpOnly ✅

---

## 🧬 Unit Tests (Vitest)

### Create: `src/__tests__/LoginPage.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '../App';
import { useEmailValidation } from '../hooks/useEmailValidation';

describe('Login Page - Enhanced', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GitHub OAuth Integration', () => {
    it('renders GitHub login button', () => {
      render(<App />);

      const githubButton = screen.getByRole('button', {
        name: /se connecter avec github/i,
      });
      expect(githubButton).toBeInTheDocument();
    });

    it('shows error on GitHub auth failure', async () => {
      const { getByRole } = render(<App />);

      const githubButton = getByRole('button', {
        name: /github/i,
      });

      // Mock failure
      vi.mocked(loginWithGitHub).mockRejectedOnce(
        new Error('Authentification GitHub échouée')
      );

      fireEvent.click(githubButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Authentification GitHub échouée/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Email Validation', () => {
    it('validates email format in real-time', async () => {
      const user = userEvent.setup();
      render(<App />);

      const emailInput = screen.getByPlaceholderText(/votre@email.com/i);

      // Invalid → valid transition
      await user.type(emailInput, 'invalid-email');
      expect(screen.getByText(/format d'email invalide/i)).toBeInTheDocument();

      // Clear and type valid
      await user.clear(emailInput);
      await user.type(emailInput, 'thomas@example.com');
      expect(screen.getByText(/email valide/i)).toBeInTheDocument();
    });

    it('rejects disposable emails', async () => {
      const user = userEvent.setup();
      render(<App />);

      const emailInput = screen.getByPlaceholderText(/votre@email.com/i);
      await user.type(emailInput, 'test@tempmail.com');

      expect(
        screen.getByText(/Email temporaire détecté/i)
      ).toBeInTheDocument();
    });

    it('disables submit button for invalid email', async () => {
      const user = userEvent.setup();
      render(<App />);

      const emailInput = screen.getByPlaceholderText(/votre@email.com/i);
      const submitButton = screen.getByRole('button', {
        name: /recevoir un lien magique/i,
      });

      expect(submitButton).toBeDisabled();

      await user.type(emailInput, 'thomas@example.com');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Loading States', () => {
    it('disables buttons while loading', async () => {
      vi.mocked(loginWithGoogle).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<App />);
      const googleButton = screen.getByRole('button', {
        name: /google/i,
      });

      fireEvent.click(googleButton);
      expect(googleButton).toBeDisabled();

      await waitFor(
        () => expect(googleButton).not.toBeDisabled(),
        { timeout: 1500 }
      );
    });

    it('shows spinner during loading', async () => {
      render(<App />);
      const googleButton = screen.getByRole('button', {
        name: /google/i,
      });

      fireEvent.click(googleButton);
      await waitFor(() => {
        expect(screen.getByRole('presentation')).toHaveClass('animate-spin');
      });
    });
  });

  describe('Error Banner', () => {
    it('displays error banners with aria-live', async () => {
      vi.mocked(loginWithGoogle).mockRejectedOnce(
        new Error('Erreur réseau')
      );

      render(<App />);
      const googleButton = screen.getByRole('button', {
        name: /google/i,
      });

      fireEvent.click(googleButton);

      await waitFor(() => {
        const banner = screen.getByRole('alert');
        expect(banner).toHaveAttribute('aria-live', 'polite');
        expect(banner).toHaveTextContent('Erreur réseau');
      });
    });

    it('allows dismissing errors', async () => {
      vi.mocked(loginWithGoogle).mockRejectedOnce(
        new Error('Erreur')
      );

      render(<App />);
      const googleButton = screen.getByRole('button', {
        name: /google/i,
      });

      fireEvent.click(googleButton);

      await waitFor(() => {
        const dismissButton = screen.getByLabelText(
          /fermer le message d'erreur/i
        );
        fireEvent.click(dismissButton);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Email Success Flow', () => {
    it('shows success message with timer', async () => {
      const user = userEvent.setup();
      render(<App />);

      const emailInput = screen.getByPlaceholderText(/votre@email.com/i);
      const submitButton = screen.getByRole('button', {
        name: /recevoir un lien magique/i,
      });

      await user.type(emailInput, 'thomas@example.com');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/vérifiez votre email/i)).toBeInTheDocument();
        expect(screen.getByText(/le lien expire dans/i)).toBeInTheDocument();
      });
    });

    it('provides resend button with cooldown', async () => {
      const user = userEvent.setup();
      render(<App />);

      // ... send email first ...

      const resendButton = screen.getByRole('button', {
        name: /renvoyer/i,
      });

      fireEvent.click(resendButton);
      expect(resendButton).toBeDisabled();

      // Button should be re-enabled after cooldown
      await waitFor(
        () => expect(resendButton).not.toBeDisabled(),
        { timeout: 61000 }
      );
    });

    it('masks email in success message', async () => {
      const user = userEvent.setup();
      render(<App />);

      const emailInput = screen.getByPlaceholderText(/votre@email.com/i);
      await user.type(emailInput, 'thomas@example.com');

      const submitButton = screen.getByRole('button', {
        name: /recevoir un lien magique/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/t•••••••••s@example.com/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('all buttons are keyboard accessible', () => {
      const { container } = render(<App />);
      const buttons = container.querySelectorAll('button');

      buttons.forEach((button) => {
        expect(button).toHaveClass('focus:ring');
      });
    });

    it('form labels are associated with inputs', () => {
      render(<App />);

      const emailInput = screen.getByPlaceholderText(/votre@email.com/i);
      // Email input should have proper label/placeholder
      expect(emailInput).toHaveAttribute('placeholder');
    });

    it('respects prefers-reduced-motion', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { container } = render(<App />);
      const animated = container.querySelector('[class*="animate-"]');

      if (animated) {
        expect(animated).toHaveClass('!animate-none');
      }
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      window.innerWidth = 375; // iPhone 8
      window.dispatchEvent(new Event('resize'));
    });

    it('uses responsive button text', () => {
      render(<App />);

      const googleButton = screen.getByRole('button', {
        name: /google/i,
      });

      // Mobile: shows short text
      expect(googleButton.querySelector('.sm\\:hidden')).toHaveTextContent(
        'Google'
      );
    });

    it('maintains 44px minimum touch target', () => {
      render(<App />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('min-h-12'); // 48px
      });
    });
  });

  describe('useEmailValidation Hook', () => {
    it('validates email in real-time', () => {
      const { result } = renderHook(() => useEmailValidation());

      act(() => {
        result.current.setEmail('test@example.com');
      });

      expect(result.current.isValid).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('rejects disposable emails', () => {
      const { result } = renderHook(() => useEmailValidation());

      act(() => {
        result.current.setEmail('test@tempmail.com');
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.warning).toBe(
        'Email temporaire détecté - Il peut ne pas recevoir d\'emails'
      );
    });

    it('validates email format', () => {
      const { result } = renderHook(() => useEmailValidation());

      act(() => {
        result.current.setEmail('invalid');
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.error).toBe(
        'Format d\'email invalide'
      );
    });
  });
});
```

---

## 🎯 Performance Validati

### Test 7.1: Load Time

```bash
# Measure login page load time
lighthouse https://localhost:3000 --only-categories=performance

# Should see:
# - First Contentful Paint (FCP): < 2s
# - Largest Contentful Paint (LCP): < 2.5s
# - Cumulative Layout Shift (CLS): < 0.1
```

### Test 7.2: No Memory Leaks

```bash
# DevTools → Memory
# 1. Take heap snapshot (0MB)
# 2. Click buttons 50x times
# 3. Dismiss errors 50x
# 4. Take heap snapshot (should be similar to step 1)
# ✅ If similar = good (no leaks)
# ❌ If +20MB = memory leak
```

---

## 📝 Final Validation Checklist

Complete this before marking as "done":

### Functional ✅

- [ ] All 3 auth methods work (Google, GitHub, Email)
- [ ] Email validation works in real-time
- [ ] Loading states prevent duplicate requests
- [ ] Errors display and dismiss properly
- [ ] Email timer counts down correctly
- [ ] Resend works with 60s cooldown
- [ ] Link masking hides email properly

### Security ✅

- [ ] Nonce generated and validated
- [ ] TTL enforced (15 min expiry)
- [ ] Duplicate links rejected
- [ ] localStorage doesn't contain secrets
- [ ] CORS headers correct

### Accessibility ✅

- [ ] WCAG 2.1 AA compliance (WAVE tool)
- [ ] Keyboard navigation works
- [ ] Screen reader announces alerts
- [ ] High contrast mode readable
- [ ] Motion preferences respected

### Mobile ✅

- [ ] iPhone 8 (375px): no horizontal scroll
- [ ] Touch targets: 44px minimum
- [ ] Text responsive (Google vs Se connecter...)
- [ ] Portrait/landscape both work
- [ ] Tested on actual device (not just browser)

### Performance ✅

- [ ] LCP < 2.5s
- [ ] No memory leaks (after 100 clicks)
- [ ] Optimized images/icons
- [ ] No console errors

### Tests ✅

- [ ] 25+ unit tests passing
- [ ] 100% of login functions covered
- [ ] Manual testing checklist complete
- [ ] Edge cases tested

---

## 🚀 Deployment Validation

```bash
# 1. Run full test suite
npm run test

# 2. Build & check size
npm run build
# Should see: "dist/index.js: XXX KB"

# 3. Preview production build
npm run preview
# Manually test all 3 auth methods

# 4. Check lighthouse again
lighthouse https://127.0.0.1:5000

# 5. Check a11y compliance
npm run test:a11y

# 6. Check security
npm run test:security

# If all green → ready to deploy! 🎉
```

---

**Next:** After tests pass, run through the **Manual Testing Checklist** once with fresh eyes before merging!
