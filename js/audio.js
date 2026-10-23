/**
 * Gestor de Audio Web para Caballito Mágico
 * Sistema de sonido espacial y movimiento personalizado según la criatura mágica activa:
 * - Caballo: Galope clásico con herraduras (caballo_cabalgata.mp3)
 * - Pegaso: Trote celestial con aleteo etéreo de alas
 * - Unicornio: Pasos suaves con resonancia de campanillas de cristal
 * - Dragón: Vuelo majestuoso con ráfagas de viento cósmico y rugido de baja frecuencia (sin cascos)
 * - Fénix: Aleteo de llamaradas ardientes y chisporroteo solar (sin cascos)
 * - Cometa: Viento estelar y zumbido de cristal cósmico (sin cascos)
 */

const AudioManager = {
  enabled: true,
  isReady: false,
  contextResumed: false,
  currentMovingFigure: null,
  
  sounds: {
    appear: null,
    disappear: null,
    gallop: null,
    fireworks: []
  },
  
  lastFireworkIdx: -1,
  
  // Nodos de síntesis procedural para criaturas voladoras y cósmicas
  synthState: {
    active: false,
    timer: null,
    timers: [],
    nodes: []
  },
  
  preload() {
    this.sounds.appear = loadSound(
      "aparecer.mp3",
      (snd) => { if (snd && snd.playMode) snd.playMode('sustain'); },
      (err) => console.warn("Error cargando sonido aparecer:", err)
    );
    
    this.sounds.disappear = loadSound(
      "desaparecer.mp3",
      (snd) => { if (snd && snd.playMode) snd.playMode('sustain'); },
      (err) => console.warn("Error cargando sonido desaparecer:", err)
    );
    
    this.sounds.gallop = loadSound(
      "caballo_cabalgata.mp3",
      (snd) => {
        this.isReady = true;
      },
      (err) => console.warn("Error cargando sonido cabalgata:", err)
    );
    
    for (let i = 1; i <= 3; i++) {
      this.sounds.fireworks.push(
        loadSound(
          `firework_${i}.mp3`,
          (snd) => {
            if (snd && snd.playMode) snd.playMode('sustain');
          },
          (err) => console.warn(`Error cargando firework_${i}:`, err)
        )
      );
    }
  },
  
  init() {
    const unlockAudio = () => {
      this.resumeContext();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
  },
  
  resumeContext() {
    try {
      if (typeof getAudioContext === 'function') {
        const ctx = getAudioContext();
        if (ctx && ctx.state !== 'running') {
          ctx.resume().then(() => {
            this.contextResumed = true;
            this.isReady = true;
          }).catch(() => {});
        } else {
          this.contextResumed = true;
          this.isReady = true;
        }
      }
    } catch (e) {}
  },
  
  toggleAudio() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.resumeContext();
    } else {
      this.stopAll();
    }
    return this.enabled;
  },
  
  playAppear() {
    if (!this.enabled || !this.sounds.appear || !this.sounds.appear.isLoaded()) return;
    try {
      this.sounds.appear.setVolume(0.45);
      this.sounds.appear.play();
    } catch (e) {}
  },
  
  playDisappear() {
    if (!this.enabled || !this.sounds.disappear || !this.sounds.disappear.isLoaded()) return;
    try {
      this.sounds.disappear.setVolume(0.5);
      this.sounds.disappear.play();
    } catch (e) {}
  },

  /**
   * INICIO DE SONIDO DE MOVIMIENTO ADAPTADO A LA FIGURA SELECCIONADA
   * Cada criatura mágica posee un paisaje sonoro exclusivo y único:
   * - Caballo: Único con galope clásico de herraduras (caballo_cabalgata.mp3)
   * - Pegaso: Aleteo de alas celestiales etéreas con brisa aérea (SIN cascos)
   * - Unicornio: Campanillas místicas de cuarzo y polvo estelar en cada paso (SIN cascos)
   * - Dragón: Aleteo masivo de baja frecuencia, desplazamiento de aire y rugido profundo (SIN cascos)
   * - Fénix: Aleteo de llamas ardientes, brisa de calor y chisporroteo solar (SIN cascos)
   * - Cometa: Resonancia de cristal cósmico y viento estelar interestelar (SIN cascos)
   */
  startMovementSound(figureId = null) {
    if (!this.enabled) return;
    this.resumeContext();
    const fig = figureId || (typeof AppState !== "undefined" ? AppState.currentFigure : "caballo") || "caballo";
    
    // Si ya está sonando exactamente esta figura, no reiniciar innecesariamente
    if (this.currentMovingFigure === fig) {
      if (fig === "caballo" && this.sounds.gallop && this.sounds.gallop.isPlaying()) return;
      if (fig !== "caballo" && this.synthState.active) return;
    }

    this.stopMovementSound();
    this.currentMovingFigure = fig;

    switch (fig) {
      case "caballo":
        // Galope rítmico tradicional con herraduras (EXCLUSIVO DEL CABALLO)
        this.startHorseGallop(0.35);
        break;

      case "pegaso":
        // Pegaso: Vuelo alado etéreo, aleteo suave con brisa celestial (SIN cascos)
        this.startPegasusFlightSynth();
        break;

      case "unicornio":
        // Unicornio: Pasos encantados con campanillas cristalinas y destellos mágicos (SIN cascos)
        this.startUnicornMagicalSynth();
        break;

      case "dragon":
        // Dragón: Vuelo majestuoso, profundas ráfagas de aire y rugido cósmico bajo (SIN cascos)
        this.startDragonFlightSynth();
        break;

      case "fenix":
        // Fénix: Aleteo de llamaradas ardientes, crepitar solar y calor radiante (SIN cascos)
        this.startPhoenixFlightSynth();
        break;

      case "cometa":
        // Cometa: Viento estelar hipersónico y resonancia cósmica de cuarzo (SIN cascos)
        this.startCometFlightSynth();
        break;

      default:
        this.startHorseGallop(0.35);
    }
  },

  // Alias retrocompatibles
  startGallop(figureId = null) {
    this.startMovementSound(figureId);
  },

  stopGallop() {
    this.stopMovementSound();
  },

  stopMovementSound() {
    this.currentMovingFigure = null;

    // Detener audio del caballo de inmediato si estaba sonando
    if (this.sounds.gallop) {
      try {
        if (this.sounds.gallop.isPlaying()) {
          this.sounds.gallop.stop();
        }
      } catch (e) {}
    }

    // Detener sintetizadores procedurales de criaturas
    this.stopSynth();
  },

  startHorseGallop(vol = 0.35) {
    if (!this.sounds.gallop || !this.sounds.gallop.isLoaded()) return;
    try {
      this.sounds.gallop.setVolume(vol);
      if (!this.sounds.gallop.isPlaying()) {
        this.sounds.gallop.loop();
      }
    } catch (e) {}
  },

  /**
   * SÍNTESIS DE SONIDOS BESPOKE PARA CRIATURAS NO TERRESTRES
   */
  startPegasusFlightSynth() {
    const ctx = typeof getAudioContext === "function" ? getAudioContext() : null;
    if (!ctx) return;
    this.synthState.active = true;

    // Ráfaga rítmica de alas celestiales cada 560ms
    const pulsePegasusWing = () => {
      if (!this.synthState.active || !this.enabled) return;
      try {
        const now = ctx.currentTime;
        // Ráfaga suave de aire emplumado
        this.playWindBurst(ctx, now, 0.42, 420, 0.22);

        // Suave armónico etéreo (acorde celestial suave)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(659.25, now); // Nota Mi celestial
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.35); // La
        
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      } catch (e) {}
    };

    pulsePegasusWing();
    const t = setInterval(pulsePegasusWing, 560);
    this.synthState.timers.push(t);
  },

  startUnicornMagicalSynth() {
    const ctx = typeof getAudioContext === "function" ? getAudioContext() : null;
    if (!ctx) return;
    this.synthState.active = true;

    // Escala mística de cristal para cada paso del unicornio
    const magicNotes = [784.0, 987.77, 1174.66, 1318.51, 1567.98, 1760.0];
    let noteIdx = 0;

    const pulseUnicornStep = () => {
      if (!this.synthState.active || !this.enabled) return;
      try {
        const now = ctx.currentTime;
        const note = magicNotes[noteIdx % magicNotes.length];
        noteIdx++;

        // Campanilla cristalina mágica
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(note, now);

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(note * 2, now); // Armónico brillante superior

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.65);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.7);
        osc2.stop(now + 0.7);

        // Suave halo de polvo de estrellas en cada paso
        this.playWindBurst(ctx, now, 0.25, 1200, 0.08);
      } catch (e) {}
    };

    pulseUnicornStep();
    const t = setInterval(pulseUnicornStep, 460);
    this.synthState.timers.push(t);
  },

  startDragonFlightSynth() {
    const ctx = typeof getAudioContext === "function" ? getAudioContext() : null;
    if (!ctx) return;
    this.synthState.active = true;

    // Función periódica de aleteo potente del dragón
    const pulseDragonWing = () => {
      if (!this.synthState.active || !this.enabled) return;
      try {
        const now = ctx.currentTime;
        
        // Oscilador de baja frecuencia para el aire desplazado por las alas gigantes
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "sine";
        osc.frequency.setValueAtTime(65, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.6);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(130, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.30, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.75);

        // Ruido de viento cósmico acompañando el aleteo
        this.playWindBurst(ctx, now, 0.7, 280, 0.18);
      } catch (e) {}
    };

    pulseDragonWing();
    const t = setInterval(pulseDragonWing, 820);
    this.synthState.timers.push(t);
  },

  startPhoenixFlightSynth() {
    const ctx = typeof getAudioContext === "function" ? getAudioContext() : null;
    if (!ctx) return;
    this.synthState.active = true;

    const pulsePhoenixWing = () => {
      if (!this.synthState.active || !this.enabled) return;
      try {
        const now = ctx.currentTime;
        // Ráfaga cálida de aleteo de fuego
        this.playWindBurst(ctx, now, 0.45, 650, 0.22);

        // Chisporroteo solar sutil
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320 + Math.random() * 150, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.4);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      } catch (e) {}
    };

    pulsePhoenixWing();
    const t = setInterval(pulsePhoenixWing, 520);
    this.synthState.timers.push(t);
  },

  startCometFlightSynth() {
    const ctx = typeof getAudioContext === "function" ? getAudioContext() : null;
    if (!ctx) return;
    this.synthState.active = true;

    try {
      const now = ctx.currentTime;
      // Zumbido resonante de cristal estelar
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(330, now);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(600, now);
      filter.Q.value = 3;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.5);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc2.start(now);

      this.synthState.nodes.push(osc, osc2, gain);

      // Ráfagas continuas de polvo de estrellas
      const pulseCometDust = () => {
        if (!this.synthState.active || !this.enabled) return;
        this.playWindBurst(ctx, ctx.currentTime, 0.6, 950, 0.14);
      };
      pulseCometDust();
      const t = setInterval(pulseCometDust, 700);
      this.synthState.timers.push(t);
    } catch (e) {}
  },

  playWindBurst(ctx, now, duration, freq, vol) {
    try {
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(freq, now);
      filter.Q.value = 1.8;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + duration * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch (e) {}
  },

  stopSynth() {
    this.synthState.active = false;
    if (this.synthState.timers && this.synthState.timers.length) {
      this.synthState.timers.forEach((t) => clearInterval(t));
      this.synthState.timers = [];
    }
    if (this.synthState.timer) {
      clearInterval(this.synthState.timer);
      this.synthState.timer = null;
    }
    if (this.synthState.nodes && this.synthState.nodes.length) {
      this.synthState.nodes.forEach((n) => {
        try { if (n.stop) n.stop(); } catch (e) {}
        try { if (n.disconnect) n.disconnect(); } catch (e) {}
      });
      this.synthState.nodes = [];
    }
  },
  
  /**
   * Reproducción polifónica de fuegos artificiales
   */
  playFirework() {
    if (!this.enabled || !this.sounds.fireworks.length) return;
    
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * this.sounds.fireworks.length);
    } while (nextIdx === this.lastFireworkIdx && this.sounds.fireworks.length > 1);
    
    this.lastFireworkIdx = nextIdx;
    const sound = this.sounds.fireworks[nextIdx];
    if (!sound) return;

    try {
      const ctx = typeof getAudioContext === 'function' ? getAudioContext() : null;
      if (ctx && sound.buffer) {
        const source = ctx.createBufferSource();
        source.buffer = sound.buffer;
        source.playbackRate.value = 0.92 + Math.random() * 0.16;
        
        const gainNode = ctx.createGain();
        const volume = 0.42 + Math.random() * 0.22;
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
        return;
      }

      if (sound.playMode) sound.playMode('sustain');
      sound.setVolume(0.45);
      sound.play();
    } catch (e) {
      try {
        if (sound.playMode) sound.playMode('sustain');
        sound.play();
      } catch (err) {}
    }
  },
  
  playMultiFireworks() {
    if (!this.enabled) return;
    this.sounds.fireworks.forEach((snd, idx) => {
      setTimeout(() => {
        this.playFirework();
      }, idx * 120);
    });
  },
  
  stopAll() {
    this.stopMovementSound();
    Object.values(this.sounds).forEach((snd) => {
      if (Array.isArray(snd)) {
        snd.forEach(s => { if (s && s.isPlaying()) s.stop(); });
      } else if (snd && snd.isPlaying()) {
        snd.stop();
      }
    });
  }
};
