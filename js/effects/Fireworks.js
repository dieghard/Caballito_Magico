/**
 * Sistema de Cañitas Voladoras y Fuegos Artificiales Realistas Variados
 * Incluye 6 estilos pirotécnicos aleatorios:
 * - Crisantemo Clásico (esfera densa con estela)
 * - Sauce Llorón Dorado (Willow: largas caídas parabólicas de brasas)
 * - Anillo / Saturno (Ring Shell: circunferencia perfecta con núcleo contrastante)
 * - Palmera Imperial (Palm: penachos veloces y gruesos)
 * - Supernova Titilante (Strobe: centelleo rápido en el cielo)
 * - Peonía Bicolor (Two-Tone: doble capa de colores contrastantes)
 */

const MAX_FIREWORK_EFFECTS = 180;
const SHELL_TYPES = ["chrysanthemum", "willow", "ring", "palm", "strobe", "twotone"];

/**
 * Partícula pirotécnica con física adaptativa según el tipo de efecto
 */
class FireworkSpark {
  constructor(x, y, hue, type = "chrysanthemum", angleOverride = null, speedOverride = null) {
    this.pos = createVector(x, y);
    this.type = type;
    this.hue = hue;
    
    // Asignación de velocidad y ángulo según estilo
    const angle = angleOverride !== null ? angleOverride : random(TWO_PI);
    let speed;

    if (speedOverride !== null) {
      speed = speedOverride;
    } else {
      switch (type) {
        case "willow":
          speed = random(2.2, 5.5);
          break;
        case "palm":
          speed = random(4.5, 8.5);
          break;
        case "ring":
          speed = random(4.8, 6.2);
          break;
        case "strobe":
          speed = random(3.0, 7.0);
          break;
        default: // chrysanthemum & twotone
          speed = random(2.8, 7.2);
      }
    }

    this.vel = p5.Vector.fromAngle(angle).mult(speed);

    // Ajustes de física según el estilo
    this.drag = type === "willow" ? 0.96 : (type === "palm" ? 0.93 : 0.945);
    this.gravity = type === "willow" ? 0.08 : (type === "palm" ? 0.13 : 0.11);
    this.decay = type === "willow" ? random(1.3, 2.0) : random(2.0, 3.2);
    this.size = type === "palm" ? random(3.8, 5.5) : random(2.6, 4.5);
    this.alpha = 100;
    
    // Parpadeo para efecto strobe / supernova
    this.flickerSpeed = random(0.3, 0.7);

    // Historial para estela de chispa
    this.prevX = x;
    this.prevY = y;
  }

  update() {
    this.prevX = this.pos.x;
    this.prevY = this.pos.y;

    this.vel.mult(this.drag);
    this.vel.y += this.gravity;
    this.pos.add(this.vel);

    this.alpha -= this.decay;
  }

  display() {
    push();
    let currentAlpha = this.alpha;

    // Centelleo para el estilo Strobe / Supernova
    if (this.type === "strobe") {
      const flicker = sin(frameCount * this.flickerSpeed);
      currentAlpha = flicker > 0 ? this.alpha : this.alpha * 0.2;
    }

    // Estela de chispa ardiente
    stroke(this.hue, 85, 100, currentAlpha * 0.75);
    strokeWeight(this.size * (this.type === "willow" ? 0.85 : 0.65));
    line(this.prevX, this.prevY, this.pos.x, this.pos.y);

    // Núcleo brillante
    noStroke();
    fill(this.hue, 90, 100, currentAlpha);
    ellipse(this.pos.x, this.pos.y, this.size);

    // Centro blanco incandescente de calor real
    fill(0, 0, 100, currentAlpha * 0.9);
    ellipse(this.pos.x, this.pos.y, this.size * 0.5);
    pop();
  }

  isDone() {
    return this.alpha <= 0;
  }
}

/**
 * Cañita Voladora balística: Sube con estela de chispas y detona en el ápice
 */
