import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function AliExpressImageZoom({
    images = [],
    initialIndex = 0,
    zoomRatio = 3,
    previewWidth = 360,
    previewHeight, // optional; defaults to main image aspect
    lensOpacity = 0.25,
    className = '',
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

	// Derive preview height if not provided (square by default)
	const effectivePreviewHeight = previewHeight || previewWidth;

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
	const lensW = Math.max(30, Math.min(containerSize.w, previewWidth / zoomRatio));
	const lensH = Math.max(30, Math.min(containerSize.h, effectivePreviewHeight / zoomRatio));

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

	// Background size and position for preview
	const bgSizeX = containerSize.w * zoomRatio;
	const bgSizeY = containerSize.h * zoomRatio;
	const bgPosX = (cursorPct.x / 100) * bgSizeX - (previewWidth / 2);
	const bgPosY = (cursorPct.y / 100) * bgSizeY - (effectivePreviewHeight / 2);

	return (
		<div className={`grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_${previewWidth}px] gap-4 ${className}`}>
			{/* Main image with lens */}
			<div
				ref={containerRef}
				className="relative rounded-lg border bg-white overflow-hidden aspect-square select-none"
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				onMouseMove={onMouseMove}
				onTouchStart={onTouchStart}
			>
				{src ? (
					<img ref={imageRef} src={src} alt="Product" className="w-full h-full object-cover" />
				) : (
					<div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
				)}

				{/* Lens (desktop only) */}
				<div
					className={`pointer-events-none hidden md:block absolute transition-opacity duration-150 ${hovering ? 'opacity-100' : 'opacity-0'}`}
					style={{
						width: `${lensW}px`,
						height: `${lensH}px`,
						left: `calc(${cursorPct.x}% - ${lensW / 2}px)`,
						top: `calc(${cursorPct.y}% - ${lensH / 2}px)`,
						backgroundColor: `rgba(0,0,0,${lensOpacity})`,
						outline: '2px solid rgba(255,255,255,0.9)',
						boxShadow: '0 0 0 2px rgba(0,0,0,0.2)'
					}}
				/>
			</div>

			{/* Side preview (desktop only) */}
			<div className="hidden md:block">
				<div
					className={`relative rounded-lg border overflow-hidden bg-white transition-opacity duration-150 ${hovering ? 'opacity-100' : 'opacity-0'}`}
					style={{ width: `${previewWidth}px`, height: `${effectivePreviewHeight}px` }}
				>
					{src && (
						<div
							className="absolute inset-0"
							style={{
								backgroundImage: `url(${src})`,
								backgroundRepeat: 'no-repeat',
								backgroundSize: `${bgSizeX}px ${bgSizeY}px`,
								backgroundPosition: `-${Math.max(0, Math.min(bgSizeX - previewWidth, bgPosX))}px -${Math.max(0, Math.min(bgSizeY - effectivePreviewHeight, bgPosY))}px`,
								transition: 'background-position 40ms linear' // snappy, low-latency feel
							}}
						/>
					)}
				</div>

				{/* Thumbnails (optional, if multiple images) */}
				{images.length > 1 && (
					<div className="mt-3 grid grid-cols-6 gap-2">
						{images.map((s, i) => (
                        <button
								key={i}
                            onClick={() => setIndex(i)}
								className={`aspect-square border rounded overflow-hidden ${i === index ? 'ring-2 ring-gray-900' : ''}`}
								aria-label={`Select image ${i + 1}`}
							>
								<img src={s} alt={`thumb-${i + 1}`} className="w-full h-full object-cover" />
							</button>
						))}
					</div>
				)}
			</div>

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
