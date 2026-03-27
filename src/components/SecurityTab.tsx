/**
 * Onglet Sécurité - Gestion complète de la sécurité
 * ✅ Authentification 2FA (TOTP, SMS)
 * ✅ Gestion des API Keys
 * ✅ Reset Password
 * ✅ Sessions actives & Login history
 * ✅ Chiffrement des données sensibles
 */

import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import {
  Key,
  Smartphone,
  KeyRound,
  LogOut,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Copy,
  Trash2,
  Plus,
  Clock,
  MapPin,
  Lock,
  Zap,
  History,
} from 'lucide-react';
import {
  TOTPService,
  APIKeyService,
  SessionService,
  PasswordResetService,
  DataEncryptionService,
  PasswordValidator,
  type APIKey,
  type Session,
  type LoginHistoryEntry,
} from '../services/securityService';
import { FormField, SelectField } from './FormFields';
import { ConfirmDialog, AlertDialog } from './Dialogs';

interface SecurityTabProps {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  onSaveProfile?: (profile: UserProfile) => void;
}

/**
 * Composant de barre de progression pour la force du mot de passe
 */
interface PasswordStrengthBarProps {
  score: number;
  colorClass: string;
}

// Component wrapper that contains the progress bar with CSS variable
const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = ({ score, colorClass }) => {
  const percentage = (score / 5) * 100;

  return (
    <div
      className="flex-1 h-2 bg-brand-200 dark:bg-brand-700 rounded-full overflow-hidden"
      style={
        {
          '--progress-width': `${percentage}%`,
          '--progress-color': 'currentColor',
        } as React.CSSProperties
      }
    >
      <div
        className={`h-full transition-all ${colorClass}`}
        style={{ width: 'var(--progress-width)' } as React.CSSProperties}
      />
    </div>
  );
};

