/* eslint-disable @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react/style-prop-object, jsx-a11y/no-static-element-interactions, jsx-a11y/anchor-is-valid */
/**
 * Exemple d'intégration GitHub OAuth - Fichier d'exemple
 * Les limitations de style inline et variables inutilisées sont intentionnelles pour la clarté
 */

import React from 'react';
import { useGitHubAuth } from '../hooks/useGitHubAuth';
import { GitHubLoginButton, GitHubLoginBlock } from '../components/GitHubLoginButton';

/**
 * Exemple 1: Page de connexion simple
 */
export function LoginPageExample() {
  const { isAuthenticated } = useGitHubAuth();

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Micro-Gestion-Facile</h1>
      <p>Connectez-vous avec votre compte GitHub pour continuer</p>

      <GitHubLoginButton
        label="Se connecter avec GitHub"
        showText={true}
        onSuccess={(username) => {
          console.log(`Connecté en tant que ${username}`);
          // Redirection autoatique via useGitHubAuth
        }}
      />

      <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
        Nous n'accédons qu'à votre profil public GitHub. Vos données personnelles
        restent protégées.
      </p>
    </div>
  );
}

/**
 * Exemple 2: Dashboard avec authentification sécurisée
 */
function Dashboard() {
  const { user, profile, isLoading, error, logout, refreshProfile } =
    useGitHubAuth();

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Chargement...</div>;
  }

  if (!user) {
    return <LoginPageExample />;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #ccc',
          paddingBottom: '1rem',
          marginBottom: '2rem',
        }}
      >
        <h1>Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt="Profil"
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
              }}
            />
          )}
          <div>
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              {user.displayName}
            </p>
            <p style={{ margin: '0.25rem 0 0' }}>{user.email}</p>
          </div>
          <button
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f85149',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main>
        <h2>Bienvenue, {profile?.displayName || 'Utilisateur'}</h2>

        <section
          style={{
            backgroundColor: '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '2rem',
          }}
        >
          <h3>Profil Utilisateur</h3>
          <pre style={{ overflow: 'auto', fontSize: '0.85rem' }}>
            {JSON.stringify(
              {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                emailVerified: user.emailVerified,
                provider: 'github',
                createdAt: user.metadata?.creationTime,
                lastSignInTime: user.metadata?.lastSignInTime,
              },
              null,
              2
            )}
          </pre>

          <button
            onClick={refreshProfile}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#0969da',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Rafraîchir le profil
          </button>
        </section>

        {/* Affichage des erreurs */}
        {error && (
          <section
            style={{
              backgroundColor: '#fff5f5',
              border: '1px solid #f85149',
              padding: '1rem',
              borderRadius: '4px',
              marginBottom: '2rem',
              color: '#f85149',
            }}
          >
            <h3>⚠️ Erreur</h3>
            <p>{error.message}</p>
          </section>
        )}

        <section>
          <h3>Fonctionnalités disponibles</h3>
          <ul>
            <li>Gestion des factures</li>
            <li>Gestion des clients</li>
            <li>Calculs fiscaux automatiques</li>
            <li>Export Factur-X</li>
            <li>Synchronisation hors ligne</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

/**
 * Exemple 3: Header réutilisable avec bloc login
 */
export function HeaderWithLogin() {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #ccc',
      }}
    >
      <h1>Micro-Gestion-Facile</h1>
      <GitHubLoginBlock />
    </header>
  );
}

/**
 * Exemple 4: Formulaire avec authentification requise
 */
export function ProtectedFormExample() {
  const { user, isAuthenticated, loginWithGitHub } = useGitHubAuth();

  if (!isAuthenticated) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
        }}
      >
        <h2>Authentification requise</h2>
        <p>Vous devez vous connecter pour accéder à cette fonctionnalité</p>
        <button
          onClick={loginWithGitHub}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#0969da',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Se connecter avec GitHub
        </button>
      </div>
    );
  }

  return (
    <form
      style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '4px' }}
    >
      <h2>Créer une facture</h2>
      <p>
        Connecté en tant que: <strong>{user?.displayName}</strong>
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Numéro de facture:
          <input type="text" required style={{ marginLeft: '0.5rem' }} />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Montant:
          <input type="number" required style={{ marginLeft: '0.5rem' }} />
        </label>
      </div>

      <button
        type="submit"
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Créer la facture
      </button>
    </form>
  );
}

/**
 * Exemple 5: Gestion avancée avec erreurs et retry
 */
export function AdvancedGitHubIntegration() {
  const {
    user,
    profile,
    isLoading,
    error,
    isAuthenticated,
    loginWithGitHub,
    logout,
    clearError,
  } = useGitHubAuth();

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Authentification GitHub Avancée</h1>
        <GitHubLoginButton
          onSuccess={(username) => {
            console.log(`✅ Connecté en tant que ${username}`);
          }}
          onError={(error) => {
            console.error(`❌ Erreur: ${error.message}`);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Session Active</h1>

      {error && (
        <div
          style={{
            backgroundColor: '#fff5f5',
            border: '2px solid #f85149',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          <p>
            <strong>Erreur:</strong> {error.message}
          </p>
          <button onClick={clearError}>Fermer</button>
        </div>
      )}

      <div>
        <h2>Informations Utilisateur</h2>
        <dl>
          <dt>Nom:</dt>
          <dd>{profile?.displayName}</dd>

          <dt>Email:</dt>
          <dd>{profile?.email}</dd>

          <dt>Provider:</dt>
          <dd>{profile?.provider}</dd>

          <dt>GitHub:** {profile?.githubUsername}</dt>

          <dt>Vérifié:</dt>
          <dd>{profile?.isVerified ? '✅ Oui' : '❌ Non'}</dd>
        </dl>

        <button
          onClick={logout}
          disabled={isLoading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isLoading ? '#ccc' : '#f85149',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Déconnexion en cours...' : 'Déconnexion'}
        </button>
      </div>
    </div>
  );
}

export default LoginPageExample;