class CanitaVoladora {
  constructor(targetX, targetY) {
    const startX = targetX + random(-35, 35);
    const startY = height + 15;
    
    this.pos = createVector(startX, startY);
    this.targetY = targetY;
    
    const distanceY = startY - targetY;
    const speedY = constrain(distanceY * 0.046, 11, 20);
    const driftX = (targetX - startX) * 0.04;
    
    this.vel = createVector(driftX, -speedY);
    this.exploded = false;
    this.sparks = [];
    
    // Tipo de efecto aleatorio para esta cañita
    this.shellType = random(SHELL_TYPES);

    // Selección de color armónico o aleatorio
    const theme = AppState.currentTheme;
    this.hue = theme.id === "arcoiris" ? floor(random(360)) : theme.baseHue;
  }

  update() {
    if (!this.exploded) {
      this.pos.add(this.vel);
      this.vel.y += 0.14; // La gravedad va frenando el ascenso

      // Estela ardiente de chispas en la subida
      for (let i = 0; i < 2; i++) {
        this.sparks.push({
          x: this.pos.x + random(-2.5, 2.5),
          y: this.pos.y + random(2, 6),
          velX: random(-0.6, 0.6),
          velY: random(1.5, 4.0),
          alpha: 100,
          size: random(2.5, 4.2)
        });
      }

      // Detonación única al alcanzar el ápice
      if (this.pos.y <= this.targetY || this.vel.y >= -1.0) {
        this.detonate();
      }
    }

    // Actualizar chispas de la cola de la cañita
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.velX;
      s.y += s.velY;
      s.alpha -= 6.0;
      if (s.alpha <= 0) this.sparks.splice(i, 1);
    }
  }

  display() {
    // Dibujar chispas de propulsión
    noStroke();
    for (let s of this.sparks) {
      fill(38 + random(-10, 10), 95, 100, s.alpha);
      ellipse(s.x, s.y, s.size);
    }

    // Cabeza ardiente de la cañita
    if (!this.exploded) {
      push();
      fill(this.hue, 85, 100, 75);
      ellipse(this.pos.x, this.pos.y, 10, 12);
      fill(0, 0, 100, 100);
      ellipse(this.pos.x, this.pos.y, 4, 6);
      pop();
    }
  }

  detonate() {
    this.exploded = true;
    detonateRealisticFirework(this.pos.x, this.pos.y, this.hue, this.shellType);
    createFullScreenFlash(0.22, 280);
  }

  isDone() {
    return this.exploded && this.sparks.length === 0;
  }
}

/**
 * Detona una salva según el efecto aleatorio seleccionado
 */
