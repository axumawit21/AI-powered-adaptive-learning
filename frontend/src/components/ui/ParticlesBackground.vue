<template>
  <canvas
    ref="canvas"
    class="absolute inset-0 pointer-events-none z-0"
  ></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";

const props = defineProps({
  variant: {
    type: String,
    default: "default",
  },
});

const canvas = ref(null);
let animationFrameId;

// Configuration for different variants
// Configuration for different variants
const getVariantConfig = (variant) => {
  const configs = {
    biology: {
      color: "147, 197, 253", // Blue-300
      shapes: ["soft-circle", "dna"],
      connectionColor: "147, 197, 253",
      speed: 0.15,
      behavior: "pulse",
      glow: 10,
    },
    physics: {
      color: "147, 197, 253", // Blue-300
      shapes: ["atom", "electron"],
      connectionColor: "147, 197, 253",
      speed: 0.2,
      behavior: "atomic",
      glow: 15,
    },
    math: {
      color: "147, 197, 253", // Blue-300
      shapes: [
        "sum",
        "root",
        "integral",
        "infinity",
        "pi",
        "x",
        "y",
        "pythagoras",
        "euler",
        "derivative",
        "trig",
      ],
      connectionColor: "147, 197, 253",
      speed: 0.1,
      behavior: "geometric",
      glow: 5,
    },
    geography: {
      color: "147, 197, 253", // Blue-300
      shapes: ["contour", "compass"],
      connectionColor: "147, 197, 253",
      speed: 0.1,
      behavior: "drift",
      glow: 8,
    },
    history: {
      color: "147, 197, 253", // Blue-300
      shapes: ["hourglass", "pillar", "scroll"],
      connectionColor: "147, 197, 253",
      speed: 0.12,
      behavior: "time-flow",
      glow: 12,
    },
    chemistry: {
      color: "147, 197, 253", // Blue-300
      shapes: ["hexagon", "molecule", "atom"], // Added explicit molecule/atom
      connectionColor: "147, 197, 253",
      speed: 0.15,
      behavior: "reaction",
      glow: 8,
    },
    english: {
      color: "147, 197, 253", // Blue-300
      shapes: ["letter", "quote"],
      connectionColor: "147, 197, 253",
      speed: 0.15,
      behavior: "float",
      glow: 8,
    },
    default: {
      color: "147, 197, 253", // Blue-300
      shapes: ["circle"],
      connectionColor: "147, 197, 253",
      speed: 0.15,
      behavior: "float",
      glow: 5,
    },
  };
  return configs[variant] || configs.default;
};

