'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useI18n } from '@/providers/i18n-provider';
import { store, getSignMessage } from '@/lib/store';
import { getAuthParams } from '@/lib/wallet-auth';
import { handleSignatureError } from '@/lib/session-logout';
import Link from 'next/link';
import { getWalletCookie, setWalletCookie, removeWalletCookie } from '@/lib/wallet-cookie';
import { MobileGuide } from '@/components/wallet/mobile-guide';
import { getActiveSessions, createSession, deactivateSession } from '@/lib/session-manager';
import { DuplicateLoginDialog } from '@/components/auth/duplicate-login-dialog';

class WalletErrorBoundary extends React.Component<{children: React.ReactNode, fallback: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode, fallback: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function ManualWalletPicker({ onSelect }: { onSelect: (walletName: string) => void }) {
  const { lang } = useI18n();
  const { wallets } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!wallets || wallets.length === 0) {
    return (
      <button 
        disabled 
        className="w-full h-12 rounded-xl bg-muted text-muted-foreground text-base font-semibold"
      >
        {lang === 'ko' ? '지갑 로딩 중...' : 'Loading wallets...'}
      </button>
    );
  }

  const handleWalletSelect = (walletName: string) => {
    setShowDropdown(false);
    setErrorMessage(null);
    
    const wallet = wallets.find(w => w.adapter.name === walletName);
    
    if (!wallet) {
      setErrorMessage(lang === 'ko' ? '지갑을 찾을 수 없습니다.' : 'Wallet not found.');
      return;
    }

    if (wallet.readyState !== 'Installed') {
      const message = lang === 'ko'
        ? `${walletName} 지갑이 설치되지 않았습니다. 확장프로그램을 설치해주세요.`
        : `${walletName} is not installed. Please install the browser extension.`;
      setErrorMessage(message);
      return;
    }

    setSelectedWallet(walletName);
    setIsInstalled(true);
  };

  const handleConnect = () => {
    if (selectedWallet && isInstalled) {
      setErrorMessage(null);
      onSelect(selectedWallet);
    } else {
      setErrorMessage(lang === 'ko' 
        ? '먼저 지갑을 선택해주세요.' 
        : 'Please select a wallet first.'
      );
    }
  };

