/**
 * Entidad Caballo: física, spritesheet, estados y comportamientos
 */

class Caballo {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(3.2, 0);
    this.row = 0;
    this.frame = 0;
    this.timer = 0;
    this.sinOffset = random(100);
    this.scale = 1;
    this.rotation = 0;
  }

  update() {
    this.timer++;
    // Ciclar cuadros del sprite de galope
    if (this.timer % 5 === 0) {
      this.frame = (this.frame + 1) % CONFIG.sprite.cols;
    }

    this.pos.add(this.vel);

    const baseY = height / 2 + 80;

    // Aplicar física y comportamientos según el efecto seleccionado
    try {
      if (AppState.isMobile) {
        // En móviles mantenemos movimiento suave y fluido
        switch (AppState.effectHorse) {
          case 0:
          case 3:
          case 4:
            this.pos.y = baseY + sin(frameCount * 0.05) * 10;
            this.scale = 1;
            this.rotation = 0;
            break;
          case 1:
          case 2:
            this.pos.y = baseY;
            this.scale = 1;
            this.rotation = 0;
            break;
          case 5:
            this.pos.y = baseY + random(-2.5, 2.5);
            this.scale = 1;
            this.rotation = 0;
            break;
        }
      } else {
        // Comportamientos completos para escritorio
        switch (AppState.effectHorse) {
          case 0: // Rebote suave natural
            this.pos.y = baseY + sin(frameCount * 0.05 + this.sinOffset) * 15;
            this.scale = 1 + sin(frameCount * 0.08) * 0.05;
            this.rotation = sin(frameCount * 0.1) * 0.05;
            break;
          case 1: // Galope con saltos
            let salto = 0;
            if (frameCount % 30 < 15) {
              salto = sin(frameCount * 0.2) * 30;
            }
            this.pos.y = baseY - salto;
            this.scale = 1 + (salto > 0 ? 0.1 : 0);
            this.rotation = sin(frameCount * 0.2) * 0.1;
            break;
          case 2: // Zigzag rítmico
            this.pos.y = baseY + sin(frameCount * 0.2) * 20;
            this.rotation = sin(frameCount * 0.2) * 0.15;
            break;
          case 3: // Flotante místico
            this.pos.y = baseY + sin(frameCount * 0.03) * 25;
            this.scale = 1 + sin(frameCount * 0.05) * 0.1;
            this.rotation = sin(frameCount * 0.03) * 0.08;
            break;
          case 4: // Ondulación suave
            this.pos.y = baseY + sin(frameCount * 0.1) * 15 + cos(frameCount * 0.05) * 10;
            this.rotation = sin(frameCount * 0.07) * 0.1;
            break;
          case 5: // Vuelo estelar
            this.pos.y = baseY + random(-4, 4) + sin(frameCount * 0.05 + this.sinOffset) * 15;
            this.scale = 1 + random(-0.03, 0.03);
            this.rotation = random(-0.03, 0.03);
            break;
        }
      }
    } catch (e) {
      this.pos.y = baseY;
      this.scale = 1;
      this.rotation = 0;
    }

    const fw = CONFIG.sprite.fw;

    // Control de límites de pantalla
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

    // Salvaguarda si el caballo avanza demasiado sin disparar letras
    if (!AppState.lettersShown && this.pos.x > width * 0.6) {
      AppState.lettersShown = true;
      AppState.timer = frameCount + 180;
    }
  }

  display(spriteImage) {
    if (!spriteImage) return;

    const fw = CONFIG.sprite.fw;
    const fh = CONFIG.sprite.fh;
    const sx = this.frame * fw;
    const sy = this.row * fh;

    push();
    translate(this.pos.x, this.pos.y);
    imageMode(CENTER);

    if (this.vel.x < 0) {
      scale(-1 * this.scale, this.scale);
    } else {
      scale(this.scale);
    }

    rotate(this.rotation);

    // Tinte visual según el tema activo
    const theme = AppState.currentTheme;
    if (theme.id === "arcoiris") {
      tint(
        (this.sinOffset + frameCount * 0.5) % 360,
        35 + sin(frameCount * 0.1) * 20,
        100
      );
    } else {
      tint(theme.baseHue, 32, 100);
    }

    image(spriteImage, 0, 0, fw, fh, sx, sy, fw, fh);
    noTint();
    pop();

    // Emisión de partículas temáticas tras el caballo
    const rate = AppState.isMobile ? 6 : 3;
    if (frameCount % rate === 0) {
      let huePart = theme.baseHue;
      if (theme.id === "arcoiris") {
        huePart = (frameCount * 0.5) % 360;
      }
      const part = new Particula(
        this.pos.x + random(-18, 18),
        this.pos.y + random(-10, 25),
        false
      );
      part.hue = huePart + random(-20, 20);
      AppState.particles.push(part);
    }
  }
}
