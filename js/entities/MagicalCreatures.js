/**
 * Sistema de Figuras y Criaturas Mágicas para Caballito Mágico
 * Cada criatura cuenta con su spritesheet animado de alta calidad:
 * - Caballo Mágico: caballito.png (128x128)
 * - Dragón Cósmico: dragon_sheet.png (191x161, vuelo nativo derecha Row 1 e izquierda Row 3 con aliento de fuego cósmico)
 * - Pegaso Alado: pegaso_sheet.png (256x256, 4 cuadros de vuelo y galope celestial con plumas etéreas)
 * - Unicornio Estelar: unicornio_sheet.png (341x256, 3 cuadros con crin arcoíris y cuerno dorado resplandeciente)
 * - Fénix de Fuego: fenix_sheet.png (341x256, 6 cuadros de aleteo ardiente con estela de calor)
 * - Cometa Estelar: cometa_sheet.png (256x256, estrella fugaz con núcleo de plasma y estela hiperluminosa)
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
  }

  update() {
    this.timer++;
    this.baseY = height / 2 + 75;

    // Física y avance horizontal
    this.pos.add(this.vel);

    // Animación de cuadros
    const animSpeed = (AppState.currentFigure === "dragon" || AppState.currentFigure === "fenix") ? 5 : 4;
    if (this.timer % animSpeed === 0) {
      this.frame++;
    }

    // Movimiento orgánico según la criatura
    const speedFactor = AppState.isMobile ? 0.08 : 0.1;
    const stride = sin(frameCount * speedFactor);
    const strideCos = cos(frameCount * speedFactor);

    if (AppState.currentFigure === "dragon") {
      // Vuelo majestuoso del dragón: ondulación aérea amplia y elegante
      this.pos.y = this.baseY + sin(frameCount * 0.06 + this.sinOffset) * 20;
      const dir = this.vel.x >= 0 ? 1 : -1;
      this.rotation = dir * sin(frameCount * 0.06) * 0.07;
      this.scale = 1 + sin(frameCount * 0.1) * 0.03;

      // Aliento de fuego cósmico continuo desde la boca del dragón
      if (frameCount % (AppState.isMobile ? 3 : 2) === 0) {
        const mouthX = this.pos.x + (this.vel.x >= 0 ? 82 : -82);
        const mouthY = this.pos.y + 12;
        const dirX = this.vel.x >= 0 ? 1 : -1;
        AppState.particles.push(new DragonBreathParticle(mouthX, mouthY, dirX));
      }
    } else if (AppState.currentFigure === "fenix") {
      // Vuelo del fénix: planeo y aleteo térmico
      this.pos.y = this.baseY + sin(frameCount * 0.07 + this.sinOffset) * 18 + strideCos * 6;
      const dir = this.vel.x >= 0 ? 1 : -1;
      this.rotation = dir * (stride * 0.05);
      this.scale = 1 + stride * 0.03;

      if (frameCount % 12 === 0) {
        AppState.particles.push(new FeatherParticle(this.pos.x - dir * 25, this.pos.y));
      }
    } else if (AppState.currentFigure === "cometa") {
      // Trayectoria de cometa cósmico con suave estela aerodinámica
      this.pos.y = this.baseY + sin(frameCount * 0.04 + this.sinOffset) * 14;
      this.rotation = 0;
      this.scale = 1 + sin(frameCount * 0.15) * 0.04;
    } else if (AppState.currentFigure === "trex") {
      // Carrera y pisadas titánicas del T-Rex
      this.pos.y = this.baseY + stride * 10 + abs(strideCos) * 5;
      const dir = this.vel.x >= 0 ? 1 : -1;
      this.rotation = dir * (stride * 0.05);
      this.scale = 1 + stride * 0.03;

      // Huellas y chispas de tierra al impactar las pisadas
      if (stride > 0.72) {
        const footX = this.pos.x + (this.vel.x > 0 ? -15 : 15);
        const footY = this.pos.y + 45;
        AppState.particles.push(new HoofSpark(footX, footY));
      }
    } else {
      // Galope orgánico para Caballo, Pegaso y Unicornio
      this.pos.y = this.baseY + stride * 14 + abs(strideCos) * 6;
      const dir = this.vel.x >= 0 ? 1 : -1;
      this.rotation = dir * (stride * 0.06);
      this.scale = 1 + stride * 0.04;

      // Chispas en los cascos
      if (stride > 0.75) {
        const hoofX = this.pos.x + (this.vel.x > 0 ? -20 : 20);
        const hoofY = this.pos.y + 40;
        AppState.particles.push(new HoofSpark(hoofX, hoofY));
      }

      if (AppState.currentFigure === "pegaso" && frameCount % 16 === 0) {
        AppState.particles.push(new FeatherParticle(this.pos.x - dir * 20, this.pos.y - 10));
      }
    }

    // Control de límites de pantalla y ciclos
    const fw = 180;
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

  display(sprites) {
    push();
    translate(this.pos.x, this.pos.y);

    const theme = AppState.currentTheme;
    const spriteObj = (sprites && typeof sprites === "object" && !sprites.width) ? sprites : { caballo: sprites };

    switch (AppState.currentFigure) {
      case "caballo":
        this.renderCaballo(spriteObj.caballo, theme);
        break;
      case "dragon":
        this.renderDragon(spriteObj.dragon, theme);
        break;
      case "pegaso":
        this.renderPegaso(spriteObj.pegaso, theme);
        break;
      case "unicornio":
        this.renderUnicornio(spriteObj.unicornio, theme);
        break;
      case "fenix":
        this.renderFenix(spriteObj.fenix, theme);
        break;
      case "cometa":
        this.renderCometa(spriteObj.cometa, theme);
        break;
      case "trex":
        this.renderTrex(spriteObj.trex, theme);
        break;
      default:
        this.renderCaballo(spriteObj.caballo, theme);
    }

    pop();

    // Emisión continua de partículas temáticas
    this.emitTrailParticles(theme);
  }

  renderCaballo(img, theme) {
    if (!img) return;

    push();
    const dir = this.vel.x >= 0 ? 1 : -1;
    scale(dir * this.scale, this.scale);
    rotate(this.rotation);

    const fw = CONFIG.sprite.fw;
    const fh = CONFIG.sprite.fh;
    const sx = (this.frame % CONFIG.sprite.cols) * fw;
    const sy = 0;

    // Resplandor ambiental de la criatura
    noStroke();
    let auraHue = theme.id === "arcoiris" ? (frameCount * 2) % 360 : theme.baseHue;
    fill(auraHue, 80, 100, 20 + sin(frameCount * 0.15) * 8);
    ellipse(0, 8, fw * 0.88, fh * 0.72);

    if (theme.id === "arcoiris") {
      tint((frameCount * 1.5) % 360, 65, 100);
    } else {
      tint(theme.baseHue, 68, 100);
    }

    imageMode(CENTER);
    image(img, 0, 0, fw, fh, sx, sy, fw, fh);
    noTint();

    pop();
  }

  renderDragon(img, theme) {
    if (!img) return;

    push();
    rotate(this.rotation);
    scale(this.scale, this.scale);

    const isMovingLeft = this.vel.x < 0;
    const fw = 191;
    const fh = 161;
    const frameIdx = this.frame % 3;
    const sx = frameIdx * fw;
    
    // NATIVAMENTE EN dragon_sheet.png:
    // Row 1 (sy = 161): Vuelo hacia el Este (derecha)
    // Row 3 (sy = 483): Vuelo hacia el Oeste (izquierda)
    const sy = isMovingLeft ? 483 : 161;

    // Resplandor cósmico del dragón
    noStroke();
    let dragonHue = theme.id === "arcoiris" ? (frameCount * 2) % 360 : theme.baseHue;
    fill(dragonHue, 85, 100, 24 + sin(frameCount * 0.15) * 10);
    ellipse(0, 5, 185, 130);

    // Tinte visual vibrante según el tema
    if (theme.id === "arcoiris") {
      tint((frameCount * 1.5) % 360, 75, 100);
    } else {
      tint(theme.baseHue, 70, 100);
    }

    imageMode(CENTER);
    image(img, 0, 0, 195, 164, sx, sy, fw, fh);
    noTint();

    pop();
  }

  renderPegaso(img, theme) {
    if (!img) return;

    push();
    const dir = this.vel.x >= 0 ? 1 : -1;
    scale(dir * this.scale, this.scale);
    rotate(this.rotation);

    const fw = 256;
    const fh = 256;
    const sx = (this.frame % 4) * fw;
    const sy = 0; // Row 0

    // Resplandor celestial etéreo
    noStroke();
    let pegasusHue = theme.id === "arcoiris" ? (frameCount * 2) % 360 : (theme.baseHue + 20) % 360;
    fill(pegasusHue, 50, 100, 25 + sin(frameCount * 0.18) * 10);
    ellipse(0, 0, 175, 175);

    if (theme.id === "arcoiris") {
      tint((frameCount * 1.5) % 360, 60, 100);
    } else {
      tint(theme.baseHue, 45, 100);
    }

    imageMode(CENTER);
    image(img, 0, 0, 185, 185, sx, sy, fw, fh);
    noTint();

    pop();
  }

  renderUnicornio(img, theme) {
    if (!img) return;

    push();
    const dir = this.vel.x >= 0 ? 1 : -1;
    scale(dir * this.scale, this.scale);
    rotate(this.rotation);

    const fw = 1024 / 3; // 341.33 px
    const fh = 256;
    const sx = (this.frame % 3) * fw;
    const sy = 256; // Row 1 (galope fluido con crin arcoíris y cuerno)

    // Halo mágico resplandeciente
    noStroke();
    let unicornHue = theme.id === "arcoiris" ? (frameCount * 3) % 360 : 55;
    fill(unicornHue, 60, 100, 24 + sin(frameCount * 0.2) * 10);
    ellipse(0, 0, 185, 140);

    // Destello de estrella en el cuerno
    fill(0, 0, 100, 90 + sin(frameCount * 0.3) * 10);
    drawStarShape(42, -32, 2.5, 7, 4);

    if (theme.id === "arcoiris") {
      tint((frameCount * 1.5) % 360, 65, 100);
    } else {
      tint(theme.baseHue, 50, 100);
    }

    imageMode(CENTER);
    image(img, 0, 0, 195, 146, sx, sy, fw, fh);
    noTint();

    pop();
  }

  renderFenix(img, theme) {
    if (!img) return;

    push();
    const dir = this.vel.x >= 0 ? 1 : -1;
    scale(dir * this.scale, this.scale);
    rotate(this.rotation);

    const fw = 1024 / 3;
    const fh = 256;
    const f = this.frame % 6;
    const col = f % 3;
    const row = Math.floor(f / 3);
    const sx = col * fw;
    const sy = row * fh;

    // Resplandor solar ardiente
    noStroke();
    let fenixHue = theme.id === "arcoiris" ? (frameCount * 2) % 360 : 25;
    fill(fenixHue, 90, 100, 30 + sin(frameCount * 0.2) * 12);
    ellipse(0, 0, 180, 135);

    if (theme.id === "arcoiris") {
      tint((frameCount * 1.5) % 360, 80, 100);
    } else {
      tint(theme.baseHue, 75, 100);
    }

    imageMode(CENTER);
    image(img, 0, 0, 185, 139, sx, sy, fw, fh);
    noTint();

    pop();
  }

  renderCometa(img, theme) {
    if (!img) return;

    push();
    // En cometa_sheet.png la cabeza apunta a la derecha y la cola a la izquierda
    const dir = this.vel.x >= 0 ? 1 : -1;
    scale(dir * this.scale, this.scale);
    rotate(this.rotation);

    const fw = 256;
    const fh = 256;
    const f = 1 + (this.frame % 7);
    const col = f % 4;
    const row = Math.floor(f / 4);
    const sx = col * fw;
    const sy = row * fh;

    // Resplandor de plasma estelar
    noStroke();
    let cometHue = theme.id === "arcoiris" ? (frameCount * 3) % 360 : theme.baseHue;
    fill(cometHue, 75, 100, 32 + sin(frameCount * 0.2) * 14);
    ellipse(0, 0, 200, 100);

    // Destello de diamante en el núcleo
    fill(0, 0, 100, 95);
    drawStarShape(35, 0, 3, 10, 4);

    if (theme.id === "arcoiris") {
      tint((frameCount * 1.5) % 360, 75, 100);
    } else {
      tint(theme.baseHue, 65, 100);
    }

    imageMode(CENTER);
    image(img, 0, 0, 210, 105, sx, sy, fw, fh);
    noTint();

    pop();
  }

  renderTrex(img, theme) {
    if (!img) return;

    push();
    const dir = this.vel.x >= 0 ? 1 : -1;
    scale(dir * this.scale, this.scale);
    rotate(this.rotation);

    const fw = 512;
    const fh = 512;
    const f = this.frame % 4;
    const col = f % 2;
    const row = Math.floor(f / 2);
    const sx = col * fw;
    const sy = row * fh;

    // Resplandor prehistórico según el tema
    noStroke();
    let trexHue = theme.id === "arcoiris" ? (frameCount * 2) % 360 : theme.baseHue;
    fill(trexHue, 80, 100, 22 + sin(frameCount * 0.18) * 8);
    ellipse(0, 6, 210, 160);

    if (theme.id === "arcoiris") {
      tint((frameCount * 1.5) % 360, 75, 100);
    } else {
      tint(theme.baseHue, 68, 100);
    }

    imageMode(CENTER);
    image(img, 0, 0, 220, 220, sx, sy, fw, fh);
    noTint();

    pop();
  }

  emitTrailParticles(theme) {
    const dir = this.vel.x > 0 ? -1 : 1;
    const rate = AppState.isMobile ? 4 : 2;

    if (frameCount % rate === 0) {
      let huePart = theme.id === "arcoiris" ? (frameCount * 1.5) % 360 : theme.baseHue;
      const part = new Particula(
        this.pos.x + dir * 25 + random(-10, 10),
        this.pos.y + random(-10, 20),
        false
      );
      part.hue = (huePart + random(-25, 25) + 360) % 360;
      AppState.particles.push(part);
    }
  }
}
