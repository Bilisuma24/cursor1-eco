import { useEffect, useMemo, useRef, useState } from 'react';

export default function ProductMediaViewer({
  images = [],
  spinImages = [],
  initialIndex = 0,
  onChange,
}) {
  const [index, setIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [mode, setMode] = useState('image'); // 'image' | '360'
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(initialIndex);
  const [autoSpinFrames, setAutoSpinFrames] = useState([]);
  const containerRef = useRef(null);
  const lightboxRef = useRef(null);

  const currentSrc = useMemo(() => images[index] || images[0], [images, index]);

  // Auto-detect 360° frames from images if sequentially numbered
  useEffect(() => {
    if (!images || images.length === 0) return;
    const groups = new Map();
    const numberRegex = /(.*?)(?:_|-|\b)(\d{2,4})(?=\D|$)/; // base_001, base-001, base001
    images.forEach((src) => {
      const name = typeof src === 'string' ? src : '';
      const match = name.match(numberRegex);
      if (match) {
        const base = match[1];
        const num = parseInt(match[2], 10);
        const key = base;
        const arr = groups.get(key) || [];
        arr.push({ num, src });
        groups.set(key, arr);
      }
    });
    let best = [];
    groups.forEach((arr) => {
      if (arr.length > best.length) best = arr;
    });
    if (best.length >= 12) {
      best.sort((a, b) => a.num - b.num);
      setAutoSpinFrames(best.map((x) => x.src));
    } else {
      setAutoSpinFrames([]);
    }
  }, [images]);

  const has360 = (spinImages && spinImages.length > 0) || (autoSpinFrames && autoSpinFrames.length > 0);
  const frames360 = (spinImages && spinImages.length > 0) ? spinImages : autoSpinFrames;

  const handleSelect = (i) => {
    setIndex(i);
    onChange && onChange(i);
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const next = () => handleSelect((index + 1) % images.length);
  const prev = () => handleSelect((index - 1 + images.length) % images.length);

  // Lightbox controls
  const openLightbox = (i) => {
    setLightboxIndex(i ?? index);
    setShowLightbox(true);
  };
  const closeLightbox = () => setShowLightbox(false);
  const lightboxPrev = () => setLightboxIndex((i) => (i - 1 + images.length) % images.length);
  const lightboxNext = () => setLightboxIndex((i) => (i + 1) % images.length);

  // Keyboard navigation when lightbox open
  useEffect(() => {
    if (!showLightbox) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lightboxPrev();
      if (e.key === 'ArrowRight') lightboxNext();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showLightbox, images.length]);

  // Swipe handling in lightbox
  const swipeState = useRef({ x: 0, y: 0, active: false });
  const onTouchStart = (e) => {
    swipeState.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, active: true };
  };
  const onTouchEnd = (e) => {
    if (!swipeState.current.active) return;
    const dx = (e.changedTouches?.[0]?.clientX || 0) - swipeState.current.x;
    if (Math.abs(dx) > 40) {
      if (dx > 0) lightboxPrev(); else lightboxNext();
    }
    swipeState.current.active = false;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded text-sm ${mode === 'image' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}
            onClick={() => setMode('image')}
          >Images</button>
          {has360 && (
            <button
              className={`px-3 py-1 rounded text-sm ${mode === '360' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}
              onClick={() => setMode(mode === '360' ? 'image' : '360')}
            >360°</button>
          )}
        </div>
      </div>

      {mode === 'image' ? (
        <div className="grid grid-cols-1 md:grid-cols-[88px_1fr] gap-3">
          {/* Thumbnails - vertical on desktop, horizontal on mobile */}
          {images.length > 1 && (
            <div className="order-2 md:order-1 md:h-[520px] md:overflow-y-auto md:pr-1">
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-hidden pb-2">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    className={`shrink-0 w-20 h-20 md:w-full md:h-auto md:aspect-square border rounded overflow-hidden transition-transform ${i === index ? 'ring-2 ring-gray-900 border-gray-900' : 'hover:scale-[1.02]'}`}
                    aria-label={`Select image ${i + 1}`}
                  >
                    <img src={src} alt={`thumb-${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main image */}
          <div className="order-1 md:order-2">
            <div
              ref={containerRef}
              className="relative overflow-hidden rounded-lg border aspect-square bg-white group"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              onClick={() => openLightbox(index)}
            >
              {currentSrc && (
                <img
                  src={currentSrc}
                  alt="Product"
                  className="w-full h-full object-cover transition-transform duration-75 ease-out cursor-zoom-in will-change-transform"
                  style={
                    isZoomed
                      ? { transform: 'scale(1.8)', transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                      : { transform: 'scale(0.96)', transformOrigin: '50% 50%' }
                  }
                />
              )}

              {/* Magnifier cursor indicator */}
              {isZoomed && (
                <div
                  className="pointer-events-none absolute w-24 h-24 rounded-full border-2 border-white/80 shadow-[0_0_0_2px_rgba(0,0,0,0.2)]"
                  style={{ left: `calc(${zoomPos.x}% - 3rem)`, top: `calc(${zoomPos.y}% - 3rem)` }}
                />
              )}

              {/* Nav */}
              {images.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-9 h-9 flex items-center justify-center shadow">‹</button>
                  <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-9 h-9 flex items-center justify-center shadow">›</button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <ThreeSixtyViewer frames={frames360} />
      )}

      {/* Lightbox */}
      {showLightbox && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
          onClick={closeLightbox}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="relative max-w-7xl w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[lightboxIndex]}
              alt={`Image ${lightboxIndex + 1}`}
              className="mx-auto max-h-[80vh] w-auto object-contain select-none"
            />
            {images.length > 1 && (
              <>
                <button onClick={lightboxPrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white w-12 h-12 rounded-full flex items-center justify-center">‹</button>
                <button onClick={lightboxNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white w-12 h-12 rounded-full flex items-center justify-center">›</button>
              </>
            )}
            <button onClick={closeLightbox} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white w-11 h-11 rounded-full flex items-center justify-center">✕</button>
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/90 text-sm">
                {lightboxIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ThreeSixtyViewer({ frames = [] }) {
  const [frame, setFrame] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [lastX, setLastX] = useState(0);

  const onDown = (e) => { setDragging(true); setLastX(e.clientX || e.touches?.[0]?.clientX || 0); };
  const onUp = () => setDragging(false);
  const onMove = (e) => {
    if (!dragging) return;
    const x = e.clientX || e.touches?.[0]?.clientX || 0;
    const delta = x - lastX;
    if (Math.abs(delta) > 4) {
      const dir = delta > 0 ? -1 : 1;
      setFrame((f) => (f + dir + frames.length) % frames.length);
      setLastX(x);
    }
  };

  return (
    <div
      className="relative select-none"
      onMouseDown={onDown}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onMouseMove={onMove}
      onTouchStart={onDown}
      onTouchEnd={onUp}
      onTouchMove={onMove}
    >
      <div className="aspect-square border rounded-lg overflow-hidden bg-white">
        {frames[frame] && (
          <img src={frames[frame]} alt={`frame-${frame}`} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs bg-black/60 text-white px-2 py-1 rounded">Drag to rotate</div>
    </div>
  );
}
