"use client";

import { useEffect, useRef } from "react";

export default function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const DOT_SPACING = 32;
    const DOT_RADIUS = 0.8;
    const ACCENT = [124, 111, 247]; // #7c6ff7

    function resize() {
      if (!canvas || !canvas.parentElement) return;
      const parent = canvas.parentElement;
      w = parent.offsetWidth;
      h = parent.offsetHeight;
      if (w === 0 || h === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(time: number) {
      if (!canvas || !ctx || w === 0) return;
      ctx.clearRect(0, 0, w, h);

      const t = time / 1000;
      const centerX = w / 2;
      const centerY = h * 0.38;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

      const cols = Math.ceil(w / DOT_SPACING) + 1;
      const rows = Math.ceil(h / DOT_SPACING) + 1;
      const offsetX = (w % DOT_SPACING) / 2;
      const offsetY = (h % DOT_SPACING) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = offsetX + c * DOT_SPACING;
          const y = offsetY + r * DOT_SPACING;

          // Distance from center — dots fade out toward edges
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const distFade = Math.max(0, 1 - dist / (maxDist * 0.85));

          // Gentle wave pulse rippling outward from center
          const wave = Math.sin(dist * 0.015 - t * 0.8) * 0.5 + 0.5;
          const alpha = distFade * (0.12 + wave * 0.18);

          if (alpha < 0.02) continue;

          ctx.beginPath();
          ctx.arc(x, y, DOT_RADIUS + wave * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${ACCENT[0]},${ACCENT[1]},${ACCENT[2]},${alpha})`;
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    const initTimeout = setTimeout(() => {
      resize();
      animRef.current = requestAnimationFrame(draw);
    }, 100);

    window.addEventListener("resize", resize);
    return () => {
      clearTimeout(initTimeout);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        opacity: 0.5,
      }}
    />
  );
}
