import React, { useEffect, useState } from 'react';
import { Download, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { canInstall, isIOS, isInstalled, promptInstall } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  if (isInstalled) return null;

  const handleClick = async () => {
    if (canInstall) {
      await promptInstall();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 rounded-lg border border-[#2E86FF]/40 bg-[#2E86FF]/15 text-[#529BFF] hover:bg-[#2E86FF]/25 transition-colors font-medium whitespace-nowrap shrink-0 min-h-[40px] ${
          compact ? 'px-3 py-2 text-xs' : 'w-full px-3.5 py-2.5 text-xs'
        }`}
        aria-label="Install Football Mtaani mobile app"
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span>{compact ? 'Install App' : 'Install Mobile App (PWA)'}</span>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-[#121824] border border-white/15 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src="/icon.svg" alt="Football Mtaani icon" className="w-9 h-9 rounded-lg" />
                <div>
                  <h3 className="text-sm font-bold text-white">Install Football Mtaani</h3>
                  <p className="text-xs text-slate-400">Play 3D matches full-screen on mobile</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Close install guide"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-mono text-[#2E86FF]">01.</span>
                  <span>
                    Tap the <Share className="w-3.5 h-3.5 inline text-[#2E86FF] mx-0.5" /> <strong>Share</strong> icon in Safari&apos;s toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono text-[#2E86FF]">02.</span>
                  <span>
                    Scroll down and select <strong>Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono text-[#2E86FF]">03.</span>
                  <span>
                    Launch <strong>Mtaani FC</strong> from your home screen in standalone 3D game mode.
                  </span>
                </li>
              </ol>
            ) : (
              <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <p className="flex items-start gap-2">
                  <Download className="w-4 h-4 text-[#2E86FF] shrink-0 mt-0.5" />
                  <span>
                    Open your browser menu (Chrome / Edge / Samsung Internet) and choose{' '}
                    <strong>Install App</strong> or <strong>Add to Home Screen</strong> to run Football Mtaani as a standalone mobile game.
                  </span>
                </p>
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#2E86FF] rounded-lg hover:bg-[#529BFF]"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 lg:bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-semibold shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Mode · 3D Match & Local Career Saved</span>
    </div>
  );
};
