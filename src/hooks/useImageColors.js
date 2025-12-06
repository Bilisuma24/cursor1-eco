import { useState, useEffect, useRef } from 'react';

/**
 * Extracts dominant colors from an image using Canvas API
 * @param {string} imageUrl - URL of the image to extract colors from
 * @param {number} colorCount - Number of dominant colors to extract (default: 2)
 * @returns {Object} - { colors: string[], loading: boolean, error: Error | null }
 */
export function useImageColors(imageUrl, colorCount = 2) {
  // Initialize with fallback colors so component doesn't break
  const getFallbackColors = () => Array(colorCount).fill('rgb(200, 200, 200)');
  const [colors, setColors] = useState(getFallbackColors());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cache colors by image URL to avoid re-extraction (use ref to persist across renders)
  const colorCacheRef = useRef(new Map());
  const colorCache = colorCacheRef.current;

  useEffect(() => {
    const fallbackColors = getFallbackColors();
    
    if (!imageUrl || imageUrl === 'https://via.placeholder.com/300' || imageUrl === 'https://via.placeholder.com/200') {
      setColors(fallbackColors);
      setLoading(false);
      return;
    }

    // Check cache first
    if (colorCache.has(imageUrl)) {
      const cachedColors = colorCache.get(imageUrl);
      setColors(cachedColors && cachedColors.length > 0 ? cachedColors : fallbackColors);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const extractColors = () => {
      const img = new Image();
      // Only set crossOrigin if the image is from a different origin
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        try {
          img.crossOrigin = 'anonymous';
        } catch (e) {
          // Ignore CORS errors, will fallback to neutral colors
        }
      }

      img.onload = () => {
        try {
          // Create a small canvas for faster processing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Use a smaller size for performance (max 200px)
          const maxSize = 200;
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          try {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          } catch (drawError) {
            // CORS or other draw error
            throw new Error('Cannot access image data due to CORS restrictions');
          }

          // Sample pixels from multiple regions for better color representation
          let imageData;
          try {
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          } catch (getDataError) {
            // CORS error accessing image data
            throw new Error('Cannot access image data due to CORS restrictions');
          }
          const pixels = imageData.data;
          
          // Sample from center and corners
          const samples = [];
          const width = canvas.width;
          const height = canvas.height;
          
          // Center region (most important)
          const centerX = Math.floor(width / 2);
          const centerY = Math.floor(height / 2);
          const centerRadius = Math.min(width, height) * 0.3;
          
          // Sample pixels
          for (let y = 0; y < height; y += 4) {
            for (let x = 0; x < width; x += 4) {
              const idx = (y * width + x) * 4;
              const r = pixels[idx];
              const g = pixels[idx + 1];
              const b = pixels[idx + 2];
              const a = pixels[idx + 3];
              
              // Skip transparent pixels
              if (a < 128) continue;
              
              // Weight center pixels more heavily
              const dx = x - centerX;
              const dy = y - centerY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const weight = distance < centerRadius ? 2 : 1;
              
              samples.push({ r, g, b, weight });
            }
          }

          // Cluster colors using a simple k-means approach
          const extractedColors = clusterColors(samples, colorCount);
          
          // Convert to CSS rgb format
          const cssColors = extractedColors.map(color => 
            `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`
          );

          // Cache the result
          colorCache.set(imageUrl, cssColors);
          setColors(cssColors);
          setLoading(false);
        } catch (err) {
          console.error('Error extracting colors:', err);
          setError(err);
          // Fallback to neutral colors
          const fallbackColors = Array(colorCount).fill('rgb(150, 150, 150)');
          setColors(fallbackColors);
          setLoading(false);
        }
      };

      img.onerror = () => {
        setError(new Error('Failed to load image'));
        // Fallback to neutral colors
        const fallbackColors = Array(colorCount).fill('rgb(150, 150, 150)');
        setColors(fallbackColors);
        setLoading(false);
      };

      img.src = imageUrl;
    };

    extractColors();
  }, [imageUrl, colorCount]);

  return { colors, loading, error };
}

/**
 * Simple k-means clustering to find dominant colors
 */
function clusterColors(samples, k) {
  if (samples.length === 0) {
    return Array(k).fill({ r: 150, g: 150, b: 150 });
  }

  // Initialize centroids randomly from samples
  const centroids = [];
  for (let i = 0; i < k; i++) {
    const randomSample = samples[Math.floor(Math.random() * samples.length)];
    centroids.push({ r: randomSample.r, g: randomSample.g, b: randomSample.b });
  }

  // Iterate a few times to refine clusters
  for (let iteration = 0; iteration < 5; iteration++) {
    const clusters = Array(k).fill(null).map(() => []);
    
    // Assign samples to nearest centroid
    samples.forEach(sample => {
      let minDist = Infinity;
      let nearestCluster = 0;
      
      centroids.forEach((centroid, idx) => {
        const dist = colorDistance(sample, centroid) / sample.weight;
        if (dist < minDist) {
          minDist = dist;
          nearestCluster = idx;
        }
      });
      
      clusters[nearestCluster].push(sample);
    });

    // Update centroids
    centroids.forEach((centroid, idx) => {
      if (clusters[idx].length > 0) {
        let totalR = 0, totalG = 0, totalB = 0, totalWeight = 0;
        clusters[idx].forEach(sample => {
          totalR += sample.r * sample.weight;
          totalG += sample.g * sample.weight;
          totalB += sample.b * sample.weight;
          totalWeight += sample.weight;
        });
        
        centroid.r = totalR / totalWeight;
        centroid.g = totalG / totalWeight;
        centroid.b = totalB / totalWeight;
      }
    });
  }

  // Sort by brightness (luminance) - brightest first
  centroids.sort((a, b) => {
    const lumA = 0.299 * a.r + 0.587 * a.g + 0.114 * a.b;
    const lumB = 0.299 * b.r + 0.587 * b.g + 0.114 * b.b;
    return lumB - lumA;
  });

  return centroids;
}

/**
 * Calculate color distance (Euclidean distance in RGB space)
 */
function colorDistance(c1, c2) {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

