(() => {
  const canvas = document.getElementById('leaves-canvas');
  const ctx = canvas.getContext('2d');
  let width, height;
  const leaves = [];
  const LEAF_COUNT = 35;

  // Green leaf color palette
  const leafColors = [
    'rgba(76, 145, 65, 0.6)',
    'rgba(107, 170, 90, 0.55)',
    'rgba(140, 198, 63, 0.5)',
    'rgba(60, 120, 50, 0.55)',
    'rgba(90, 160, 80, 0.5)',
    'rgba(120, 180, 70, 0.45)',
  ];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createLeaf() {
    return {
      x: width + Math.random() * 200,
      y: Math.random() * -height,
      size: Math.random() * 12 + 8,
      speedY: Math.random() * 1.2 + 0.5,
      speedX: -(Math.random() * 0.8 + 0.3),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.03,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.02 + 0.01,
      wobbleAmount: Math.random() * 1.0 + 0.3,
      color: leafColors[Math.floor(Math.random() * leafColors.length)],
      opacity: Math.random() * 0.4 + 0.3,
    };
  }

  function drawLeaf(leaf) {
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.rotation);
    ctx.globalAlpha = leaf.opacity;

    ctx.beginPath();
    const s = leaf.size;
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.5, -s * 0.7, s * 0.6, -s * 0.1, 0, s * 0.5);
    ctx.bezierCurveTo(-s * 0.6, -s * 0.1, -s * 0.5, -s * 0.7, 0, -s);
    ctx.fillStyle = leaf.color;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -s * 0.85);
    ctx.lineTo(0, s * 0.4);
    ctx.strokeStyle = 'rgba(50, 100, 40, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.restore();
  }

  function update() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < leaves.length; i++) {
      const leaf = leaves[i];

      leaf.wobblePhase += leaf.wobbleSpeed;
      leaf.x += leaf.speedX + Math.sin(leaf.wobblePhase) * leaf.wobbleAmount;
      leaf.y += leaf.speedY;
      leaf.rotation += leaf.rotationSpeed;

      if (leaf.y > height + 50 || leaf.x < -50) {
        leaf.x = width + Math.random() * 200;
        leaf.y = -30 - Math.random() * 100;
        leaf.speedY = Math.random() * 1.2 + 0.5;
        leaf.speedX = -(Math.random() * 0.8 + 0.3);
      }

      drawLeaf(leaf);
    }

    requestAnimationFrame(update);
  }

  function init() {
    resize();
    for (let i = 0; i < LEAF_COUNT; i++) {
      const leaf = createLeaf();
      leaf.x = Math.random() * width + Math.random() * 200;
      leaf.y = Math.random() * height;
      leaves.push(leaf);
    }
    requestAnimationFrame(update);
  }

  window.addEventListener('resize', resize);
  init();
})();
