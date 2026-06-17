import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './engine';
import { LEVELS } from './levels';

const TOTAL = LEVELS.length;

export default function PortalGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [started, setStarted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [levelIdx, setLevelIdx] = useState(0);
  const [blueActive, setBlueActive] = useState(false);
  const [orangeActive, setOrangeActive] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completedLevel, setCompletedLevel] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);

  const goToLevel = useCallback((idx: number) => {
    const eng = engineRef.current;
    if (!eng) return;
    setShowComplete(false);
    setFadeIn(true);
    setTimeout(() => {
      eng.loadLevel(idx);
      setFadeIn(false);
    }, 400);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;
    engine.resize(container.clientWidth, container.clientHeight);
    engine.loadLevel(0);

    engine.onLevelChange = (idx) => setLevelIdx(idx);

    engine.onLevelComplete = (idx) => {
      setCompletedLevel(idx);
      setShowComplete(true);
    };

    engine.start(() => {
      setBlueActive(!!engine.bluePortal);
      setOrangeActive(!!engine.orangePortal);
      setLocked(engine.isPointerLocked);
    });

    engine.setupControls(container);

    const onResize = () => engine.resize(container.clientWidth, container.clientHeight);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      engine.dispose();
    };
  }, []);

  const handleStart = () => {
    setStarted(true);
    setTimeout(() => containerRef.current?.requestPointerLock(), 100);
  };

  const handleNextLevel = () => {
    const next = completedLevel + 1;
    if (next < TOTAL) goToLevel(next);
  };

  const def = LEVELS[levelIdx];
  const progress = ((levelIdx + 1) / TOTAL) * 100;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black select-none overflow-hidden"
      style={{ cursor: locked ? 'none' : 'default' }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Fade overlay for level transitions */}
      <div
        className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-400"
        style={{ opacity: fadeIn ? 1 : 0 }}
      />

      {/* Crosshair — Portal 2 style */}
      {locked && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative" style={{ width: 28, height: 28 }}>
            {/* Gap crosshair */}
            <div className="absolute bg-white/90" style={{ top: '50%', left: 0, right: 14, height: 1, transform: 'translateY(-50%)' }} />
            <div className="absolute bg-white/90" style={{ top: '50%', right: 0, left: 14, height: 1, transform: 'translateY(-50%)' }} />
            <div className="absolute bg-white/90" style={{ left: '50%', top: 0, bottom: 14, width: 1, transform: 'translateX(-50%)' }} />
            <div className="absolute bg-white/90" style={{ left: '50%', bottom: 0, top: 14, width: 1, transform: 'translateX(-50%)' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/80" />
          </div>
        </div>
      )}

      {/* TOP HUD — level info */}
      {started && (
        <div className="absolute top-0 inset-x-0 pointer-events-none">
          {/* Level bar */}
          <div className="h-0.5 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="text-white/90 font-mono text-xs uppercase tracking-widest">
                Камера <span className="text-cyan-300 font-bold text-sm">{String(levelIdx + 1).padStart(2, '0')}</span>
                <span className="text-white/30 mx-1">/</span>
                <span className="text-white/40">{TOTAL}</span>
              </div>
              <div className="hidden sm:block text-white/30 font-mono text-xs">|</div>
              <div className="hidden sm:block text-white/40 font-mono text-xs uppercase tracking-wider">{def?.name}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-white/30 font-mono text-[10px] uppercase tracking-widest">
                {Math.round(progress)}% пройдено
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM HUD — portal gun status */}
      {started && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full"
            style={{ background: 'rgba(10,15,25,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>

            {/* Blue portal */}
            <div className={`flex items-center gap-2 transition-all duration-300 ${blueActive ? 'opacity-100' : 'opacity-40'}`}>
              <div className="relative">
                <div className={`w-5 h-5 rounded-full border-2 transition-all ${blueActive ? 'border-blue-400 shadow-[0_0_10px_#3b82f6]' : 'border-white/25'}`}
                  style={blueActive ? { background: 'radial-gradient(circle, #60a5fa55, #1d4ed820)' } : {}} />
                {blueActive && <div className="absolute inset-0 rounded-full animate-ping border border-blue-400 opacity-40" />}
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">ЛКМ</span>
            </div>

            <div className="w-px h-4 bg-white/15" />
            <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25">PORTALGUN mk2</div>
            <div className="w-px h-4 bg-white/15" />

            {/* Orange portal */}
            <div className={`flex items-center gap-2 transition-all duration-300 ${orangeActive ? 'opacity-100' : 'opacity-40'}`}>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">ПКМ</span>
              <div className="relative">
                <div className={`w-5 h-5 rounded-full border-2 transition-all ${orangeActive ? 'border-orange-400 shadow-[0_0_10px_#f97316]' : 'border-white/25'}`}
                  style={orangeActive ? { background: 'radial-gradient(circle, #fb923c55, #7c2d1220)' } : {}} />
                {orangeActive && <div className="absolute inset-0 rounded-full animate-ping border border-orange-400 opacity-40" />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls hint — top right */}
      {locked && (
        <div className="absolute top-14 right-4 pointer-events-none">
          <div className="text-right space-y-0.5" style={{ opacity: 0.35 }}>
            {[['WASD', 'движение'], ['ПРОБЕЛ', 'прыжок'], ['SHIFT', 'бег'], ['ЛКМ', 'синий портал'], ['ПКМ', 'оранжевый портал'], ['ESC', 'пауза']].map(([k, v]) => (
              <div key={k} className="flex gap-3 justify-end">
                <span className="text-white/50 text-[10px] font-mono">{v}</span>
                <span className="text-cyan-400/60 text-[10px] font-mono w-14 text-right">{k}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hint text */}
      {locked && def?.hint && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="text-white/35 font-mono text-[11px] uppercase tracking-widest text-center px-4">
            {def.hint}
          </div>
        </div>
      )}

      {/* Level complete overlay */}
      {showComplete && (
        <div className="absolute inset-0 flex items-center justify-center z-40"
          style={{ background: 'rgba(4,10,20,0.88)', backdropFilter: 'blur(8px)' }}>
          <div className="text-center max-w-sm px-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: 'radial-gradient(circle, #00ff8840, #00ff8808)', border: '2px solid #00ff8870', boxShadow: '0 0 30px #00ff8840' }}>
              <span className="text-green-400 text-2xl">✓</span>
            </div>
            <p className="text-green-400/70 font-mono text-xs uppercase tracking-[0.3em] mb-2">Тест пройден</p>
            <h2 className="text-white font-display text-3xl mb-1">Камера {String(completedLevel + 1).padStart(2, '0')}</h2>
            <p className="text-white/30 font-mono text-xs mb-8">
              {completedLevel + 1 < TOTAL ? `Следующая: Камера ${String(completedLevel + 2).padStart(2, '0')}` : 'Все 214 камер пройдены!'}
            </p>
            {completedLevel + 1 < TOTAL ? (
              <button
                onClick={handleNextLevel}
                className="w-full py-3 rounded-lg font-mono uppercase tracking-widest text-sm text-black font-bold transition-all"
                style={{ background: 'linear-gradient(135deg, #00aaff, #0055ee)', boxShadow: '0 0 25px #00aaff40' }}
              >
                Следующая камера →
              </button>
            ) : (
              <div className="text-yellow-400 font-mono text-sm uppercase tracking-widest">🏆 Комплекс пройден</div>
            )}
            <button
              onClick={() => { setShowComplete(false); containerRef.current?.requestPointerLock(); }}
              className="mt-3 w-full py-2 rounded-lg font-mono text-xs text-white/40 hover:text-white/70 transition-colors uppercase tracking-widest"
            >
              Продолжить исследование
            </button>
          </div>
        </div>
      )}

      {/* Paused — pointer not locked */}
      {started && !locked && !showComplete && (
        <div
          className="absolute inset-0 flex items-center justify-center z-30 cursor-pointer"
          style={{ background: 'rgba(4,10,20,0.72)', backdropFilter: 'blur(6px)' }}
          onClick={() => containerRef.current?.requestPointerLock()}
        >
          <div className="text-center">
            <div className="w-14 h-14 rounded-full border border-white/30 flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[14px] border-t-transparent border-b-transparent border-l-white/80 ml-1" />
            </div>
            <p className="text-white/70 font-mono uppercase tracking-widest text-sm">Кликни для продолжения</p>
            <p className="text-white/30 font-mono text-xs mt-2 uppercase tracking-wider">Камера {String(levelIdx + 1).padStart(2, '0')} · Anomaly Dynamics</p>
          </div>
        </div>
      )}

      {/* Start screen */}
      {!started && (
        <div className="absolute inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(4,8,18,0.96)' }}>
          <div className="text-center max-w-md w-full px-8">
            {/* Animated portal logo */}
            <div className="relative w-28 h-28 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-blue-400/60"
                style={{ animation: 'spin 4s linear infinite', boxShadow: '0 0 20px #3b82f640' }} />
              <div className="absolute inset-2 rounded-full border-3 border-orange-400/60"
                style={{ animation: 'spin 2.5s linear reverse infinite', boxShadow: '0 0 15px #f9731640', borderWidth: 3 }} />
              <div className="absolute inset-5 rounded-full border border-white/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white/80" />
              </div>
            </div>

            <div className="text-white/25 font-mono text-[10px] uppercase tracking-[0.4em] mb-3">
              Anomaly Dynamics · Test Complex
            </div>
            <h1 className="font-display text-5xl text-white mb-1" style={{ textShadow: '0 0 40px rgba(0,150,255,0.4)' }}>
              BREACH
            </h1>
            <h1 className="font-display text-5xl mb-6" style={{ color: '#ff6600', textShadow: '0 0 40px rgba(255,100,0,0.4)' }}>
              PROTOCOL
            </h1>

            <div className="mb-6 p-4 rounded-xl text-left space-y-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-cyan-400/60 font-mono text-[10px] uppercase tracking-widest mb-3">Управление</p>
              {[['WASD', 'движение'], ['ПРОБЕЛ', 'прыжок'], ['SHIFT', 'бег'], ['ЛКМ', 'синий портал'], ['ПКМ', 'оранжевый портал'], ['ESC', 'пауза / курсор']].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-white/30 font-mono text-xs">{v}</span>
                  <span className="text-cyan-300/60 font-mono text-xs">{k}</span>
                </div>
              ))}
            </div>

            <p className="text-white/25 font-mono text-xs mb-7 uppercase tracking-wider">
              214 тестовых камер · стреляй по белым панелям
            </p>

            <button
              onClick={handleStart}
              className="w-full py-3.5 rounded-xl font-mono uppercase tracking-widest text-sm font-bold transition-all"
              style={{
                background: 'linear-gradient(135deg, #0088ee, #0044cc)',
                color: '#fff',
                boxShadow: '0 0 30px #0088ee30',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 50px #0088ee60')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 30px #0088ee30')}
            >
              Начать испытание — Камера 01
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
