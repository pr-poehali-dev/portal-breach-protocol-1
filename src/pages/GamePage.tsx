import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalGame from '@/components/game/PortalGame';
import Icon from '@/components/ui/icon';

export default function GamePage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden">
      <PortalGame />
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white/60 hover:text-white hover:border-white/50 transition-all text-xs font-mono uppercase tracking-widest backdrop-blur-sm"
      >
        <Icon name="ArrowLeft" size={14} />
        На сайт
      </button>
    </div>
  );
}
