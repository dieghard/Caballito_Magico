/**
 * Sistema de Figuras y Criaturas Mágicas para Caballito Mágico
 * Incluye: Caballo Mejorado, Pegaso Alado, Unicornio Estelar, Dragón Cósmico, Fénix de Fuego y Cometa Estelar.
 */

class FigureManager {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(3.2, 0);
    this.timer = 0;
    this.frame = 0;
    this.scale = 1;
    this.rotation = 0;
    this.baseY = y;
    this.sinOffset = random(100);

    // Segmentos para el dragón
    this.dragonSegments = [];
    for (let i = 0; i < 14; i++) {
      this.dragonSegments.push(createVector(x - i * 14, y));
    }
  }

  update() {
    this.timer++;
    this.baseY = height / 2 + 75;

    // Física y avance horizontal
    this.pos.add(this.vel);

    // Animación de pasos / aleteo
    if (this.timer % 4 === 0) {
      this.frame = (this.frame + 1) % CONFIG.sprite.cols;
    }

    // Comportamiento de galope / vuelo orgánico con Squash & Stretch
    const speedFactor = AppState.isMobile ? 0.08 : 0.1;
    const stride = sin(frameCount * speedFactor);
    const strideCos = cos(frameCount * speedFactor);

    // Oscilación vertical natural (galope rítmico: sube, planea, cae suave)
    this.pos.y = this.baseY + stride * 14 + abs(strideCos) * 6;
    
    // Inclinación aerodinámica según la dirección y fase del paso
    const dir = this.vel.x > 0 ? 1 : -1;
    this.rotation = dir * (stride * 0.06);

    // Deformación elástica de galope (Squash & Stretch sutil)
    this.scale = 1 + stride * 0.04;

    // Actualización de segmentos del dragón si está activo
    if (AppState.currentFigure === "dragon") {
      this.updateDragonBody();
    }

    // Chispas en las patas / cascos cuando toca el punto bajo del paso
    if (stride > 0.75 && (AppState.currentFigure === "caballo" || AppState.currentFigure === "pegaso" || AppState.currentFigure === "unicornio")) {
      const hoofX = this.pos.x + (this.vel.x > 0 ? -15 : 15);
      const hoofY = this.pos.y + 40;
      AppState.particles.push(new HoofSpark(hoofX, hoofY));
    }

    // Plumas etéreas que caen con Pegaso y Fénix
    if (frameCount % 18 === 0 && (AppState.currentFigure === "pegaso" || AppState.currentFigure === "fenix")) {
      AppState.particles.push(new FeatherParticle(this.pos.x - dir * 20, this.pos.y));
    }

    // Control de límites de pantalla y ciclos
    const fw = CONFIG.sprite.fw;
    if (this.pos.x > width + fw) {
      if (AppState.hideLetters) {
        this.pos.x = -fw;
        this.vel.x = Math.abs(this.vel.x);
        AppState.lettersShown = false;
        AppState.hideLetters = false;
        AppState.timer = frameCount + 180;
      } else {
        this.pos.x = -fw;
      }
    }

    if (this.pos.x < -fw) {
      if (!AppState.hideLetters) {
        this.pos.x = width + fw;
        this.vel.x = -Math.abs(this.vel.x);
      } else if (AppState.restartTimer === null) {
        AppState.restartTimer = frameCount + (AppState.isMobile ? 30 : 120);
      }
    }
  }

  updateDragonBody() {
    this.dragonSegments[0] = this.pos.copy();
    for (let i = 1; i < this.dragonSegments.length; i++) {
      const prev = this.dragonSegments[i - 1];
      const curr = this.dragonSegments[i];
      const dir = p5.Vector.sub(prev, curr);
      const dist = 13;
      dir.setMag(dist);
      this.dragonSegments[i] = p5.Vector.sub(prev, dir);
      this.dragonSegments[i].y += sin(frameCount * 0.12 + i * 0.45) * 1.5;
    }
  }

  display(spriteImage) {
    push();
    translate(this.pos.x, this.pos.y);

    const dir = this.vel.x < 0 ? -1 : 1;
    scale(dir * this.scale, this.scale);
    rotate(this.rotation);

    const theme = AppState.currentTheme;

    switch (AppState.currentFigure) {
      case "caballo":
        this.renderHorse(spriteImage, theme, false, false);
        break;
      case "pegaso":
        this.renderHorse(spriteImage, theme, true, false);
        break;
      case "unicornio":
        this.renderHorse(spriteImage, theme, false, true);
        break;
      case "dragon":
        this.renderDragon(theme);
        break;
      case "fenix":
        this.renderPhoenix(theme);
        break;
      case "cometa":
        this.renderComet(theme);
        break;
      default:
        this.renderHorse(spriteImage, theme, false, false);
    }

    pop();

    // Emisión continua de partículas temáticas
    this.emitTrailParticles(theme);
  }

  renderHorse(spriteImage, theme, hasWings, hasHorn) {
    if (!spriteImage) return;

    const fw = CONFIG.sprite.fw;
    const fh = CONFIG.sprite.fh;
    const sx = this.frame * fw;
    const sy = 0;

    // Resplandor ambiental de la criatura
    noStroke();
    let auraHue = theme.id === "arcoiris" ? (frameCount * 2) % 360 : theme.baseHue;
    fill(auraHue, 80, 100, 20 + sin(frameCount * 0.15) * 8);
    ellipse(0, 8, fw * 0.88, fh * 0.72);

    // Tinte visual vibrante según el tema
    if (theme.id === "arcoiris") {
      tint((frameCount * 1.5) % 360, 65, 100);
    } else {
      tint(theme.baseHue, 68, 100);
    }

    imageMode(CENTER);
    image(spriteImage, 0, 0, fw, fh, sx, sy, fw, fh);
    noTint();

    // Alas de Pegaso
    if (hasWings) {
      this.drawPegasusWings(theme);
    }

    // Cuerno de Unicornio
    if (hasHorn) {
      this.drawUnicornHorn(theme);
    }
  }

  drawPegasusWings(theme) {
    push();
    translate(-5, -12);
    const flap = sin(frameCount * 0.18) * 0.55;
    rotate(flap);

    const wingHue = theme.id === "arcoiris" ? (frameCount * 2) % 360 : (theme.baseHue + 20) % 360;

    // Ala primaria translúcida
    noStroke();
    fill(wingHue, 60, 100, 65);
    beginShape();
    vertex(0, 0);
    bezierVertex(-25, -55, 35, -75, 45, -35);
    bezierVertex(35, -20, 20, -5, 0, 0);
    endShape(CLOSE);

    // Plumas brillantes
    fill(0, 0, 100, 80);
    beginShape();
    vertex(5, -5);
    bezierVertex(-15, -45, 25, -60, 35, -30);
    bezierVertex(25, -15, 15, -5, 5, -5);
    endShape(CLOSE);

    // Borde de luz
    stroke(wingHue, 90, 100, 85);
    strokeWeight(1.8);
    noFill();
    bezier(0, 0, -20, -50, 30, -70, 42, -32);
    pop();
  }

  drawUnicornHorn(theme) {
    push();
    translate(38, -28);
    rotate(-0.4);

    const hornHue = theme.id === "arcoiris" ? (frameCount * 4) % 360 : 45; // Oro o arcoíris

    // Haz de luz estelar saliendo del cuerno
    noStroke();
    fill(hornHue, 70, 100, 35 + sin(frameCount * 0.2) * 20);
    ellipse(18, 0, 40, 10);

    // Cuerno espiral dorado
    stroke(hornHue, 80, 100, 95);
    strokeWeight(1);
    fill(hornHue, 50, 100, 90);
    triangle(0, -4, 0, 4, 24, 0);

    // Destello de estrella en la punta
    fill(0, 0, 100, 95);
    drawStarShape(24, 0, 2, 6, 4);
    pop();
  }

  renderDragon(theme) {
    const dragonHue = theme.id === "arcoiris" ? (frameCount * 1.5) % 360 : theme.baseHue;

    // Dibujar cuerpo serpentino
    noStroke();
    for (let i = this.dragonSegments.length - 1; i >= 1; i--) {
      const seg = this.dragonSegments[i];
      const relX = seg.x - this.pos.x;
      const relY = seg.y - this.pos.y;
      const size = map(i, 0, this.dragonSegments.length - 1, 28, 8);
      const alpha = map(i, 0, this.dragonSegments.length - 1, 95, 45);

      fill((dragonHue + i * 5) % 360, 85, 100, alpha);
      ellipse(relX, relY, size, size * 0.85);

      // Cresta dorsal brillante
      if (i % 2 === 0) {
        fill(45, 90, 100, 90);
        triangle(relX, relY - size * 0.5, relX - 4, relY, relX + 4, relY);
      }
    }

    // Cabeza del Dragón
    fill(dragonHue, 90, 100, 95);
    beginShape();
    vertex(18, -4);
    vertex(32, -10);
    vertex(46, -2);
    vertex(36, 12);
    vertex(12, 10);
    endShape(CLOSE);

    // Ojo brillante
    fill(45, 100, 100, 100);
    ellipse(30, -3, 6, 6);
    fill(0, 0, 100, 100);
    ellipse(31, -3, 2.5, 2.5);

    // Cuernos
    stroke((dragonHue + 40) % 360, 90, 100, 95);
    strokeWeight(2.5);
    noFill();
    bezier(22, -8, 14, -26, 4, -28, -2, -32);

    // Alas de dragón batiendo
    noStroke();
    const wingFlap = sin(frameCount * 0.16) * 0.6;
    push();
    translate(4, -8);
    rotate(wingFlap);
    fill(dragonHue, 80, 100, 75);
    triangle(0, 0, -25, -45, 20, -55);
    stroke(45, 90, 100, 85);
    strokeWeight(1.5);
    line(0, 0, -25, -45);
    line(0, 0, 20, -55);
    pop();
  }

  renderPhoenix(theme) {
    const fenixHue = theme.id === "arcoiris" ? (frameCount * 2) % 360 : 25; // Tono fuego solar

    // Halo solar
    noStroke();
    fill(fenixHue, 90, 100, 30 + sin(frameCount * 0.2) * 15);
    ellipse(0, 0, 90, 70);

    // Cola de plumas de fuego ondulante
    for (let p = 0; p < 3; p++) {
      const tailOffset = (p - 1) * 12;
      const tailWave = sin(frameCount * 0.12 + p * 0.8) * 16;
      stroke(fenixHue + p * 15, 95, 100, 75);
      strokeWeight(3.5 - p * 0.5);
      noFill();
      bezier(-10, 0, -35, tailOffset + tailWave * 0.5, -65, tailOffset + tailWave, -95, tailOffset + tailWave * 1.5);
    }

    // Alas de fuego desplegadas batiendo
    const wingFlap = sin(frameCount * 0.18) * 0.7;
    push();
    translate(-2, -6);
    rotate(wingFlap);
    noStroke();
    fill(fenixHue, 95, 100, 85);
    beginShape();
    vertex(0, 0);
    bezierVertex(-20, -60, 20, -75, 45, -45);
    bezierVertex(30, -25, 15, -10, 0, 0);
    endShape(CLOSE);
    // Núcleo solar del ala
    fill(50, 90, 100, 95);
    beginShape();
    vertex(2, -2);
    bezierVertex(-10, -45, 15, -55, 30, -35);
    bezierVertex(20, -18, 10, -6, 2, -2);
    endShape(CLOSE);
    pop();

    // Cuerpo y pecho dorado
    noStroke();
    fill(45, 95, 100, 95);
    ellipse(6, 0, 32, 22);

    // Cabeza y cresta de fuego
    fill(fenixHue, 100, 100, 95);
    ellipse(24, -6, 16, 14);
    triangle(28, -8, 38, -5, 28, -2); // pico

    // Ojo místico
    fill(0, 0, 100, 100);
    ellipse(25, -7, 4, 4);
  }

  renderComet(theme) {
    const cometHue = theme.id === "arcoiris" ? (frameCount * 3) % 360 : theme.baseHue;

    // Núcleo de estrella de cristal multifacetado
    push();
    rotate(frameCount * 0.05);

    // Resplandor expansivo
    noStroke();
    fill(cometHue, 70, 100, 35 + sin(frameCount * 0.2) * 15);
    ellipse(0, 0, 75, 75);

    // Anillo orbital cósmico
    stroke((cometHue + 40) % 360, 90, 100, 80);
    strokeWeight(2.5);
    noFill();
    ellipse(0, 0, 60, 18);

    // Cristal central
    noStroke();
    fill(cometHue, 85, 100, 95);
    drawStarShape(0, 0, 12, 28, 6);
    fill(0, 0, 100, 95);
    drawStarShape(0, 0, 5, 14, 6);
    pop();
  }

  emitTrailParticles(theme) {
    const dir = this.vel.x > 0 ? -1 : 1;
    const rate = AppState.isMobile ? 4 : 2;

    if (frameCount % rate === 0) {
      let huePart = theme.id === "arcoiris" ? (frameCount * 1.5) % 360 : theme.baseHue;
      const part = new Particula(
        this.pos.x + dir * 18 + random(-10, 10),
        this.pos.y + random(-10, 20),
        false
      );
      part.hue = (huePart + random(-25, 25) + 360) % 360;
      AppState.particles.push(part);
    }
  }
}
