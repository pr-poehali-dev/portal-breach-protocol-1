import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const HERO_IMG = 'https://cdn.poehali.dev/projects/42980457-f622-4c23-91a9-9939a8f84d65/files/2234b2b2-d51a-43a4-aea2-c41be8119ed9.jpg';
const GUN_IMG = 'https://cdn.poehali.dev/projects/42980457-f622-4c23-91a9-9939a8f84d65/files/fa9e76cd-e389-4e83-93b9-393b972a099c.jpg';

const NAV = [
  { id: 'home', label: 'Главная' },
  { id: 'about', label: 'О игре' },
  { id: 'gallery', label: 'Галерея' },
  { id: 'news', label: 'Новости' },
  { id: 'specs', label: 'Требования' },
  { id: 'download', label: 'Скачать' },
];

const FEATURES = [
  { icon: 'Aperture', color: 'blue', title: 'Портальная пушка', text: 'Создавай синие и оранжевые порталы, перемещайся, переноси объекты и перенаправляй лазеры.' },
  { icon: 'Crosshair', color: 'orange', title: 'Desert Eagle', text: 'Однозарядное оружие с мощной отдачей. Разрушай преграды и сражайся с охранными системами.' },
  { icon: 'Boxes', color: 'blue', title: 'Физические головоломки', text: 'Кубы, кнопки, лазеры, энергосферы и поля антиэкспонирования в десятках тестовых камер.' },
  { icon: 'Bot', color: 'orange', title: 'Враги и угрозы', text: 'Дроны-сканеры, турели, роботы-ремонтники и блуждающие энергетические аномалии.' },
];

const GALLERY = [
  { type: 'screenshot', level: 'Лаборатория', enemy: 'Дрон', img: HERO_IMG, title: 'Тестовая камера 01' },
  { type: 'video', level: 'Лаборатория', enemy: 'Турель', img: GUN_IMG, title: 'Бой с турелью' },
  { type: 'screenshot', level: 'Реактор', enemy: 'Робот', img: GUN_IMG, title: 'Зал реактора' },
  { type: 'screenshot', level: 'Реактор', enemy: 'Аномалия', img: HERO_IMG, title: 'Энергетическая аномалия' },
  { type: 'video', level: 'Архив', enemy: 'Дрон', img: HERO_IMG, title: 'Прохождение архива' },
  { type: 'screenshot', level: 'Архив', enemy: 'Робот', img: GUN_IMG, title: 'Коридор ремонтников' },
];

const LEVELS = ['Все', 'Лаборатория', 'Реактор', 'Архив'];
const ENEMIES = ['Все', 'Дрон', 'Турель', 'Робот', 'Аномалия'];

const NEWS = [
  { date: '12 июня 2026', tag: 'Обновление', title: 'Патч 1.4 — новая глава «Реактор»', text: 'Добавлены 8 тестовых камер, тип врага «робот-ремонтник» и система временных порталов.' },
  { date: '28 мая 2026', tag: 'Анонс', title: 'Кооперативный режим в разработке', text: 'Два игрока, четыре портала. Готовим совместное прохождение головоломок.' },
  { date: '10 мая 2026', tag: 'Сообщество', title: 'Конкурс пользовательских камер', text: 'Создавай свои уровни в редакторе и побеждай. Призовой фонд — 100 000 ₽.' },
];

const SPECS = {
  min: [
    { l: 'ОС', v: 'Windows 10 64-bit' },
    { l: 'Процессор', v: 'Intel Core i5-6600 / Ryzen 5 1600' },
    { l: 'Память', v: '8 GB RAM' },
    { l: 'Видеокарта', v: 'GTX 1060 6GB / RX 580' },
    { l: 'Место', v: '40 GB SSD' },
  ],
  rec: [
    { l: 'ОС', v: 'Windows 11 64-bit' },
    { l: 'Процессор', v: 'Intel Core i7-10700 / Ryzen 7 3700X' },
    { l: 'Память', v: '16 GB RAM' },
    { l: 'Видеокарта', v: 'RTX 3060 / RX 6700 XT' },
    { l: 'Место', v: '40 GB NVMe SSD' },
  ],
};

