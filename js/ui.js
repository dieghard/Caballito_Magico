/**
 * Módulo de Interfaz de Usuario (UI) para Caballito Mágico
 * Manejo del Dock, Input, Modal de Temas, Modal de Figuras, Modal de Compartir y Luna
 */

const UI = {
  elements: {},
  moonClickCount: 0,
  moonLastClick: 0,
  poweredEffects: ["normal", "rainbow", "pulse", "flicker", "wave", "rotate"],
  currentPoweredIdx: 0,

  init() {
    this.cacheElements();
    this.bindEvents();
    this.renderThemeCards();
    this.renderFigureCards();
    this.renderMusicCards();
    this.updateThemeBadge();
    this.applyThemeToElements();
    this.updateMusicUI();
    this.startPoweredByCycle();
  },

  cacheElements() {
    this.elements = {
      magicInput: document.getElementById("magicInput"),
      charCounter: document.getElementById("charCounter"),
      themeBadge: document.getElementById("themeBadge"),
      themeIndicator: document.getElementById("themeIndicator"),
      themeName: document.getElementById("themeName"),
      themeModal: document.getElementById("themeModal"),
      themeGrid: document.getElementById("themeGrid"),
      closeThemeModal: document.getElementById("closeThemeModal"),
      figureModal: document.getElementById("figureModal"),
      figureGrid: document.getElementById("figureGrid"),
      closeFigureModal: document.getElementById("closeFigureModal"),
      musicModal: document.getElementById("musicModal"),
      musicList: document.getElementById("musicList"),
      closeMusicModal: document.getElementById("closeMusicModal"),
      musicBtn: document.getElementById("musicBtn"),
      musicEqBars: document.getElementById("musicEqBars"),
      musicVolumeSlider: document.getElementById("musicVolumeSlider"),
      musicVolumeVal: document.getElementById("musicVolumeVal"),
      shareModal: document.getElementById("shareModal"),
      closeShareModal: document.getElementById("closeShareModal"),
      shareUrlInput: document.getElementById("shareUrlInput"),
      copyShareBtn: document.getElementById("copyShareBtn"),
      moonContainer: document.querySelector(".moon-container"),
      themeBtn: document.getElementById("themeBtn"),
      figureBtn: document.getElementById("figureBtn"),
      audioBtn: document.getElementById("audioBtn"),
      restartBtn: document.getElementById("restartBtn"),
      shareBtn: document.getElementById("shareBtn"),
      fullscreenBtn: document.getElementById("fullscreenBtn"),
      poweredBy: document.getElementById("poweredBy"),
      toast: document.getElementById("toast")
    };
  },

  bindEvents() {
    const el = this.elements;

    // Input de texto mágico
    if (el.magicInput) {
      el.magicInput.value = AppState.word;
      this.updateCharCounter();

      el.magicInput.addEventListener("input", (e) => {
        let val = e.target.value;
        if (val.length > CONFIG.maxTextLength) {
          val = val.slice(0, CONFIG.maxTextLength);
          el.magicInput.value = val;
          this.showToast("Máximo 20 caracteres ✨");
        }
        AppState.word = val;
        this.updateCharCounter();
        if (typeof TextAnimator !== "undefined") {
          TextAnimator.buildLetters();
          // Si la criatura está a la derecha, activar las letras para que se vean de inmediato
          if (typeof creature !== "undefined" && creature.pos.x > width * 0.4) {
            for (let l of AppState.letterObjects) {
              if (creature.pos.x >= l.x) {
                l.born = true;
                l.birthFrame = frameCount - 25;
              }
            }
          }
        }
      });
    }

    // Botón y Badge de Temas
    if (el.themeBtn) {
      el.themeBtn.addEventListener("click", () => this.toggleThemeModal());
    }
    if (el.themeBadge) {
      el.themeBadge.addEventListener("click", () => this.toggleThemeModal());
    }
    if (el.closeThemeModal) {
      el.closeThemeModal.addEventListener("click", () => this.closeThemeModal());
    }

    // Botón de Figuras
    if (el.figureBtn) {
      el.figureBtn.addEventListener("click", () => this.toggleFigureModal());
    }
    if (el.closeFigureModal) {
      el.closeFigureModal.addEventListener("click", () => this.closeFigureModal());
    }

    // Botón de Música Melancólica
    if (el.musicBtn) {
      el.musicBtn.addEventListener("click", () => this.toggleMusicModal());
    }
    if (el.closeMusicModal) {
      el.closeMusicModal.addEventListener("click", () => this.closeMusicModal());
    }
    if (el.musicVolumeSlider) {
      const initialVol = typeof MusicPlayer !== "undefined" ? Math.round(MusicPlayer.volume * 100) : 50;
      el.musicVolumeSlider.value = initialVol;
      if (el.musicVolumeVal) el.musicVolumeVal.textContent = `${initialVol}%`;
      el.musicVolumeSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (el.musicVolumeVal) el.musicVolumeVal.textContent = `${val}%`;
        if (typeof MusicPlayer !== "undefined") MusicPlayer.setVolume(val / 100);
      });
    }

    // Botón de Audio General (Efectos)
    if (el.audioBtn) {
      el.audioBtn.addEventListener("click", () => {
        const isEnabled = AudioManager.toggleAudio();
        el.audioBtn.innerHTML = isEnabled
          ? `<span>🔊</span><span class="label">Sonido ON</span>`
          : `<span>🔇</span><span class="label">Sonido OFF</span>`;
        el.audioBtn.classList.toggle("active", isEnabled);
      });
    }

    // Botón de Reinicio
    if (el.restartBtn) {
      el.restartBtn.addEventListener("click", () => {
        if (typeof window.reiniciarAnimacion === "function") {
          window.reiniciarAnimacion();
        }
      });
    }

    // Botón de Compartir
    if (el.shareBtn) {
      el.shareBtn.addEventListener("click", () => this.openShareModal());
    }
    if (el.closeShareModal) {
      el.closeShareModal.addEventListener("click", () => this.closeShareModal());
    }
    if (el.copyShareBtn) {
      el.copyShareBtn.addEventListener("click", () => this.copyShareLink());
    }

    // Botón de Pantalla Completa
    if (el.fullscreenBtn) {
      el.fullscreenBtn.addEventListener("click", () => this.toggleFullscreen());
    }

    // Interacción con la Luna
    if (el.moonContainer) {
      const handleMoon = (e) => {
        e.stopPropagation();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        this.processMoonTap(clientX, clientY);
      };

      el.moonContainer.addEventListener("click", handleMoon);
      el.moonContainer.addEventListener("touchstart", handleMoon, { passive: true });
    }

    // Clic fuera para cerrar modales
    window.addEventListener("click", (e) => {
      if (el.themeModal && el.themeModal.classList.contains("visible") &&
          !el.themeModal.contains(e.target) && !el.themeBtn.contains(e.target) && !el.themeBadge.contains(e.target)) {
        this.closeThemeModal();
      }
      if (el.figureModal && el.figureModal.classList.contains("visible") &&
          !el.figureModal.contains(e.target) && !el.figureBtn.contains(e.target)) {
        this.closeFigureModal();
      }
      if (el.musicModal && el.musicModal.classList.contains("visible") &&
          !el.musicModal.contains(e.target) && !el.musicBtn.contains(e.target)) {
        this.closeMusicModal();
      }
      if (el.shareModal && el.shareModal.classList.contains("visible") &&
          !el.shareModal.contains(e.target) && !el.shareBtn.contains(e.target)) {
        this.closeShareModal();
      }
    });
  },

  updateCharCounter() {
    if (this.elements.charCounter && this.elements.magicInput) {
      this.elements.charCounter.textContent = `${this.elements.magicInput.value.length}/${CONFIG.maxTextLength}`;
    }
  },

  renderThemeCards() {
    const grid = this.elements.themeGrid;
    if (!grid) return;
    grid.innerHTML = "";

    CONFIG.themes.forEach((t) => {
      const card = document.createElement("div");
      card.className = `theme-card ${t.id === AppState.currentTheme.id ? "active" : ""}`;
      card.dataset.themeId = t.id;
      card.innerHTML = `
        <span class="theme-swatch" style="background-color: ${t.color}; color: ${t.color}"></span>
        <span>${t.icon} ${t.name}</span>
      `;
      card.addEventListener("click", () => {
        AppState.setTheme(t);
        this.updateThemeBadge();
        this.renderThemeCards();
        this.applyThemeToElements();
        this.showToast(`Tema ${t.name} activado ✨`);
        this.closeThemeModal();

        // Destello suave inmediato de confirmación
        createFullScreenFlash(0.35, 450);
      });
      grid.appendChild(card);
    });
  },

  renderFigureCards() {
    const grid = this.elements.figureGrid;
    if (!grid) return;
    grid.innerHTML = "";

    CONFIG.figures.forEach((f) => {
      const card = document.createElement("div");
      card.className = `figure-card ${f.id === AppState.currentFigure ? "active" : ""}`;
      card.dataset.figureId = f.id;
      card.innerHTML = `
        <span class="figure-icon">${f.icon}</span>
        <div class="figure-info">
          <strong>${f.name}</strong>
          <small>${f.desc}</small>
        </div>
      `;
      card.addEventListener("click", () => {
        AppState.setFigure(f.id);
        this.renderFigureCards();
        this.closeFigureModal();
        this.showToast(`¡Criatura ${f.name} invocada! ✨`);

        // Detener de inmediato cualquier sonido de movimiento anterior
        if (typeof AudioManager !== "undefined") {
          AudioManager.stopMovementSound();
        }

        if (typeof window.reiniciarAnimacion === "function") {
          window.reiniciarAnimacion();
        }

        // Iniciar de inmediato el sonido exclusivo de la nueva criatura
        if (typeof AudioManager !== "undefined") {
          AudioManager.startMovementSound(f.id);
        }
      });
      grid.appendChild(card);
    });
  },

  updateThemeBadge() {
    const t = AppState.currentTheme;
    if (this.elements.themeIndicator) {
      this.elements.themeIndicator.style.backgroundColor = t.color;
      this.elements.themeIndicator.style.color = t.color;
    }
    if (this.elements.themeName) {
      this.elements.themeName.textContent = `${t.icon} ${t.name}`;
    }
  },

  applyThemeToElements() {
    const t = AppState.currentTheme;
    
    // Actualizar variables CSS
    document.documentElement.style.setProperty("--accent-color", t.color);
    document.documentElement.style.setProperty("--primary-glow", t.color + "88");

    // Actualizar Luna y sus nubes
    const moon = this.elements.moonContainer;
    if (moon) {
      moon.style.boxShadow = `0 0 55px 18px ${t.color}88, inset 0 0 25px rgba(255, 255, 255, 0.45)`;
      const clouds = moon.querySelector(".clouds");
      if (clouds) {
        clouds.style.filter = `hue-rotate(${t.baseHue}deg) saturate(2.2)`;
      }
    }

    // Actualizar Powered by
    if (this.elements.poweredBy) {
      this.elements.poweredBy.style.color = t.color;
      this.elements.poweredBy.style.textShadow = `0 0 10px ${t.color}`;
    }
  },

  toggleThemeModal() {
    if (!this.elements.themeModal) return;
    this.closeFigureModal();
    this.closeMusicModal();
    this.closeShareModal();
    const isVis = this.elements.themeModal.classList.toggle("visible");
    if (isVis) {
      this.renderThemeCards();
    }
  },

  closeThemeModal() {
    if (this.elements.themeModal) {
      this.elements.themeModal.classList.remove("visible");
    }
  },

  toggleFigureModal() {
    if (!this.elements.figureModal) return;
    this.closeThemeModal();
    this.closeMusicModal();
    this.closeShareModal();
    const isVis = this.elements.figureModal.classList.toggle("visible");
    if (isVis) {
      this.renderFigureCards();
    }
  },

  closeFigureModal() {
    if (this.elements.figureModal) {
      this.elements.figureModal.classList.remove("visible");
    }
  },

  toggleMusicModal() {
    if (!this.elements.musicModal) return;
    this.closeThemeModal();
    this.closeFigureModal();
    this.closeShareModal();
    const isVis = this.elements.musicModal.classList.toggle("visible");
    if (isVis) {
      this.renderMusicCards();
      if (this.elements.musicVolumeSlider && typeof MusicPlayer !== "undefined") {
        const v = Math.round(MusicPlayer.volume * 100);
        this.elements.musicVolumeSlider.value = v;
        if (this.elements.musicVolumeVal) this.elements.musicVolumeVal.textContent = `${v}%`;
      }
    }
  },

  closeMusicModal() {
    if (this.elements.musicModal) {
      this.elements.musicModal.classList.remove("visible");
    }
  },

  renderMusicCards() {
    const list = this.elements.musicList;
    if (!list || typeof MusicPlayer === "undefined") return;
    list.innerHTML = "";

    MusicPlayer.tracks.forEach((track) => {
      const card = document.createElement("div");
      card.className = "music-card";
      if (track.id === MusicPlayer.currentTrackId) {
        card.classList.add("active");
      }

      card.innerHTML = `
        <span class="music-card-icon">${track.icon}</span>
        <div class="music-card-info">
          <div class="music-card-header">
            <strong>${track.name}</strong>
            <span class="music-style-badge">${track.style}</span>
          </div>
          <small>${track.description}</small>
        </div>
        <span class="music-status-dot"></span>
      `;

      card.addEventListener("click", () => {
        MusicPlayer.setTrack(track.id);
        this.updateMusicUI();
        if (track.id === "silencio") {
          this.showToast("Música: En silencio 🔇");
        } else {
          this.showToast(`Música: ${track.icon} ${track.name} ✨`);
        }
      });

      list.appendChild(card);
    });
  },

  updateMusicUI() {
    if (typeof MusicPlayer === "undefined") return;
    const cur = MusicPlayer.getCurrentTrack();
    const isSilencio = MusicPlayer.currentTrackId === "silencio";
    const isPlaying = MusicPlayer.isPlaying && !isSilencio;

    // Actualizar tarjetas en el modal
    if (this.elements.musicList) {
      const cards = this.elements.musicList.querySelectorAll(".music-card");
      cards.forEach((c, idx) => {
        const track = MusicPlayer.tracks[idx];
        if (track) {
          c.classList.toggle("active", track.id === MusicPlayer.currentTrackId);
        }
      });
    }

    // Actualizar botón del Dock
    const btn = this.elements.musicBtn;
    if (btn) {
      const iconEl = btn.querySelector(".music-btn-icon");
      const labelEl = btn.querySelector(".label");
      const eqEl = this.elements.musicEqBars;

      if (isSilencio) {
        btn.classList.remove("active");
        if (iconEl) iconEl.textContent = "🔇";
        if (labelEl) labelEl.textContent = "Silencio";
        if (eqEl) eqEl.classList.remove("playing");
      } else {
        btn.classList.add("active");
        if (iconEl) iconEl.textContent = cur.icon;
        if (labelEl) labelEl.textContent = cur.name;
        if (eqEl) eqEl.classList.toggle("playing", isPlaying);
      }
    }
  },

  openShareModal() {
    if (!this.elements.shareModal || !this.elements.shareUrlInput) return;
    this.closeThemeModal();
    this.closeFigureModal();
    this.closeMusicModal();
    const url = new URL(window.location.href);
    url.searchParams.set("texto", AppState.word);
    url.searchParams.set("tema", AppState.currentTheme.id);
    url.searchParams.set("figura", AppState.currentFigure);
    if (typeof MusicPlayer !== "undefined") {
      url.searchParams.set("musica", MusicPlayer.currentTrackId);
    }
    this.elements.shareUrlInput.value = url.toString();
    this.elements.shareModal.classList.add("visible");
  },

  closeShareModal() {
    if (this.elements.shareModal) {
      this.elements.shareModal.classList.remove("visible");
    }
  },

  copyShareLink() {
    if (!this.elements.shareUrlInput) return;
    this.elements.shareUrlInput.select();
    navigator.clipboard.writeText(this.elements.shareUrlInput.value).then(() => {
      this.showToast("¡Enlace mágico copiado! 🪄");
      this.closeShareModal();
    }).catch(() => {
      document.execCommand("copy");
      this.showToast("¡Enlace mágico copiado! 🪄");
      this.closeShareModal();
    });
  },

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      if (this.elements.fullscreenBtn) {
        this.elements.fullscreenBtn.innerHTML = `<span>🗗</span><span class="label">Salir</span>`;
      }
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      if (this.elements.fullscreenBtn) {
        this.elements.fullscreenBtn.innerHTML = `<span>⛶</span><span class="label">Pantalla Completa</span>`;
      }
    }
  },

  processMoonTap(x, y) {
    const now = Date.now();
    if (now - this.moonLastClick < 450) {
      this.moonClickCount++;
    } else {
      this.moonClickCount = 1;
    }
    this.moonLastClick = now;

    // Detonar fuegos artificiales realistas
    detonateRealisticFirework(x, y);

    const moonEl = this.elements.moonContainer;
    if (this.moonClickCount >= 3) {
      // Salva de fuegos artificiales en abanico
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          detonateRealisticFirework(x + (i - 1) * 60, y + (i % 2 === 0 ? -30 : 20));
        }, i * 150);
      }
      createFullScreenFlash(0.85, 750);
      this.showToast("🌟 ¡SALVA ESTELAR PIROTÉCNICA! 🌟");
      this.moonClickCount = 0;
    } else {
      this.cycleNextTheme();
      createFullScreenFlash(0.4, 400);
    }

    if (moonEl) {
      moonEl.style.transform = `scale(${1 + this.moonClickCount * 0.12})`;
      setTimeout(() => {
        moonEl.style.transform = "";
      }, 1000);
    }
  },

  cycleNextTheme() {
    const currentIdx = CONFIG.themes.findIndex(t => t.id === AppState.currentTheme.id);
    const nextTheme = CONFIG.themes[(currentIdx + 1) % CONFIG.themes.length];
    AppState.setTheme(nextTheme);
    this.updateThemeBadge();
    this.applyThemeToElements();
    this.showToast(`Tema: ${nextTheme.name} ✨`);
  },

  showToast(message) {
    const toast = this.elements.toast;
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  },

  startPoweredByCycle() {
    const el = this.elements.poweredBy;
    if (!el) return;

    el.addEventListener("click", () => {
      this.currentPoweredIdx = (this.currentPoweredIdx + 1) % this.poweredEffects.length;
      this.applyPoweredEffect();
    });

    setInterval(() => {
      this.currentPoweredIdx = (this.currentPoweredIdx + 1) % this.poweredEffects.length;
      this.applyPoweredEffect();
    }, 6000);
  },

  applyPoweredEffect() {
    const el = this.elements.poweredBy;
    if (!el) return;
    const effect = this.poweredEffects[this.currentPoweredIdx];
    const text = "Powered by Diego Markiewicz";

    if (effect === "rainbow") {
      el.innerHTML = text.split("").map((c, i) => `<span style="color: hsl(${(i * 18) % 360}, 95%, 75%)">${c}</span>`).join("");
    } else {
      el.textContent = text;
      el.style.color = AppState.currentTheme.color;
    }
  }
};
