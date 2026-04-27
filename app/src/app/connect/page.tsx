'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useModal, usePhantom, useDisconnect } from '@phantom/react-sdk';
import {
  ArrowLeft,
  Wallet as WalletIcon,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { store, getSignMessage } from '@/lib/store';
import { getAuthParams } from '@/lib/wallet-auth';
import { handleSignatureError } from '@/lib/session-logout';
import { getWalletCookie, setWalletCookie, removeWalletCookie } from '@/lib/wallet-cookie';
import { MobileGuide } from '@/components/wallet/mobile-guide';
import { getActiveSessions, createSession, deactivateSession } from '@/lib/session-manager';
import { DuplicateLoginDialog } from '@/components/auth/duplicate-login-dialog';

/* ─── Small atoms ─── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 px-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div className="rounded-[14px] border border-border bg-card/50 p-4">{children}</div>
    </div>
  );
}


/* ─── Connect (Login) View ─── */
function ConnectView({ originHref }: { originHref: string }) {
  const { t, lang } = useI18n();
  const isKo = lang === 'ko';
  const router = useRouter();
  const { open: openPhantomModal, isOpened: isPhantomOpened } = useModal();
  const { isConnected: connected, isConnecting: phantomConnecting, addresses } =
    usePhantom();
  const { disconnect } = useDisconnect();
  // addresses[0] is always Solana — Provider configured with addressTypes:[AddressType.solana]
  const publicKey = useMemo(() => addresses?.[0]?.address || null, [addresses]);

  const [mounted, setMounted] = useState(false);
  const [showMobileGuide, setShowMobileGuide] = useState(false);
  const [duplicateSessions, setDuplicateSessions] = useState<any[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingAddr, setPendingAddr] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // When SDK reports connected, stage address for confirmation
  useEffect(() => {
    if (connected && publicKey && mounted && !pendingAddr) {
      setPendingAddr(publicKey);
      setConnecting(false);
    }
    if (!connected && !publicKey) {
      setPendingAddr(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey, mounted]);

  // Release the local lock if Phantom modal closes without connecting
  useEffect(() => {
    if (connecting && !isPhantomOpened && !phantomConnecting && !connected) {
      setConnecting(false);
    }
  }, [connecting, isPhantomOpened, phantomConnecting, connected]);

  const handleConnect = () => {
    setErrorMessage(null);
    setConnecting(true);
    try {
      openPhantomModal();
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      setErrorMessage(
        isKo
          ? '지갑 연결 중 문제가 발생했어요.'
          : 'Something went wrong while connecting your wallet.'
      );
      setConnecting(false);
    }
  };

  const handleSwitchWallet = async () => {
    setPendingAddr(null);
    try {
      await disconnect();
      await new Promise((r) => setTimeout(r, 200));
    } catch {
      /* ignore */
    }
  };

  const handleConfirmWallet = async () => {
    if (!pendingAddr) return;
    setConfirming(true);
    try {
      const activeSessions = await getActiveSessions(pendingAddr);
      const otherSessions = activeSessions.filter(
        (s) => !s.device_id.includes(Date.now().toString())
      );
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

      const localProfile = store.getProfile();

      if (!localProfile.display_name && !localProfile.current_talent) {
        router.push(originHref === '/' ? '/discovery' : originHref);
        return;
      }

      try {
        const serverProfile = await store.getProfileAsync();
        store.setProfile(serverProfile);

        if (originHref !== '/' && originHref !== '/connect') {
          router.push(originHref);
          return;
        }
        if (serverProfile.current_talent) {
          router.push('/chat');
        } else {
          router.push('/discovery');
        }
        return;
      } catch {
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

  /* ── Already connected: confirm or switch ── */
  if (pendingAddr) {
    const short = `${pendingAddr.slice(0, 4)}…${pendingAddr.slice(-4)}`;
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-105 rounded-[14px] border border-border bg-card/60 p-6 md:p-8">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--fg-on-ember)]">
              <Check className="h-7 w-7 text-[var(--ember)]" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-[20px] font-bold tracking-tight text-foreground">
                {isKo ? '이 지갑으로 시작할까요?' : 'Start with this wallet?'}
              </h1>
              <p className="mt-2 font-mono text-[15px] font-semibold text-foreground">
                {short}
              </p>
            </div>
            <button
              type="button"
              onClick={handleConfirmWallet}
              disabled={confirming}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--ember)] font-semibold text-[var(--fg-on-ember)] transition-all hover:brightness-110 disabled:opacity-60"
            >
              {confirming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isKo ? '연결 중…' : 'Connecting…'}
                </>
              ) : (
                <>{isKo ? '계속하기' : 'Continue'}</>
              )}
            </button>
            <button
              type="button"
              onClick={handleSwitchWallet}
              disabled={confirming}
              className="text-[13px] text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground disabled:opacity-40"
            >
              {isKo ? '다른 지갑 사용하기' : 'Use a different wallet'}
            </button>
            <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground/70">
              {isKo
                ? '지갑 주소를 확인하고 계속해 주세요.'
                : 'Please verify your wallet address before continuing.'}
            </p>
          </div>
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

  /* ── Default: pick a wallet ── */
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-6 md:py-10">
      <div className="w-full max-w-105 rounded-[14px] border border-border bg-card/60 p-6 md:p-8">
        {/* Hero */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--fg-on-ember)]">
            <WalletIcon className="h-6 w-6 text-[var(--ember)]" strokeWidth={2} />
          </div>
          <h1 className="mt-5 text-[20px] font-bold leading-7 tracking-tight text-foreground">
            {isKo ? 'Solana 지갑 연결.' : 'Connect your Solana wallet.'}
          </h1>
          <p className="mt-1 text-[14px] tracking-widest text-muted-foreground">
            {isKo ? 'Connect your Solana wallet.' : 'Solana 지갑 연결.'}
          </p>
          <p className="mt-3 max-w-[280px] text-[13px] leading-[21px] text-muted-foreground">
            {isKo
              ? 'Soul과 상호작용하고 디지털 자산을 안전하게 관리하려면 지갑이 필요합니다.'
              : 'You need a wallet to interact with your Souls and securely manage digital assets.'}
          </p>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mt-5 flex items-start gap-2 rounded-[10px] border border-[var(--ember)]/40 bg-[var(--fg-on-ember)]/40 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--ember)]" />
            <p className="text-[12px] leading-snug text-foreground/90">{errorMessage}</p>
          </div>
        )}

        {/* Phantom connect — multi-wallet picker replaced by Phantom SDK modal */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleConnect}
            disabled={!mounted || connecting || phantomConnecting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--ember)] font-semibold text-[var(--fg-on-ember)] transition-all hover:brightness-110 disabled:opacity-60"
          >
            {connecting || phantomConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isKo ? '연결 중…' : 'Connecting…'}
              </>
            ) : (
              <>
                <WalletIcon className="h-4 w-4" />
                {isKo ? 'Phantom 지갑 연결' : 'Connect with Phantom'}
              </>
            )}
          </button>
        </div>

        {/* Secondary actions */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <Link
            href={originHref === '/connect' ? '/' : originHref}
            className="text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {isKo ? '나중에 할게요' : "I'll do this later"}
          </Link>
          <button
            type="button"
            onClick={() => setShowMobileGuide(true)}
            className="text-[12px] text-muted-foreground/70 underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground"
          >
            {isKo ? '모바일 지갑 연결 가이드' : 'Mobile wallet connection guide'}
          </button>
        </div>

        {/* Fine print */}
        <p className="mt-6 px-2 text-center text-[11px] leading-[18px] text-muted-foreground/60">
          {isKo
            ? '연결하면 이용약관에 동의한 것으로 간주됩니다. 자금이나 프라이빗 키에는 접근하지 않습니다. '
            : 'By connecting, you agree to the terms. We never have access to your funds or private keys. '}
          <Link href="/terms" className="text-[var(--ember)] hover:underline">
            {t('connect.terms')}
          </Link>
          {' · '}
          <Link href="/privacy" className="text-[var(--ember)] hover:underline">
            {t('connect.privacy')}
          </Link>
        </p>
      </div>

      {showMobileGuide && <MobileGuide onClose={() => setShowMobileGuide(false)} />}
    </div>
  );
}

