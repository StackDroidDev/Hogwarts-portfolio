import * as THREE from 'three';

export const HOUSE_THEMES = {
  gryffindor: {
    name: 'Gryffindor',
    primary: '#9c1c1c',
    secondary: '#d69e2e',
    glow: '#e03a3a',
    particleColor: 0xff3b30,
    accentHex: 0xd69e2e,
    particleType: 'fire',
    cssVars: {
      '--accent-glow': 'rgba(224, 58, 58, 0.45)',
      '--accent-gold': '#f5b041',
      '--crest-color': '#c0392b'
    }
  },
  slytherin: {
    name: 'Slytherin',
    primary: '#1b4d3e',
    secondary: '#a3b899',
    glow: '#2ecc71',
    particleColor: 0x2ecc71,
    accentHex: 0xbdc3c7,
    particleType: 'mist',
    cssVars: {
      '--accent-glow': 'rgba(46, 204, 113, 0.45)',
      '--accent-gold': '#a3b899',
      '--crest-color': '#27ae60'
    }
  },
  ravenclaw: {
    name: 'Ravenclaw',
    primary: '#1c3b6e',
    secondary: '#cd7f32',
    glow: '#3498db',
    particleColor: 0x4aa3df,
    accentHex: 0xcd7f32,
    particleType: 'stars',
    cssVars: {
      '--accent-glow': 'rgba(52, 152, 219, 0.45)',
      '--accent-gold': '#e09852',
      '--crest-color': '#2980b9'
    }
  },
  hufflepuff: {
    name: 'Hufflepuff',
    primary: '#e6a117',
    secondary: '#2c2523',
    glow: '#f39c12',
    particleColor: 0xf1c40f,
    accentHex: 0xe67e22,
    particleType: 'dust',
    cssVars: {
      '--accent-glow': 'rgba(243, 156, 18, 0.45)',
      '--accent-gold': '#f39c12',
      '--crest-color': '#d35400'
    }
  }
};

export class HouseThemeManager {
  constructor() {
    this.currentHouse = this.loadSavedHouse();
    this.listeners = [];
    if (this.currentHouse) {
      this.applyCSSTheme(this.currentHouse, false);
    }
  }

  loadSavedHouse() {
    try {
      const saved = localStorage.getItem('hogwarts_portfolio_house');
      if (saved && HOUSE_THEMES[saved]) return saved;
    } catch {
      // safe fallback on restricted storage
    }
    return null;
  }

  saveHouse(houseId) {
    if (!HOUSE_THEMES[houseId]) return;
    this.currentHouse = houseId;
    try {
      localStorage.setItem('hogwarts_portfolio_house', houseId);
    } catch {
      // ignored
    }
    this.applyCSSTheme(houseId, true);
    this.notifyListeners(houseId);
  }

  applyCSSTheme(houseId, animated = true) {
    const theme = HOUSE_THEMES[houseId];
    if (!theme) return;

    const root = document.documentElement;
    Object.entries(theme.cssVars).forEach(([k, v]) => {
      root.style.setProperty(k, v);
    });
    root.setAttribute('data-house', houseId);

    // Update wand cursor spark tint dynamically
    const wandCore = document.querySelector('.wand-core');
    if (wandCore) {
      wandCore.style.boxShadow = `0 0 10px 4px ${theme.glow}, 0 0 25px 8px ${theme.secondary}`;
    }
  }

  getThemeData(houseId = this.currentHouse) {
    return HOUSE_THEMES[houseId] || null;
  }

  onThemeChange(callback) {
    this.listeners.push(callback);
    if (this.currentHouse) callback(this.currentHouse, this.getThemeData());
  }

  notifyListeners(houseId) {
    const data = this.getThemeData(houseId);
    this.listeners.forEach(cb => cb(houseId, data));
  }
}