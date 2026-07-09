import { useEffect, useRef } from "react";

export const InteractiveOrb = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width;
    let height = canvas.height;

    // Node definitions
    interface Node {
      x: number;
      y: number;
      z: number; // 3D coordinates
      vx: number;
      vy: number;
      vz: number;
    }

    const numNodes = 48;
    const nodes: Node[] = [];
    const maxDistance = 110;

    // Mouse positions
    let mouseX = 0;
    let mouseY = 0;
    let isMouseOver = false;

    // Initialize nodes inside a spherical volume (representing a brain/globe node network)
    for (let i = 0; i < numNodes; i++) {
      // Uniform random points on a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 100 + Math.random() * 80; // sphere radius range

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      nodes.push({
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.3,
      });
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width * dpr;
      height = rect.height * dpr;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", resize);
    resize();

    // 3D rotation speeds
    const baseAngleX = 0.001;
    const baseAngleY = 0.0012;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Center of canvas
      const cx = width / 2;
      const cy = height / 2;

      // Mouse interactive rotation additions
      let rotY = baseAngleY;
      let rotX = baseAngleX;
      if (isMouseOver) {
        // Map mouse coordinates to rotation vectors
        rotY += (mouseX - cx) * 0.00002;
        rotX += -(mouseY - cy) * 0.00002;
      }

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // Update positions & 3D rotation
      nodes.forEach((node) => {
        // Rotate around Y axis
        let x1 = node.x * cosY - node.z * sinY;
        let z1 = node.z * cosY + node.x * sinY;

        // Rotate around X axis
        let y2 = node.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + node.y * sinX;

        node.x = x1;
        node.y = y2;
        node.z = z2;

        // Add subtle local float movements
        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;

        // Contain nodes within spherical bounds
        const distFromCenter = Math.sqrt(node.x * node.x + node.y * node.y + node.z * node.z);
        if (distFromCenter > 180) {
          node.vx *= -1;
          node.vy *= -1;
          node.vz *= -1;
        }
      });

      // Projection factor (camera focal length)
      const fov = 350;

      // Draw connections (translucent gradient lines)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];

          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dz = n1.z - n2.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < maxDistance) {
            // Camera perspective projection for n1
            const scale1 = fov / (fov + n1.z);
            const x1 = cx + n1.x * scale1;
            const y1 = cy + n1.y * scale1;

            // Camera perspective projection for n2
            const scale2 = fov / (fov + n2.z);
            const x2 = cx + n2.x * scale2;
            const y2 = cy + n2.y * scale2;

            // Fade lines based on distance and average z-depth
            const avgZ = (n1.z + n2.z) / 2;
            const depthFade = Math.max(0.1, (180 - avgZ) / 360);
            const distFade = 1 - dist / maxDistance;
            const opacity = distFade * depthFade * 0.45;

            // Draw connecting line
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            
            // Subtle theme gradient (purple to pink to blue)
            const grad = ctx.createLinearGradient(x1, y1, x2, y2);
            grad.addColorStop(0, `rgba(168, 85, 247, ${opacity})`); // purple
            grad.addColorStop(0.5, `rgba(236, 72, 153, ${opacity * 0.85})`); // pink
            grad.addColorStop(1, `rgba(56, 189, 248, ${opacity})`); // blue
            
            ctx.strokeStyle = grad;
            ctx.lineWidth = Math.max(0.5, scale1 * 0.8);
            ctx.stroke();
          }
        }
      }

      // Draw nodes (points with glowing rings)
      nodes.forEach((node) => {
        const scale = fov / (fov + node.z);
        const px = cx + node.x * scale;
        const py = cy + node.y * scale;

        // Size based on depth projection
        const radius = Math.max(1, scale * 3.5);
        
        // Depth opacity: closer nodes are brighter, further nodes are faded
        const depthOpacity = Math.max(0.15, (180 - node.z) / 360);

        // Glowing ring
        ctx.beginPath();
        ctx.arc(px, py, radius * 2.5, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(px, py, 0, px, py, radius * 2.5);
        glow.addColorStop(0, `rgba(255, 255, 255, ${depthOpacity})`);
        glow.addColorStop(0.4, `rgba(139, 92, 246, ${depthOpacity * 0.7})`); // purple glow
        glow.addColorStop(1, "rgba(139, 92, 246, 0)");
        ctx.fillStyle = glow;
        ctx.fill();
        
        // Solid white core center
        ctx.beginPath();
        ctx.arc(px, py, radius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${depthOpacity * 0.95})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
      isMouseOver = true;
    };

    const handleMouseLeave = () => {
      isMouseOver = false;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* Background ambient glow behind constellation */}
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-purple-500/10 via-pink-500/5 to-blue-500/10 blur-3xl opacity-50 scale-90" />
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-[450px] aspect-square cursor-pointer"
      />
    </div>
  );
};
