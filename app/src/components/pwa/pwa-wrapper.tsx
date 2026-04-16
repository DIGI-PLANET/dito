'use client';

import { useEffect, useState } from 'react';
import { registerServiceWorker, addOfflineListener, isOffline } from '@/lib/pwa';

interface PWAWrapperProps {
  children: React.ReactNode;
}

export function PWAWrapper({ children }: PWAWrapperProps) {
  const [offline, setOffline] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Register service worker
    registerServiceWorker();
    
    // Set initial offline state
    setOffline(isOffline());
    
    // Listen for online/offline changes
    const removeListener = addOfflineListener(setOffline);
    
    return removeListener;
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Offline indicator */}
      {offline && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-yellow-500 text-black text-center py-1 text-xs font-medium">
          ⚠️ 오프라인 상태 - 일부 기능이 제한될 수 있습니다
        </div>
      )}
      
      {/* Main content */}
      <div className={offline ? 'mt-6' : ''}>
        {children}
      </div>
    </>
  );
}