import { useEffect, useRef } from "react";

export const DashboardGraph = () => {
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
      z: number;
      vx: number;
      vy: number;
      vz: number;
      label?: string;
    }

    const numNodes = 36;
    const nodes: Node[] = [];
    const maxDistance = 90;

    // Mouse coordinates
    let mouseX = 0;
    let mouseY = 0;
    let isMouseOver = false;

    // Dynamic mock labels representing vector documents in Memorix RAG index
    const mockLabels = [
      "Handbook.pdf",
      "Decision #242",
      "Slack: #eng-sync",
      "Notion: InfoSec",
      "Q3_Planning.docx"
    ];

    // Initialize nodes inside a spherical volume
    for (let i = 0; i < numNodes; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 60 + Math.random() * 60; // sphere radius range

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      nodes.push({
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        vz: (Math.random() - 0.5) * 0.25,
        // Assign a mock label to a few nodes
        label: i < mockLabels.length ? mockLabels[i] : undefined,
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
    const baseAngleX = 0.0008;
    const baseAngleY = 0.001;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Mouse interactive rotation
      let rotY = baseAngleY;
      let rotX = baseAngleX;
      if (isMouseOver) {
        rotY += (mouseX - cx) * 0.00003;
        rotX += -(mouseY - cy) * 0.00003;
      }

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // Update positions and apply 3D rotation matrix
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

        // Subtle floating movement
        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;

        // Boundaries check (contain nodes in a globe shape)
        const dist = Math.sqrt(node.x * node.x + node.y * node.y + node.z * node.z);
        if (dist > 130) {
          node.vx *= -1;
          node.vy *= -1;
          node.vz *= -1;
        }

        // Mouse magnetic pull towards mouse projection vector
        if (isMouseOver) {
          const targetX = (mouseX - cx) * 0.4;
          const targetY = (mouseY - cy) * 0.4;
          const dx = targetX - node.x;
          const dy = targetY - node.y;
          const distToMouse = Math.sqrt(dx * dx + dy * dy);
          if (distToMouse < 100) {
            node.x += dx * 0.005;
            node.y += dy * 0.005;
          }
        }
      });

      // Projection factor (camera focal length)
      const fov = 280;

      // Draw connection lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];

          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dz = n1.z - n2.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < maxDistance) {
            const scale1 = fov / (fov + n1.z);
            const x1 = cx + n1.x * scale1;
            const y1 = cy + n1.y * scale1;

            const scale2 = fov / (fov + n2.z);
            const x2 = cx + n2.x * scale2;
            const y2 = cy + n2.y * scale2;

            const avgZ = (n1.z + n2.z) / 2;
            const depthFade = Math.max(0.1, (130 - avgZ) / 260);
            const distFade = 1 - dist / maxDistance;
            const opacity = distFade * depthFade * 0.45;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);

            const grad = ctx.createLinearGradient(x1, y1, x2, y2);
            grad.addColorStop(0, `rgba(168, 85, 247, ${opacity})`); // purple
            grad.addColorStop(1, `rgba(59, 130, 246, ${opacity})`); // blue
            ctx.strokeStyle = grad;
            ctx.lineWidth = Math.max(0.4, scale1 * 0.6);
            ctx.stroke();
          }
        }
      }

      // Draw nodes and labels
      nodes.forEach((node) => {
        const scale = fov / (fov + node.z);
        const px = cx + node.x * scale;
        const py = cy + node.y * scale;

        const radius = Math.max(1, scale * 2.8);
        const depthOpacity = Math.max(0.15, (130 - node.z) / 260);

        // Core fill (white center, outer glowing ring)
        ctx.beginPath();
        ctx.arc(px, py, radius * 2.2, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(px, py, 0, px, py, radius * 2.2);
        glow.addColorStop(0, `rgba(255, 255, 255, ${depthOpacity})`);
        glow.addColorStop(0.4, `rgba(168, 85, 247, ${depthOpacity * 0.7})`); // purple
        glow.addColorStop(1, "rgba(168, 85, 247, 0)");
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, radius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${depthOpacity * 0.95})`;
        ctx.fill();

        // Draw floating text labels for selected index points
        if (node.label && node.z < 20) { // Only show label when node is closer to foreground
          ctx.font = "700 8px monospace";
          ctx.fillStyle = `rgba(236, 72, 153, ${depthOpacity * 0.95})`; // pink tone
          ctx.fillText(node.label, px + 8, py + 3);
          
          // Draw a tiny pointer line to the text label
          ctx.beginPath();
          ctx.moveTo(px + 2, py);
          ctx.lineTo(px + 6, py);
          ctx.strokeStyle = `rgba(236, 72, 153, ${depthOpacity * 0.4})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
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
    <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden rounded-xl border border-black/[0.06] dark:border-white/5 bg-white/5 dark:bg-[#09090b]/40 backdrop-blur-md p-4 min-h-[280px]">
      <div className="absolute top-4 left-4 z-10">
        <p className="text-[10px] font-mono tracking-widest text-purple-500 uppercase">Semantic Memory Graph</p>
        <h4 className="text-xs font-semibold text-fg-secondary/80 mt-0.5">Active Vector Connections</h4>
      </div>
      
      <div className="absolute bottom-4 right-4 z-10 text-right">
        <p className="text-[9px] font-mono text-fg-secondary/60">STATUS: VECTOR OK</p>
        <p className="text-[9px] font-mono text-purple-500/80">36 NODES INDEXED</p>
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-tr from-purple-500/5 via-transparent to-blue-500/5 blur-2xl opacity-40" />
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-[400px] aspect-square cursor-crosshair"
      />
    </div>
  );
};
