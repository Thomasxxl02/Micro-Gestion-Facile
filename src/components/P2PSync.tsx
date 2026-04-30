import React, { useState, useEffect, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { QRCodeSVG } from 'qrcode.react';
import { useAppStore } from '../store/appStore';
import { useUIStore } from '../store/useUIStore';
import { toast } from 'sonner';
import { Share2, Smartphone, Monitor, CheckCircle2, XCircle, Loader2, Copy } from 'lucide-react';

export const P2PSync: React.FC = () => {
  const [peerId, setPeerId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [status, setStatus] = useState<'idle' | 'linking' | 'connected' | 'error'>('idle');
  const [_receivedData, _setReceivedData] = useState<boolean>(false);
  const peerRef = useRef<Peer | null>(null);

  const { userProfile, setUserProfile } = useAppStore();
  const uiSettings = useUIStore();

  useEffect(() => {
    // Initialisation de PeerJS
    const newPeer = new Peer();
    
    newPeer.on('open', (id) => {
      setPeerId(id);
    });

    newPeer.on('connection', (conn) => {
      setStatus('connected');
      setConnection(conn);
      setupConnection(conn);
    });

    newPeer.on('error', (_err) => {
      console.error('PeerJS error:', _err);
      setStatus('error');
      toast.error('Erreur de connexion P2P');
    });

    peerRef.current = newPeer;

    return () => {
      newPeer.destroy();
    };
  }, []);

  const setupConnection = (conn: DataConnection) => {
    conn.on('data', (data: unknown) => {
      try {
        if ((data as Record<string, unknown>).type === 'SYNC_PAYLOAD') {
          const { profile, ui } = data.payload;
          
          if (profile) setUserProfile(profile);
          if (ui) {
            // Apply UI settings
            if (ui.isDarkMode !== undefined) uiSettings.setIsDarkMode(ui.isDarkMode);
            if (ui.fontSize !== undefined) uiSettings.setFontSize(ui.fontSize);
            if (ui.colorTheme !== undefined) uiSettings.setColorTheme(ui.colorTheme);
          }
          
          setReceivedData(true);
          toast.success('Paramètres synchronisés !');
        }
      } catch (err) {
        console.error('Data sync error:', err);
        toast.error('Échec de la synchronisation des données');
      }
    });

    conn.on('close', () => {
      setStatus('idle');
      setConnection(null);
    });
  };

  const connectToPeer = (id: string) => {
    if (!peerRef.current || !id) return;
    
    setStatus('linking');
    const conn = peerRef.current.connect(id);
    
    conn.on('open', () => {
      setStatus('connected');
      setConnection(conn);
      setupConnection(conn);
      
      // Envoi automatique des paramètres après connexion initiée
      sendSettings(conn);
    });

    conn.on('error', (err) => {
      setStatus('error');
      toast.error('Impossible de se connecter');
    });
  };

  const sendSettings = (conn: DataConnection | null) => {
    const targetConn = conn || connection;
    if (!targetConn) return;

    const payload = {
      type: 'SYNC_PAYLOAD',
      payload: {
        profile: userProfile,
        ui: {
          isDarkMode: uiSettings.isDarkMode,
          fontSize: uiSettings.fontSize,
          colorTheme: uiSettings.colorTheme,
          reducedMotion: uiSettings.reducedMotion,
          soundEnabled: uiSettings.soundEnabled,
        }
      }
    };

    targetConn.send(payload);
    toast.success('Paramètres envoyés');
  };

  const syncUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?syncId=${peerId}`;

  // Check URL for syncId on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const syncId = urlParams.get('syncId');
    if (syncId && peerId && status === 'idle') {
      connectToPeer(syncId);
    }
  }, [peerId]);

  return (
    <div className="p-6 space-y-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
          <Share2 className="w-6 h-6 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Synchronisation Directe (P2P)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Transférez vos réglages sans passer par le Cloud.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Generate QR Code Section */}
        <div className="space-y-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-5 h-5 text-brand-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">Cet appareil</span>
          </div>
          
          {peerId ? (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-xl shadow-inner border-4 border-slate-100 dark:border-slate-700">
                <QRCodeSVG value={syncUrl} size={180} />
              </div>
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 max-w-50">
                Scannez ce code avec un autre appareil pour synchroniser vos paramètres instantanément.
              </p>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(syncUrl);
                  toast.success('Lien copié !');
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copier le lien de synchro
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
              <span className="mt-2 text-sm text-slate-500">Génération du code...</span>
            </div>
          )}
        </div>

        {/* Connection Status Section */}
        <div className="space-y-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Monitor className="w-5 h-5 text-brand-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">Statut de connexion</span>
          </div>

          <div className="space-y-4 h-full flex flex-col justify-center">
            {status === 'idle' && (
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Prêt pour une nouvelle connexion.</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="ID ou Lien reçu"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    onChange={(e) => setTargetId(e.target.value.split('=')[1] || e.target.value)}
                  />
                  <button 
                    onClick={() => connectToPeer(targetId)}
                    className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    Lier
                  </button>
                </div>
              </div>
            )}

            {status === 'linking' && (
              <div className="text-center space-y-4">
                <Loader2 className="mx-auto w-10 h-10 text-brand-500 animate-spin" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Établissement du lien sécurisé...</p>
              </div>
            )}

            {status === 'connected' && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-700 dark:text-green-400">Appareils liés !</p>
                  <p className="text-xs text-slate-500 mt-1">Connexion WebRTC direct active.</p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button 
                    onClick={() => sendSettings(null)}
                    className="w-full px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700"
                  >
                    Envoyer mes réglages
                  </button>
                  <button 
                    onClick={() => {
                      connection?.close();
                      setStatus('idle');
                    }}
                    className="w-full px-4 py-2 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Déconnecter
                  </button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-4">
                <XCircle className="mx-auto w-12 h-12 text-rose-500" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Échec du lien P2P.</p>
                <button 
                  onClick={() => setStatus('idle')}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg">
        <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
          <strong>Note Sécurité :</strong> La synchronisation P2P s'effectue directement entre vos navigateurs. 
          Aucune donnée de profil ou réglage n'est stocké sur nos serveurs. Assurez-vous d'être sur un réseau stable et sécurisé.
        </p>
      </div>
    </div>
  );
};
