import { useEffect, useRef, useState } from 'react';
import { GameEngine } from './engine';

export default function PortalGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [started, setStarted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [bluePortal, setBluePortal] = useState(false);
  const [orangePortal, setOrangePortal] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;
    engine.buildLevel();
    engine.resize(container.clientWidth, container.clientHeight);

    engine.start(() => {
      setBluePortal(!!engine.bluePortal);
      setOrangePortal(!!engine.orangePortal);
      setLocked(engine.isPointerLocked);
    });

    engine.setupControls(container);

    const onResize = () => {
      engine.resize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      engine.dispose();
    };
  }, []);

  const handleStart = () => {
    setStarted(true);
    setTimeout(() => {
      containerRef.current?.requestPointerLock();
    }, 100);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black select-none" style={{ cursor: locked ? 'none' : 'default' }}>
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Crosshair */}
      {locked && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-6 h-6">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/80" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/80" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white" />
          </div>
        </div>
      )}

      {/* HUD - portal status */}
      {started && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 pointer-events-none">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${bluePortal ? 'border-blue-400 bg-blue-500/20 shadow-[0_0_15px_#3b82f6]' : 'border-white/20 bg-white/5'}`}>
            <div className={`w-3 h-3 rounded-full ${bluePortal ? 'bg-blue-400' : 'bg-white/30'}`} />
            <span className="text-xs uppercase tracking-widest font-mono text-white/70">LMB</span>
          </div>
          <div className="text-white/30 text-xs font-mono uppercase tracking-widest">PORTALGUN</div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${orangePortal ? 'border-orange-400 bg-orange-500/20 shadow-[0_0_15px_#f97316]' : 'border-white/20 bg-white/5'}`}>
            <span className="text-xs uppercase tracking-widest font-mono text-white/70">RMB</span>
            <div className={`w-3 h-3 rounded-full ${orangePortal ? 'bg-orange-400' : 'bg-white/30'}`} />
          </div>
        </div>
      )}

      {/* Controls hint */}
      {locked && (
        <div className="absolute top-4 right-4 pointer-events-none text-right">
          <div className="text-white/30 text-[10px] font-mono uppercase tracking-widest space-y-0.5">
            <div>WASD — движение</div>
            <div>ПРОБЕЛ — прыжок</div>
            <div>ЛКМ — синий портал</div>
            <div>ПКМ — оранжевый портал</div>
            <div>ESC — курсор</div>
          </div>
        </div>
      )}

      {/* Click to unlock */}
      {started && !locked && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
          onClick={() => containerRef.current?.requestPointerLock()}
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-2 border-white/50 flex items-center justify-center mx-auto mb-4">
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
            <p className="text-white font-mono uppercase tracking-widest text-sm">Кликни для продолжения</p>
          </div>
        </div>
      )}

      {/* Start screen */}
      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90">
          <div className="text-center max-w-md px-6">
            {/* Portal logo animation */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-spin" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-3 rounded-full border-4 border-orange-500 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
            </div>

            <h1 className="text-4xl font-display tracking-widest text-white mb-2">
              BREACH<span className="text-orange-400">·</span>PROTOCOL
            </h1>
            <p className="text-white/50 text-sm font-mono mb-2">Anomaly Dynamics — Тестовая камера 01</p>

            <div className="my-8 space-y-2 text-left bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-white/80 text-xs font-mono uppercase tracking-widest mb-3 text-portal-blue" style={{ color: '#60a5fa' }}>Управление</p>
              {[
                ['WASD', 'Движение'],
                ['ПРОБЕЛ', 'Прыжок'],
                ['ЛКМ', 'Синий портал'],
                ['ПКМ', 'Оранжевый портал'],
                ['ESC', 'Пауза / курсор'],
              ].map(([key, action]) => (
                <div key={key} className="flex justify-between gap-8">
                  <span className="text-white/40 text-xs font-mono">{key}</span>
                  <span className="text-white/70 text-xs font-mono">{action}</span>
                </div>
              ))}
            </div>

            <p className="text-white/40 text-xs font-mono mb-6">
              Стреляй порталами по белым панелям. Войди в синий — выйди из оранжевого.
            </p>

            <button
              onClick={handleStart}
              className="w-full py-3 rounded-lg font-mono uppercase tracking-widest text-sm text-black transition-all"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 0 30px #3b82f640' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 50px #3b82f680')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 30px #3b82f640')}
            >
              Начать испытание
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
