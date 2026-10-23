/**
 * Clases de partículas, atmósfera, chispas y estelas para Caballito Mágico
 */

class Niebla {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.r = random(120, 260);
    this.alpha = random(12, 30);
    this.speed = random(0.15, 0.4);
    this.retheme();
  }

  retheme() {
    const theme = AppState.currentTheme;
    const base = theme.id === "arcoiris" ? random(360) : theme.baseHue;
    this.hue = (base + random(-30, 30) + 360) % 360;
  }

  update() {
    this.x += this.speed;
    if (this.x > width + this.r) {
      this.x = -this.r;
      this.y = random(height);
      this.retheme();
    }
  }

  display() {
    noStroke();
    // Resplandor ambiental de color del tema
    fill(this.hue, 55, 65, this.alpha);
    ellipse(this.x, this.y, this.r);
  }
}

class Estrella {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = random(1.5, 3.5);
    this.alpha = 0;
    this.maxAlpha = random(55, 100);
    this.pulseSpeed = random(0.02, 0.05);
    this.retheme();
  }

  retheme() {
    const theme = AppState.currentTheme;
    if (theme.id === "arcoiris") {
      this.hue = random(360);
    } else {
      this.hue = (theme.baseHue + random(-25, 25) + 360) % 360;
    }
  }

  update() {
    this.alpha = this.maxAlpha * (0.5 + 0.5 * sin(frameCount * this.pulseSpeed));
  }

  display() {
    fill(this.hue, 35, 100, this.alpha);
    noStroke();
    ellipse(this.x, this.y, this.size);
  }
}

class Estela {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.alpha = 90;
    this.size = random(32, 58);
    const theme = AppState.currentTheme;
    if (theme.id === "arcoiris") {
      this.hue = (frameCount * 3) % 360;
    } else {
      this.hue = (theme.baseHue + random(-15, 15) + 360) % 360;
    }
  }

  update() {
    this.alpha -= 1.8;
    this.size *= 0.96;
  }

  display() {
    noStroke();
    fill(this.hue, 85, 100, this.alpha);
    ellipse(this.pos.x, this.pos.y, this.size);
  }
}

class Particula {
  constructor(x, y, especial = false) {
    this.pos = createVector(x, y);
    this.vel = createVector(
      random(-1.5, 1.5),
      random(-2.8, especial ? -0.5 : -3.8)
    );
    this.alpha = 100;
    this.size = random(4.5, especial ? 16 : 10) * (AppState.isMobile ? 0.8 : 1);
    
    const theme = AppState.currentTheme;
    const base = theme.id === "arcoiris" ? (frameCount * 2) % 360 : theme.baseHue;
    this.hue = (base + random(-25, 25) + 360) % 360;
    
    this.tipo = random(["brillo", "chispa", "polvo"]);
    this.especial = especial;
    this.rotacion = random(TWO_PI);
    this.rotVel = random(-0.08, 0.08);
  }

  update() {
    this.pos.add(this.vel);
    this.alpha -= this.especial ? 0.8 : 2.2;
    this.rotacion += this.rotVel;
    this.vel.y += this.especial ? 0.03 : 0.06;
  }

  display() {
    noStroke();
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotacion);
    
    if (this.tipo === "brillo") {
      fill(this.hue, 85, 100, this.alpha);
      ellipse(0, 0, this.size);
    } else if (this.tipo === "chispa") {
      fill((this.hue + 20) % 360, 100, 100, this.alpha);
      drawStarShape(0, 0, this.size * 0.35, this.size * 0.75, 5);
    } else {
      fill((this.hue + 45) % 360, 70, 100, this.alpha);
      ellipse(0, 0, this.size * 0.65);
    }
    pop();
  }
}

/**
 * Chispas en las herraduras / patas de la criatura al galopar
 */
class HoofSpark {
  constructor(x, y) {
    this.pos = createVector(x + random(-10, 10), y + random(-3, 6));
    this.vel = createVector(random(-3, -0.5), random(-2.5, 0.5));
    this.alpha = 100;
    this.size = random(3, 7);
    const theme = AppState.currentTheme;
    this.hue = (theme.baseHue + random(-20, 20) + 360) % 360;
  }

  update() {
    this.pos.add(this.vel);
    this.vel.y += 0.12; // gravedad
    this.alpha -= 4.5;
    this.size *= 0.94;
  }

  display() {
    noStroke();
    fill(this.hue, 95, 100, this.alpha);
    ellipse(this.pos.x, this.pos.y, this.size);
  }
}

/**
 * Plumas etéreas que caen al aletear (Pegaso y Fénix)
 */
class FeatherParticle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-2, 0), random(0.5, 2));
    this.alpha = 95;
    this.size = random(8, 16);
    this.rot = random(TWO_PI);
    this.rotVel = random(-0.04, 0.04);
    const theme = AppState.currentTheme;
    this.hue = (theme.baseHue + random(-15, 15) + 360) % 360;
  }

  update() {
    this.pos.add(this.vel);
    this.rot += this.rotVel;
    this.alpha -= 1.6;
    this.vel.x += sin(frameCount * 0.1) * 0.05;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rot);
    noStroke();
    fill(this.hue, 70, 100, this.alpha);
    ellipse(0, 0, this.size * 0.4, this.size);
    fill(0, 0, 100, this.alpha * 0.6);
    ellipse(0, 0, this.size * 0.15, this.size * 0.8);
    pop();
  }
}

/**
 * Partículas de aliento de fuego cósmico para el Dragón
 */
class DragonBreathParticle {
  constructor(x, y, dirX) {
    this.pos = createVector(x, y);
    this.vel = createVector(dirX * random(2.5, 6.0), random(-1.2, 1.2));
    this.alpha = 100;
    this.size = random(6, 15) * (AppState.isMobile ? 0.75 : 1);
    const theme = AppState.currentTheme;
    this.hue = theme.id === "arcoiris" ? (frameCount * 3) % 360 : (theme.baseHue + random(-25, 25) + 360) % 360;
  }

  update() {
    this.pos.add(this.vel);
    this.vel.mult(0.96);
    this.vel.y -= 0.05; // calor ascendente
    this.alpha -= 3.2;
    this.size *= 0.96;
  }

  display() {
    noStroke();
    fill(this.hue, 95, 100, this.alpha);
    ellipse(this.pos.x, this.pos.y, this.size);
    fill((this.hue + 35) % 360, 100, 100, this.alpha * 0.85);
    ellipse(this.pos.x, this.pos.y, this.size * 0.5);
  }
}

/**
 * Función auxiliar para dibujar estrellas poligonales
 */
function drawStarShape(x, y, radius1, radius2, npoints) {
  const angle = TWO_PI / npoints;
  const halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}
