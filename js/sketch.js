/**
 * Sketch principal de p5.js para "Caballito Mágico"
 * La criatura mágica escribe el nombre letra por letra a medida que avanza.
 */

let caballoSprite;
let customFont = null;
let creature;

const CreatureSprites = {
  caballo: null,
  dragon: null,
  pegaso: null,
  unicornio: null,
  fenix: null,
  cometa: null
};

function preload() {
  CreatureSprites.caballo = loadImage("caballito.png");
  CreatureSprites.dragon = loadImage("dragon_sheet.png");
  CreatureSprites.pegaso = loadImage("pegaso_sheet.png");
  CreatureSprites.unicornio = loadImage("unicornio_sheet.png");
  CreatureSprites.fenix = loadImage("fenix_sheet.png");
  CreatureSprites.cometa = loadImage("cometa_sheet.png");
  caballoSprite = CreatureSprites.caballo;

  try {
    customFont = loadFont("Montserrat-Regular.ttf", () => {}, (err) => {
      console.warn("Usando fuente alternativa:", err);
    });
  } catch (e) {
    console.warn("Excepción cargando fuente:", e);
  }

  AudioManager.preload();
}

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("canvas-container");
  
  colorMode(HSB, 360, 100, 100, 100);
  
  if (customFont) {
    textFont(customFont);
  } else {
    textFont("Montserrat, sans-serif");
  }
  
  textAlign(CENTER, CENTER);

  // Inicializar estado y subsistemas
  AppState.init();
  AudioManager.init();
  UI.init();

  // Crear criatura mágica
  const fw = CONFIG.sprite.fw;
  creature = new FigureManager(-fw, height / 2 + 75);

  // Generar atmósfera nocturna
  initAtmosphere();

  // Disponer letras
  TextAnimator.buildLetters();
}

function initAtmosphere() {
  AppState.fogBackground = [];
  const numFog = AppState.isMobile ? 18 : 45;
  for (let i = 0; i < numFog; i++) {
    AppState.fogBackground.push(new Niebla());
  }
}

