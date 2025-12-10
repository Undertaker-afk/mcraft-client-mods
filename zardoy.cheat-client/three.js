//@ts-check
import * as THREE from 'three'

export const worldReady = (world) => {
    console.log('[CheatClient] ThreeJS visuals loaded')
    
    const scene = world.scene
    const bot = globalThis.bot
    
    // Storage for visual elements
    const espBoxes = new Map()
    const tracerLines = new Map()
    const chestESPBoxes = new Map()
    
    // Materials
    const espMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00ff00,
        linewidth: 2,
        transparent: true,
        opacity: 0.8
    })
    
    const espMaterialPlayer = new THREE.LineBasicMaterial({ 
        color: 0xff0000,
        linewidth: 2,
        transparent: true,
        opacity: 0.8
    })
    
    const espMaterialMob = new THREE.LineBasicMaterial({ 
        color: 0xffff00,
        linewidth: 2,
        transparent: true,
        opacity: 0.6
    })
    
    const tracerMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5
    })
    
    const tracerMaterialPlayer = new THREE.LineBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.5
    })
    
    const chestMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffa500,
        linewidth: 3,
        transparent: true,
        opacity: 0.9
    })
    
    // Helper function to create a box
    const createBox = (width, height, depth) => {
        const geometry = new THREE.BoxGeometry(width, height, depth)
        const edges = new THREE.EdgesGeometry(geometry)
        return edges
    }
    
    // Helper function to create ESP box for entity
    const createESPBox = (entity, material) => {
        const width = entity.width || 0.6
        const height = entity.height || 1.8
        const edges = createBox(width, height, width)
        const box = new THREE.LineSegments(edges, material)
        
        // Position box
        if (entity.position) {
            box.position.set(
                entity.position.x,
                entity.position.y + height / 2,
                entity.position.z
            )
        }
        
        scene.add(box)
        return box
    }
    
    // Helper function to create tracer line
    const createTracerLine = (from, to, material) => {
        const points = [
            new THREE.Vector3(from.x, from.y, from.z),
            new THREE.Vector3(to.x, to.y, to.z)
        ]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const line = new THREE.Line(geometry, material)
        scene.add(line)
        return line
    }
    
    // Helper function to create chest ESP box
    const createChestBox = (position) => {
        const edges = createBox(1, 1, 1)
        const box = new THREE.LineSegments(edges, chestMaterial)
        box.position.set(position.x + 0.5, position.y + 0.5, position.z + 0.5)
        scene.add(box)
        return box
    }
    
    // Get module state from local storage or window
    const getModuleState = (moduleName) => {
        if (globalThis.cheatClientModules) {
            const module = globalThis.cheatClientModules.get(moduleName)
            return module ? module.enabled : false
        }
        return false
    }
    
    // Update ESP boxes
    const updateESP = () => {
        if (!getModuleState('ESP') || !bot.entity) {
            // Clear all ESP boxes
            espBoxes.forEach(box => {
                scene.remove(box)
                box.geometry.dispose()
            })
            espBoxes.clear()
            return
        }
        
        const currentEntities = new Set()
        const entities = Object.values(bot.entities)
        
        for (const entity of entities) {
            if (!entity || entity === bot.entity) continue
            if (!entity.position) continue
            
            const entityId = entity.id || entity.uuid
            if (!entityId) continue
            
            currentEntities.add(entityId)
            
            // Determine if we should show this entity
            let shouldShow = false
            let material = espMaterial
            
            if (entity.type === 'player') {
                shouldShow = true
                material = espMaterialPlayer
            } else if (entity.type === 'mob') {
                shouldShow = true
                material = espMaterialMob
            }
            
            if (!shouldShow) continue
            
            // Update or create box
            if (espBoxes.has(entityId)) {
                const box = espBoxes.get(entityId)
                const height = entity.height || 1.8
                box.position.set(
                    entity.position.x,
                    entity.position.y + height / 2,
                    entity.position.z
                )
            } else {
                const box = createESPBox(entity, material)
                espBoxes.set(entityId, box)
            }
        }
        
        // Remove boxes for entities that no longer exist
        espBoxes.forEach((box, id) => {
            if (!currentEntities.has(id)) {
                scene.remove(box)
                box.geometry.dispose()
                espBoxes.delete(id)
            }
        })
    }
    
    // Update Tracers
    const updateTracers = () => {
        // Clear all tracers
        tracerLines.forEach(line => {
            scene.remove(line)
            line.geometry.dispose()
        })
        tracerLines.clear()
        
        if (!getModuleState('Tracers') || !bot.entity) return
        
        const entities = Object.values(bot.entities)
        const playerPos = bot.entity.position
        
        for (const entity of entities) {
            if (!entity || entity === bot.entity) continue
            if (!entity.position) continue
            
            let shouldShow = false
            let material = tracerMaterial
            
            if (entity.type === 'player') {
                shouldShow = true
                material = tracerMaterialPlayer
            } else if (entity.type === 'mob') {
                shouldShow = true
                material = tracerMaterial
            }
            
            if (!shouldShow) continue
            
            const entityId = entity.id || entity.uuid
            if (!entityId) continue
            
            // Create tracer from player to entity
            const line = createTracerLine(
                playerPos,
                entity.position.offset(0, entity.height ? entity.height / 2 : 0.9, 0),
                material
            )
            tracerLines.set(entityId, line)
        }
    }
    
    // Update Chest ESP
    const updateChestESP = () => {
        // Clear all chest boxes
        chestESPBoxes.forEach(box => {
            scene.remove(box)
            box.geometry.dispose()
        })
        chestESPBoxes.clear()
        
        if (!getModuleState('ChestESP') || !bot.entity) return
        
        const playerPos = bot.entity.position
        const searchRadius = 50
        
        // Find all chests in range
        const minX = Math.floor(playerPos.x - searchRadius)
        const maxX = Math.floor(playerPos.x + searchRadius)
        const minY = Math.floor(playerPos.y - searchRadius)
        const maxY = Math.floor(playerPos.y + searchRadius)
        const minZ = Math.floor(playerPos.z - searchRadius)
        const maxZ = Math.floor(playerPos.z + searchRadius)
        
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    const block = bot.blockAt({ x, y, z })
                    if (!block) continue
                    
                    // Check if it's a chest-like block
                    if (block.name.includes('chest') || 
                        block.name.includes('shulker') ||
                        block.name.includes('barrel')) {
                        const posKey = `${x},${y},${z}`
                        const box = createChestBox({ x, y, z })
                        chestESPBoxes.set(posKey, box)
                    }
                }
            }
        }
    }
    
    // Xray effect (make specific blocks visible through walls)
    const updateXray = () => {
        if (!getModuleState('Xray')) {
            // Reset all block visibility
            return
        }
        
        // This would require modifying the renderer or materials
        // For web client, we can add glowing effects to specific ores
        const playerPos = bot.entity?.position
        if (!playerPos) return
        
        const searchRadius = 30
        const oreBlocks = ['diamond_ore', 'iron_ore', 'gold_ore', 'emerald_ore', 'ancient_debris', 'coal_ore', 'redstone_ore', 'lapis_ore']
        
        // Find and highlight ores (would need custom implementation based on web client rendering)
    }
    
    // Main update loop
    const update = () => {
        if (!bot || !bot.entity) return
        
        try {
            updateESP()
            updateTracers()
            updateChestESP()
            updateXray()
        } catch (err) {
            console.error('[CheatClient ThreeJS] Update error:', err)
        }
    }
    
    // Update every frame
    let lastUpdate = Date.now()
    const animate = () => {
        const now = Date.now()
        if (now - lastUpdate > 100) { // Update 10 times per second
            update()
            lastUpdate = now
        }
        requestAnimationFrame(animate)
    }
    
    animate()
    
    // Cleanup on world unload
    if (bot) {
        bot.on('end', () => {
            espBoxes.forEach(box => {
                scene.remove(box)
                box.geometry.dispose()
            })
            espBoxes.clear()
            
            tracerLines.forEach(line => {
                scene.remove(line)
                line.geometry.dispose()
            })
            tracerLines.clear()
            
            chestESPBoxes.forEach(box => {
                scene.remove(box)
                box.geometry.dispose()
            })
            chestESPBoxes.clear()
        })
    }
    
    console.log('[CheatClient] ThreeJS visuals ready - ESP, Tracers, ChestESP active')
}

export const panoramaReady = (panorama) => {
    // Nothing needed for panorama
}
