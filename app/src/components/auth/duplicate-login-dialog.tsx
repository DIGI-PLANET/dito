'use client';

import { useState } from 'react';
import { Session, getSessionDisplayInfo, deactivateOtherSessions } from '@/lib/session-manager';

interface DuplicateLoginDialogProps {
  existingSessions: Session[];
  onKeepExisting: () => void;
  onReplaceExisting: () => void;
}

export function DuplicateLoginDialog({ 
  existingSessions, 
  onKeepExisting, 
  onReplaceExisting 
}: DuplicateLoginDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleReplaceExisting = async () => {
    setIsLoading(true);
    try {
      const walletAddress = existingSessions[0]?.wallet_address;
      if (walletAddress) {
        await deactivateOtherSessions(walletAddress);
        onReplaceExisting();
      }
    } catch (error) {
      console.error('[DuplicateLogin] Error replacing sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold mb-2">중복 로그인 감지</h3>
          <p className="text-sm text-muted-foreground">
            이 지갑으로 다른 기기에서 이미 로그인되어 있습니다
          </p>
        </div>

        {/* Existing Sessions List */}
        <div className="space-y-3 mb-6">
          <h4 className="font-medium text-sm">활성 세션:</h4>
          {existingSessions.map((session) => {
            const info = getSessionDisplayInfo(session);
            return (
              <div key={session.id} className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{info.deviceName}</span>
                  {info.isCurrent && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                      현재 기기
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  <div>마지막 활동: {info.lastActive}</div>
                  <div>위치: {info.location}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleReplaceExisting}
            disabled={isLoading}
            className="w-full bg-[var(--ember)] hover:bg-[#e85d2c] disabled:opacity-50 text-white rounded-xl py-3 font-semibold"
          >
            {isLoading ? '처리 중...' : '다른 세션 종료 후 로그인'}
          </button>
          
          <button
            onClick={onKeepExisting}
            disabled={isLoading}
            className="w-full bg-muted hover:bg-muted/80 text-foreground rounded-xl py-3 font-medium"
          >
            취소 (기존 세션 유지)
          </button>
        </div>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          보안상 한 번에 하나의 기기에서만 로그인할 수 있습니다
        </p>
      </div>
    </div>
  );
}