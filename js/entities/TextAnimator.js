/**
 * Módulo de Animación de Texto Tipográfico Profesional para Caballito Mágico
 * - Kerning y espaciado proporcional exacto por letra (textWidth): nunca se enciman letras anchas ni quedan huecos en letras angostas.
 * - Separación natural de espacios entre palabras.
 * - Renderizado de alta definición con resplandor suave y sin duplicados fantasma.
 * - Entrada dinámica de cada letra conforme avanza la criatura mágica.
 */

const TextAnimator = {
  entranceTypes: ["bounce", "spin", "flare", "swoop", "shockwave"],

  buildLetters() {
    AppState.letterObjects = [];
    const word = AppState.word || "";
    if (!word.length) return;
    
    const isMob = AppState.isMobile;
    
    // 1. Tamaño de fuente base según longitud del texto y pantalla
    let targetSize = isMob ? 62 : 94;
    if (word.length > 7) targetSize = isMob ? 50 : 80;
    if (word.length > 12) targetSize = isMob ? 40 : 66;
    if (word.length > 16) targetSize = isMob ? 32 : 54;

    push();
    if (customFont) textFont(customFont);
    else textFont("Montserrat, sans-serif");
    textSize(targetSize);

    // 2. Medir el ancho proporcional real de cada carácter (Kerning natural)
    const charMetrics = [];
    let totalWidth = 0;

    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      let w;
      if (ch === " ") {
        // Ancho de separación natural entre palabras
        w = targetSize * 0.40;
      } else {
        // Ancho exacto del glifo con un padding sutil para respiración
        w = textWidth(ch) + (isMob ? 5 : 8);
      }
      charMetrics.push(w);
      totalWidth += w;
    }

    // 3. Ajuste de seguridad: si el texto excede el 86% del ancho de pantalla, escalar proporcionalmente
    const maxAvailableWidth = width * (isMob ? 0.88 : 0.84);
    if (totalWidth > maxAvailableWidth && totalWidth > 0) {
      const scaleFactor = maxAvailableWidth / totalWidth;
      targetSize = max(18, targetSize * scaleFactor);
      textSize(targetSize);

      totalWidth = 0;
      for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        let w = ch === " " ? targetSize * 0.40 : textWidth(ch) + (isMob ? 4 : 6);
        charMetrics[i] = w;
        totalWidth += w;
      }
    }
    pop();

    // 4. Calcular coordenadas horizontales centradas con distribución proporcional
    let currentX = width / 2 - totalWidth / 2;

    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      const charW = charMetrics[i];
      const centerX = currentX + charW / 2;
      currentX += charW;

      AppState.letterObjects.push({
        char: ch,
        isSpace: ch === " ",
        x: centerX,
        y: height / 2 - 20,
        targetSize: targetSize,
        size: 0,
        alpha: 0,
        born: false,
        birthFrame: 0,
        offsetY: 0,
        velY: 0,
        rotation: 0,
        entranceEffect: this.entranceTypes[i % this.entranceTypes.length]
      });
    }
  },

  resetLetters() {
    for (let letra of AppState.letterObjects) {
      letra.born = false;
      letra.size = 0;
      letra.alpha = 0;
      letra.offsetY = 0;
      letra.rotation = 0;
    }
  },

  updateAndRenderLetters(creatureX, creatureVelX) {
    const letters = AppState.letterObjects;
    const theme = AppState.currentTheme;

    for (let i = 0; i < letters.length; i++) {
      const letra = letters[i];

      // 1. NACIMIENTO: La criatura escribe la letra al cruzar su coordenada X
      if (!letra.born && creatureVelX > 0 && creatureX >= letra.x - 12) {
        letra.born = true;
        letra.birthFrame = frameCount;
        
        // Estallido de chispas solo en caracteres visibles (no en espacios)
        if (!letra.isSpace) {
          this.triggerLetterBirthParticles(letra.x, letra.y, theme);
        }
      }

      // Si es un espacio en blanco, no requiere animación visual ni renderizado
      if (letra.isSpace) continue;

      // 2. FASE DE ENTRADA Y ANIMACIÓN
      if (letra.born && !AppState.hideLetters) {
        const age = frameCount - letra.birthFrame;
        const duration = 28;
        const progress = constrain(age / duration, 0, 1);
        const elastic = this.easeOutElastic(progress);

        letra.alpha = min(100, age * 6.5);

        // Efectos dinámicos individuales por letra
        switch (letra.entranceEffect) {
          case "bounce":
            letra.size = letra.targetSize * elastic;
            letra.offsetY = (1 - elastic) * -45;
            letra.rotation = (1 - progress) * 0.15;
            break;

          case "spin":
            letra.size = letra.targetSize * elastic;
            letra.offsetY = (1 - elastic) * 25;
            letra.rotation = (1 - progress) * -PI;
            break;

          case "flare":
            letra.size = letra.targetSize * (progress < 0.25 ? map(progress, 0, 0.25, 0.2, 1.35) : map(progress, 0.25, 1, 1.35, 1.0));
            letra.offsetY = 0;
            letra.rotation = sin(age * 0.15) * 0.06 * (1 - progress);
            break;

          case "swoop":
            letra.size = letra.targetSize * elastic;
            letra.offsetY = (1 - progress) * 40;
            letra.rotation = (1 - progress) * -0.2;
            break;

          case "shockwave":
            letra.size = letra.targetSize * elastic;
            letra.offsetY = sin(age * 0.2) * 6 * (1 - progress);
            letra.rotation = 0;
            break;
        }

        // Micro-oscilación flotante orgánica
        if (progress >= 1) {
          letra.offsetY = sin(frameCount * 0.05 + i * 0.5) * 4;
          letra.rotation = sin(frameCount * 0.03 + i * 0.3) * 0.02;
        }

        // Interacción con mouse/touch
        const distMouse = dist(mouseX, mouseY, letra.x, letra.y);
        if (distMouse < 85) {
          const repel = map(distMouse, 0, 85, 14, 0);
          letra.size = letra.targetSize + repel;
          if (frameCount % 6 === 0) {
            AppState.particles.push(new Particula(letra.x + random(-12, 12), letra.y + random(-12, 12), false));
          }
        }
      } 
      // 3. FASE DE DESAPARICIÓN (Suave y progresiva)
      else if (AppState.hideLetters && letra.born) {
        letra.size = lerp(letra.size, 0, 0.016);
        letra.alpha = lerp(letra.alpha, 0, 0.020);
        letra.offsetY -= 1.0;
        letra.rotation += 0.005;

        if (frameCount % 6 === 0 && letra.alpha > 15) {
          AppState.particles.push(new Particula(letra.x + random(-8, 8), letra.y + letra.offsetY, false));
        }
      }

      // 4. RENDERIZADO VISUAL CRISP CON RESPLANDOR SUAVE (SIN FANTASMAS NI DISTORSIÓN)
      if (letra.alpha > 0.8 && letra.size > 1) {
        push();
        translate(letra.x, letra.y + letra.offsetY);
        rotate(letra.rotation);

        let hueBase = theme.baseHue;
        if (theme.id === "arcoiris") {
          hueBase = (hueBase + frameCount * 0.5 + i * 28) % 360;
        }
        const letterHue = (hueBase + ((i * 5) % 35)) % 360;

        textSize(letra.size);

        // Resplandor exterior e interior usando la API nativa de sombreado (Glow perfecto sin duplicar texto)
        const ctx = drawingContext;
        ctx.save();
        ctx.shadowBlur = 24;
        ctx.shadowColor = `hsl(${letterHue}, ${theme.satMax}%, 65%, ${letra.alpha * 0.008})`;

        // Capa de resplandor ambiental
        fill(letterHue, theme.satMax, theme.briMax, letra.alpha * 0.6);
        text(letra.char, 0, 0);

        // Capa de color principal nítida
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsl(${letterHue}, 100%, 85%, ${letra.alpha * 0.01})`;
        fill(letterHue, theme.satMin, theme.briMax, letra.alpha);
        text(letra.char, 0, 0);

        // Núcleo blanco brillante en el centro para dar sensación de luz pura
        ctx.shadowBlur = 0;
        fill(0, 0, 100, letra.alpha * 0.35);
        text(letra.char, 0, 0);

        ctx.restore();
        pop();
      }
    }
  },

  triggerLetterBirthParticles(x, y, theme) {
    const sparkCount = AppState.isMobile ? 10 : 16;
    const baseHue = theme.id === "arcoiris" ? random(360) : theme.baseHue;

    for (let i = 0; i < sparkCount; i++) {
      const p = new Particula(x + random(-8, 8), y + random(-8, 8), false);
      p.vel = p5.Vector.random2D().mult(random(2, 5.0));
      p.hue = (baseHue + random(-22, 22) + 360) % 360;
      AppState.particles.push(p);
    }
  },

  renderFinalMessage(alphaFactor = 100) {
    if (alphaFactor <= 0) return;
    const isMob = AppState.isMobile;
    const isFlip = AppState.isSamsungFlip;
    const theme = AppState.currentTheme;
    const msg = CONFIG.finalMessage;

    const yPos = isFlip ? height * 0.65 : (isMob ? height * 0.68 : height * 0.72);
    const textSizeVal = isFlip ? 34 : (isMob ? 38 : 46);
    const alphaNorm = constrain(alphaFactor / 100, 0, 1);

    push();
    translate(width / 2, yPos);

    let hueMsg = theme.baseHue;
    if (theme.id === "arcoiris") {
      hueMsg = (frameCount * 0.5) % 360;
    }

    textSize(textSizeVal);

    // Resplandor nativo sin duplicación deformante
    const ctx = drawingContext;
    ctx.save();
    ctx.shadowBlur = 25;
    ctx.shadowColor = `hsl(${hueMsg}, ${theme.satMax}%, 65%, ${alphaNorm * 0.7})`;

    fill(hueMsg, theme.satMax, theme.briMax, 85 * alphaNorm);
    text(msg, 0, 0);

    ctx.shadowBlur = 8;
    ctx.shadowColor = `hsl(${hueMsg}, 100%, 85%, ${alphaNorm * 0.9})`;
    fill(0, 0, 100, 75 * alphaNorm);
    text(msg, 0, 0);

    ctx.restore();
    pop();

    if (frameCount % (isMob ? 5 : 3) === 0 && alphaFactor > 30) {
      AppState.particles.push(
        new Particula(
          width / 2 + random(-160, 160),
          yPos + random(-30, 20),
          true
        )
      );
    }
  },

  easeOutElastic(x) {
    const c4 = (2 * Math.PI) / 3;
    return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  }
};
