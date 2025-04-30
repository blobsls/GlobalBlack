class GlobalBlack {
  constructor() {
    this.settings = {
      contrast: 90,
      brightness: -20,
      sepia: 10,
      mode: 'smart',
      excludedElements: []
    };
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observeDocument();
    this.applyDarkMode();
  }

  async loadSettings() {
    const stored = await chrome.storage.sync.get('globalBlackSettings');
    if (stored.globalBlackSettings) {
      this.settings = {...this.settings, ...stored.globalBlackSettings};
    }
  }

  observeDocument() {
    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }

  handleMutations(mutations) {
    if (!this.isEnabled) return;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes') {
        this.processElement(mutation.target);
      } else if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.processElement(node);
          }
        });
      }
    });
  }

  processElement(element) {
    if (this.shouldSkipElement(element)) return;
    
    // Process background colors
    this.convertBackgroundColors(element);
    
    // Process text colors
    this.convertTextColors(element);
    
    // Process borders
    this.convertBorders(element);
    
    // Process images and media
    if (this.settings.mode === 'smart') {
      this.processMediaElements(element);
    }
  }

  shouldSkipElement(element) {
    // Skip elements that should remain unchanged
    return this.settings.excludedElements.some(selector => 
      element.matches(selector) || element.closest(selector)
    );
  }

  convertBackgroundColors(element) {
    const bgColor = getComputedStyle(element).backgroundColor;
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      const newColor = this.convertColor(bgColor, 'background');
      element.style.backgroundColor = newColor;
    }
  }

  convertTextColors(element) {
    const textColor = getComputedStyle(element).color;
    if (textColor && textColor !== 'rgba(0, 0, 0, 0)') {
      const newColor = this.convertColor(textColor, 'text');
      element.style.color = newColor;
    }
  }

  convertBorders(element) {
    ['border', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft'].forEach(prop => {
      const borderValue = getComputedStyle(element)[prop];
      if (borderValue && borderValue !== 'none') {
        const parts = borderValue.split(' ');
        if (parts.length >= 3) {
          const newColor = this.convertColor(parts[2], 'border');
          element.style[prop] = `${parts[0]} ${parts[1]} ${newColor}`;
        }
      }
    });
  }

  processMediaElements(element) {
    if (element.tagName === 'IMG' || element.tagName === 'VIDEO') {
      element.style.filter = `
        brightness(${100 + this.settings.brightness}%)
        contrast(${this.settings.contrast}%)
        sepia(${this.settings.sepia}%)
      `;
    }
  }

  convertColor(color, type) {
    // Advanced color conversion logic
    const rgba = this.parseColor(color);
    if (!rgba) return color;
    
    const [r, g, b, a] = rgba;
    
    if (type === 'background') {
      // Darken background colors
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const factor = luminance / 255;
      
      const newR = Math.max(0, r - (factor * 150));
      const newG = Math.max(0, g - (factor * 150));
      const newB = Math.max(0, b - (factor * 150));
      
      return `rgba(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(newB)}, ${a})`;
    } else if (type === 'text') {
      // Lighten text colors while maintaining contrast
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const factor = (255 - luminance) / 255;
      
      const newR = Math.min(255, r + (factor * 100));
      const newG = Math.min(255, g + (factor * 100));
      const newB = Math.min(255, b + (factor * 100));
      
      return `rgba(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(newB)}, ${a})`;
    } else {
      // Borders and other elements
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const factor = luminance / 255;
      
      const newR = Math.max(0, r - (factor * 100));
      const newG = Math.max(0, g - (factor * 100));
      const newB = Math.max(0, b - (factor * 100));
      
      return `rgba(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(newB)}, ${a})`;
    }
  }

  parseColor(color) {
    // Parse different color formats
    if (color.startsWith('rgba')) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
      if (match) {
        return [
          parseInt(match[1]),
          parseInt(match[2]),
          parseInt(match[3]),
          match[4] ? parseFloat(match[4]) : 1
        ];
      }
    } else if (color.startsWith('#')) {
      const hex = color.substring(1);
      if (hex.length === 3) {
        return [
          parseInt
