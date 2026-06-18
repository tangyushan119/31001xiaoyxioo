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
import { BattleSystem } from './modules/BattleSystem.js';
import { GAME_CONFIG } from './config.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.storage = new Storage();
        this.input = new Input();

        this.modules = {
            playerMovement: new PlayerMovement(this),
            buildingSystem: new BuildingSystem(this),
            shipSystem: new ShipSystem(this),
            plotSystem: new PlotSystem(this),
            resourceSystem: new ResourceSystem(this),
            renderSystem: new RenderSystem(this)
        };

        this.terrain = null;
        this.player = null;
        this.buildPanel = null;
        this.inventoryPanel = null;
        this.resourceManager = null;
        this.enemyManager = null;
        this.turretManager = null;
        this.barracks = null;
        this.dock = null;
        this.battleSystem = null;

        this.lastTime = 0;
        this.isRunning = false;
        this.isReady = false;

        this.hoveredIsland = null;
        this.selectedIsland = null;

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
                this.modules.plotSystem.clearSelectedSeed();
                this.buildPanel?.clearSelectedBuilding();
                this.modules.buildingSystem.cancelPlacement();
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

        this.battleSystem = new BattleSystem(this);

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

        this.modules.resourceSystem.update(deltaTime);
        this.modules.playerMovement.update(deltaTime);
        this.modules.buildingSystem.update(deltaTime);

        if (this.battleSystem) {
            this.battleSystem.update(deltaTime);
        }

        if (this.buildPanel) {
            this.buildPanel.updateTrainingPanel();
        }
    }

    render() {
        this.modules.renderSystem.render();

        if (this.battleSystem) {
            this.battleSystem.renderBattleUI(this.renderer.ctx);
            this.battleSystem.renderBattleLog(this.renderer.ctx);
        }
    }

    showShipBuildingPanel() {
        this.modules.shipSystem.showShipBuildingPanel();
    }

    onBuildingClick(building) {
        this.modules.playerMovement.onBuildingClick(building);

        if (building.type === 'barracks') {
            if (this.buildPanel) {
                this.buildPanel.showTrainingPanel();
            }
        }
    }

    handleCanvasClick(x, y) {
        const input = this.getInput();
        if (!input) return;

        if (this.modules.buildingSystem.isPlacingBuilding()) {
            this.modules.buildingSystem.handleClick(x, y);
            input.mouse.clicked = false;
            return;
        }

        this.modules.buildingSystem.handleClick(x, y);

        const inventoryPanel = this.getInventoryPanel();
        if (inventoryPanel && inventoryPanel.isVisible()) {
            return;
        }

        if (this.modules.plotSystem) {
            const terrain = this.getTerrain();
            if (terrain && terrain.landRenderer) {
                const plot = terrain.landRenderer.getPlotAtPosition(x, y);
                if (plot) {
                    const plots = this.getStorage().getFarmPlots();
                    const targetPlot = plots.find(p => p.id === plot.id);
                    if (targetPlot) {
                        if (targetPlot.isReady) {
                            this.modules.plotSystem.harvestCrop(targetPlot.id);
                            input.mouse.clicked = false;
                            return;
                        } else if (!targetPlot.crop) {
                            this.modules.plotSystem.showSeedSelection(plot);
                            input.mouse.clicked = false;
                            return;
                        }
                    }
                }
            }
        }

        if (this.resourceManager) {
            const player = this.getPlayer();
            if (player) {
                const playerPos = player.getPosition();
                const resources = this.resourceManager.getResources();
                
                for (const resource of resources) {
                    if (resource.isDepleted) continue;
                    const dx = playerPos.x - resource.x;
                    const dy = playerPos.y - resource.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < this.resourceManager.getCollectionRange()) {
                        this.resourceManager.collectResource(resource);
                        input.mouse.clicked = false;
                        return;
                    }
                }
            }
        }

        if (this.dock) {
            const destinations = this.dock.getDestinations();
            for (const id of Object.keys(destinations)) {
                if (id === 'home') continue;
                const pos = this.dock.getIslandPosition(id);
                if (!pos) continue;
                const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
                if (distance <= pos.radius) {
                    this.selectedIsland = id;
                    if (destinations[id].requiresSoldiers) {
                        input.showBattleConfirmModal(id);
                    } else {
                        if (this.buildPanel) {
                            this.buildPanel.showSuccess(`已选中: ${destinations[id].emoji} ${destinations[id].name}`);
                        }
                    }
                    input.mouse.clicked = false;
                    return;
                }
            }
        }
    }

    showSeedSelection(plot) {
        this.modules.plotSystem.showSeedSelection(plot);
    }

    harvestCrop(plotId) {
        this.modules.plotSystem.harvestCrop(plotId);
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
        if (this.dock) {
            this.dock.destroy();
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
        if (this.dock) {
            this.dock.destroy();
            this.dock = new Dock(this);
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
        toast.textContent = '🏝️ 欢迎来到海岛生存，使用 WASD 或方向键移动，靠近资源点击采集';
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
        return this.modules.playerMovement;
    }

    getBuildingSystem() {
        return this.modules.buildingSystem;
    }

    getShipSystem() {
        return this.modules.shipSystem;
    }

    getPlotSystem() {
        return this.modules.plotSystem;
    }

    getResourceSystem() {
        return this.modules.resourceSystem;
    }

    getRenderSystem() {
        return this.modules.renderSystem;
    }

    getBattleSystem() {
        return this.battleSystem;
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

window.buildDockBuildingClick = function(building) {
    if (window.game && window.game.isReady) {
        window.game.onBuildingClick(building);
    }
};