onMounted(() => {
  const ctx = canvas.value.getContext("2d");
  let width, height;
  let particles = [];
  let config = getVariantConfig(props.variant);

  const resize = () => {
    if (!canvas.value) return;
    width = canvas.value.width = canvas.value.parentElement.clientWidth;
    height = canvas.value.height = canvas.value.parentElement.clientHeight;
  };

  window.addEventListener("resize", resize);
  resize();

  const createParticle = () => {
    const shape =
      config.shapes[Math.floor(Math.random() * config.shapes.length)];
    const isLarge = [
      "dna",
      "atom",
      "hexagon",
      "hourglass",
      "compass",
      "pillar",
      "scroll",
      "sum",
      "root",
      "integral",
      "infinity",
      "molecule",
      "pythagoras",
      "euler",
      "derivative",
      "trig",
      "contour",
    ].includes(shape);
    const sizeBase = isLarge ? 12 : 3;

    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * config.speed,
      vy: (Math.random() - 0.5) * config.speed,
      size: Math.random() * sizeBase + (isLarge ? 8 : 2), // Larger particles
      baseSize: Math.random() * sizeBase + (isLarge ? 8 : 2),
      shape: shape,
      // Reduced opacity for subtlety
      alpha: Math.random() * 0.15 + 0.05,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.02, // Slower spin
      phase: Math.random() * Math.PI * 2,
    };
  };

  const initParticles = () => {
    particles = [];
    // Adjusted count for balance with larger sizes
    let count = (width < 800 ? 30 : 50) * 0.5; // Reduced by 50% globally

    // Reduce particles for history to minimize clutter (further reduction if needed, but global reduction might be enough)
    if (props.variant === "history") {
      count = Math.floor(count * 0.3);
    }

    for (let i = 0; i < count; i++) {
      particles.push(createParticle());
    }
  };

  initParticles();

  watch(
    () => props.variant,
    (newVal) => {
      config = getVariantConfig(newVal);
      initParticles();
    }
  );

  const drawShape = (ctx, p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle); // Rotate all shapes

    // Apply Glow
    if (config.glow > 0) {
      ctx.shadowBlur = config.glow;
      ctx.shadowColor = `rgba(${config.color}, ${p.alpha})`;
    }

    ctx.fillStyle = `rgba(${config.color}, ${p.alpha})`;
    ctx.strokeStyle = `rgba(${config.color}, ${p.alpha})`;
    ctx.lineWidth = 2; // Thicker lines

    switch (p.shape) {
      case "atom":
        // Core
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Orbits
        ctx.strokeStyle = `rgba(${config.color}, ${p.alpha * 0.5})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.4, Math.PI / 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.4, -Math.PI / 3, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case "electron":
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "soft-circle":
        // Cell-like
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${config.color}, ${p.alpha * 0.3})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${config.color}, ${p.alpha * 0.8})`;
        ctx.stroke();
        // Nucleus
        ctx.beginPath();
        ctx.arc(p.size * 0.3, -p.size * 0.2, p.size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${config.color}, ${p.alpha * 0.6})`;
        ctx.fill();
        break;
      case "dna":
        // Double Helix Segment
        ctx.beginPath();
        for (let i = -p.size; i <= p.size; i += 4) {
          const yOffset =
            Math.sin(((i + p.size) / p.size) * Math.PI) * p.size * 0.5;
          ctx.moveTo(i, -yOffset);
          ctx.lineTo(i, yOffset);
        }
        ctx.stroke();
        // Strands
        ctx.beginPath();
        ctx.moveTo(-p.size, 0);
        ctx.bezierCurveTo(-p.size / 2, p.size, p.size / 2, -p.size, p.size, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-p.size, 0);
        ctx.bezierCurveTo(-p.size / 2, -p.size, p.size / 2, p.size, p.size, 0);
        ctx.stroke();
        break;
      case "hexagon":
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          ctx.lineTo(
            p.size * Math.cos((i * Math.PI) / 3),
            p.size * Math.sin((i * Math.PI) / 3)
          );
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(${config.color}, ${p.alpha * 0.2})`;
        ctx.fill();
        ctx.stroke();
        break;
      case "molecule":
        // Central atom
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        // Bonded atoms
        for (let j = 0; j < 3; j++) {
          const angle = (j * Math.PI * 2) / 3;
          const bx = Math.cos(angle) * p.size;
          const by = Math.sin(angle) * p.size;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(bx, by);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(bx, by, p.size * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case "sum":
        ctx.font = `bold ${p.size * 1.5}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("∑", 0, 0);
        break;
      case "root":
        ctx.font = `bold ${p.size * 1.5}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("√", 0, 0);
        break;
      case "integral":
        ctx.font = `italic ${p.size * 1.5}px serif`;
        ctx.fillText("∫", 0, 0);
        break;
      case "infinity":
        ctx.font = `bold ${p.size * 1.5}px serif`;
        ctx.fillText("∞", 0, 0);
        break;
      case "x":
        ctx.font = `italic ${p.size * 1.5}px serif`;
        ctx.fillText("x", 0, 0);
        break;
      case "y":
        ctx.font = `italic ${p.size * 1.5}px serif`;
        ctx.fillText("y", 0, 0);
        break;
      case "pythagoras":
        ctx.font = `italic ${p.size * 0.8}px serif`;
        ctx.fillText("a²+b²", 0, 0);
        break;
      case "euler":
        ctx.font = `italic ${p.size * 1}px serif`;
        ctx.fillText("eⁱπ", 0, 0);
        break;
      case "derivative":
        ctx.font = `italic ${p.size * 0.8}px serif`;
        ctx.fillText("dy/dx", 0, 0);
        break;
      case "trig":
        ctx.font = `italic ${p.size * 0.8}px serif`;
        ctx.fillText("sin θ", 0, 0);
        break;
      case "function":
        ctx.font = `italic ${p.size * 1.2}px serif`;
        ctx.fillText("f(x)", 0, 0);
        break;
      case "contour":
        ctx.beginPath();
        // Irregular shape
        for (let i = 0; i <= 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const r = p.size * (0.8 + Math.cos(a * 3) * 0.2);
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${config.color}, ${p.alpha})`;
        ctx.stroke();
        break;
      case "compass":
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.stroke();
        // Needle
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 0.8);
        ctx.lineTo(p.size * 0.2, 0);
        ctx.lineTo(0, p.size * 0.8);
        ctx.lineTo(-p.size * 0.2, 0);
        ctx.closePath();
        ctx.fill();
        break;
      case "hourglass":
        ctx.beginPath();
        ctx.moveTo(-p.size / 2, -p.size);
        ctx.lineTo(p.size / 2, -p.size);
        ctx.lineTo(0, 0);
        ctx.lineTo(p.size / 2, p.size);
        ctx.lineTo(-p.size / 2, p.size);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.stroke();
        break;
      case "pillar":
        ctx.strokeRect(-p.size / 2, -p.size, p.size, p.size * 2);
        ctx.strokeRect(-p.size / 2 - 2, -p.size, p.size + 4, 4); // Cap
        ctx.strokeRect(-p.size / 2 - 2, p.size - 4, p.size + 4, 4); // Base
        // Flutes
        ctx.beginPath();
        ctx.moveTo(-p.size / 6, -p.size + 4);
        ctx.lineTo(-p.size / 6, p.size - 4);
        ctx.moveTo(p.size / 6, -p.size + 4);
        ctx.lineTo(p.size / 6, p.size - 4);
        ctx.stroke();
        break;
      case "scroll":
        // Scroll body
        ctx.strokeRect(-p.size / 1.5, -p.size, p.size * 1.3, p.size * 2);
        // Rolled ends
        ctx.strokeRect(-p.size / 1.5, -p.size - 4, p.size * 1.3, 4);
        ctx.strokeRect(-p.size / 1.5, p.size, p.size * 1.3, 4);
        break;
      case "letter":
        const chars = "AaBbCcDdEeFfGg";
        ctx.font = `bold ${p.size * 1.5}px monospace`;
        ctx.fillText(chars[Math.floor(p.size) % chars.length], -5, 5);
        break;
      case "quote":
        ctx.font = `bold ${p.size * 2}px serif`;
        ctx.fillText('"', -5, 5);
        break;
      case "circle":
      default:
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  };

  const updateParticle = (p) => {
    // Apply velocity
    p.x += p.vx;
    p.y += p.vy;
    p.angle += p.spin;
    p.phase += 0.05;

    // Apply Subject Behaviors
    switch (config.behavior) {
      case "atomic": // Fast chaotic zooming
        p.x += (Math.random() - 0.5) * 2;
        p.y += (Math.random() - 0.5) * 2;
        break;
      case "reaction": // Bubbling up
        p.vy -= 0.002; // Very gentle acceleration up
        if (p.vy < -0.2) p.vy = -0.2; // Lower cap speed
        p.x += Math.sin(p.phase) * 0.3; // Slower wobble
        break;
      case "pulse": // Breathing
        // Size pulsing handled in draw via scale if needed
        break;
      case "time-flow": // Steady downward "sands of time" / history
        // Maintain a steady downward drift, don't accelerate indefinitely or add too much speed
        if (p.vy < 0.1) p.vy = 0.1;
        if (p.vy > 0.3) p.vy = 0.3;
        p.vx *= 0.99; // Damping
        break;
      case "geometric": // Grid locking
        if (Math.random() < 0.01) p.vx = -p.vx; // Sudden 90 degree turns
        if (Math.random() < 0.01) p.vy = -p.vy;
        break;
    }

    // Wrap around screen
    if (p.x < -50) p.x = width + 50;
    if (p.x > width + 50) p.x = -50;
    if (p.y < -50) p.y = height + 50;
    if (p.y > height + 50) p.y = -50;
  };

  const animate = () => {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      updateParticle(p);
      drawShape(ctx, p);
    });

    // Draw Connectors for Math/Chemistry specific
    if (["math", "chemistry"].includes(props.variant)) {
      ctx.beginPath();
      ctx.lineWidth = 1; // Thinner for connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = dx * dx + dy * dy;
          if (dist < 150 * 150) {
            // Increased connection distance
            const opacity = (1 - dist / (150 * 150)) * 0.4; // Distinct connections
            ctx.strokeStyle = `rgba(${config.connectionColor}, ${opacity})`;
            // Must stroke individually for opacity
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    animationFrameId = requestAnimationFrame(animate);
  };

  animate();

  onUnmounted(() => {
    window.removeEventListener("resize", resize);
    cancelAnimationFrame(animationFrameId);
  });
});
</script>

<style scoped></style>