/* ─── Settings View (preserved) ─── */
function SettingsView() {
  const { t } = useI18n();
  const router = useRouter();
  const { open: openPhantomModal } = useModal();
  const { isConnected: connected, addresses } = usePhantom();
  const { disconnect } = useDisconnect();
  // addresses[0] is always Solana — Provider configured with addressTypes:[AddressType.solana]
  const publicKey = useMemo(() => addresses?.[0]?.address || null, [addresses]);
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
          getAuthParams(wallet, signMessageFn)
            .then((auth) => {
              fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet_address: wallet, avatar_url: data, ...auth }),
              });
            })
            .catch((error) => {
              handleSignatureError(error, false);
            });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const truncatedAddr = publicKey
    ? `${publicKey.slice(0, 4)}…${publicKey.slice(-4)}`
    : '';

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 page-enter">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        {mounted && (
          <Section title={t('settings.profile')}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/30 transition-colors hover:border-[var(--ember)]/50"
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
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
                  className="w-full border-b border-border/50 bg-transparent py-1.5 text-sm outline-none transition-colors focus:border-[var(--ember)]"
                  maxLength={20}
                />
              </div>
            </div>
          </Section>
        )}

        <Section title={t('settings.wallet')}>
          {connected && publicKey ? (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">
                  {t('settings.walletConnected')}
                </span>
                <div className="font-mono text-sm">{truncatedAddr}</div>
              </div>
              <button
                onClick={async () => {
                  const wallet = getWalletCookie();
                  if (wallet) await deactivateSession(wallet);
                  disconnect();
                  removeWalletCookie();
                  router.push('/');
                }}
                className="text-sm text-red-400 transition-colors hover:text-red-300"
              >
                {t('settings.disconnect')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openPhantomModal()}
              className="h-10 w-full rounded-[10px] bg-ember text-sm font-semibold text-(--fg-on-ember) transition-all hover:brightness-110"
            >
              Connect Phantom
            </button>
          )}
        </Section>

        <Section title={t('settings.links')}>
          <div className="flex flex-col gap-2">
            <a
              href="https://x.com/0xDARGONNE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-[var(--ember)]"
            >
              𝕏 Twitter
            </a>
            <a
              href="https://discord.gg/6Cjn2sJZrV"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-[var(--ember)]"
            >
              Discord
            </a>
            <a
              href="https://t.me/ditoguru"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-[var(--ember)]"
            >
              Telegram
            </a>
          </div>
        </Section>

        <Section title={t('settings.legal')}>
          <div className="flex flex-col gap-2">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-[var(--ember)]"
            >
              {t('settings.privacy')}
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground transition-colors hover:text-[var(--ember)]"
            >
              {t('settings.terms')}
            </Link>
          </div>
        </Section>

        <div className="py-4 text-center text-xs text-muted-foreground">
          <div>DITO v0.1.0 MVP</div>
          <div>© 2026 DIGI PLANET</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function ConnectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [checked, setChecked] = useState(false);
  const { lang } = useI18n();
  const isKo = lang === 'ko';

  // Resolve origin (redirect target after successful connect, or back target)
  const originHref = useMemo(() => {
    const raw =
      searchParams?.get('origin') ||
      searchParams?.get('from') ||
      searchParams?.get('returnTo');
    if (!raw) return '/';
    // Only allow internal paths
    if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
    return raw;
  }, [searchParams]);

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

  return (
    <div
      data-landing-page
      className="relative flex min-h-screen w-full flex-col bg-background text-foreground"
    >
      {/* Sticky top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-105 items-center gap-3 px-4">
          <Link
            href={originHref === '/connect' ? '/' : originHref}
            aria-label={isKo ? '뒤로' : 'Back'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {isConnected
              ? isKo
                ? '계정 설정'
                : 'Account'
              : isKo
              ? '지갑 연결'
              : 'Connect Wallet'}
          </span>
        </div>
      </header>

      {isConnected ? <SettingsView /> : <ConnectView originHref={originHref} />}
    </div>
  );
}
