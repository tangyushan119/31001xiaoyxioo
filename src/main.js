import { Renderer } from './modules/Renderer.js';
import { Terrain } from './modules/Terrain.js';
import { Player } from './modules/Player.js';
import { Storage } from './modules/Storage.js';
import { Input } from './modules/Input.js';
import { BuildPanel } from './components/BuildPanel.js';
import { InventoryPanel } from './components/InventoryPanel.js';
import { ResourceManager } from './modules/ResourceManager.js';
import { EnemyManager } from './modules/EnemyManager.js';
import { TurretManager } from './modules/TurretManager.js';
import { Barracks } from './modules/Barracks.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.storage = new Storage();
        this.input = new Input();
        this.terrain = null;
        this.player = null;
        this.buildPanel = null;
        this.inventoryPanel = null;
        this.resourceManager = null;
        this.enemyManager = null;
        this.turretManager = null;
        this.barracks = null;
        
        this.lastTime = 0;
        this.isRunning = false;
        this.isReady = false;
        
        this.selectedSeed = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startGameLoop();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            if (this.terrain) {
                this.terrain.updateDimensions();
            }
        });
        
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.restart());
        }
        
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                this.clearSelectedSeed();
            }
        });
        
        const trainBtns = document.querySelectorAll('.train-btn');
        trainBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.onTrainClick(e));
        });
    }
    
    onTrainClick(e) {
        const btn = e.target;
        const soldierType = btn.dataset.soldier;
        
        if (!this.barracks) return;
        
        const result = this.barracks.train(soldierType);
        
        if (result.success) {
            this.showToast(result.message);
            this.buildPanel.updateResourceDisplay();
        } else {
            this.showToast(result.message);
        }
    }

    startGameLoop() {
        const checkReady = () => {
            if (this.renderer.isReady()) {
                this.setupGame();
            } else {
                requestAnimationFrame(checkReady);
            }
        };
        
        checkReady();
    }

    setupGame() {
        this.terrain = new Terrain(this.renderer);
        this.terrain.init();
        
        this.player = new Player(this);
        
        this.input.setGame(this);
        
        this.buildPanel = new BuildPanel(this);
        this.inventoryPanel = new InventoryPanel(this);
        
        this.resourceManager = new ResourceManager(this);
        
        this.enemyManager = new EnemyManager(this);
        
        this.turretManager = new TurretManager(this);
        this.turretManager.init();
        
        this.barracks = new Barracks(this);
        
        this.renderer.setGame(this);
        
        this.buildPanel.updateResourceDisplay();
        this.buildPanel.updateBuildingCount();
        
        this.isReady = true;
        this.isRunning = true;
        this.lastTime = performance.now();
        
        this.gameLoop();
        
        this.showWelcomeMessage();
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        if (!this.isReady) return;
        
        this.player.update(deltaTime);
        this.terrain.update(deltaTime);
        this.input.update();
        
        if (this.resourceManager) {
            this.resourceManager.update(deltaTime);
        }
        
        if (this.enemyManager) {
            this.enemyManager.updateEnemies(deltaTime);
        }
        
        if (this.turretManager) {
            this.turretManager.updateTurrets(deltaTime);
        }
        
        if (this.storage) {
            this.storage.updateFarmPlots();
            this.updateBuildings(deltaTime);
        }
        
        this.checkBuildingInteractions();
        this.checkFarmPlotInteractions();
        this.checkSelectedBuildingPlacement();
    }

    render() {
        if (!this.isReady) {
            this.renderer.render();
            return;
        }
        
        this.renderer.render();
        
        if (this.resourceManager) {
            this.resourceManager.render(this.renderer.ctx);
        }
    }

    checkBuildingInteractions() {
        if (!this.player || !this.storage) return;
        
        const playerPos = this.player.getPosition();
        const buildings = this.storage.getBuildings();
        
        buildings.forEach(building => {
            const dx = playerPos.x - building.x;
            const dy = playerPos.y - building.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < building.size && this.input.wasClicked()) {
                this.onBuildingClick(building);
            }
        });
    }
    
    checkSelectedBuildingPlacement() {
        if (!this.buildPanel || !this.buildPanel.selectedBuilding) return;
        
        const hasClick = this.input.wasClicked();
        const hasRelease = this.input.wasReleased();
        
        if (!hasClick && !hasRelease) return;
        
        const mousePos = this.input.getCanvasMousePosition();
        
        const buildingType = this.buildPanel.selectedBuilding;
        const buildingConfig = this.buildPanel.buildingTypes[buildingType];
        
        if (!buildingConfig) return;
        
        const terrainType = this.terrain.getTerrainType(mousePos.x, mousePos.y);
        
        if (terrainType !== 'land') {
            return;
        }
        
        const resources = this.storage.getResources();
        let canAfford = true;
        for (const [key, value] of Object.entries(buildingConfig.cost)) {
            if ((resources[key] || 0) < value) {
                canAfford = false;
                break;
            }
        }
        
        if (!canAfford) {
            return;
        }
        
        this.buildPanel.tryPlaceBuilding(buildingType, mousePos.x, mousePos.y);
        this.buildPanel.clearSelectedBuilding();
    }

    onBuildingClick(building) {
        console.log('Clicked on building:', building.name);
    }
    
    updateBuildings(deltaTime) {
        const buildings = this.storage.getBuildings();
        const now = Date.now();
        
        buildings.forEach(building => {
            if (building.goldPerSecond && building.lastGoldTime) {
                const timeSinceLastGold = now - building.lastGoldTime;
                const goldInterval = 1000;
                
                if (timeSinceLastGold >= goldInterval) {
                    const goldToAdd = Math.floor(timeSinceLastGold / goldInterval) * building.goldPerSecond;
                    this.storage.modifyResource('gold', goldToAdd);
                    building.lastGoldTime = now;
                }
            }
        });
    }

    checkFarmPlotInteractions() {
        if (!this.input.wasClicked()) return;
        
        const mousePos = this.input.getCanvasMousePosition();
        const terrain = this.getTerrain();
        const existingPanel = document.getElementById('seed-selection-panel');
        
        if (!terrain || !terrain.landRenderer) return;
        
        const plot = terrain.landRenderer.getPlotAtPosition(mousePos.x, mousePos.y);
        
        if (plot) {
            const plots = this.storage.getFarmPlots();
            const targetPlot = plots.find(p => p.id === plot.id);
            
            if (targetPlot) {
                if (targetPlot.isReady) {
                    this.harvestCrop(targetPlot.id);
                } else if (!targetPlot.crop) {
                    if (!existingPanel) {
                        this.showSeedSelection(plot);
                    } else {
                        this.currentPlot = plot;
                        this.showToast(`📍 已选择地块 (${plot.row + 1}, ${plot.col + 1})`);
                    }
                }
            }
        }
    }

    showSeedSelection(plot) {
        const existingPanel = document.getElementById('seed-selection-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        const panel = document.createElement('div');
        panel.id = 'seed-selection-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(30, 41, 59, 0.95);
            backdrop-filter: blur(12px);
            border-radius: 14px;
            padding: 20px;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
            z-index: 100;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            min-width: 180px;
            cursor: default;
        `;
        
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                panel.remove();
                this.selectedSeed = null;
            }
        });
        
        const cropTypes = this.storage.getCropTypes();
        const resources = this.storage.getResources();
        const seedResources = this.storage.getResourcesByCategory('seeds');
        
        let hasSeeds = false;
        
        const buttons = [];
        
        Object.entries(cropTypes).forEach(([key, cropInfo]) => {
            const seedKey = `${key}Seed`;
            const seedCount = resources[seedKey] || 0;
            const hasSeed = seedCount > 0;
            
            if (hasSeed) {
                hasSeeds = true;
            }
            
            const button = document.createElement('button');
            button.dataset.seedType = key;
            buttons.push(button);
            
            button.style.cssText = `
                padding: 10px 12px;
                border: none;
                border-radius: 8px;
                cursor: ${hasSeed ? 'pointer' : 'not-allowed'};
                opacity: ${hasSeed ? 1 : 0.4};
                background: ${hasSeed ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
                transition: all 0.25s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 3px;
                min-width: 70px;
                border: 2px solid transparent;
            `;
            
            if (hasSeed) {
                button.onclick = () => {
                    buttons.forEach(btn => {
                        btn.style.borderColor = 'transparent';
                        btn.style.background = 'rgba(74, 222, 128, 0.15)';
                    });
                    
                    button.style.borderColor = '#4ade80';
                    button.style.background = 'rgba(74, 222, 128, 0.3)';
                    
                    this.selectedSeed = key;
                    this.showToast(`✅ 已选中 ${cropInfo.emoji} ${cropInfo.name}种子，点击空地播种`);
                };
                
                button.onmouseenter = () => {
                    if (!this.selectedSeed || this.selectedSeed !== key) {
                        button.style.background = 'rgba(74, 222, 128, 0.3)';
                        button.style.transform = 'scale(1.05)';
                    }
                };
                
                button.onmouseleave = () => {
                    if (!this.selectedSeed || this.selectedSeed !== key) {
                        button.style.background = 'rgba(74, 222, 128, 0.15)';
                        button.style.transform = 'scale(1)';
                    }
                };
            }
            
            button.innerHTML = `
                <span style="font-size: 20px;">${cropInfo.emoji}</span>
                <span style="color: white; font-size: 11px; font-weight: 500;">${cropInfo.name}</span>
                <span style="color: rgba(255, 255, 255, 0.6); font-size: 10px;">${seedCount} 个</span>
            `;
            
            panel.appendChild(button);
        });
        
        const confirmBtn = document.createElement('button');
        confirmBtn.style.cssText = `
            padding: 10px 16px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            background: linear-gradient(135deg, #4ade80, #22c55e);
            color: white;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.25s ease;
            grid-column: span 2;
            margin-top: 8px;
        `;
        confirmBtn.textContent = '🌱 确认播种';
        confirmBtn.onclick = () => {
            if (this.selectedSeed) {
                const targetPlot = this.currentPlot || plot;
                if (!targetPlot) {
                    this.showToast('⚠️ 请先选择地块');
                    return;
                }
                
                const plots = this.storage.getFarmPlots();
                const existingPlot = plots.find(p => p.id === targetPlot.id);
                
                if (!existingPlot || existingPlot.crop) {
                    this.showToast('⚠️ 该地块已被占用');
                    return;
                }
                
                const success = this.storage.plantCrop(targetPlot.id, this.selectedSeed);
                if (success) {
                    const cropInfoData = cropTypes[this.selectedSeed];
                    this.showToast(`🌱 已种下 ${cropInfoData.emoji} ${cropInfoData.name}！`);
                    
                    buttons.forEach(btn => {
                        btn.style.borderColor = 'transparent';
                        btn.style.background = 'rgba(74, 222, 128, 0.15)';
                    });
                    this.selectedSeed = null;
                    
                    const updatedResources = this.storage.getResources();
                    buttons.forEach(btn => {
                        const seedType = btn.dataset.seedType;
                        const seedKey = `${seedType}Seed`;
                        const seedCount = updatedResources[seedKey] || 0;
                        const countSpan = btn.querySelector('span:last-child');
                        if (countSpan) {
                            countSpan.textContent = `${seedCount} 个`;
                        }
                        if (seedCount === 0) {
                            btn.style.opacity = 0.4;
                            btn.style.cursor = 'not-allowed';
                        }
                    });
                } else {
                    this.showToast('❌ 无法播种，请检查种子数量');
                }
            } else {
                this.showToast('⚠️ 请先选择种子');
            }
        };
        confirmBtn.onmouseenter = () => {
            confirmBtn.style.transform = 'scale(1.02)';
            confirmBtn.style.boxShadow = '0 4px 12px rgba(74, 222, 128, 0.4)';
        };
        confirmBtn.onmouseleave = () => {
            confirmBtn.style.transform = 'scale(1)';
            confirmBtn.style.boxShadow = 'none';
        };
        panel.appendChild(confirmBtn);
        
        const cancelBtn = document.createElement('button');
        cancelBtn.style.cssText = `
            padding: 8px 16px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.7);
            font-size: 11px;
            transition: all 0.25s ease;
            grid-column: span 2;
        `;
        cancelBtn.textContent = '取消';
        cancelBtn.onclick = () => {
            panel.remove();
            this.selectedSeed = null;
        };
        cancelBtn.onmouseenter = () => {
            cancelBtn.style.background = 'rgba(255, 255, 255, 0.15)';
        };
        cancelBtn.onmouseleave = () => {
            cancelBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        };
        panel.appendChild(cancelBtn);
        
        if (!hasSeeds) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = `
                padding: 16px;
                text-align: center;
                color: rgba(255, 255, 255, 0.5);
                font-size: 12px;
                grid-column: span 2;
            `;
            emptyMsg.textContent = '📭 没有可用的种子';
            panel.appendChild(emptyMsg);
            
            confirmBtn.disabled = true;
            confirmBtn.style.opacity = 0.5;
            confirmBtn.style.cursor = 'not-allowed';
        }
        
        document.body.appendChild(panel);
        
        return panel;
    }
    
    clearSelectedSeed() {
        if (this.selectedSeed) {
            const cropTypes = this.storage.getCropTypes();
            const cropInfo = cropTypes[this.selectedSeed];
            if (cropInfo) {
                this.showToast(`❌ 已取消选择 ${cropInfo.emoji} ${cropInfo.name}种子`);
            }
            this.selectedSeed = null;
        }
    }

    plantCrop(plotId, cropType) {
        const success = this.storage.plantCrop(plotId, cropType);
        
        if (success) {
            const cropTypes = this.storage.getCropTypes();
            const cropInfo = cropTypes[cropType];
            this.showToast(`🌱 已种下 ${cropInfo.name}！`);
        } else {
            this.showToast('❌ 无法播种，请检查种子数量');
        }
    }

    harvestCrop(plotId) {
        const plots = this.storage.getFarmPlots();
        const plot = plots.find(p => p.id === plotId);
        
        if (!plot || !plot.isReady) return;
        
        const cropTypes = this.storage.getCropTypes();
        const cropInfo = cropTypes[plot.crop];
        
        const success = this.storage.harvestCrop(plotId);
        
        if (success) {
            this.showToast(`✅ 收获了 ${cropInfo.yield} 个 ${cropInfo.name}！`);
        }
    }

    showToast(message) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.background = 'rgba(52, 152, 219, 0.9)';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2500);
    }

    stop() {
        this.isRunning = false;
        if (this.storage) {
            this.storage.stopAutoSave();
        }
        if (this.enemyManager) {
            this.enemyManager.stop();
        }
        if (this.turretManager) {
            this.turretManager.clearAll();
        }
    }

    restart() {
        this.storage.clearAll();
        this.player.init();
        if (this.resourceManager) {
            this.resourceManager = new ResourceManager(this);
        }
        if (this.enemyManager) {
            this.enemyManager.reset();
        }
        if (this.turretManager) {
            this.turretManager.reset();
        }
        this.buildPanel.updateResourceDisplay();
        this.buildPanel.updateBuildingCount();
        this.buildPanel.updateBuildItemStates();
        this.render();
    }

    showWelcomeMessage() {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.background = 'rgba(52, 152, 219, 0.9)';
        toast.textContent = '🌴 欢迎来到海岛生存！使用 WASD 或方向键移动，靠近资源点击采集';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    getRenderer() {
        return this.renderer;
    }

    getTerrain() {
        return this.terrain;
    }

    getPlayer() {
        return this.player;
    }

    getStorage() {
        return this.storage;
    }

    getInput() {
        return this.input;
    }

    getBuildPanel() {
        return this.buildPanel;
    }

    getInventoryPanel() {
        return this.inventoryPanel;
    }

    getResourceManager() {
        return this.resourceManager;
    }

    getEnemyManager() {
        return this.enemyManager;
    }

    getTurretManager() {
        return this.turretManager;
    }

    getBarracks() {
        return this.barracks;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

window.addEventListener('beforeunload', () => {
    if (window.game && window.game.storage) {
        window.game.storage.saveToLocalStorage();
    }
});