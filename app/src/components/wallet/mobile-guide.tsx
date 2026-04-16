'use client';

import { useState } from 'react';

interface MobileGuideProps {
  onClose: () => void;
}

export function MobileGuide({ onClose }: MobileGuideProps) {

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-4 max-w-sm w-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold">📱 암호화폐 지갑 연결 가이드</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-sm">
          {/* Method 1: In-wallet browser */}
          <div className="bg-muted/30 rounded-xl p-3">
            <h4 className="font-semibold mb-2">🎯 추천 방법 (가장 안정적)</h4>
            <p className="text-muted-foreground mb-2 text-xs">지갑 앱 안에서 직접 접속하세요</p>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <span className="bg-[#ff6b35] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <p className="text-xs">Phantom, Solflare 등 지갑 앱 실행</p>
              </div>
              <div className="flex gap-2">
                <span className="bg-[#ff6b35] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                <p className="text-xs">앱 하단의 <strong>&quot;브라우저&quot;</strong> 또는 <strong>&quot;Discover&quot;</strong> 탭 클릭</p>
              </div>
              <div className="flex gap-2">
                <span className="bg-[#ff6b35] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                <p className="text-xs"><strong>dito.guru</strong> 입력 후 접속</p>
              </div>
              <div className="flex gap-2">
                <span className="bg-[#ff6b35] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                <p className="text-xs">지갑 연결 시 바로 서명 가능! ✅</p>
              </div>
            </div>
          </div>

          {/* Method 2: External browser */}
          <div className="bg-muted/10 rounded-xl p-3">
            <h4 className="font-semibold mb-2">📱 일반 브라우저 사용시</h4>
            <p className="text-muted-foreground mb-2 text-xs">Chrome, Safari에서도 가능하지만 여러 번 시도 필요할 수 있어요</p>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Connect Wallet 여러 번 클릭</li>
              <li>• 지갑이 안 열리면 브라우저 새로고침</li>
              <li>• 서명창이 안 뜨면 다시 연결 시도</li>
            </ul>
          </div>

          {/* Currently supported wallets */}
          <div className="border-t border-border pt-3">
            <h4 className="font-medium mb-2 text-sm">🔥 현재 지원 가능한 지갑</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <img 
                  src="https://phantom.app/img/meta/phantom-logo.png" 
                  alt="Phantom" 
                  className="w-4 h-4 rounded-sm"
                  onError={(e) => {e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iNCIgZmlsbD0iIzUzM0I4NSIvPgo8cGF0aCBkPSJNOCA0QzEwLjIwOTEgNCA2IDE0IDYgMTQgNiAxNCA2IDEwIDggMTBTMTAgMTQgMTAgMTRIMTJDMTQgOC40NzcxNSAxMS41MjI4IDQgOCA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg=='}}
                />
                <span>Phantom</span>
              </div>
              <div className="flex items-center gap-2">
                <img 
                  src="https://solflare.com/assets/solflare-logo.svg" 
                  alt="Solflare" 
                  className="w-4 h-4 rounded-sm"
                  onError={(e) => {e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iNCIgZmlsbD0iI0ZGNjkwMCIvPgo8cGF0aCBkPSJNOCA0QzEwIDQgMTIgNiAxMiA4QzEyIDEwIDEwIDEyIDggMTJDNiAxMiA0IDEwIDQgOEM0IDYgNiA0IDggNFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo='}}
                />
                <span>Solflare</span>
              </div>
              <div className="flex items-center gap-2">
                <img 
                  src="https://avatars.githubusercontent.com/u/18060234?s=280&v=4" 
                  alt="Coinbase" 
                  className="w-4 h-4 rounded-sm"
                  onError={(e) => {e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iOCIgZmlsbD0iIzAwNTJGRiIvPgo8cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiByeD0iMiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg=='}}
                />
                <span>Coinbase Wallet</span>
              </div>
              <div className="flex items-center gap-2">
                <img 
                  src="https://trustwallet.com/assets/images/media/assets/trust_platform.svg" 
                  alt="Trust Wallet" 
                  className="w-4 h-4 rounded-sm"
                  onError={(e) => {e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iNCIgZmlsbD0iIzAwNzJGRiIvPgo8cGF0aCBkPSJNOCAyQzEwIDIgMTIgNCA5IDE0QzggMTQgNiAxNCA0IDE0QzQgNCA2IDIgOCAyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg=='}}
                />
                <span>Trust Wallet</span>
              </div>
              <div className="flex items-center gap-2">
                <img 
                  src="https://app.tor.us/img/torus-logo-blue.svg" 
                  alt="Torus" 
                  className="w-4 h-4 rounded-sm"
                  onError={(e) => {e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjgiIGZpbGw9IiMwMDY0RkYiLz4KPGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjQiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo='}}
                />
                <span>Torus</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileDetector({ children }: { children: React.ReactNode }) {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <>
      {children}
      {showGuide && <MobileGuide onClose={() => setShowGuide(false)} />}
    </>
  );
}