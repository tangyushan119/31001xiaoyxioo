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
import { Dock } from './modules/Dock.js';
import { PlayerMovement } from './modules/PlayerMovement.js';
import { BuildingSystem } from './modules/BuildingSystem.js';
import { ShipSystem } from './modules/ShipSystem.js';
import { PlotSystem } from './modules/PlotSystem.js';
import { ResourceSystem } from './modules/ResourceSystem.js';
import { RenderSystem } from './modules/RenderSystem.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.storage = new Storage();
        this.input = new Input();
        
        this.playerMovement = new PlayerMovement(this);
        this.buildingSystem = new BuildingSystem(this);
        this.shipSystem = new ShipSystem(this);
        this.plotSystem = new PlotSystem(this);
        this.resourceSystem = new ResourceSystem(this);
        this.renderSystem = new RenderSystem(this);
        
        this.terrain = null;
        this.player = null;
        this.buildPanel = null;
        this.inventoryPanel = null;
        this.resourceManager = null;
        this.enemyManager = null;
        this.turretManager = null;
        this.barracks = null;
        this.dock = null;
        
        this.lastTime = 0;
        this.isRunning = false;
        this.isReady = false;
        
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
                this.plotSystem.clearSelectedSeed();
                this.buildPanel?.clearSelectedBuilding();
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
        
        this.enemyManager = new EnemyManager(this);
        
        this.turretManager = new TurretManager(this);
        this.turretManager.init();
        
        this.barracks = new Barracks(this);
        
        this.dock = new Dock(this);
        
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
        
        this.resourceSystem.update(deltaTime);
        this.playerMovement.update(deltaTime);
        this.buildingSystem.update(deltaTime);
    }

    render() {
        this.renderSystem.render();
    }

    showShipBuildingPanel() {
        this.shipSystem.showShipBuildingPanel();
    }

    showSeedSelection(plot) {
        this.plotSystem.showSeedSelection(plot);
    }

    harvestCrop(plotId) {
        this.plotSystem.harvestCrop(plotId);
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

    getDock() {
        return this.dock;
    }

    getPlayerMovement() {
        return this.playerMovement;
    }

    getBuildingSystem() {
        return this.buildingSystem;
    }

    getShipSystem() {
        return this.shipSystem;
    }

    getPlotSystem() {
        return this.plotSystem;
    }

    getResourceSystem() {
        return this.resourceSystem;
    }

    getRenderSystem() {
        return this.renderSystem;
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