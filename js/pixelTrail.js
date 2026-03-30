(() => {
  // Config — matches your usage example
  const CONFIG = {
    gridSize: 88,
    trailSize: 0.05,
    maxAge: 250,
    interpolate: 8,
    color: '#95ff80',
  };

  // Load Three.js dynamically then init
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
  script.onload = init;
  document.head.appendChild(script);

  function init() {
    const THREE = window.THREE;

    // Create canvas overlay fixed behind content
    const canvas = document.createElement('canvas');
    canvas.id = 'pixel-trail-canvas';
    canvas.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    `;
    document.body.insertBefore(canvas, document.body.firstChild);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // Scene + orthographic camera (fullscreen quad)
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Trail texture — a canvas we draw mouse circles on, then fade
    const TRAIL_SIZE = 512;
    const trailCanvas = document.createElement('canvas');
    trailCanvas.width = TRAIL_SIZE;
    trailCanvas.height = TRAIL_SIZE;
    const ctx = trailCanvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, TRAIL_SIZE, TRAIL_SIZE);

    const trailTexture = new THREE.CanvasTexture(trailCanvas);
    trailTexture.minFilter = THREE.NearestFilter;
    trailTexture.magFilter = THREE.NearestFilter;

    // Shader material — same logic as the React version
    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        resolution: { value: new THREE.Vector2(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio) },
        mouseTrail: { value: trailTexture },
        gridSize: { value: CONFIG.gridSize },
        pixelColor: { value: new THREE.Color(CONFIG.color) },
      },
      vertexShader: `
        void main() {
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec2 resolution;
        uniform sampler2D mouseTrail;
        uniform float gridSize;
        uniform vec3 pixelColor;

        vec2 coverUv(vec2 uv) {
          vec2 s = resolution.xy / max(resolution.x, resolution.y);
          vec2 newUv = (uv - 0.5) * s + 0.5;
          return clamp(newUv, 0.0, 1.0);
        }

        void main() {
          vec2 screenUv = vec2(gl_FragCoord.x / resolution.x, 1.0 - gl_FragCoord.y / resolution.y);
          vec2 uv = coverUv(screenUv);

          vec2 gridUvCenter = (floor(uv * gridSize) + 0.5) / gridSize;
          float trail = texture2D(mouseTrail, gridUvCenter).r;

          gl_FragColor = vec4(pixelColor, trail);
        }
      `,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    // Mouse trail state
    let mouse = { x: -1, y: -1 };
    let prevMouse = { x: -1, y: -1 };
    let isOver = false;

    document.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = e.clientY / window.innerHeight;
      isOver = true;
    });

    document.addEventListener('mouseleave', () => {
      isOver = false;
    });

    // Draw trail onto canvas texture
    function drawTrail() {
      // Fade existing trail
      ctx.globalCompositeOperation = 'source-over';
      const fadeAmount = 1 - (1 / CONFIG.maxAge) * 16;
      ctx.fillStyle = `rgba(0,0,0,${1 - fadeAmount})`;
      ctx.fillRect(0, 0, TRAIL_SIZE, TRAIL_SIZE);

      if (!isOver || mouse.x < 0) return;

      // Interpolate between prev and current mouse
      const steps = Math.max(1, Math.round(CONFIG.interpolate));
      for (let i = 0; i < steps; i++) {
        const t = steps === 1 ? 1 : i / (steps - 1);
        const ix = prevMouse.x + (mouse.x - prevMouse.x) * t;
        const iy = prevMouse.y + (mouse.y - prevMouse.y) * t;

        const px = ix * TRAIL_SIZE;
        const py = iy * TRAIL_SIZE;
        const radius = CONFIG.trailSize * TRAIL_SIZE * 0.5;

        const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      prevMouse.x = mouse.x;
      prevMouse.y = mouse.y;
    }

    // Resize
    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.resolution.value.set(
        window.innerWidth * window.devicePixelRatio,
        window.innerHeight * window.devicePixelRatio
      );
    });

    // Render loop
    function animate() {
      requestAnimationFrame(animate);
      drawTrail();
      trailTexture.needsUpdate = true;
      renderer.render(scene, camera);
    }

    animate();
  }
})();