function detonateRealisticFirework(x, y, customHue = null, shellType = null) {
  const theme = AppState.currentTheme;
  const baseHue = customHue !== null 
    ? customHue 
    : (theme.id === "arcoiris" ? floor(random(360)) : theme.baseHue);

  const type = shellType || random(SHELL_TYPES);

  // Control estricto de límite para no colgar el navegador
  if (AppState.clickEffects.length > MAX_FIREWORK_EFFECTS) {
    AppState.clickEffects.splice(0, AppState.clickEffects.length - MAX_FIREWORK_EFFECTS + 35);
  }

  switch (type) {
    case "willow": {
      // Sauce Llorón: Chispas doradas de larga caída
      const count = AppState.isMobile ? 24 : 36;
      for (let i = 0; i < count; i++) {
        const sparkHue = 42 + random(-12, 12); // Tono oro/ámbar clásico de sauce
        AppState.clickEffects.push(new FireworkSpark(x, y, sparkHue, "willow"));
      }
      break;
    }

    case "ring": {
      // Anillo de Saturno: Círculo perfecto exterior + centro contrastante
      const count = AppState.isMobile ? 22 : 32;
      const ringHue = (baseHue + 60) % 360;
      for (let i = 0; i < count; i++) {
        const angle = (TWO_PI / count) * i + random(-0.05, 0.05);
        AppState.clickEffects.push(new FireworkSpark(x, y, ringHue, "ring", angle, 5.5));
      }
      // Centro blanco/oro
      for (let i = 0; i < 8; i++) {
        AppState.clickEffects.push(new FireworkSpark(x, y, 45, "chrysanthemum", null, random(1.5, 3.0)));
      }
      break;
    }

    case "palm": {
      // Palmera Imperial: 14 ramas gruesas y potentes
      const branches = AppState.isMobile ? 10 : 14;
      for (let i = 0; i < branches; i++) {
        const angle = -PI * 0.85 + (PI * 0.7 / branches) * i + random(-0.1, 0.1);
        const speed = random(5.5, 8.5);
        const sparkHue = (baseHue + random(-15, 15) + 360) % 360;
        AppState.clickEffects.push(new FireworkSpark(x, y, sparkHue, "palm", angle, speed));
      }
      break;
    }

    case "strobe": {
      // Supernova Titilante
      const count = AppState.isMobile ? 26 : 38;
      for (let i = 0; i < count; i++) {
        const sparkHue = (baseHue + random(-25, 25) + 360) % 360;
        AppState.clickEffects.push(new FireworkSpark(x, y, sparkHue, "strobe"));
      }
      break;
    }

    case "twotone": {
      // Bicolor: Capa exterior y capa interior
      const countOuter = AppState.isMobile ? 18 : 26;
      const countInner = AppState.isMobile ? 10 : 16;
      const outerHue = (baseHue + 40) % 360;
      const innerHue = (baseHue + 180) % 360; // Complementario

      for (let i = 0; i < countOuter; i++) {
        AppState.clickEffects.push(new FireworkSpark(x, y, outerHue, "chrysanthemum", null, random(5.0, 7.5)));
      }
      for (let i = 0; i < countInner; i++) {
        AppState.clickEffects.push(new FireworkSpark(x, y, innerHue, "chrysanthemum", null, random(2.5, 4.0)));
      }
      break;
    }

    default: { // chrysanthemum clásico
      const count = AppState.isMobile ? 26 : 38;
      for (let i = 0; i < count; i++) {
        const sparkHue = (baseHue + random(-18, 18) + 360) % 360;
        AppState.clickEffects.push(new FireworkSpark(x, y, sparkHue, "chrysanthemum"));
      }
      for (let i = 0; i < 8; i++) {
        AppState.clickEffects.push(new FireworkSpark(x, y, 45, "chrysanthemum", null, random(1.8, 3.2)));
      }
    }
  }

  // Reproducir sonido polifónico (nunca se corta)
  AudioManager.playFirework();
}

/**
 * Disparador de interacción por clic o toque: lanza una cañita voladora hacia el punto
 */
function triggerClickEffect(x, y) {
  if (y > height * 0.82) {
    detonateRealisticFirework(x, y);
  } else {
    AppState.clickEffects.push(new CanitaVoladora(x, y));
  }
}

/**
 * Flash de pantalla completa sutil y suave
 */
function createFullScreenFlash(opacity, duration) {
  const flashDiv = document.createElement("div");
  flashDiv.style.position = "fixed";
  flashDiv.style.top = "0";
  flashDiv.style.left = "0";
  flashDiv.style.width = "100%";
  flashDiv.style.height = "100%";
  flashDiv.style.backgroundColor = "white";
  flashDiv.style.opacity = opacity.toString();
  flashDiv.style.zIndex = "99";
  flashDiv.style.pointerEvents = "none";
  flashDiv.style.transition = `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
  document.body.appendChild(flashDiv);

  requestAnimationFrame(() => {
    flashDiv.style.opacity = "0";
    setTimeout(() => {
      if (document.body.contains(flashDiv)) {
        document.body.removeChild(flashDiv);
      }
    }, duration);
  });
}
