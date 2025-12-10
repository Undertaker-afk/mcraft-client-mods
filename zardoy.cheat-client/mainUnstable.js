//@ts-check

export default () => {
  globalThis.customEvents.on('gameLoaded', () => {
    const bot = globalThis.bot
    
    // Cheat Client Module System
    const modules = new Map()
    let guiVisible = false
    let selectedCategory = 'Combat'
    let selectedModule = null
    let isBindingKey = false
    
    // Expose modules to ThreeJS backend
    globalThis.cheatClientModules = modules
    
    // Load saved settings from localStorage
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem('cheatClientSettings')
        return saved ? JSON.parse(saved) : {}
      } catch (err) {
        return {}
      }
    }
    
    const saveSettings = () => {
      try {
        const settings = {}
        modules.forEach((module, name) => {
          settings[name] = {
            enabled: module.enabled,
            keybind: module.keybind,
            settings: module.settings
          }
        })
        localStorage.setItem('cheatClientSettings', JSON.stringify(settings))
      } catch (err) {
        console.error('Failed to save settings:', err)
      }
    }
    
    const savedSettings = loadSettings()
    
    // Register Module Helper
    const registerModule = (module) => {
      // Apply saved settings
      if (savedSettings[module.name]) {
        const saved = savedSettings[module.name]
        module.keybind = saved.keybind !== undefined ? saved.keybind : module.keybind
        if (saved.settings) {
          module.settings = { ...module.settings, ...saved.settings }
        }
      }
      modules.set(module.name, module)
    }
    
    // ========== COMBAT MODULES ==========
    registerModule({
      name: 'KillAura',
      description: 'Automatisch Angriff auf nahegelegene Entities',
      category: 'Combat',
      enabled: false,
      keybind: 'r',
      settings: {
        range: 4.5,
        attackSpeed: 10,
        players: true,
        mobs: true
      },
      tick: () => {
        if (!bot.entity) return
        const module = modules.get('KillAura')
        const entities = Object.values(bot.entities)
        
        for (const entity of entities) {
          if (entity === bot.entity) continue
          if (!entity.position) continue
          
          const distance = bot.entity.position.distanceTo(entity.position)
          if (distance > module.settings.range) continue
          
          if (entity.type === 'player' && module.settings.players) {
            bot.attack(entity)
            break
          }
          if (entity.type === 'mob' && module.settings.mobs) {
            bot.attack(entity)
            break
          }
        }
      }
    })
    
    registerModule({
      name: 'AutoTotem',
      description: 'Automatisch Totems in Offhand',
      category: 'Combat',
      enabled: false,
      keybind: 'y',
      tick: () => {
        try {
          const offhand = bot.inventory.slots[45]
          if (offhand && offhand.name === 'totem_of_undying') return
          
          const totem = bot.inventory.items().find(item => 
            item.name === 'totem_of_undying'
          )
          
          if (totem) {
            bot.equip(totem, 'off-hand').catch(() => {})
          }
        } catch (err) {
          console.error('AutoTotem error:', err)
        }
      }
    })
    
    registerModule({
      name: 'Criticals',
      description: 'Kritische Treffer bei jedem Hit',
      category: 'Combat',
      enabled: false,
      keybind: 'k'
    })
    
    registerModule({
      name: 'Velocity',
      description: 'Anti-Knockback',
      category: 'Combat',
      enabled: false,
      settings: {
        horizontal: 0,
        vertical: 0
      }
    })
    
    // ========== MOVEMENT MODULES ==========
    registerModule({
      name: 'Flight',
      description: 'Fliegen im Survival',
      category: 'Movement',
      enabled: false,
      keybind: 'f',
      settings: {
        speed: 1.0
      },
      tick: () => {
        if (!bot.entity) return
        const module = modules.get('Flight')
        const speed = module.settings.speed
        
        bot.entity.velocity.y = 0
        
        if (bot.controlState.jump) {
          bot.entity.velocity.y = speed * 0.5
        }
        if (bot.controlState.sneak) {
          bot.entity.velocity.y = -speed * 0.5
        }
      }
    })
    
    registerModule({
      name: 'Speed',
      description: 'Schneller laufen',
      category: 'Movement',
      enabled: false,
      keybind: 'v',
      settings: {
        speed: 2.0
      },
      tick: () => {
        if (!bot.entity) return
        const module = modules.get('Speed')
        const multiplier = module.settings.speed
        
        if (bot.controlState.forward || bot.controlState.back || 
            bot.controlState.left || bot.controlState.right) {
          bot.entity.velocity.x *= multiplier
          bot.entity.velocity.z *= multiplier
        }
      }
    })
    
    registerModule({
      name: 'NoFall',
      description: 'Kein Fallschaden',
      category: 'Movement',
      enabled: false,
      tick: () => {
        if (!bot.entity) return
        if (bot.entity.velocity.y < -0.5) {
          bot.entity.onGround = true
        }
      }
    })
    
    registerModule({
      name: 'Jesus',
      description: 'Auf Wasser laufen',
      category: 'Movement',
      enabled: false,
      tick: () => {
        if (!bot.entity) return
        
        const blockBelow = bot.blockAt(
          bot.entity.position.offset(0, -0.1, 0)
        )
        
        if (blockBelow && blockBelow.name === 'water') {
          bot.entity.velocity.y = 0.1
        }
      }
    })
    
    registerModule({
      name: 'Sprint',
      description: 'Immer sprinten',
      category: 'Movement',
      enabled: false,
      tick: () => {
        if (bot.controlState.forward) {
          bot.setSprinting(true)
        }
      }
    })
    
    registerModule({
      name: 'Step',
      description: 'Höhere Blöcke hochspringen',
      category: 'Movement',
      enabled: false,
      settings: {
        height: 2.0
      }
    })
    
    // ========== RENDER MODULES ==========
    registerModule({
      name: 'ESP',
      description: 'ESP für Spieler und Mobs',
      category: 'Render',
      enabled: false,
      keybind: 'u',
      settings: {
        players: true,
        mobs: false,
        items: false
      }
    })
    
    registerModule({
      name: 'Tracers',
      description: 'Linien zu Entities',
      category: 'Render',
      enabled: false,
      settings: {
        players: true,
        mobs: false
      }
    })
    
    registerModule({
      name: 'Fullbright',
      description: 'Volle Helligkeit',
      category: 'Render',
      enabled: false,
      keybind: 'b',
      onEnable: () => {
        const style = document.createElement('style')
        style.id = 'fullbright-style'
        style.textContent = 'canvas { filter: brightness(200%) !important; }'
        document.head.appendChild(style)
        addNotification('§aFullbright aktiviert')
      },
      onDisable: () => {
        const style = document.getElementById('fullbright-style')
        if (style) style.remove()
        addNotification('§cFullbright deaktiviert')
      }
    })
    
    registerModule({
      name: 'Nametags',
      description: 'Bessere Nametags',
      category: 'Render',
      enabled: false,
      settings: {
        health: true,
        distance: true
      }
    })
    
    registerModule({
      name: 'Xray',
      description: 'Sehe durch Blöcke',
      category: 'Render',
      enabled: false,
      keybind: 'x',
      settings: {
        ores: ['diamond_ore', 'iron_ore', 'gold_ore', 'emerald_ore', 'ancient_debris']
      }
    })
    
    // ========== UTILITY MODULES ==========
    registerModule({
      name: 'AutoEat',
      description: 'Automatisch essen',
      category: 'Utility',
      enabled: false,
      settings: {
        hungerLevel: 16
      },
      tick: () => {
        if (!bot.food) return
        const module = modules.get('AutoEat')
        
        if (bot.food < module.settings.hungerLevel) {
          const food = bot.inventory.items().find(item => 
            item.foodPoints && item.foodPoints > 0
          )
          if (food) {
            bot.equip(food, 'hand').then(() => {
              bot.activateItem()
            }).catch(() => {})
          }
        }
      }
    })
    
    registerModule({
      name: 'ChestESP',
      description: 'ESP für Kisten',
      category: 'Utility',
      enabled: false
    })
    
    registerModule({
      name: 'Scaffold',
      description: 'Automatisch Blöcke platzieren',
      category: 'Utility',
      enabled: false,
      tick: () => {
        if (!bot.entity) return
        
        const blockBelow = bot.blockAt(
          bot.entity.position.offset(0, -1, 0)
        )
        
        if (!blockBelow || blockBelow.name === 'air') {
          const blocks = bot.inventory.items().filter(item => 
            item.name.includes('stone') || item.name.includes('dirt') || item.name.includes('cobblestone')
          )
          if (blocks.length > 0) {
            // Place block implementation
          }
        }
      }
    })
    
    registerModule({
      name: 'AutoMine',
      description: 'Automatisch abbauen',
      category: 'Utility',
      enabled: false,
      settings: {
        blocks: ['stone', 'dirt', 'netherrack']
      }
    })
    
    registerModule({
      name: 'AntiAFK',
      description: 'Anti-AFK Bot',
      category: 'Utility',
      enabled: false,
      tick: () => {
        if (Math.random() < 0.01) {
          const actions = ['jump', 'sneak', 'rotate']
          const action = actions[Math.floor(Math.random() * actions.length)]
          
          if (action === 'jump') {
            bot.setControlState('jump', true)
            setTimeout(() => bot.setControlState('jump', false), 100)
          } else if (action === 'rotate') {
            bot.look(Math.random() * Math.PI * 2, Math.random() * Math.PI - Math.PI / 2)
          }
        }
      }
    })
    
    registerModule({
      name: 'AutoReconnect',
      description: 'Automatisch reconnecten',
      category: 'Utility',
      enabled: false,
      settings: {
        delay: 5000
      }
    })
    
    // ========== EXPLOIT MODULES ==========
    registerModule({
      name: 'PacketFly',
      description: 'Fliegen via Packets',
      category: 'Exploit',
      enabled: false,
      settings: {
        speed: 1.0
      }
    })
    
    registerModule({
      name: 'Blink',
      description: 'Packets verzögern',
      category: 'Exploit',
      enabled: false
    })
    
    // ========== MODULE TOGGLE FUNCTION ==========
    const toggleModule = (name) => {
      const module = modules.get(name)
      if (!module) return
      
      module.enabled = !module.enabled
      
      if (module.enabled) {
        addNotification(`§a${name} aktiviert`)
        if (module.onEnable) module.onEnable()
      } else {
        addNotification(`§c${name} deaktiviert`)
        if (module.onDisable) module.onDisable()
      }
      
      saveSettings()
      updateHUD()
    }
    
    const setModuleKeybind = (moduleName, key) => {
      const module = modules.get(moduleName)
      if (!module) return
      
      module.keybind = key
      saveSettings()
      addNotification(`§e${moduleName} keybind set to ${key}`)
    }
    
    const updateModuleSetting = (moduleName, settingKey, value) => {
      const module = modules.get(moduleName)
      if (!module || !module.settings) return
      
      module.settings[settingKey] = value
      saveSettings()
    }
    
    // ========== NOTIFICATION SYSTEM ==========
    const addNotification = (message) => {
      console.log(`[CheatClient] ${message}`)
      
      const notification = document.createElement('div')
      notification.className = 'cheat-notification'
      notification.textContent = message.replace(/§[a-f0-9]/g, '')
      document.body.appendChild(notification)
      
      setTimeout(() => {
        notification.remove()
      }, 3000)
    }
    
    // ========== GUI FUNCTIONS ==========
    const generateGUIHTML = () => {
      const categories = ['Combat', 'Movement', 'Render', 'Utility', 'Exploit']
      const modulesList = Array.from(modules.values())
        .filter(m => m.category === selectedCategory)
        .map(module => {
          const hasSettings = module.settings && Object.keys(module.settings).length > 0
          const settingsHTML = hasSettings && selectedModule === module.name ? `
            <div class="module-settings">
              ${Object.entries(module.settings).map(([key, value]) => {
                if (typeof value === 'boolean') {
                  return `
                    <div class="setting-item">
                      <span class="setting-label">${key}</span>
                      <label class="toggle-switch ${value ? 'active' : ''}" data-module="${module.name}" data-setting="${key}">
                        <input type="checkbox" ${value ? 'checked' : ''}>
                      </label>
                    </div>
                  `
                } else if (typeof value === 'number') {
                  return `
                    <div class="setting-item">
                      <span class="setting-label">${key}</span>
                      <div class="setting-value-group">
                        <input type="range" min="0" max="${key.includes('range') ? '10' : key.includes('speed') ? '5' : '20'}" step="0.1" value="${value}" 
                               class="setting-slider" data-module="${module.name}" data-setting="${key}">
                        <span class="setting-value">${value}</span>
                      </div>
                    </div>
                  `
                } else if (Array.isArray(value)) {
                  return `
                    <div class="setting-item">
                      <span class="setting-label">${key}</span>
                      <span class="setting-value">${value.length} items</span>
                    </div>
                  `
                }
                return ''
              }).join('')}
              <div class="setting-item keybind-setting">
                <span class="setting-label">Keybind</span>
                <button class="keybind-btn" data-module="${module.name}">
                  ${isBindingKey && selectedModule === module.name ? 'Press any key...' : (module.keybind || 'None').toUpperCase()}
                </button>
              </div>
            </div>
          ` : ''
          
          return `
            <div class="module-item ${module.enabled ? 'enabled' : ''}" data-module="${module.name}">
              <div class="module-header" data-module="${module.name}">
                <div class="module-info">
                  <span class="module-name">${module.name}</span>
                  <span class="module-keybind">${module.keybind ? module.keybind.toUpperCase() : 'NONE'}</span>
                </div>
                ${hasSettings ? `<span class="settings-icon" data-module="${module.name}">⚙</span>` : ''}
              </div>
              <div class="module-description">${module.description}</div>
              ${settingsHTML}
            </div>
          `
        }).join('')
      
      return `
        <div class="cheat-gui-container">
          <div class="cheat-gui-header">
            <div class="header-title">
              <div class="logo">CHEAT CLIENT</div>
              <div class="version">v1.0</div>
            </div>
            <span class="close-btn">✕</span>
          </div>
          <div class="cheat-gui-tabs">
            ${categories.map(cat => `
              <div class="tab ${cat === selectedCategory ? 'active' : ''}" data-category="${cat}">
                <span class="tab-icon">${getCategoryIcon(cat)}</span>
                <span class="tab-label">${cat}</span>
              </div>
            `).join('')}
          </div>
          <div class="cheat-gui-content">
            <div class="cheat-gui-modules">
              ${modulesList}
            </div>
          </div>
        </div>
      `
    }
    
    const getCategoryIcon = (category) => {
      const icons = {
        'Combat': '⚔',
        'Movement': '🏃',
        'Render': '👁',
        'Utility': '🔧',
        'Exploit': '💥'
      }
      return icons[category] || '•'
    }
    
    const showGUI = () => {
      let gui = document.getElementById('cheat-client-gui')
      if (!gui) {
        gui = document.createElement('div')
        gui.id = 'cheat-client-gui'
        document.body.appendChild(gui)
      }
      gui.innerHTML = generateGUIHTML()
      gui.style.display = 'block'
      
      // Close button
      const closeBtn = gui.querySelector('.close-btn')
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          guiVisible = false
          selectedModule = null
          hideGUI()
        })
      }
      
      // Category/Tab buttons
      gui.querySelectorAll('.tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const tab = e.currentTarget
          selectedCategory = tab.dataset.category
          selectedModule = null
          showGUI()
        })
      })
      
      // Module toggle (click on header)
      gui.querySelectorAll('.module-header').forEach(header => {
        header.addEventListener('click', (e) => {
          if (e.target.classList.contains('settings-icon')) return
          const moduleName = header.dataset.module
          toggleModule(moduleName)
        })
      })
      
      // Settings icon (expand settings)
      gui.querySelectorAll('.settings-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
          e.stopPropagation()
          const moduleName = icon.dataset.module
          selectedModule = selectedModule === moduleName ? null : moduleName
          showGUI()
        })
      })
      
      // Keybind buttons
      gui.querySelectorAll('.keybind-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          const moduleName = btn.dataset.module
          isBindingKey = true
          selectedModule = moduleName
          showGUI()
        })
      })
      
      // Toggle switches for boolean settings
      gui.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
          e.stopPropagation()
          const moduleName = toggle.dataset.module
          const settingKey = toggle.dataset.setting
          const checkbox = toggle.querySelector('input')
          const newValue = !checkbox.checked
          updateModuleSetting(moduleName, settingKey, newValue)
          showGUI()
        })
      })
      
      // Sliders for numeric settings
      gui.querySelectorAll('.setting-slider').forEach(slider => {
        slider.addEventListener('input', (e) => {
          const moduleName = slider.dataset.module
          const settingKey = slider.dataset.setting
          const value = parseFloat(e.target.value)
          updateModuleSetting(moduleName, settingKey, value)
          const valueDisplay = slider.parentElement.querySelector('.setting-value')
          if (valueDisplay) valueDisplay.textContent = value
        })
      })
    }
    
    const hideGUI = () => {
      const gui = document.getElementById('cheat-client-gui')
      if (gui) gui.style.display = 'none'
    }
    
    // ========== HUD ==========
    const hud = document.createElement('div')
    hud.id = 'cheat-client-hud'
    hud.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      color: white;
      font-family: 'Minecraft', monospace;
      font-size: 14px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      pointer-events: none;
      z-index: 9999;
    `
    document.body.appendChild(hud)
    
    const updateHUD = () => {
      const enabled = Array.from(modules.values())
        .filter(m => m.enabled)
        .map(m => m.name)
      
      hud.innerHTML = `
        <div style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px;">
          <div style="color: #00ff00; font-weight: bold; margin-bottom: 5px; font-size: 16px;">
            ⚡ Cheat Client v1.0
          </div>
          ${enabled.map(m => `<div style="color: #00ff00;">• ${m}</div>`).join('')}
        </div>
      `
    }
    
    updateHUD()
    
    // ========== KEYBIND LISTENER ==========
    document.addEventListener('keydown', (e) => {
      // Handle keybind assignment
      if (isBindingKey && selectedModule) {
        e.preventDefault()
        if (e.key === 'Escape') {
          setModuleKeybind(selectedModule, null)
        } else if (e.key.length === 1 || ['Shift', 'Control', 'Alt'].includes(e.key)) {
          setModuleKeybind(selectedModule, e.key.toLowerCase())
        }
        isBindingKey = false
        showGUI()
        return
      }
      
      // Toggle GUI with Right Shift
      if (e.key === 'Shift' && e.location === 2) {
        e.preventDefault()
        guiVisible = !guiVisible
        if (guiVisible) {
          showGUI()
        } else {
          selectedModule = null
          hideGUI()
        }
        return
      }
      
      // Don't trigger module keybinds when GUI is open or typing
      if (guiVisible) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      
      // Module keybinds
      for (const [name, module] of modules) {
        if (module.keybind && e.key.toLowerCase() === module.keybind.toLowerCase()) {
          e.preventDefault()
          toggleModule(name)
        }
      }
    })
    
    // ========== TICK LOOP ==========
    setInterval(() => {
      for (const [name, module] of modules) {
        if (module.enabled && module.tick) {
          try {
            module.tick()
          } catch (err) {
            console.error(`Error in ${name}:`, err)
          }
        }
      }
    }, 50) // 20 ticks per second
    
    // ========== CLEANUP ON DISCONNECT ==========
    bot.on('end', () => {
      const gui = document.getElementById('cheat-client-gui')
      if (gui) gui.remove()
      
      const hudEl = document.getElementById('cheat-client-hud')
      if (hudEl) hudEl.remove()
      
      const style = document.getElementById('fullbright-style')
      if (style) style.remove()
    })
    
    console.log('🎮 Cheat Client geladen! Drücke Right Shift für GUI')
    addNotification('§aCheat Client v1.0 geladen!')
  })
}
