/**
 * Configuración global, temas cromáticos y figuras mágicas para Caballito Mágico
 */

const CONFIG = {
  sprite: {
    cols: 4,
    rows: 8,
    fw: 128,
    fh: 128
  },
  maxTextLength: 20,
  defaultWord: "Diego Markiewicz",
  finalMessage: "Gracias por mirar ✨",
  
  // Lista de temas cromáticos y estéticos
  themes: [
    {
      id: "fuego",
      name: "Fuego",
      icon: "🔥",
      baseHue: 15,
      satMin: 85,
      satMax: 100,
      briMin: 85,
      briMax: 100,
      color: "#f97316",
      bgSat: 75,
      bgBri: 11
    },
    {
      id: "galaxia",
      name: "Galaxia",
      icon: "🌌",
      baseHue: 275,
      satMin: 80,
      satMax: 100,
      briMin: 80,
      briMax: 100,
      color: "#a855f7",
      bgSat: 70,
      bgBri: 10
    },
    {
      id: "aurora",
      name: "Aurora",
      icon: "✨",
      baseHue: 165,
      satMin: 75,
      satMax: 95,
      briMin: 80,
      briMax: 100,
      color: "#10b981",
      bgSat: 68,
      bgBri: 10
    },
    {
      id: "agua",
      name: "Océano",
      icon: "🌊",
      baseHue: 205,
      satMin: 75,
      satMax: 95,
      briMin: 75,
      briMax: 95,
      color: "#0ea5e9",
      bgSat: 72,
      bgBri: 10
    },
    {
      id: "oro",
      name: "Oro Cósmico",
      icon: "👑",
      baseHue: 45,
      satMin: 80,
      satMax: 100,
      briMin: 85,
      briMax: 100,
      color: "#eab308",
      bgSat: 75,
      bgBri: 11
    },
    {
      id: "neon",
      name: "Cyber Neón",
      icon: "⚡",
      baseHue: 320,
      satMin: 85,
      satMax: 100,
      briMin: 90,
      briMax: 100,
      color: "#ec4899",
      bgSat: 80,
      bgBri: 11
    },
    {
      id: "naturaleza",
      name: "Naturaleza",
      icon: "🍃",
      baseHue: 120,
      satMin: 70,
      satMax: 90,
      briMin: 70,
      briMax: 90,
      color: "#22c55e",
      bgSat: 68,
      bgBri: 10
    },
    {
      id: "arcoiris",
      name: "Arcoíris",
      icon: "🌈",
      baseHue: 0,
      satMin: 85,
      satMax: 100,
      briMin: 85,
      briMax: 100,
      color: "#f43f5e",
      bgSat: 70,
      bgBri: 10
    }
  ],

  // Figuras y avatares mágicos seleccionables
  figures: [
    {
      id: "caballo",
      name: "Caballo Mágico",
      icon: "🐎",
      desc: "Galope místico con crin estelar y chispas en cascos"
    },
    {
      id: "pegaso",
      name: "Pegaso Alado",
      icon: "🪽",
      desc: "Corcel celestial con alas etéreas que aletean al galope"
    },
    {
      id: "unicornio",
      name: "Unicornio Estelar",
      icon: "🦄",
      desc: "Cuerno de luz radiante con aura prismática"
    },
    {
      id: "dragon",
      name: "Dragón Cósmico",
      icon: "🐉",
      desc: "Serpiente alada de fuego estelar y nebulosa"
    },
    {
      id: "fenix",
      name: "Fénix de Fuego",
      icon: "🔥",
      desc: "Ave sagrada con alas de llamarada y cola de brasas"
    },
    {
      id: "cometa",
      name: "Cometa Estelar",
      icon: "⭐",
      desc: "Estrella fugaz de cristal con estela hiperluminosa"
    }
  ]
};

// Estado reactivo global
const AppState = {
  currentTheme: CONFIG.themes[0],
  currentFigure: "caballo",
  word: CONFIG.defaultWord,
  isMobile: false,
  isSamsungFlip: false,
  effectsReduction: 1,
  
  lettersShown: false,
  hideLetters: false,
  timer: 0,
  restartTimer: null,
  
  effectLetters: 0,
  effectHorse: 0,
  effectMessage: 0,
  
  particles: [],
  fogBackground: [],
  trails: [],
  letterObjects: [],
  clickEffects: [],
  
  init() {
    this.detectDevice();
    this.readURLParams();
    this.pickRandomEffects();
  },
  
  detectDevice() {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    this.isSamsungFlip = /SM-F|Galaxy Z Flip/i.test(navigator.userAgent) || 
      (this.isMobile && (window.innerWidth / window.innerHeight > 0.45 && window.innerWidth / window.innerHeight < 0.55));
    
    this.effectsReduction = this.isMobile ? (this.isSamsungFlip ? 0.35 : 0.5) : 1;
  },
  
  readURLParams() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const textParam = urlParams.get('texto') || urlParams.get('name') || urlParams.get('word');
      if (textParam) {
        this.word = textParam.slice(0, CONFIG.maxTextLength);
      }
      
      const themeParam = urlParams.get('tema') || urlParams.get('theme');
      if (themeParam) {
        const found = CONFIG.themes.find(t => t.id.toLowerCase() === themeParam.toLowerCase() || t.name.toLowerCase() === themeParam.toLowerCase());
        if (found) this.currentTheme = found;
      }

      const figureParam = urlParams.get('figura') || urlParams.get('avatar');
      if (figureParam) {
        const foundFig = CONFIG.figures.find(f => f.id.toLowerCase() === figureParam.toLowerCase() || f.name.toLowerCase() === figureParam.toLowerCase());
        if (foundFig) this.currentFigure = foundFig.id;
      }
    } catch (e) {
      console.warn("Error leyendo URL params:", e);
    }
  },
  
  pickRandomEffects() {
    this.effectLetters = Math.floor(Math.random() * 6);
    this.effectHorse = Math.floor(Math.random() * 6);
    this.effectMessage = Math.floor(Math.random() * 6);
  },
  
  setTheme(theme) {
    if (typeof theme === 'string') {
      const found = CONFIG.themes.find(t => t.id === theme || t.name === theme);
      if (found) theme = found;
      else return;
    }
    this.currentTheme = theme;

    // Actualizar niebla ambiental inmediatamente
    if (this.fogBackground && this.fogBackground.length) {
      for (let n of this.fogBackground) {
        if (typeof n.retheme === 'function') {
          n.retheme();
        }
      }
    }

    // Actualizar estrellas de fondo
    if (this.particles && this.particles.length) {
      for (let p of this.particles) {
        if (typeof p.retheme === 'function') {
          p.retheme();
        }
      }
    }

    // Actualizar interfaz, luna y variables CSS
    if (window.UI) {
      if (typeof window.UI.updateThemeBadge === 'function') window.UI.updateThemeBadge();
      if (typeof window.UI.applyThemeToElements === 'function') window.UI.applyThemeToElements();
      if (typeof window.UI.renderThemeCards === 'function') window.UI.renderThemeCards();
    }
  },

  setFigure(figureId) {
    const found = CONFIG.figures.find(f => f.id === figureId);
    if (found) {
      this.currentFigure = found.id;
      if (window.UI && typeof window.UI.renderFigureCards === 'function') {
        window.UI.renderFigureCards();
        window.UI.showToast(`Figura: ${found.icon} ${found.name} ✨`);
      }
    }
  }
};