const DOWNLOADS = [
  { icon: 'Monitor', name: 'Steam', desc: 'PC / Windows', price: '1 999 ₽' },
  { icon: 'Gamepad2', name: 'Epic Games', desc: 'PC / Windows', price: '1 999 ₽' },
  { icon: 'Box', name: 'GOG', desc: 'PC / без DRM', price: '1 999 ₽' },
];

export default function Index() {
  const navigate = useNavigate();
  const [levelFilter, setLevelFilter] = useState('Все');
  const [enemyFilter, setEnemyFilter] = useState('Все');

  const filtered = GALLERY.filter(
    (g) =>
      (levelFilter === 'Все' || g.level === levelFilter) &&
      (enemyFilter === 'Все' || g.enemy === enemyFilter)
  );

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <button onClick={() => scrollTo('home')} className="flex items-center gap-2">
            <div className="relative w-7 h-7">
              <span className="absolute inset-0 rounded-full border-2 border-portal-blue animate-portal-spin" />
              <span className="absolute inset-1 rounded-full border-2 border-portal-orange" />
            </div>
            <span className="font-display text-lg tracking-widest">BREACH<span className="text-portal-orange">·</span>PROTOCOL</span>
          </button>
          <nav className="hidden lg:flex items-center gap-7">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => scrollTo(n.id)}
                className="text-sm uppercase tracking-wider text-muted-foreground hover:text-portal-blue transition-colors"
              >
                {n.label}
              </button>
            ))}
          </nav>
          <Button onClick={() => navigate('/play')} className="bg-portal-blue text-primary-foreground hover:bg-portal-blue/90 glow-blue font-display tracking-wide">
            Играть
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section id="home" className="relative min-h-screen flex items-center overflow-hidden grid-bg">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Лаборатория" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        </div>
        <div className="absolute -left-20 top-1/3 w-72 h-72 rounded-full bg-portal-blue/30 animate-glow-pulse" />
        <div className="absolute -right-20 bottom-1/4 w-72 h-72 rounded-full bg-portal-orange/30 animate-glow-pulse" style={{ animationDelay: '2s' }} />

        <div className="container relative z-10 pt-20">
          <div className="max-w-3xl animate-fade-in">
            <Badge className="mb-6 bg-portal-orange/15 text-portal-orange border border-portal-orange/40 uppercase tracking-widest">
              Anomaly Dynamics — Доступ восстановлен
            </Badge>
            <h1 className="text-5xl md:text-8xl font-display leading-[0.9] mb-6">
              Portal:<br />
              <span className="text-portal-blue text-glow-blue">Breach</span>{' '}
              <span className="text-portal-orange text-glow-orange">Protocol</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8 font-body">
              Головоломка-шутер от первого лица. Открывай порталы, переигрывай гравитацию и сражайся с охранными системами заброшенной лаборатории 80-х.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={() => navigate('/play')} className="bg-portal-blue text-primary-foreground hover:bg-portal-blue/90 glow-blue font-display tracking-wide text-base h-12 px-8">
                <Icon name="Gamepad2" className="mr-2" size={20} /> Играть в браузере
              </Button>
              <Button size="lg" onClick={() => scrollTo('download')} className="bg-portal-orange text-secondary-foreground hover:bg-portal-orange/90 glow-orange font-display tracking-wide text-base h-12 px-8">
                <Icon name="Download" className="mr-2" size={20} /> Скачать
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollTo('gallery')} className="border-white/30 text-white/70 hover:bg-white/10 font-display tracking-wide text-base h-12 px-8">
                <Icon name="Play" className="mr-2" size={20} /> Галерея
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground animate-float">
          <Icon name="ChevronsDown" size={28} />
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-24 relative">
        <div className="container">
          <div className="flex items-end justify-between mb-14 flex-wrap gap-4">
            <div>
              <span className="text-portal-orange font-display tracking-widest text-sm">// О ИГРЕ</span>
              <h2 className="text-4xl md:text-6xl font-display mt-2">Механики, что ломают реальность</h2>
            </div>
            <p className="text-muted-foreground max-w-md font-body">
              Комплекс Anomaly Dynamics хранит секреты давней катастрофы. Каждая камера — испытание для ума и реакции.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group relative p-6 rounded-xl bg-card border border-border hover:border-portal-blue/50 transition-all hover-scale animate-scale-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${f.color === 'blue' ? 'bg-portal-blue/15 text-portal-blue' : 'bg-portal-orange/15 text-portal-orange'}`}>
                  <Icon name={f.icon} size={26} />
                </div>
                <h3 className="text-xl mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground font-body">{f.text}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center rounded-2xl overflow-hidden border border-border bg-card">
            <div className="p-8 md:p-12">
              <h3 className="text-3xl mb-4">Стреляй сквозь порталы</h3>
              <p className="text-muted-foreground font-body mb-6">
                Используй отдачу пистолета для микро-прыжков, поражай цели за углом через портал и нейтрализуй энергетические аномалии, перенаправив их в поглотитель.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Стрельба через портал', 'Отдача-прыжок', 'Перенаправление лазеров', 'Поля антиэкспонирования'].map((t) => (
                  <span key={t} className="text-xs uppercase tracking-wider px-3 py-1.5 rounded-full bg-muted text-muted-foreground border border-border">{t}</span>
                ))}
              </div>
            </div>
            <div className="relative h-64 lg:h-full min-h-[300px]">
              <img src={GUN_IMG} alt="Портальная пушка" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-card via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="py-24 bg-muted/30 border-y border-border">
        <div className="container">
          <span className="text-portal-blue font-display tracking-widest text-sm">// ГАЛЕРЕЯ</span>
          <h2 className="text-4xl md:text-6xl font-display mt-2 mb-8">Скриншоты и видео</h2>

          <div className="flex flex-col gap-4 mb-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground mr-2 w-16">Уровень</span>
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevelFilter(l)}
                  className={`px-4 py-1.5 rounded-full text-sm uppercase tracking-wider border transition-all ${levelFilter === l ? 'bg-portal-blue text-primary-foreground border-portal-blue glow-blue' : 'border-border text-muted-foreground hover:border-portal-blue/50'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground mr-2 w-16">Враг</span>
              {ENEMIES.map((e) => (
                <button
                  key={e}
                  onClick={() => setEnemyFilter(e)}
                  className={`px-4 py-1.5 rounded-full text-sm uppercase tracking-wider border transition-all ${enemyFilter === e ? 'bg-portal-orange text-secondary-foreground border-portal-orange glow-orange' : 'border-border text-muted-foreground hover:border-portal-orange/50'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((g) => (
              <div key={g.title} className="group relative rounded-xl overflow-hidden border border-border hover-scale animate-scale-in aspect-video">
                <img src={g.img} alt={g.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                {g.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-portal-blue/90 flex items-center justify-center glow-blue group-hover:scale-110 transition-transform">
                      <Icon name="Play" size={24} className="text-primary-foreground ml-1" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 p-4">
                  <div className="flex gap-2 mb-2">
                    <Badge className="bg-portal-blue/20 text-portal-blue border-0 text-[10px]">{g.level}</Badge>
                    <Badge className="bg-portal-orange/20 text-portal-orange border-0 text-[10px]">{g.enemy}</Badge>
                  </div>
                  <p className="font-display text-sm tracking-wide">{g.title}</p>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12 font-body">Нет материалов под выбранные фильтры.</p>
          )}
        </div>
      </section>

      {/* NEWS */}
      <section id="news" className="py-24">
        <div className="container">
          <span className="text-portal-orange font-display tracking-widest text-sm">// НОВОСТИ</span>
          <h2 className="text-4xl md:text-6xl font-display mt-2 mb-12">Обновления и анонсы</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {NEWS.map((n, i) => (
              <article
                key={n.title}
                className="p-6 rounded-xl bg-card border border-border hover:border-portal-orange/50 transition-all hover-scale animate-scale-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-portal-orange/15 text-portal-orange border border-portal-orange/30 uppercase text-[10px] tracking-wider">{n.tag}</Badge>
                  <span className="text-xs text-muted-foreground">{n.date}</span>
                </div>
                <h3 className="text-xl mb-3 leading-tight">{n.title}</h3>
                <p className="text-sm text-muted-foreground font-body mb-4">{n.text}</p>
                <button className="text-sm text-portal-blue font-display tracking-wide flex items-center gap-1 hover:gap-2 transition-all">
                  Читать <Icon name="ArrowRight" size={16} />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SPECS */}
      <section id="specs" className="py-24 bg-muted/30 border-y border-border">
        <div className="container">
          <span className="text-portal-blue font-display tracking-widest text-sm">// ТРЕБОВАНИЯ</span>
          <h2 className="text-4xl md:text-6xl font-display mt-2 mb-12">Системные требования</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { label: 'Минимальные', data: SPECS.min, color: 'blue' },
              { label: 'Рекомендуемые', data: SPECS.rec, color: 'orange' },
            ].map((block) => (
              <div key={block.label} className={`rounded-xl border bg-card overflow-hidden ${block.color === 'blue' ? 'border-portal-blue/40' : 'border-portal-orange/40'}`}>
                <div className={`px-6 py-4 font-display tracking-widest text-lg ${block.color === 'blue' ? 'bg-portal-blue/10 text-portal-blue' : 'bg-portal-orange/10 text-portal-orange'}`}>
                  {block.label}
                </div>
                <div className="divide-y divide-border">
                  {block.data.map((row) => (
                    <div key={row.l} className="flex justify-between gap-4 px-6 py-3.5">
                      <span className="text-sm text-muted-foreground uppercase tracking-wider">{row.l}</span>
                      <span className="text-sm text-right font-body">{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 max-w-3xl">
            <h3 className="text-2xl mb-4">Частые вопросы</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="1">
                <AccordionTrigger className="font-display tracking-wide">Поддерживается ли геймпад?</AccordionTrigger>
                <AccordionContent className="font-body text-muted-foreground">Да, полная поддержка контроллеров Xbox и PlayStation, а также гибкая настройка управления.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="2">
                <AccordionTrigger className="font-display tracking-wide">Есть ли русская озвучка?</AccordionTrigger>
                <AccordionContent className="font-body text-muted-foreground">Игра полностью локализована: интерфейс, субтитры и озвучка системы безопасности на русском языке.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="3">
                <AccordionTrigger className="font-display tracking-wide">Будет ли кооператив?</AccordionTrigger>
                <AccordionContent className="font-body text-muted-foreground">Кооперативный режим на двоих находится в активной разработке и выйдет бесплатным обновлением.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* PLAY NOW CTA */}
      <section id="download" className="py-24 relative overflow-hidden grid-bg">
        <div className="absolute left-1/4 top-0 w-80 h-80 rounded-full bg-portal-blue/20 animate-glow-pulse" />
        <div className="absolute right-1/4 bottom-0 w-80 h-80 rounded-full bg-portal-orange/20 animate-glow-pulse" style={{ animationDelay: '2s' }} />
        <div className="container relative z-10 text-center">
          <h2 className="text-4xl md:text-7xl font-display mb-4">Войди в <span className="text-portal-blue text-glow-blue">портал</span></h2>
          <p className="text-muted-foreground font-body max-w-xl mx-auto mb-10">214 тестовых камер. Физика. Враги. Прямо в браузере — без установки.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/play')} className="bg-portal-blue text-primary-foreground hover:bg-portal-blue/90 glow-blue font-display tracking-wide text-lg h-14 px-12">
              <Icon name="Gamepad2" className="mr-3" size={22} /> Играть бесплатно
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollTo('about')} className="border-white/20 text-white/70 hover:bg-white/10 font-display tracking-wide text-lg h-14 px-10">
              <Icon name="Info" className="mr-3" size={22} /> О игре
            </Button>
          </div>
          <p className="text-white/25 text-xs font-mono mt-6 uppercase tracking-widest">Уровень 1 из 214 · Anomaly Dynamics Test Complex</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6">
              <span className="absolute inset-0 rounded-full border-2 border-portal-blue animate-portal-spin" />
              <span className="absolute inset-1 rounded-full border-2 border-portal-orange" />
            </div>
            <span className="font-display tracking-widest text-sm">BREACH·PROTOCOL</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Anomaly Dynamics. Все права защищены.</p>
          <div className="flex gap-4">
            {['Twitter', 'Youtube', 'MessageCircle'].map((s) => (
              <button key={s} className="text-muted-foreground hover:text-portal-blue transition-colors">
                <Icon name={s} size={20} />
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}