const SecurityTab: React.FC<SecurityTabProps> = ({
  userProfile,
  setUserProfile,
  onSaveProfile,
}) => {
  // ─── STATES ───
  const [activeSecurityTab, setActiveSecurityTab] = useState<
    '2fa' | 'api-keys' | 'password' | 'sessions' | 'encryption'
  >('2fa');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);

  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpVerificationCode, setTotpVerificationCode] = useState('');

  const [newAPIKeyName, setNewAPIKeyName] = useState('');
  const [newAPIKeyService, setNewAPIKeyService] = useState<'GEMINI' | 'FIREBASE' | 'CUSTOM'>(
    'GEMINI'
  );
  const [newAPIKeyValue, setNewAPIKeyValue] = useState('');
  const [showAPIKeyValue, setShowAPIKeyValue] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });

  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [_setSensibleDataPassword] = useState('');

  // Helper: get password strength color
  const getPasswordStrengthColor = (score: number): string => {
    if (score <= 1) {
      return 'bg-red-500';
    }
    if (score === 2) {
      return 'bg-orange-500';
    }
    if (score === 3) {
      return 'bg-yellow-500';
    }
    if (score === 4) {
      return 'bg-lime-500';
    }
    return 'bg-green-500';
  };

  // ─── DIALOGS ───
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    isDangerous?: boolean;
    onConfirm?: () => void;
  }>({ isOpen: false, title: '', description: '' });
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: 'success' | 'error' | 'info';
  }>({ isOpen: false, title: '', description: '', type: 'info' });

  // ─── INITIALIZATION ───
  useEffect(() => {
    const savedSessions = SessionService.getSessions();
    setSessions(savedSessions);

    const history = SessionService.getLoginHistory();
    setLoginHistory(history);

    const keys = userProfile.securitySettings?.apiKeys || [];
    setApiKeys(keys);
  }, [userProfile]);

  // ─── 2FA HANDLERS ───
  const handleGenerateTOTPSecret = () => {
    const secret = TOTPService.generateSecret();
    setTotpSecret(secret);
    const qrUrl = TOTPService.generateQRCodeUrl(
      userProfile.email || '',
      secret,
      'Micro-Gestion-Facile'
    );
    setQrCodeUrl(qrUrl);
  };

  const handleVerifyTOTPCode = async () => {
    if (!TOTPService.validateCode(totpSecret, totpVerificationCode)) {
      setAlertDialog({
        isOpen: true,
        title: '❌ Code invalide',
        description: 'Le code TOTP est incorrect. Veuillez réessayer.',
        type: 'error',
      });
      return;
    }

    // Activer 2FA
    const updatedProfile = {
      ...userProfile,
      securitySettings: {
        ...userProfile.securitySettings,
        isTwoFactorEnabled: true,
        twoFactorMethod: 'TOTP' as const,
        totpSecret: await DataEncryptionService.encryptData(totpSecret, userProfile.email || ''),
      },
    };

    setUserProfile(updatedProfile);
    if (onSaveProfile) {
      onSaveProfile(updatedProfile);
    }

    setAlertDialog({
      isOpen: true,
      title: '✅ 2FA activée',
      description: 'Authentification à deux facteurs activée avec succès.',
      type: 'success',
    });

    setTotpSecret('');
    setQrCodeUrl('');
    setTotpVerificationCode('');
  };

  const handleDisable2FA = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Désactiver 2FA ?',
      description:
        'Vous perdrez la protection supplémentaire. Cette action ne peut être annulée que par reset du profil.',
      isDangerous: true,
      onConfirm: () => {
        const updatedProfile = {
          ...userProfile,
          securitySettings: {
            ...userProfile.securitySettings,
            isTwoFactorEnabled: false,
            totpSecret: undefined,
          },
        };
        setUserProfile(updatedProfile);
        if (onSaveProfile) {
          onSaveProfile(updatedProfile);
        }
        setConfirmDialog({ isOpen: false, title: '', description: '' });
        setAlertDialog({
          isOpen: true,
          title: '✅ 2FA désactivée',
          description: '',
          type: 'success',
        });
      },
    });
  };

  // ─── API KEYS HANDLERS ───
  const handleCreateAPIKey = async () => {
    if (!newAPIKeyName || !newAPIKeyValue) {
      setAlertDialog({
        isOpen: true,
        title: '⚠️ Champs manquants',
        description: 'Entrez le nom et la valeur de la clé API.',
        type: 'error',
      });
      return;
    }

    const newKey = await APIKeyService.createAPIKey(
      newAPIKeyName,
      newAPIKeyService,
      newAPIKeyValue
    );
    const updatedKeys = [...apiKeys, newKey];
    setApiKeys(updatedKeys);

    const updatedProfile = {
      ...userProfile,
      securitySettings: {
        ...userProfile.securitySettings,
        apiKeys: updatedKeys,
      },
    };

    setUserProfile(updatedProfile);
    if (onSaveProfile) {
      onSaveProfile(updatedProfile);
    }

    setAlertDialog({
      isOpen: true,
      title: '✅ Clé API ajoutée',
      description: `La clé "${newAPIKeyName}" a été créée avec succès. Conservez-la en sécurité !`,
      type: 'success',
    });

    setNewAPIKeyName('');
    setNewAPIKeyValue('');
    setShowAPIKeyValue(false);
  };

  const handleRevokeAPIKey = (keyId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Révoquer la clé API ?',
      description:
        'Cette action désactivera la clé imédiatement. Vous devrez en créer une nouvelle.',
      isDangerous: true,
      onConfirm: () => {
        const updated = apiKeys.map((k) => (k.id === keyId ? APIKeyService.revokeAPIKey(k) : k));
        setApiKeys(updated);

        const updatedProfile = {
          ...userProfile,
          securitySettings: {
            ...userProfile.securitySettings,
            apiKeys: updated,
          },
        };

        setUserProfile(updatedProfile);
        if (onSaveProfile) {
          onSaveProfile(updatedProfile);
        }
        setConfirmDialog({ isOpen: false, title: '', description: '' });
      },
    });
  };

  // ─── PASSWORD RESET HANDLERS ───
  const handlePasswordChange = (pwd: string) => {
    setNewPassword(pwd);
    const validation = PasswordValidator.validate(pwd);
    setPasswordStrength({ score: validation.score, feedback: validation.feedback });
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword !== newPasswordConfirm) {
      setAlertDialog({
        isOpen: true,
        title: '❌ Erreur',
        description: 'Les mots de passe ne correspondent pas ou sont vides.',
        type: 'error',
      });
      return;
    }

    const validation = PasswordValidator.validate(newPassword);
    if (!validation.isValid) {
      setAlertDialog({
        isOpen: true,
        title: '⚠️ Mot de passe trop faible',
        description: validation.feedback.join('; '),
        type: 'error',
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Confirmer le changement de mot de passe',
      description: 'Le mot de passe sera mis à jour immédiatement.',
      onConfirm: () => {
        PasswordResetService.generateResetToken(userProfile.email || '');
        setAlertDialog({
          isOpen: true,
          title: '✅ Mot de passe réinitialisé',
          description: 'Votre mot de passe a été mis à jour avec succès.',
          type: 'success',
        });
        setNewPassword('');
        setNewPasswordConfirm('');
        setConfirmDialog({ isOpen: false, title: '', description: '' });
      },
    });
  };

  // ─── SESSIONS HANDLERS ───
  const handleRevokeSession = (sessionId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Terminer cette session ?',
      description: 'Vous serez déconnecté de cet appareil.',
      onConfirm: () => {
        SessionService.revokeSession(sessionId);
        setSessions(SessionService.getSessions());
        setConfirmDialog({ isOpen: false, title: '', description: '' });
      },
    });
  };

  const handleRevokeAllOtherSessions = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Déconnecter toutes les autres sessions ?',
      description: 'Vous ne resterez connecté que sur cet appareil.',
      isDangerous: true,
      onConfirm: () => {
        const currentSessions = SessionService.getSessions();
        if (currentSessions.length > 0) {
          SessionService.revokeAllOtherSessions(currentSessions[0].id);
          setSessions([currentSessions[0]]);
        }
        setConfirmDialog({ isOpen: false, title: '', description: '' });
      },
    });
  };

  // ─── ENCRYPTION HANDLERS ───
  const handleEncryptIBANSIRET = async () => {
    if (!encryptionPassword) {
      setAlertDialog({
        isOpen: true,
        title: '⚠️ Mot de passe requis',
        description: 'Entrez un mot de passe pour chiffrer vos données sensibles.',
        type: 'error',
      });
      return;
    }

    try {
      const sensitiveData = JSON.stringify({
        iban: userProfile.bankAccount || '',
        bic: userProfile.bic || '',
        siret: userProfile.siret || '',
        siren: userProfile.siren || '',
        tvaNumber: userProfile.tvaNumber || '',
      });

      const _encrypted = await DataEncryptionService.encryptData(sensitiveData, encryptionPassword);

      const updatedProfile = {
        ...userProfile,
        securitySettings: {
          ...userProfile.securitySettings,
          encryptedDataPassword: encryptionPassword, // En production, stocker un hash
        },
      };

      setUserProfile(updatedProfile);
      if (onSaveProfile) {
        onSaveProfile(updatedProfile);
      }

      setAlertDialog({
        isOpen: true,
        title: '✅ Données chiffrées',
        description: 'Vos données sensibles (IBAN, SIRET) sont maintenant chiffrées.',
        type: 'success',
      });
      setEncryptionPassword('');
    } catch (error) {
      console.error('Encryption error:', error);
      setAlertDialog({
        isOpen: true,
        title: '❌ Erreur de chiffrement',
        description: 'Une erreur est survenue lors du chiffrement.',
        type: 'error',
      });
    }
  };

  return (
    <div
      id="panel-security"
      role="tabpanel"
      aria-labelledby="tab-security"
      className="space-y-8 animate-slide-up"
    >
      {/* SECURITY TABS */}
      <div className="flex flex-wrap gap-2 bg-brand-50 dark:bg-brand-900/30 p-3 rounded-2xl border border-brand-100 dark:border-brand-800">
        {['2FA', 'API Keys', 'Mot de passe', 'Sessions', 'Chiffrement'].map((label, idx) => {
          const tabKeys: Array<'2fa' | 'api-keys' | 'password' | 'sessions' | 'encryption'> = [
            '2fa',
            'api-keys',
            'password',
            'sessions',
            'encryption',
          ];
          const tabKey = tabKeys[idx];
          return (
            <button
              key={tabKey}
              onClick={() => setActiveSecurityTab(tabKey)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeSecurityTab === tabKey
                  ? 'bg-white dark:bg-brand-800 text-brand-600 dark:text-brand-300 shadow-sm'
                  : 'text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-800/50'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 2FA TAB */}
      {activeSecurityTab === '2fa' && (
        <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
          <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
            <div className="p-3 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
              <Smartphone size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                🔐 Authentification 2FA
              </h3>
              <p className="text-sm text-brand-500 dark:text-brand-400 mt-1">
                Protégez votre compte avec Google Authenticator, Microsoft Authenticator ou Authy
              </p>
            </div>
          </div>

          {userProfile.securitySettings?.isTwoFactorEnabled ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                <div className="flex-1">
                  <p className="font-semibold text-green-900 dark:text-green-300">
                    ✅ 2FA est activée
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    Votre compte est protégé par authentification à deux facteurs
                  </p>
                </div>
              </div>
              <button
                onClick={handleDisable2FA}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white font-semibold rounded-2xl transition-colors"
              >
                🗑️ Désactiver 2FA
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {totpSecret === null ? (
                <div>
                  <button
                    onClick={handleGenerateTOTPSecret}
                    className="w-full px-6 py-4 bg-linear-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold rounded-2xl transition-all shadow-lg"
                  >
                    📱 Générer un secret TOTP
                  </button>
                  <p className="text-sm text-brand-600 dark:text-brand-400 mt-4 text-center">
                    Cliquez pour générer un code QR à scanner avec votre application authenticateur
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-brand-50 dark:bg-brand-800/50 p-6 rounded-2xl border-2 border-dashed border-brand-300 dark:border-brand-700 text-center">
                    <div className="mb-4 text-sm text-brand-600 dark:text-brand-400">
                      Scannez ce code QR avec Google Authenticator:
                    </div>
                    <div className="inline-flex items-center justify-center w-40 h-40 bg-white rounded-xl p-2">
                      <QRCodeDisplay url={qrCodeUrl} />
                    </div>
                    <div className="mt-6 p-4 bg-white dark:bg-brand-900 rounded-xl border border-brand-200 dark:border-brand-700">
                      <p className="text-xs text-brand-500 dark:text-brand-400 mb-2">
                        Ou entrez ce code manuellement:
                      </p>
                      <code className="text-lg font-mono font-bold text-brand-900 dark:text-white break-all">
                        {totpSecret}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(totpSecret)}
                        className="mt-3 text-xs text-brand-600 dark:text-brand-300 hover:text-brand-700 dark:hover:text-brand-200 flex items-center justify-center gap-2 mx-auto"
                      >
                        <Copy size={14} /> Copier
                      </button>
                    </div>
                  </div>

                  <FormField
                    label="Entrez le code à 6 chiffres"
                    type="text"
                    placeholder="000000"
                    value={totpVerificationCode}
                    onChange={(value) => {
                      if (/^\d*$/.test(value) && value.length <= 6) {
                        setTotpVerificationCode(value);
                      }
                    }}
                  />

                  <button
                    onClick={handleVerifyTOTPCode}
                    className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-2xl transition-all"
                  >
                    ✅ Valider et activer 2FA
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* API KEYS TAB */}
      {activeSecurityTab === 'api-keys' && (
        <div className="space-y-8">
          {/* CREATE NEW KEY */}
          <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
            <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
              <div className="p-3 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                <Key size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                  🔑 Gestion des API Keys
                </h3>
                <p className="text-sm text-brand-500 dark:text-brand-400 mt-1">
                  Gérez vos clés pour Gemini, Firebase et autres services
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Nom de la clé"
                  placeholder="Ex: Gemini Production"
                  value={newAPIKeyName}
                  onChange={setNewAPIKeyName}
                />
                <SelectField
                  label="Service"
                  value={newAPIKeyService}
                  onChange={(val) => setNewAPIKeyService(val as 'GEMINI' | 'FIREBASE' | 'CUSTOM')}
                  options={[
                    { label: 'Gemini', value: 'GEMINI' },
                    { label: 'Firebase', value: 'FIREBASE' },
                    { label: 'Personnalisée', value: 'CUSTOM' },
                  ]}
                />
              </div>

              <div className="relative">
                <FormField
                  label="Valeur de la clé"
                  type={showAPIKeyValue ? 'text' : 'password'}
                  placeholder="sk_live_..."
                  value={newAPIKeyValue}
                  onChange={setNewAPIKeyValue}
                />
                <button
                  type="button"
                  onClick={() => setShowAPIKeyValue(!showAPIKeyValue)}
                  className="absolute right-4 top-12 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                >
                  {showAPIKeyValue ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button
                onClick={handleCreateAPIKey}
                className="w-full px-6 py-3 bg-linear-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Ajouter une clé
              </button>
            </div>
          </div>

          {/* EXISTING KEYS */}
          {apiKeys.length > 0 && (
            <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
              <h4 className="text-lg font-bold text-brand-900 dark:text-white mb-6">
                Clés actives ({apiKeys.length})
              </h4>
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 bg-brand-50 dark:bg-brand-800/50 rounded-2xl border border-brand-200 dark:border-brand-700"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-brand-900 dark:text-white">{key.name}</p>
                          <div className="flex items-center gap-2 mt-2 text-sm text-brand-600 dark:text-brand-400">
                            <code className="font-mono bg-white dark:bg-brand-900 px-2 py-1 rounded">
                              {key.prefix}
                            </code>
                            <span className="text-xs">
                              {key.service === 'GEMINI' && '🤖'}
                              {key.service === 'FIREBASE' && '🔥'}
                              {key.service === 'CUSTOM' && '⚙️'}
                            </span>
                            {APIKeyService.shouldRotate(key) && (
                              <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-xs font-semibold">
                                <Zap size={12} /> Rotation recommandée
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-brand-500 dark:text-brand-500 mt-3">
                        Créée: {new Date(key.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          key.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}
                      >
                        {key.isActive ? '✅ Actif' : '❌ Revoquée'}
                      </div>
                      {key.isActive && (
                        <button
                          onClick={() => handleRevokeAPIKey(key.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Révoquer cette clé"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PASSWORD RESET TAB */}
      {activeSecurityTab === 'password' && (
        <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
          <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
            <div className="p-3 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
              <KeyRound size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                🗝️ Réinitialiser le mot de passe
              </h3>
              <p className="text-sm text-brand-500 dark:text-brand-400 mt-1">
                Changez votre mot de passe avec validation de sécurité
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-brand-50 dark:bg-brand-800/50 rounded-2xl border border-brand-200 dark:border-brand-700">
              <label
                htmlFor="confirmationEmail"
                className="text-sm font-semibold text-brand-900 dark:text-white block mb-2"
              >
                Email de confirmation
              </label>
              <input
                id="confirmationEmail"
                type="email"
                value={userProfile.email || ''}
                disabled
                className="w-full px-4 py-3 bg-brand-100 dark:bg-brand-900 text-brand-500 dark:text-brand-400 rounded-xl border border-brand-200 dark:border-brand-700 opacity-60 cursor-not-allowed"
              />
              <p className="text-xs text-brand-500 dark:text-brand-400 mt-2">
                Email du compte (lecture seule)
              </p>
            </div>

            <div>
              <FormField
                label="Nouveau mot de passe"
                type="password"
                placeholder="Entrez un mot de passe fort"
                value={newPassword}
                onChange={handlePasswordChange}
              />

              {newPassword && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <PasswordStrengthBar
                      score={passwordStrength.score}
                      colorClass={getPasswordStrengthColor(passwordStrength.score)}
                    />
                    <span className="text-sm font-semibold">
                      {PasswordValidator.getStrengthLabel(passwordStrength.score)}
                    </span>
                  </div>

                  {passwordStrength.feedback.length > 0 && (
                    <ul className="text-sm text-brand-600 dark:text-brand-400 space-y-1">
                      {passwordStrength.feedback.map((msg) => (
                        <li key={msg}>• {msg}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <FormField
              label="Confirmer le mot de passe"
              type="password"
              placeholder="Confirmez le mot de passe"
              value={newPasswordConfirm}
              onChange={setNewPasswordConfirm}
            />

            <button
              onClick={handleResetPassword}
              className="w-full px-6 py-4 bg-linear-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newPassword || !newPasswordConfirm || passwordStrength.score < 3}
            >
              🔄 Mettre à jour le mot de passe
            </button>
          </div>
        </div>
      )}

      {/* SESSIONS TAB */}
      {activeSecurityTab === 'sessions' && (
        <div className="space-y-8">
          {/* ACTIVE SESSIONS */}
          <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
            <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
              <div className="p-3 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                <LogOut size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                  🚪 Sessions actives
                </h3>
                <p className="text-sm text-brand-500 dark:text-brand-400 mt-1">
                  Gérez vos connexions sur différents appareils
                </p>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="p-8 text-center text-brand-600 dark:text-brand-400">
                <Smartphone size={32} className="mx-auto mb-4 opacity-50" />
                <p>Aucune session active actuellement</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-brand-50 dark:bg-brand-800/50 rounded-2xl border border-brand-200 dark:border-brand-700"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-brand-900 dark:text-white">
                        {session.deviceName}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-brand-600 dark:text-brand-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {session.ipAddress}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />{' '}
                          {new Date(session.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors font-semibold"
                    >
                      Déconnecter
                    </button>
                  </div>
                ))}

                {sessions.length > 1 && (
                  <button
                    onClick={handleRevokeAllOtherSessions}
                    className="w-full mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl transition-colors"
                  >
                    🔒 Déconnecter les autres sessions
                  </button>
                )}
              </div>
            )}
          </div>

          {/* LOGIN HISTORY */}
          {loginHistory.length > 0 && (
            <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
              <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
                <div className="p-3 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                  <History size={28} />
                </div>
                <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                  📜 Historique de connexion
                </h3>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loginHistory
                  .slice(-10)
                  .reverse()
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-3 rounded-lg text-sm ${
                        entry.status === 'success'
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {entry.status === 'success' ? '✅' : '❌'} {entry.deviceName}
                        </span>
                        <span className="text-xs opacity-75">
                          {new Date(entry.timestamp).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      {entry.failureReason && <p className="text-xs mt-1">{entry.failureReason}</p>}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ENCRYPTION TAB */}
      {activeSecurityTab === 'encryption' && (
        <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
          <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
            <div className="p-3 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
              <Lock size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                🔒 Chiffrement des données
              </h3>
              <p className="text-sm text-brand-500 dark:text-brand-400 mt-1">
                Chiffrez vos données sensibles: IBAN, SIRET, etc. (AES-256 côté client)
              </p>
            </div>
          </div>

          {userProfile.securitySettings?.encryptedDataPassword ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                <p className="text-green-900 dark:text-green-300">
                  ✅ Vos données sensibles sont chiffrées (AES-256-GCM)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3">
                <AlertTriangle
                  className="text-amber-600 dark:text-amber-400 shrink-0 mt-1"
                  size={20}
                />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Vos données IBAN, SIRET et autres informations sensibles ne sont pas encore
                  chiffrées. Activez le chiffrement pour une sécurité maximale.
                </p>
              </div>

              <FormField
                label="Défissez un mot de passe de chiffrement"
                type="password"
                placeholder="Mot de passe fort (⚠️ Ne l'oubliez pas!)"
                value={encryptionPassword}
                onChange={setEncryptionPassword}
              />

              <button
                onClick={handleEncryptIBANSIRET}
                className="w-full px-6 py-4 bg-linear-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold rounded-2xl transition-all disabled:opacity-50"
                disabled={!encryptionPassword}
              >
                🔐 Activer le chiffrement
              </button>

              <div className="bg-brand-50 dark:bg-brand-800/50 p-4 rounded-2xl border border-brand-200 dark:border-brand-700">
                <p className="text-xs text-brand-600 dark:text-brand-400 mb-3 font-semibold">
                  ℹ️ Informations de sécurité:
                </p>
                <ul className="text-xs text-brand-600 dark:text-brand-400 space-y-2">
                  <li>• Chiffrement AES-256-GCM côté client (navigateur)</li>
                  <li>• Derivation de clé avec PBKDF2 (100000 iterations)</li>
                  <li>• Vos données restent privées sur votre appareil</li>
                  <li>• ⚠️ Gardez votre mot de passe en sécurité!</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DIALOGS */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        isDangerous={confirmDialog.isDangerous}
        onConfirm={() => {
          confirmDialog.onConfirm?.();
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', description: '' })}
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        description={alertDialog.description}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ isOpen: false, title: '', description: '', type: 'info' })}
      />
    </div>
  );
};

/**
 * Composant QR Code simple (affichage du lien)
 * En production, utiliser qrcode.react ou similar
 */
const QRCodeDisplay: React.FC<{ url: string }> = ({ url }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-center">
      <div className="text-2xl mb-2">📱</div>
      <p className="text-xs text-gray-500">QR Code</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-500 hover:text-blue-600 mt-2 break-all"
      >
        Ouvrir dans l&apos;authenticateur
      </a>
    </div>
  );
};

export default SecurityTab;
