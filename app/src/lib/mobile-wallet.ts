/**
 * Mobile wallet utilities for improved connection experience
 */

export interface MobileWalletInfo {
  name: string;
  deepLink: string;
  downloadUrl: string;
  inAppBrowser: boolean;
}

export const MOBILE_WALLETS: MobileWalletInfo[] = [
  {
    name: 'Phantom',
    deepLink: 'phantom://browse/',
    downloadUrl: 'https://phantom.app/',
    inAppBrowser: true,
  },
  {
    name: 'Solflare',
    deepLink: 'solflare://browse/',
    downloadUrl: 'https://solflare.com/',
    inAppBrowser: true,
  },
  {
    name: 'Coinbase Wallet',
    deepLink: 'cbwallet://dapp/',
    downloadUrl: 'https://www.coinbase.com/wallet',
    inAppBrowser: true,
  },
  {
    name: 'Trust Wallet',
    deepLink: 'trust://open_url?coin_id=501&url=',
    downloadUrl: 'https://trustwallet.com/',
    inAppBrowser: true,
  },
];

/**
 * Detect if running on mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
  );
}

/**
 * Detect if running inside a wallet app's browser
 */
export function isInWalletBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes('phantom') ||
    userAgent.includes('solflare') ||
    userAgent.includes('coinbase') ||
    userAgent.includes('trustwallet')
  );
}

/**
 * Generate deep link to open DITO in wallet app
 */
export function generateWalletDeepLink(walletName: string): string | null {
  const wallet = MOBILE_WALLETS.find(w => w.name.toLowerCase() === walletName.toLowerCase());
  if (!wallet) return null;
  
  const currentUrl = encodeURIComponent(window.location.href);
  return wallet.deepLink + currentUrl;
}

/**
 * Attempt to open wallet app via deep link
 */
export function openInWallet(walletName: string): boolean {
  const deepLink = generateWalletDeepLink(walletName);
  if (!deepLink) return false;
  
  try {
    window.location.href = deepLink;
    return true;
  } catch (error) {
    console.warn(`Failed to open ${walletName} deep link:`, error);
    return false;
  }
}

/**
 * Get user agent info for debugging
 */
export function getMobileInfo() {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isInWallet: false,
      userAgent: 'server',
      screenSize: 'unknown'
    };
  }
  
  return {
    isMobile: isMobileDevice(),
    isInWallet: isInWalletBrowser(),
    userAgent: navigator.userAgent,
    screenSize: `${window.innerWidth}x${window.innerHeight}`
  };
}