  return (
    <div className="relative w-full">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full h-12 rounded-xl bg-[#ff6b35] hover:bg-[#e85d2c] text-white text-base font-semibold transition-all flex items-center justify-center gap-2"
      >
        {selectedWallet || (lang === 'ko' ? '암호화폐 지갑 선택' : 'Select Crypto Wallet')}
        <span className={`transform transition-transform ${showDropdown ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      <div className={`absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto transition-all duration-200 ease-out origin-top ${
        showDropdown 
          ? 'opacity-100 scale-y-100 pointer-events-auto' 
          : 'opacity-0 scale-y-95 pointer-events-none'
      }`}>
        {wallets.map((wallet, index) => {
          const isInstalled = wallet.readyState === 'Installed';
          return (
            <button
              key={wallet.adapter.name}
              onClick={() => handleWalletSelect(wallet.adapter.name)}
              className={`w-full flex items-center gap-3 h-14 px-4 hover:bg-muted/50 transition-all duration-150 text-left first:rounded-t-xl last:rounded-b-xl ${
                showDropdown 
                  ? 'translate-y-0 opacity-100' 
                  : 'translate-y-2 opacity-0'
              }`}
              style={{ transitionDelay: showDropdown ? `${index * 30}ms` : '0ms' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={wallet.adapter.icon} alt="" className="w-8 h-8 rounded-md flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium">{wallet.adapter.name}</div>
                {!isInstalled && (
                  <div className="text-xs text-muted-foreground">
                    {lang === 'ko' ? '설치 필요' : 'Not installed'}
                  </div>
                )}
              </div>
              {isInstalled && (
                <span className="text-xs text-green-500">●</span>
              )}
            </button>
          );
        })}
      </div>
      
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
      
      {selectedWallet && isInstalled && (
        <button
          onClick={handleConnect}
          className="w-full mt-3 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white text-base font-semibold transition-all"
        >
          {lang === 'ko' ? '연결하기' : 'Connect'}
        </button>
      )}
      
      {errorMessage && (
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-sm">⚠️</span>
            <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
              {errorMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 px-1">{title}</div>
      <div className="bg-card/50 border border-border rounded-xl p-4">{children}</div>
    </div>
  );
}

/* ─── Connect (Login) View ─── */
function ConnectView() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { connected, publicKey, disconnect, select, connect, wallets, wallet } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [showMobileGuide, setShowMobileGuide] = useState(false);
  const [duplicateSessions, setDuplicateSessions] = useState<any[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  // Staged address — wallet connected but not yet confirmed by user
  const [pendingAddr, setPendingAddr] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  // Show custom wallet list when switching (avoids WalletMultiButton auto-reconnect issues)
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  
  const handleWalletSelect = async (walletName: string) => {
    try {
      // Simple approach: just select and connect
      select(walletName as any);
      await connect();
    } catch (error) {
      console.error('Wallet connection error:', error);
      // If it fails, throw the error to be handled by the retry logic
      throw error;
    }
  };

  useEffect(() => { setMounted(true); }, []);

  // When adapter connects, stage for confirmation
  useEffect(() => {
    if (connected && publicKey && mounted && !pendingAddr) {
      setPendingAddr(publicKey.toBase58());
      setShowWalletPicker(false);
    }
    if (!connected && !publicKey) {
      setPendingAddr(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey, mounted]);

  const handleSwitchWallet = async () => {
    setPendingAddr(null);

    // Complete disconnect and reset wallet adapter state
    try {
      await disconnect();
      // Reset wallet adapter selection
      select(null as any);
      // Wait for complete cleanup
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch {
      // ignore disconnect errors
    }

    // Show wallet picker (this will trigger reset in ManualWalletPicker)
    setShowWalletPicker(true);
  };

  const handleSwitchWalletSelect = (walletName: string) => {
    setShowWalletPicker(false);
    handleWalletSelect(walletName);
  };

  const handleConfirmWallet = async () => {
    if (!pendingAddr) return;
    setConfirming(true);
    try {
      const activeSessions = await getActiveSessions(pendingAddr);
      const otherSessions = activeSessions.filter(s => !s.device_id.includes(Date.now().toString()));
      if (otherSessions.length > 0) {
        setDuplicateSessions(otherSessions);
        setShowDuplicateDialog(true);
        return;
      }
      await proceedWithLogin(pendingAddr);
    } catch {
      await proceedWithLogin(pendingAddr);
    } finally {
      setConfirming(false);
    }
  };

  const handleKeepExisting = async () => {
    setShowDuplicateDialog(false);
    setDuplicateSessions([]);
    setPendingAddr(null);
    await disconnect();
  };

  const handleReplaceExisting = async () => {
    setShowDuplicateDialog(false);
    setDuplicateSessions([]);
    if (pendingAddr) await proceedWithLogin(pendingAddr);
  };

  const proceedWithLogin = async (addr: string) => {
    try {
      setWalletCookie(addr);
      await createSession(addr);

      // Check if this is a returning user with local data
      const localProfile = store.getProfile();

      // For first-time users or users without server auth, skip server check
      if (!localProfile.display_name && !localProfile.current_talent) {
        router.push('/discovery');
        return;
      }

      // For users with local data, try server sync (but don't block on signature)
      try {
        const serverProfile = await store.getProfileAsync();

        // Update local profile with server data
        store.setProfile(serverProfile);

        // Route based on updated profile
        if (serverProfile.current_talent) {
          router.push('/chat');
        } else {
          router.push('/discovery');
        }
        return;
      } catch {
        // Use local profile state for routing
        if (localProfile.current_talent) {
          router.push('/chat');
        } else {
          router.push('/discovery');
        }
      }
    } catch (error) {
      console.error('Login process failed:', error);
      router.push('/discovery');
    }
  };

  // ── Wallet connected: confirm or switch ──
  if (pendingAddr) {
    const short = `${pendingAddr.slice(0, 4)}...${pendingAddr.slice(-4)}`;
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 page-enter">
        <div className="max-w-xs w-full flex flex-col items-center gap-6">
          <span className="text-5xl">🔥</span>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              {lang === 'ko' ? '이 지갑으로 시작할까요?' : 'Start with this wallet?'}
            </p>
            <p className="font-mono text-base font-semibold">{short}</p>
          </div>
          <div className="w-full flex flex-col items-center gap-3">
            <button
              onClick={handleConfirmWallet}
              disabled={confirming}
              className="w-full h-12 rounded-xl bg-[#ff6b35] hover:bg-[#e85d2c] text-white font-semibold text-base transition-all disabled:opacity-60"
            >
              {confirming
                ? (lang === 'ko' ? '연결 중...' : 'Connecting...')
                : (lang === 'ko' ? '✅ 맞아, 이 지갑으로 할게' : '✅ Yes, use this wallet')}
            </button>
            <button
              onClick={handleSwitchWallet}
              disabled={confirming}
              className="text-xs text-muted-foreground/60 hover:text-[#ff6b35] underline decoration-dotted transition-colors disabled:opacity-40"
            >
              {lang === 'ko' ? '다른 지갑으로 변경' : 'Switch wallet'}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground/50 text-center">
            {lang === 'ko'
              ? '지갑 주소를 확인하고 진행해 주세요.'
              : 'Please verify your wallet address before continuing.'}
          </p>
        </div>
        {showDuplicateDialog && (
          <DuplicateLoginDialog
            existingSessions={duplicateSessions}
            onKeepExisting={handleKeepExisting}
            onReplaceExisting={handleReplaceExisting}
          />
        )}
      </div>
    );
  }

  // ── Custom wallet picker (shown after "Switch") ──
  if (showWalletPicker && mounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 page-enter">
        <div className="max-w-xs w-full flex flex-col items-center gap-6">
          <span className="text-6xl">🔥</span>
          <div className="text-center">
            <h1 className="text-xl font-bold mb-2">
              {lang === 'ko' ? '다른 지갑 선택' : 'Choose Different Wallet'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === 'ko' ? '어떤 지갑으로 연결할까요?' : 'Select your preferred wallet'}
            </p>
          </div>
          <div className="w-full flex justify-center">
            <div className="w-full max-w-xs">
              <ManualWalletPicker onSelect={handleSwitchWalletSelect} />
            </div>
          </div>
          <button
            onClick={() => setShowWalletPicker(false)}
            className="text-sm text-muted-foreground hover:text-[#ff6b35] transition-colors underline decoration-dotted"
          >
            {lang === 'ko' ? '취소' : 'Cancel'}
          </button>
        </div>
      </div>
    );
  }

  // ── Default: initial wallet connection ──
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 page-enter">
      <div className="max-w-xs w-full flex flex-col items-center gap-8">
        <span className="text-6xl">🔥</span>
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">{t('connect.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('connect.subtitle')}</p>
        </div>
        <div className="w-full flex justify-center">
          <div className="w-full max-w-xs">
            {mounted ? (
              <ManualWalletPicker onSelect={handleWalletSelect} />
            ) : (
              <button 
                disabled 
                className="w-full h-12 rounded-xl bg-muted text-muted-foreground text-base font-semibold"
              >
                {lang === 'ko' ? '지갑 연결 준비 중...' : 'Preparing wallet...'}
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowMobileGuide(true)}
          className="text-sm text-muted-foreground hover:text-[#ff6b35] transition-colors underline decoration-dotted"
        >
          {lang === 'ko' ? '📱 암호화폐 지갑 연결 가이드' : '📱 Crypto Wallet Connection Guide'}
        </button>
        <p className="text-[11px] text-muted-foreground/60 text-center leading-relaxed">
          {t('connect.tosNotice')}{' '}
          <Link href="/terms" className="text-[#ff6b35] hover:underline">{t('connect.terms')}</Link>
          {' '}{t('connect.and')}{' '}
          <Link href="/privacy" className="text-[#ff6b35] hover:underline">{t('connect.privacy')}</Link>
          {t('connect.tosNoticeSuffix')}
        </p>
      </div>
      {showMobileGuide && (
        <MobileGuide onClose={() => setShowMobileGuide(false)} />
      )}
    </div>
  );
}

/* ─── Settings View (after connected) ─── */
function SettingsView() {
  const { t } = useI18n();
  const router = useRouter();
  const { connected, publicKey, disconnect } = useWallet();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      setMounted(true);
      const wallet = getWalletCookie();
      if (wallet) {
        const profile = await store.getProfileAsync();
        if (profile.display_name) setName(profile.display_name);
      }
    };
    init();
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    const wallet = getWalletCookie();
    if (wallet) {
      const profile = store.getProfile();
      store.saveProfileAsync({ ...profile, display_name: val });
    }
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert('Max 500KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      setAvatar(data);
      const wallet = getWalletCookie();
      if (wallet) {
        const signMessageFn = getSignMessage();
        if (signMessageFn) {
          getAuthParams(wallet, signMessageFn).then(auth => {
            fetch('/api/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ wallet_address: wallet, avatar_url: data, ...auth }),
            });
          }).catch((error) => {
            handleSignatureError(error, false); // Don't auto-logout on avatar upload
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const truncatedAddr = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : '';

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 page-enter">
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {/* Profile */}
        {mounted && (
          <Section title={t('settings.profile')}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-16 h-16 rounded-full bg-muted/30 border border-border flex items-center justify-center overflow-hidden flex-shrink-0 hover:border-[#ff6b35]/50 transition-colors"
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatar}
                className="hidden"
              />
              <div className="flex-1">
                <input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t('settings.namePlaceholder')}
                  className="w-full bg-transparent border-b border-border/50 focus:border-[#ff6b35] outline-none text-sm py-1.5 transition-colors"
                  maxLength={20}
                />
              </div>
            </div>
          </Section>
        )}

        {/* Wallet */}
        <Section title={t('settings.wallet')}>
          {connected && publicKey ? (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">{t('settings.walletConnected')}</span>
                <div className="font-mono text-sm">{truncatedAddr}</div>
              </div>
              <button
                onClick={async () => { 
                  const wallet = getWalletCookie();
                  if (wallet) {
                    await deactivateSession(wallet);
                  }
                  disconnect(); 
                  removeWalletCookie(); 
                  router.push('/'); 
                }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                {t('settings.disconnect')}
              </button>
            </div>
          ) : (
            <WalletErrorBoundary
              fallback={
                <button
                  disabled
                  className="w-full h-10 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 text-xs"
                >
                  Wallet Error
                </button>
              }
            >
              <WalletMultiButton className="!bg-[#ff6b35] !rounded-xl !h-10 !text-sm !font-semibold !justify-center hover:!bg-[#e85d2c] !transition-all !w-full" />
            </WalletErrorBoundary>
          )}
        </Section>

        {/* Links */}
        <Section title={t('settings.links')}>
          <div className="flex flex-col gap-2">
            <a href="https://x.com/0xDARGONNE" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-[#ff6b35] transition-colors">𝕏 Twitter</a>
            <a href="https://discord.gg/6Cjn2sJZrV" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-[#ff6b35] transition-colors">Discord</a>
            <a href="https://t.me/ditoguru" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-[#ff6b35] transition-colors">Telegram</a>
          </div>
        </Section>

        {/* Legal */}
        <Section title={t('settings.legal')}>
          <div className="flex flex-col gap-2">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-[#ff6b35] transition-colors">
              {t('settings.privacy')}
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-[#ff6b35] transition-colors">
              {t('settings.terms')}
            </Link>
          </div>
        </Section>

        {/* App Info */}
        <div className="text-center text-xs text-muted-foreground py-4">
          <div>DITO v0.1.0 MVP</div>
          <div>© 2026 DIGI PLANET</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page: Connect or Settings based on wallet state ─── */
export default function ConnectPage() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const init = async () => {
      const wallet = getWalletCookie();
      if (wallet) {
        const profile = await store.getProfileAsync();
        if (!profile.current_talent) {
          router.replace('/discovery');
          return;
        }
        setIsConnected(true);
      }
      setChecked(true);
    };
    init();
  }, [router]);

  if (!checked) return null;

  if (isConnected) {
    return <SettingsView />;
  }

  return <ConnectView />;
}
