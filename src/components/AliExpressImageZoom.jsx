import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function AliExpressImageZoom({
    images = [],
    initialIndex = 0,
    zoomRatio = 2.5,
    lensOpacity = 0.25,
    className = '',
    aspectClass = 'aspect-[16/10]',
    onChange = () => {}
}) {
    const [index, setIndex] = useState(initialIndex);
	const [hovering, setHovering] = useState(false);
	const [cursorPct, setCursorPct] = useState({ x: 50, y: 50 });
	const [showModal, setShowModal] = useState(false);

	const containerRef = useRef(null);
	const imageRef = useRef(null);
	const rafRef = useRef(null);

    const src = useMemo(() => images[index] || images[0] || '', [images, index]);

    // keep external state informed
    useEffect(() => { onChange(index); }, [index]);

	// Track container size for lens math
	const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
	useEffect(() => {
		const updateSize = () => {
			if (!containerRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			setContainerSize({ w: rect.width, h: rect.height });
		};
		updateSize();
		window.addEventListener('resize', updateSize);
		return () => window.removeEventListener('resize', updateSize);
	}, []);

	// Lens size based on zoomRatio and preview size
	const lensW = Math.max(80, Math.min(containerSize.w * 0.3, 120));
	const lensH = Math.max(80, Math.min(containerSize.h * 0.3, 120));

	// Move handler (requestAnimationFrame to avoid jank)
	const queueCursorUpdate = (clientX, clientY) => {
		if (!containerRef.current) return;
		if (rafRef.current) cancelAnimationFrame(rafRef.current);
		rafRef.current = requestAnimationFrame(() => {
			const rect = containerRef.current.getBoundingClientRect();
			const x = (clientX - rect.left) / rect.width;
			const y = (clientY - rect.top) / rect.height;
			// Clamp to keep lens fully inside
			const clampedX = Math.max(lensW / 2 / rect.width, Math.min(1 - lensW / 2 / rect.width, x));
			const clampedY = Math.max(lensH / 2 / rect.height, Math.min(1 - lensH / 2 / rect.height, y));
			setCursorPct({ x: clampedX * 100, y: clampedY * 100 });
		});
	};

	const onMouseEnter = () => setHovering(true);
	const onMouseLeave = () => setHovering(false);
	const onMouseMove = (e) => queueCursorUpdate(e.clientX, e.clientY);

	// Touch: open modal on tap (mobile), no hover zoom
	const onTouchStart = () => setShowModal(true);

	return (
		<div className={`flex flex-col gap-0 md:gap-4 ${className}`}>
			{/* Main image with self-zoom - AliExpress style */}
			<div className="relative w-full">
				<div
					ref={containerRef}
                    className={`relative border-0 md:border border-gray-100 bg-white overflow-hidden w-full select-none rounded-none md:rounded ${aspectClass}`}
					onMouseEnter={onMouseEnter}
					onMouseLeave={onMouseLeave}
					onMouseMove={onMouseMove}
					onTouchStart={onTouchStart}
				>
					{src ? (
						<>
							{/* Base image */}
							<img ref={imageRef} src={src} alt="Product" className="block w-full h-full object-contain object-center md:object-cover p-4 md:p-0" style={{ objectPosition: 'center center' }} />
							
							{/* Zoomed overlay image */}
							<img 
								src={src} 
								alt="Product zoomed" 
								className={`absolute top-0 left-0 w-full h-auto object-contain object-center transition-opacity duration-75 ${hovering ? 'opacity-100' : 'opacity-0'}`}
								style={{
									transform: `scale(${zoomRatio})`,
									transformOrigin: `${cursorPct.x}% ${cursorPct.y}%`,
									pointerEvents: 'none',
									objectPosition: 'center center'
								}}
							/>
						</>
					) : (
						<div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
					)}

					{/* Lens indicator (desktop only) */}
					<div
						className={`pointer-events-none hidden md:block absolute border-2 transition-opacity duration-75 ${hovering ? 'opacity-100' : 'opacity-0'}`}
						style={{
							width: `${lensW}px`,
							height: `${lensH}px`,
							left: `calc(${cursorPct.x}% - ${lensW / 2}px)`,
							top: `calc(${cursorPct.y}% - ${lensH / 2}px)`,
							borderColor: 'rgba(255,255,255,0.9)',
							boxShadow: '0 0 8px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(0,0,0,0.1)',
							cursor: 'crosshair'
						}}
					/>
				</div>
			</div>

			{/* Mobile thumbnail gallery */}
			{images.length > 1 && (
				<div className="mt-2 md:hidden">
					<div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
						{images.map((s, i) => (
							<button
								key={i}
								onClick={() => setIndex(i)}
								className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 border-2 rounded-md overflow-hidden touch-manipulation transition-all ${
									i === index 
										? 'border-blue-500 ring-2 ring-blue-200 shadow-md' 
										: 'border-gray-200 hover:border-gray-300'
								}`}
								aria-label={`Select image ${i + 1}`}
							>
								<img src={s} alt={`thumb-${i + 1}`} className="w-full h-full object-cover" />
							</button>
						))}
					</div>
				</div>
			)}

			{/* Desktop thumbnail gallery */}
			{images.length > 1 && (
				<div className="hidden md:grid grid-cols-6 gap-2 mt-2">
					{images.map((s, i) => (
						<button
							key={i}
							onClick={() => setIndex(i)}
							className={`aspect-square border-2 rounded overflow-hidden transition-all ${i === index ? 'ring-2 ring-gray-900 border-gray-900' : 'border-gray-200 hover:border-gray-400'}`}
							aria-label={`Select image ${i + 1}`}
						>
							<img src={s} alt={`thumb-${i + 1}`} className="w-full h-full object-cover" />
						</button>
					))}
				</div>
			)}

			{/* Mobile fullscreen modal */}
			{showModal && (
				<div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
					<div className="relative max-w-7xl w-full max-h-full" onClick={(e) => e.stopPropagation()}>
						<img src={src} alt="Zoomed" className="mx-auto max-h-[85vh] w-auto object-contain select-none" />
						<button onClick={() => setShowModal(false)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white w-11 h-11 rounded-full flex items-center justify-center">✕</button>
					</div>
				</div>
			)}
		</div>
	);
}
