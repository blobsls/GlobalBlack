document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.storage.sync.get('globalBlackSettings', (data) => {
    const settings = data.globalBlackSettings || {};
    
    // Set toggle state
    document.getElementById('globalToggle').checked = settings.enabled !== false;
    
    // Set mode
    if (settings.mode) {
      document.querySelector(`input[name="mode"][value="${settings.mode}"]`).checked = true;
    }
    
    // Set sliders
    if (settings.brightness) {
      document.getElementById('brightness').value = settings.brightness;
      document.getElementById('brightnessValue').textContent = `${settings.brightness}%`;
    }
    if (settings.contrast) {
      document.getElementById('contrast').value = settings.contrast;
      document.getElementById('contrastValue').textContent = `${settings.contrast}%`;
    }
    if (settings.sepia) {
      document.getElementById('sepia').value = settings.sepia;
      document.getElementById('sepiaValue').textContent = `${settings.sepia}%`;
    }
    
    // Set exclusions
    if (settings.excludedElements) {
      settings.excludedElements.forEach(selector => {
        addExclusionItem(selector);
      });
    }
  });
  
  // Slider value displays
  document.getElementById('brightness').addEventListener('input', (e) => {
    document.getElementById('brightnessValue').textContent = `${e.target.value}%`;
  });
  
  document.getElementById('contrast').addEventListener('input', (e) => {
    document.getElementById('contrastValue').textContent = `${e.target.value}%`;
  });
  
  document.getElementById('sepia').addEventListener('input', (e) => {
    document.getElementById('sepiaValue').textContent = `${e.target.value}%`;
  });
  
  // Add exclusion
  document.getElementById('addExclusion').addEventListener('click', () => {
    const selector = document.getElementById('excludeSelector').value.trim();
    if (selector) {
      addExclusionItem(selector);
      document.getElementById('excludeSelector').value = '';
    }
  });
  
  // Apply settings
  document.getElementById('applySettings').addEventListener('click', () => {
    const settings = {
      enabled: document.getElementById('globalToggle').checked,
      mode: document.querySelector('input[name="mode"]:checked').value,
      brightness: parseInt(document.getElementById('brightness').value),
      contrast: parseInt(document.getElementById('contrast').value),
      sepia: parseInt(document.getElementById('sepia').value),
      excludedElements: Array.from(document.querySelectorAll('.exclusion-item')).map(
        item => item.dataset.selector
      )
    };
    
    chrome.storage.sync.set({ globalBlackSettings: settings }, () => {
      // Send settings to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateSettings',
          settings: settings
        });
      });
      
      // Close popup
      window.close();
    });
  });
  
  function addExclusionItem(selector) {
    const list = document.getElementById('exclusionList');
    const item = document.createElement('div');
    item.className = 'exclusion-item';
    item.dataset.selector = selector;
    item.innerHTML = `
      <span>${selector}</span>
      <button class="remove-exclusion">×</button>
    `;
    
    item.querySelector('.remove-exclusion').addEventListener('click', () => {
      item.remove();
    });
    
    list.appendChild(item);
  }
});
