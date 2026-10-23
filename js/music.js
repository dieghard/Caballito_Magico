/**
 * Motor de Música de Fondo Melancólica para Caballito Mágico
 * Sintetizador procedural Web Audio API de alta fidelidad:
 * 4 temas musicales melancólicos y nostálgicos + modo "En silencio"
 *
 * 1. 🌙 Luz de Luna: Nocturno íntimo en piano acústico y cuerdas cálidas (estilo Satie / Chopin)
 * 2. 🧸 Caja de Recuerdos: Vals nostálgico en celesta y caja de música antigua
 * 3. ✨ Lluvia de Estrellas: Arpa celestial y pads etéreos de ensueño espacial
 * 4. 🌌 Vals de las Sombras: Vals cinematográfico en piano melancólico y bajo profundo
 * 5. 🔇 En Silencio: Sin música de fondo (solo silencio o efectos mágicos)
 */

const MUSIC_TRACKS = [
  {
    id: "luz_de_luna",
    name: "Luz de Luna",
    icon: "🌙",
    style: "Piano Melancólico",
    description: "Nocturno íntimo y poético con acordes lentos de ensueño"
  },
  {
    id: "caja_recuerdos",
    name: "Caja de Recuerdos",
    icon: "🧸",
    style: "Caja de Música Nostálgica",
    description: "Vals melancólico en campanillas de cristal y caja de música antigua"
  },
  {
    id: "lluvia_estrellas",
    name: "Lluvia de Estrellas",
    icon: "✨",
    style: "Arpa Celestial & Pads",
    description: "Arpegios etéreos en cascada y suaves brisas astrales"
  },
  {
    id: "vals_sombras",
    name: "Vals de las Sombras",
    icon: "🌌",
    style: "Vals Melancólico & Cinema",
    description: "Melodía nostálgica y profunda con cadencia cinematográfica"
  },
  {
    id: "silencio",
    name: "En Silencio",
    icon: "🔇",
    style: "Sin Música",
    description: "Disfruta únicamente de la calma o los efectos mágicos"
  }
];

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const MusicPlayer = {
  tracks: MUSIC_TRACKS,
  currentTrackId: "luz_de_luna",
  volume: 0.5,
  userEnabled: true,
  isPlaying: false,
  
  // Nodos de Web Audio
  audioCtx: null,
  masterGain: null,
  fadeGain: null,
  delayNode: null,
  feedbackGain: null,
  delayFilter: null,
  
  // Temporizadores del secuenciador
  schedulerTimer: null,
  nextNoteTime: 0,
  currentStep: 0,
  lookahead: 25, // ms
  scheduleAheadTime: 0.25, // segundos
  
  init() {
    // Recuperar preferencia de música guardada
    try {
      const saved = localStorage.getItem("caballito_music_track");
      if (saved && this.tracks.some(t => t.id === saved)) {
        this.currentTrackId = saved;
      }
      const savedVol = localStorage.getItem("caballito_music_vol");
      if (savedVol !== null) {
        const v = parseFloat(savedVol);
        if (!isNaN(v) && v >= 0 && v <= 1) this.volume = v;
      }
    } catch (e) {}

    // Desbloquear audio con primera interacción del usuario
    const unlockMusic = () => {
      this.ensureAudioContext();
      if (this.currentTrackId !== "silencio" && this.userEnabled) {
        this.start();
      }
      window.removeEventListener("click", unlockMusic);
      window.removeEventListener("touchstart", unlockMusic);
      window.removeEventListener("keydown", unlockMusic);
    };

    window.addEventListener("click", unlockMusic);
    window.addEventListener("touchstart", unlockMusic);
    window.addEventListener("keydown", unlockMusic);
  },

  ensureAudioContext() {
    if (!this.audioCtx) {
      if (typeof getAudioContext === "function") {
        this.audioCtx = getAudioContext();
      } else {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) this.audioCtx = new AudioCtxClass();
      }

      if (this.audioCtx) {
        this.setupAudioGraph();
      }
    }

    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  },

  setupAudioGraph() {
    const ctx = this.audioCtx;
    if (!ctx) return;

    // Ganancia Master de Música
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, ctx.currentTime);

    // Ganancia de Fundido suave (Crossfade / Mute)
    this.fadeGain = ctx.createGain();
    this.fadeGain.gain.setValueAtTime(1.0, ctx.currentTime);

    // Bus de Efecto Espacial: Delay / Reverberación Cálida
    this.delayNode = ctx.createDelay();
    this.delayNode.delayTime.setValueAtTime(0.42, ctx.currentTime);

    this.feedbackGain = ctx.createGain();
    this.feedbackGain.gain.setValueAtTime(0.32, ctx.currentTime);

    this.delayFilter = ctx.createBiquadFilter();
    this.delayFilter.type = "lowpass";
    this.delayFilter.frequency.setValueAtTime(1400, ctx.currentTime);

    // Loop de feedback: delay -> filtro -> feedbackGain -> delay
    this.delayNode.connect(this.delayFilter);
    this.delayFilter.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);

    // Conexión del delay al master
    this.delayFilter.connect(this.masterGain);

    // Cadena: Instrumentos -> fadeGain -> masterGain -> destination
    this.fadeGain.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);
  },

  getCurrentTrack() {
    return this.tracks.find(t => t.id === this.currentTrackId) || this.tracks[0];
  },

  setTrack(trackId, immediate = false) {
    if (!this.tracks.some(t => t.id === trackId)) return;
    
    const prevId = this.currentTrackId;
    this.currentTrackId = trackId;

    try {
      localStorage.setItem("caballito_music_track", trackId);
    } catch (e) {}

    if (trackId === "silencio") {
      this.stop();
      if (window.UI) window.UI.updateMusicUI();
      return;
    }

    if (!this.userEnabled) {
      if (window.UI) window.UI.updateMusicUI();
      return;
    }

    this.ensureAudioContext();

    if (this.isPlaying) {
      if (immediate) {
        this.currentStep = 0;
        if (this.audioCtx) this.nextNoteTime = this.audioCtx.currentTime + 0.05;
      } else {
        // Suave transición crossfade
        this.crossfadeToTrack();
      }
    } else {
      this.start();
    }

    if (window.UI) window.UI.updateMusicUI();
  },

  crossfadeToTrack() {
    if (!this.fadeGain || !this.audioCtx) {
      this.currentStep = 0;
      return;
    }
    const now = this.audioCtx.currentTime;
    this.fadeGain.gain.setValueAtTime(this.fadeGain.gain.value, now);
    this.fadeGain.gain.linearRampToValueAtTime(0.001, now + 0.45);

    setTimeout(() => {
      this.currentStep = 0;
      if (this.audioCtx) {
        this.nextNoteTime = this.audioCtx.currentTime + 0.1;
        const cur = this.audioCtx.currentTime;
        this.fadeGain.gain.setValueAtTime(0.001, cur);
        this.fadeGain.gain.linearRampToValueAtTime(1.0, cur + 0.6);
      }
    }, 450);
  },

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem("caballito_music_vol", this.volume.toString());
    } catch (e) {}

    if (this.masterGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.05);
    }
  },

  start() {
    if (this.currentTrackId === "silencio") {
      this.isPlaying = false;
      return;
    }

    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    if (this.isPlaying) return;
    this.isPlaying = true;

    this.currentStep = 0;
    this.nextNoteTime = ctx.currentTime + 0.15;

    if (this.fadeGain) {
      const now = ctx.currentTime;
      this.fadeGain.gain.setValueAtTime(0.001, now);
      this.fadeGain.gain.linearRampToValueAtTime(1.0, now + 1.2);
    }

    if (this.schedulerTimer) clearInterval(this.schedulerTimer);
    this.schedulerTimer = setInterval(() => this.scheduler(), this.lookahead);

    if (window.UI) window.UI.updateMusicUI();
  },

  stop() {
    this.isPlaying = false;
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    if (this.fadeGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.fadeGain.gain.setValueAtTime(this.fadeGain.gain.value, now);
      this.fadeGain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
    }

    if (window.UI) window.UI.updateMusicUI();
  },

  pause() {
    this.stop();
  },

  resume() {
    if (this.currentTrackId !== "silencio" && this.userEnabled) {
      this.start();
    }
  },

  toggleAudioMaster(enabled) {
    this.userEnabled = enabled;
    if (!enabled) {
      this.stop();
    } else if (this.currentTrackId !== "silencio") {
      this.start();
    }
  },

  // Secuenciador Lookahead de alta precisión
  scheduler() {
    if (!this.isPlaying || !this.audioCtx) return;

    while (this.nextNoteTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
      this.scheduleCurrentBeat(this.nextNoteTime, this.currentStep);
      this.advanceStep();
    }
  },

  advanceStep() {
    const track = this.currentTrackId;
    let secondsPerBeat = 0.6; // default

    if (track === "luz_de_luna") {
      // 52 BPM en 4/4 subdividido en corcheas (0.5 beats)
      // 60 / 52 = 1.153s por negra -> 0.576s por corchea
      secondsPerBeat = 0.576;
    } else if (track === "caja_recuerdos") {
      // 108 BPM en 3/4 (vals) -> 60 / 108 = 0.555s por pulso
      secondsPerBeat = 0.278; // corcheas de vals
    } else if (track === "lluvia_estrellas") {
      // Arpegios continuos flotantes
      secondsPerBeat = 0.32;
    } else if (track === "vals_sombras") {
      // 116 BPM en 3/4 subdividido
      secondsPerBeat = 0.258;
    }

    this.nextNoteTime += secondsPerBeat;
    this.currentStep++;
  },

  scheduleCurrentBeat(time, step) {
    const track = this.currentTrackId;

    switch (track) {
      case "luz_de_luna":
        this.playLuzDeLunaStep(time, step);
        break;
      case "caja_recuerdos":
        this.playCajaRecuerdosStep(time, step);
        break;
      case "lluvia_estrellas":
        this.playLluviaEstrellasStep(time, step);
        break;
      case "vals_sombras":
        this.playValsSombrasStep(time, step);
        break;
    }
  },

  // ==========================================
  // SÍNTESIS DE INSTRUMENTOS (VIRTUAL INSTRUMENTS)
  // ==========================================

  /**
   * Piano Acústico Melancólico con sobretonos cálidos y filtro de fieltro
   */
  synthPiano(midi, time, duration = 2.4, velocity = 0.65) {
    const ctx = this.audioCtx;
    if (!ctx || !this.fadeGain) return;

    try {
      const freq = midiToFreq(midi);
      const now = Math.max(time, ctx.currentTime);

      // Oscilador 1: Fundamental con sutil desafinación de coro (-1.2 cents)
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq * 0.9993, now);

      // Oscilador 2: Fundamental con sutil desafinación opuesta (+1.2 cents)
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 1.0007, now);

      // Oscilador 3: Segundo armónico (octava superior dulce)
      const osc3 = ctx.createOscillator();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(freq * 2, now);

      // Oscilador 4: Golpe percusivo de martillo suave de fieltro
      const oscHammer = ctx.createOscillator();
      oscHammer.type = "triangle";
      oscHammer.frequency.setValueAtTime(freq * 3, now);

      // Filtro Lowpass suave para calidez acústica (sin asperezas)
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      const cutoff = Math.min(1800, freq * 3.2);
      filter.frequency.setValueAtTime(cutoff, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(160, freq * 1.2), now + duration * 0.5);

      // Ganancias individuales
      const voiceGain = ctx.createGain();
      const vol = velocity * 0.22;

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(vol, now + 0.012); // Ataque suave
      voiceGain.gain.exponentialRampToValueAtTime(vol * 0.45, now + 0.25); // Caída a resonancia
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + duration); // Relajación larga

      // Martillo rápido
      const hammerGain = ctx.createGain();
      hammerGain.gain.setValueAtTime(vol * 0.25, now);
      hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      // Conexiones
      osc1.connect(voiceGain);
      osc2.connect(voiceGain);
      osc3.connect(voiceGain);
      oscHammer.connect(hammerGain);

      hammerGain.connect(filter);
      voiceGain.connect(filter);

      filter.connect(this.fadeGain);

      // Enviar una fracción al bus de delay/reverb
      if (this.delayNode) {
        const sendGain = ctx.createGain();
        sendGain.gain.setValueAtTime(0.24, now);
        filter.connect(sendGain);
        sendGain.connect(this.delayNode);
      }

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      oscHammer.start(now);

      const stopTime = now + duration + 0.05;
      osc1.stop(stopTime);
      osc2.stop(stopTime);
      osc3.stop(stopTime);
      oscHammer.stop(stopTime);
    } catch (e) {}
  },

  /**
   * Caja de Música / Celesta Antigua (Sonido tintineante, nostálgico y brillante)
   */
  synthMusicBox(midi, time, duration = 1.8, velocity = 0.6) {
    const ctx = this.audioCtx;
    if (!ctx || !this.fadeGain) return;

    try {
      const freq = midiToFreq(midi);
      const now = Math.max(time, ctx.currentTime);

      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq, now);

      // Parcial metálico inarmónico característico de lámina de caja de música
      const oscBell = ctx.createOscillator();
      oscBell.type = "sine";
      oscBell.frequency.setValueAtTime(freq * 2.756, now);

      // Segundo parcial campaniforme muy sutil
      const oscBell2 = ctx.createOscillator();
      oscBell2.type = "sine";
      oscBell2.frequency.setValueAtTime(freq * 5.404, now);

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(Math.min(3200, freq * 1.5), now);
      filter.Q.value = 1.4;

      const gain = ctx.createGain();
      const vol = velocity * 0.18;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.003); // Ataque percusivo instantáneo
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      const bellGain = ctx.createGain();
      bellGain.gain.setValueAtTime(vol * 0.28, now);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35); // Resonancia metálica rápida

      osc1.connect(gain);
      oscBell.connect(bellGain);
      oscBell2.connect(bellGain);

      gain.connect(filter);
      bellGain.connect(filter);

      filter.connect(this.fadeGain);

      // Enviar al delay espacial
      if (this.delayNode) {
        const sendGain = ctx.createGain();
        sendGain.gain.setValueAtTime(0.35, now);
        filter.connect(sendGain);
        sendGain.connect(this.delayNode);
      }

      osc1.start(now);
      oscBell.start(now);
      oscBell2.start(now);

      const stopTime = now + duration + 0.05;
      osc1.stop(stopTime);
      oscBell.stop(stopTime);
      oscBell2.stop(stopTime);
    } catch (e) {}
  },

  /**
   * Arpa Celestial Etérea
   */
  synthHarp(midi, time, duration = 2.6, velocity = 0.55) {
    const ctx = this.audioCtx;
    if (!ctx || !this.fadeGain) return;

    try {
      const freq = midiToFreq(midi);
      const now = Math.max(time, ctx.currentTime);

      const osc1 = ctx.createOscillator();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq, now);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2600, now);
      filter.frequency.exponentialRampToValueAtTime(650, now + duration * 0.6);

      const gain = ctx.createGain();
      const vol = velocity * 0.16;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(vol * 0.4, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(filter);
      filter.connect(this.fadeGain);

      if (this.delayNode) {
        const send = ctx.createGain();
        send.gain.setValueAtTime(0.38, now);
        filter.connect(send);
        send.connect(this.delayNode);
      }

      osc1.start(now);
      osc2.start(now);
      const stop = now + duration + 0.05;
      osc1.stop(stop);
      osc2.stop(stop);
    } catch (e) {}
  },

  /**
   * Pad Ambiental Cálido de Fondo (Cuerda etérea / violonchelo celestial)
   */
  synthWarmPad(midi, time, duration = 3.8, velocity = 0.4) {
    const ctx = this.audioCtx;
    if (!ctx || !this.fadeGain) return;

    try {
      const freq = midiToFreq(midi);
      const now = Math.max(time, ctx.currentTime);

      const osc1 = ctx.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(freq * 0.998, now);

      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq * 1.002, now);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(380, now);

      const gain = ctx.createGain();
      const vol = velocity * 0.09;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.7); // Ataque lento y suave
      gain.gain.setValueAtTime(vol, now + duration - 0.9);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.fadeGain);

      osc1.start(now);
      osc2.start(now);
      const stop = now + duration + 0.1;
      osc1.stop(stop);
      osc2.stop(stop);
    } catch (e) {}
  },

  // ==========================================
  // COMPOSICIONES MUSICALES MELANCÓLICAS
  // ==========================================

  /**
   * TEMA 1: "LUZ DE LUNA" (Nocturno Melancólico en Piano)
   * Progresión armónica: Dm9 -> Bbmaj7 -> Gm9 -> A7sus4 -> Dm(add9) -> C7 -> Fmaj7 -> Bb/A7
   * Ciclo de 64 pasos (8 compases de 8 corcheas)
   */
  playLuzDeLunaStep(time, rawStep) {
    const step = rawStep % 64;
    const bar = Math.floor(step / 8);
    const beatInBar = step % 8;

    // Pad de cuerdas cálido al inicio de cada compás
    if (beatInBar === 0) {
      const padChords = [
        [38, 50, 53], // D2, D3, F3
        [34, 46, 50], // Bb1, Bb2, D3
        [31, 43, 46], // G1, G2, Bb2
        [33, 45, 49], // A1, A2, C#3
        [38, 50, 57], // D2, D3, A3
        [36, 48, 52], // C2, C3, E3
        [29, 41, 48], // F1, F2, C3
        [34, 45, 50]  // Bb1, A2, D3
      ];
      const padNotes = padChords[bar];
      padNotes.forEach(m => this.synthWarmPad(m, time, 4.4, 0.35));
    }

    // Acompañamiento de piano en la mano izquierda
    if (beatInBar === 0) {
      // Nota de bajo profundo
      const bassNotes = [38, 34, 31, 33, 38, 36, 29, 34];
      this.synthPiano(bassNotes[bar], time, 3.2, 0.7);
    } else if (beatInBar === 2) {
      // Arpegio medio
      const midNotes = [
        [53, 57], // F3, A3
        [50, 57], // D3, A3
        [46, 53], // Bb2, F3
        [49, 55], // C#3, G3
        [53, 57], // F3, A3
        [52, 55], // E3, G3
        [48, 53], // C3, F3
        [49, 53]  // C#3, F3
      ];
      midNotes[bar].forEach(m => this.synthPiano(m, time, 2.0, 0.45));
    } else if (beatInBar === 4) {
      // Acorde armónico agudo
      const highChords = [
        [60, 64], // C4, E4
        [57, 62], // A3, D4
        [58, 62], // Bb3, D4
        [57, 61], // A3, C#4
        [60, 64], // C4, E4
        [58, 60], // Bb3, C4
        [57, 60], // A3, C4
        [57, 61]  // A3, C#4
      ];
      highChords[bar].forEach(m => this.synthPiano(m, time, 2.2, 0.42));
    }

    // Melodía melancólica de piano en mano derecha
    const melodyMap = {
      // Compás 1 (Dm9): Melodía nostálgica descendente
      1: 69, // A4
      3: 67, // G4
      5: 65, // F4
      6: 64, // E4
      // Compás 2 (Bbmaj7): Deseo y anhelo ascendente
      9: 62,  // D4
      11: 65, // F4
      13: 69, // A4
      15: 72, // C5
      // Compás 3 (Gm9): Caída suave como lluvia en la ventana
      17: 70, // Bb4
      19: 69, // A4
      21: 67, // G4
      23: 65, // F4
      // Compás 4 (A7sus4 -> A7): Tensión melancólica
      25: 64, // E4
      27: 65, // F4
      29: 67, // G4
      31: 61, // C#4
      // Compás 5 (Dm add9): Clímax lírico en el registro agudo
      33: 74, // D5 (nota alta de ensueño)
      35: 72, // C5
      37: 70, // Bb4
      39: 69, // A4
      // Compás 6 (C7):
      41: 67, // G4
      43: 69, // A4
      45: 70, // Bb4
      47: 64, // E4
      // Compás 7 (Fmaj7):
      49: 65, // F4
      51: 69, // A4
      53: 72, // C5
      55: 76, // E5
      // Compás 8 (Bb -> A7): Resolución dulce que prepara el regreso
      57: 74, // D5
      59: 73, // C#5
      61: 69, // A4
      63: 62  // D4
    };

    if (melodyMap[step]) {
      this.synthPiano(melodyMap[step], time, 2.6, 0.72);
    }
  },

  /**
   * TEMA 2: "CAJA DE RECUERDOS" (Vals Nostálgico en Caja de Música Antigua)
   * 48 pasos (8 compases de 6 corcheas en 3/4)
   */
  playCajaRecuerdosStep(time, rawStep) {
    const step = rawStep % 48;
    const bar = Math.floor(step / 6);
    const beatInBar = step % 6;

    // Bajo de caja de música en tiempo 1
    if (beatInBar === 0) {
      const basses = [45, 50, 43, 48, 41, 47, 40, 45]; // Am, Dm, G, C, F, Bdim, E7, Am
      this.synthMusicBox(basses[bar], time, 1.8, 0.65);
    }

    // Acompañamiento rítmico de vals (tiempos 2 y 3)
    if (beatInBar === 2 || beatInBar === 4) {
      const chords = [
        [60, 64], // C4, E4 (Am)
        [62, 65], // D4, F4 (Dm)
        [59, 62], // B3, D4 (G)
        [60, 64], // C4, E4 (C)
        [57, 60], // A3, C4 (F)
        [59, 62], // B3, D4 (Bdim)
        [56, 59], // G#3, B3 (E)
        [60, 64]  // C4, E4 (Am)
      ];
      chords[bar].forEach(m => this.synthMusicBox(m, time, 1.2, 0.35));
    }

    // Melodía cristalina de campanillas
    const boxMelody = {
      0: 76,  // E5
      2: 81,  // A5
      4: 84,  // C6
      6: 83,  // B5
      8: 81,  // A5
      10: 77, // F5
      12: 74, // D5
      14: 79, // G5
      16: 83, // B5
      18: 81, // A5
      20: 79, // G5
      22: 76, // E5
      24: 72, // C5
      26: 77, // F5
      28: 81, // A5
      30: 80, // G#5
      32: 77, // F5
      34: 74, // D5
      36: 71, // B4
      38: 76, // E5
      40: 80, // G#5
      42: 81, // A5 (sostén melancólico)
      45: 84, // C6 (cascada de campanas)
      47: 81  // A5
    };

    if (boxMelody[step]) {
      this.synthMusicBox(boxMelody[step], time, 1.9, 0.75);
    }
  },

  /**
   * TEMA 3: "LLUVIA DE ESTRELLAS" (Arpa Celestial y Brisa Cósmica)
   * 32 pasos de arpegios etéreos continuos en Em9 -> Cmaj9 -> Gmaj7 -> Dadd9
   */
  playLluviaEstrellasStep(time, rawStep) {
    const step = rawStep % 32;
    const bar = Math.floor(step / 8);
    const subStep = step % 8;

    // Pad cósmico en el bajo
    if (subStep === 0) {
      const rootBasses = [40, 36, 43, 38]; // Em, C, G, D
      this.synthWarmPad(rootBasses[bar], time, 3.2, 0.45);
      this.synthWarmPad(rootBasses[bar] + 7, time, 3.2, 0.3);
    }

    // Cascada de arpa en arpegios de ensueño
    const harpPatterns = [
      // Compás 1: Em9
      [40, 47, 52, 55, 59, 62, 64, 67],
      // Compás 2: Cmaj9
      [36, 43, 48, 52, 55, 59, 60, 64],
      // Compás 3: Gmaj7
      [43, 47, 50, 54, 55, 59, 62, 66],
      // Compás 4: Dadd9
      [38, 45, 50, 54, 57, 62, 64, 66]
    ];

    const note = harpPatterns[bar][subStep];
    this.synthHarp(note, time, 2.2, 0.58);

    // Destellos estelares en el registro alto
    const sparkleMap = {
      2: 76,  // E5
      5: 79,  // G5
      10: 76, // E5
      13: 83, // B5
      18: 78, // F#5
      21: 81, // A5
      26: 81, // A5
      29: 86  // D6 (estrella fugaz)
    };

    if (sparkleMap[step]) {
      this.synthHarp(sparkleMap[step], time, 2.6, 0.7);
    }
  },

  /**
   * TEMA 4: "VALS DE LAS SOMBRAS" (Vals Melancólico Cinemático en Bm)
   * 48 pasos (8 compases de 6 corcheas en 3/4)
   * Bm -> G -> Em -> F#7 -> Bm -> D -> G -> F#7
   */
  playValsSombrasStep(time, rawStep) {
    const step = rawStep % 48;
    const bar = Math.floor(step / 6);
    const beatInBar = step % 6;

    // Bajo de piano
    if (beatInBar === 0) {
      const basses = [47, 43, 40, 42, 47, 50, 43, 42]; // Bm, G, Em, F#, Bm, D, G, F#
      this.synthPiano(basses[bar], time, 2.2, 0.72);
      this.synthWarmPad(basses[bar] + 12, time, 2.2, 0.3);
    }

    // Acordes de vals (tiempos 2 y 3)
    if (beatInBar === 2 || beatInBar === 4) {
      const chords = [
        [54, 59, 62], // F#3, B3, D4
        [55, 59, 62], // G3, B3, D4
        [52, 55, 59], // E3, G3, B3
        [54, 58, 61], // F#3, A#3, C#4
        [54, 59, 62], // F#3, B3, D4
        [57, 62, 66], // A3, D4, F#4
        [55, 59, 62], // G3, B3, D4
        [54, 58, 61]  // F#3, A#3, C#4
      ];
      chords[bar].forEach(m => this.synthPiano(m, time, 1.4, 0.38));
    }

    // Melodía melancólica expresiva
    const valsMelody = {
      0: 66,  // F#4
      2: 71,  // B4
      4: 74,  // D5
      6: 76,  // E5
      8: 74,  // D5
      10: 73, // C#5
      12: 71, // B4
      14: 74, // D5
      16: 76, // E5
      18: 78, // F#5
      20: 76, // E5
      22: 73, // C#5
      24: 74, // D5
      26: 78, // F#5
      28: 83, // B5
      30: 81, // A5
      32: 79, // G5
      34: 78, // F#5
      36: 76, // E5
      38: 79, // G5
      40: 83, // B5
      42: 78, // F#5 (sostén final)
      45: 66  // F#4
    };

    if (valsMelody[step]) {
      this.synthPiano(valsMelody[step], time, 2.5, 0.75);
    }
  }
};
