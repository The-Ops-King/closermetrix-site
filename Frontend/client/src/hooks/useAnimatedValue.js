import { useState, useEffect, useRef } from 'react';

/**
 * Smoothly animates a numeric value using requestAnimationFrame.
 *
 * CSS transitions via MUI's sx prop don't work reliably because Emotion
 * regenerates class names on re-render instead of updating properties
 * in-place. This hook provides a JS-based alternative that's guaranteed
 * to produce smooth animations regardless of the styling approach.
 *
 * @param {number} target - The target value to animate toward
 * @param {number} [duration=400] - Animation duration in milliseconds
 * @returns {number} The current animated value
 */
export default function useAnimatedValue(target, duration = 400) {
  const [current, setCurrent] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    if (prevRef.current === target) return;

    const from = prevRef.current;
    const start = performance.now();

    function animate(now) {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out cubic — fast start, smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(from + (target - from) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
    prevRef.current = target;
  }, [target, duration]);

  return current;
}