function draw() {
  const fw = CONFIG.sprite.fw;
  const theme = AppState.currentTheme;

  // 1. FONDO DINÁMICO ADAPTATIVO POR TEMA
  let bgHue = theme.baseHue;
  if (theme.id === "arcoiris") {
    bgHue = (frameCount * 0.25) % 360;
  }
  const bgSat = theme.bgSat || 70;
  const bgBri = theme.bgBri || 10;

  // Desvanecimiento suave en el reinicio
  let fade = 0;
  if (AppState.hideLetters && creature.pos.x < -fw && AppState.restartTimer !== null) {
    fade = map(frameCount - AppState.restartTimer + 180, 0, 60, 0, 255);
  }
  background(bgHue, bgSat, constrain(bgBri - fade * 0.08, 2, 22), constrain(255 - fade, 0, 255));

  // 2. ESTRELLAS TITILANTES DE FONDO
  const starRate = AppState.isMobile ? 55 : 25;
  if (frameCount % starRate === 0) {
    AppState.particles.push(new Estrella(random(width), random(height)));
  }

  // 3. NIEBLA AMBIENTAL CON COLOR DEL TEMA
  for (let n of AppState.fogBackground) {
    n.update();
    n.display();
  }

  // 4. SONIDO DE APARICIÓN AL ENTRAR LA CRIATURA
  if (!AppState.lettersShown && creature.pos.x > -10 && creature.vel.x > 0) {
    AudioManager.playAppear();
    AudioManager.startMovementSound(AppState.currentFigure);
    AppState.lettersShown = true;
  }

  // 5. LA CRIATURA ESCRIBE LAS LETRAS A SU PASO
  TextAnimator.updateAndRenderLetters(creature.pos.x, creature.vel.x);

  // 6. DETECCIÓN DE FINALIZACIÓN DE ESCRITURA Y DESAPARICIÓN
  // Cuando todas las letras fueron escritas y la criatura superó el centro
  const allBorn = AppState.letterObjects.length > 0 && AppState.letterObjects.every(l => l.born);
  if (allBorn && creature.pos.x > width * 0.72 && AppState.timer === 0 && !AppState.hideLetters) {
    AppState.timer = frameCount + 360; // ~6 segundos completos para admirar el nombre
  }

  if (AppState.timer > 0 && frameCount > AppState.timer && !AppState.hideLetters) {
    AppState.hideLetters = true;
    creature.vel.mult(-1); // Dar media vuelta
    creature.frame = 0;
    AudioManager.playDisappear();
  }

  // 7. MENSAJE FINAL TRAS SALIR LA CRIATURA POR LA IZQUIERDA
  if (AppState.hideLetters && creature.pos.x < -fw) {
    AudioManager.stopMovementSound();

    const totalDuration = AppState.isMobile ? 220 : 280;
    if (AppState.restartTimer === null) {
      AppState.restartTimer = frameCount + totalDuration;
    }

    // Suave entrada (fade-in) y desvanecimiento progresivo (fade-out)
    const timeLeft = AppState.restartTimer - frameCount;
    const elapsed = totalDuration - timeLeft;
    let msgAlpha = 100;

    if (elapsed < 45) {
      msgAlpha = map(elapsed, 0, 45, 0, 100);
    } else if (timeLeft < 60) {
      msgAlpha = map(timeLeft, 60, 0, 100, 0);
    }

    // Renderizar "Gracias por mirar ✨" con fade gradual
    TextAnimator.renderFinalMessage(msgAlpha);

    // Reiniciar ciclo al terminar el desvanecimiento
    if (frameCount > AppState.restartTimer) {
      reiniciarCiclo();
    }
  }

  // 8. ESTELAS LUMINOSAS
  for (let i = AppState.trails.length - 1; i >= 0; i--) {
    const estela = AppState.trails[i];
    estela.update();
    estela.display();
    if (estela.alpha <= 0) AppState.trails.splice(i, 1);
  }

  if (frameCount % (AppState.isMobile ? 4 : 2) === 0 && creature.pos.x > -fw && creature.pos.x < width + fw) {
    AppState.trails.push(new Estela(creature.pos.x, creature.pos.y));
  }

  // 9. ACTUALIZAR Y DIBUJAR CRIATURA MÁGICA
  creature.update();
  creature.display(CreatureSprites);

  // 10. GESTIÓN DE AUDIO DE MOVIMIENTO DE LA CRIATURA
  if (creature.pos.x > -fw && creature.pos.x < width + fw && Math.abs(creature.vel.x) > 0) {
    if (!AppState.hideLetters) {
      AudioManager.startMovementSound(AppState.currentFigure);
    }
  } else {
    AudioManager.stopMovementSound();
  }

  // 11. ACTUALIZAR PARTÍCULAS
  const maxParts = AppState.isMobile ? 75 : 450;
  if (AppState.particles.length > maxParts) {
    AppState.particles.splice(0, AppState.particles.length - maxParts);
  }

  for (let i = AppState.particles.length - 1; i >= 0; i--) {
    const p = AppState.particles[i];
    p.update();
    p.display();
    if (p.alpha <= 0) AppState.particles.splice(i, 1);
  }

  // 12. ACTUALIZAR EFECTOS DE FUEGOS ARTIFICIALES
  if (AppState.clickEffects.length > 150) {
    AppState.clickEffects.splice(0, AppState.clickEffects.length - 150);
  }

  for (let i = AppState.clickEffects.length - 1; i >= 0; i--) {
    const fx = AppState.clickEffects[i];
    fx.update();
    fx.display();
    if (fx.isDone()) AppState.clickEffects.splice(i, 1);
  }
}

function mousePressed() {
  if (event && event.target && (event.target.closest('.glass-panel') || event.target.closest('.moon-container') || event.target.closest('button') || event.target.closest('input'))) {
    return;
  }
  triggerClickEffect(mouseX, mouseY);
}

function touchStarted() {
  if (touches.length > 0) {
    const t = touches[0];
    if (event && event.target && (event.target.closest('.glass-panel') || event.target.closest('.moon-container') || event.target.closest('button') || event.target.closest('input'))) {
      return true;
    }
    triggerClickEffect(t.x, t.y);
  }
  return true;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  AppState.detectDevice();
  initAtmosphere();
  TextAnimator.buildLetters();
  AudioManager.stopMovementSound();
}

function reiniciarCiclo() {
  const fw = CONFIG.sprite.fw;
  creature = new FigureManager(-fw, height / 2 + 75);
  creature.vel.x = Math.abs(creature.vel.x);
  AppState.lettersShown = false;
  AppState.hideLetters = false;
  AppState.timer = 0;
  AppState.restartTimer = null;
  TextAnimator.resetLetters();
  AudioManager.stopMovementSound();
}

window.reiniciarAnimacion = function() {
  AppState.pickRandomEffects();
  reiniciarCiclo();
  AudioManager.stopMovementSound();
  if (window.UI) {
    window.UI.showToast("¡Animación reiniciada! 🔄");
  }
};
