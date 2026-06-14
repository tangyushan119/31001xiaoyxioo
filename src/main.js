import { Renderer } from './modules/Renderer.js';
import { Terrain } from './modules/Terrain.js';
import { Player } from './modules/Player.js';
import { Storage } from './modules/Storage.js';
import { Input } from './modules/Input.js';
import { BuildPanel } from './components/BuildPanel.js';
import { InventoryPanel } from './components/InventoryPanel.js';
import { ResourceManager } from './modules/ResourceManager.js';

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
        this.input.update();
        
        if (this.resourceManager) {
            this.resourceManager.update(deltaTime);
        }
        
        if (this.storage) {
            this.storage.updateFarmPlots();
        }
        
        this.checkBuildingInteractions();
        this.checkFarmPlotInteractions();
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

    onBuildingClick(building) {
        console.log('Clicked on building:', building.name);
    }

    checkFarmPlotInteractions() {
        if (!this.input.wasClicked()) return;
        
        const mousePos = this.input.getCanvasMousePosition();
        const terrain = this.getTerrain();
        
        if (!terrain || !terrain.landRenderer) return;
        
        const plot = terrain.landRenderer.getPlotAtPosition(mousePos.x, mousePos.y);
        if (!plot) {
            if (this.selectedSeed) {
                this.clearSelectedSeed();
            }
            return;
        }
        
        const plots = this.storage.getFarmPlots();
        const targetPlot = plots.find(p => p.id === plot.id);
        
        if (!targetPlot) return;
        
        if (targetPlot.isReady) {
            this.harvestCrop(targetPlot.id);
        } else if (!targetPlot.crop) {
            if (this.selectedSeed) {
                this.plantCrop(plot.id, this.selectedSeed);
                this.clearSelectedSeed();
            } else {
                this.showSeedSelection(plot);
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
            position: absolute;
            background: rgba(30, 41, 59, 0.95);
            backdrop-filter: blur(12px);
            border-radius: 14px;
            padding: 18px;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
            z-index: 100;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            min-width: 160px;
        `;
        
        const terrain = this.getTerrain();
        const landRenderer = terrain.landRenderer;
        const farmArea = landRenderer.getFarmArea();
        const plotSize = landRenderer.getPlotSize();
        const plotGap = landRenderer.plotGap || 3;
        
        panel.style.left = `${farmArea.x + plot.col * (plotSize + plotGap) + plotSize + 10}px`;
        panel.style.top = `${farmArea.y + plot.row * (plotSize + plotGap)}px`;
        
        const cropTypes = this.storage.getCropTypes();
        const resources = this.storage.getResources();
        const seedResources = this.storage.getResourcesByCategory('seeds');
        
        let hasSeeds = false;
        
        Object.entries(cropTypes).forEach(([key, cropInfo]) => {
            const seedKey = `${key}Seed`;
            const seedCount = resources[seedKey] || 0;
            const hasSeed = seedCount > 0;
            
            if (hasSeed) {
                hasSeeds = true;
            }
            
            const button = document.createElement('button');
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
            `;
            
            if (hasSeed) {
                button.onclick = () => {
                    const success = this.plantCrop(plot.id, key);
                    if (success) {
                        const cropInfoData = cropTypes[key];
                        this.showToast(`🌱 已种下 ${cropInfoData.emoji} ${cropInfoData.name}！`);
                    } else {
                        this.showToast('❌ 无法播种，请检查种子数量');
                    }
                    panel.remove();
                };
                
                button.onmouseenter = () => {
                    button.style.background = 'rgba(74, 222, 128, 0.3)';
                    button.style.transform = 'scale(1.05)';
                };
                
                button.onmouseleave = () => {
                    button.style.background = 'rgba(74, 222, 128, 0.15)';
                    button.style.transform = 'scale(1)';
                };
            }
            
            button.innerHTML = `
                <span style="font-size: 20px;">${cropInfo.emoji}</span>
                <span style="color: white; font-size: 11px; font-weight: 500;">${cropInfo.name}</span>
                <span style="color: rgba(255, 255, 255, 0.6); font-size: 10px;">${seedCount} 个</span>
            `;
            
            panel.appendChild(button);
        });
        
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
        }
        
        document.body.appendChild(panel);
        
        const closeOnClickOutside = (e) => {
            const target = e.target;
            if (!panel.contains(target)) {
                const canvas = document.getElementById('game-canvas');
                if (canvas && canvas.contains(target)) {
                    const terrain = this.getTerrain();
                    if (terrain && terrain.landRenderer) {
                        const mousePos = this.input.getCanvasMousePosition();
                        const clickedPlot = terrain.landRenderer.getPlotAtPosition(mousePos.x, mousePos.y);
                        if (clickedPlot && clickedPlot.id === plot.id) {
                            return;
                        }
                    }
                }
                panel.remove();
                document.removeEventListener('click', closeOnClickOutside);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeOnClickOutside);
        }, 0);
        
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
    }

    restart() {
        this.storage.clearAll();
        this.player.init();
        if (this.resourceManager) {
            this.resourceManager = new ResourceManager(this);
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
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

window.addEventListener('beforeunload', () => {
    if (window.game && window.game.storage) {
        window.game.storage.saveToLocalStorage();
    }
});