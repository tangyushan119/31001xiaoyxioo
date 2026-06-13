import { Renderer } from './modules/Renderer.js';
import { Terrain } from './modules/Terrain.js';
import { Player } from './modules/Player.js';
import { Storage } from './modules/Storage.js';
import { Input } from './modules/Input.js';
import { BuildPanel } from './components/BuildPanel.js';
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
        this.resourceManager = null;
        
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
        
        this.checkBuildingInteractions();
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