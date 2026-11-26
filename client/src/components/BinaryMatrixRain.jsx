import { useEffect, useRef } from 'react';

/**
 * BinaryMatrixRain
 * Renders cascading streams of green binary numbers ('0' and '1')
 * streaming downwards on a deep black background (Matrix aesthetic).
 */
export default function BinaryMatrixRain({
  opacity = 0.55,
  fontSize = 15,
  speed = 33, // ms per frame (~30 fps)
  className = ''
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let lastTime = 0;

    // Characters: predominantly binary numbers (0, 1), with subtle hacker glyphs
    const characters = ['0', '1', '0', '1', '1', '0', '0', '1', '0', '1', '0', '1', '<', '>', '/', '#', '*', '0', '1'];

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let columns = Math.floor(width / fontSize);
    // Array holding y-position for each column
    let drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -50));
    // Array holding individual column speeds
    let speeds = Array.from({ length: columns }, () => 0.8 + Math.random() * 0.8);

    function handleResize() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.floor(width / fontSize);
      drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -50));
      speeds = Array.from({ length: columns }, () => 0.8 + Math.random() * 0.8);
    }

    window.addEventListener('resize', handleResize);

    function draw(currentTime) {
      animationFrameId = requestAnimationFrame(draw);

      if (currentTime - lastTime < speed) return;
      lastTime = currentTime;

      // Semi-transparent black wash to create fading rain trail
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px "JetBrains Mono", "Fira Code", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = characters[Math.floor(Math.random() * characters.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Leading char is bright white-green glow
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00ff66';
        ctx.fillStyle = '#e6fffa';
        ctx.fillText(char, x, y);

        // Subsequent trail char is neon Matrix green
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#00ff41';
        ctx.fillStyle = i % 3 === 0 ? '#00ff66' : '#10b981';
        ctx.fillText(char, x, y - fontSize);

        // Reset shadow
        ctx.shadowBlur = 0;

        // Reset drop to top with randomized delay once it leaves screen
        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
          speeds[i] = 0.8 + Math.random() * 0.8;
        }

        drops[i] += speeds[i];
      }
    }

    // Initial black screen fill
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [fontSize, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}
