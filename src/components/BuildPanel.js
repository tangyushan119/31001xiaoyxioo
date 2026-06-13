export class BuildPanel {
    constructor(game) {
        this.game = game;
        this.panel = document.getElementById('build-panel');
        this.items = [];
        this.draggedItem = null;
        
        this.buildingTypes = {
            house: {
                name: '房屋',
                emoji: '🏠',
                cost: { wood: 50, stone: 20 },
                size: 60
            },
            hut: {
                name: '小屋',
                emoji: '🏚️',
                cost: { wood: 30, stone: 10 },
                size: 45
            },
            storage: {
                name: '仓库',
                emoji: '📦',
                cost: { wood: 40, stone: 30 },
                size: 50
            },
            farm: {
                name: '农田',
                emoji: '🌾',
                cost: { wood: 20, stone: 5 },
                size: 55
            },
            fishing: {
                name: '捕鱼站',
                emoji: '🎣',
                cost: { wood: 25, stone: 15 },
                size: 40
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const buildItems = this.panel.querySelectorAll('.build-item');
        
        buildItems.forEach(item => {
            item.addEventListener('dragstart', (e) => this.onDragStart(e));
            item.addEventListener('dragend', (e) => this.onDragEnd(e));
        });
        
        this.game.renderer.canvas.addEventListener('dragover', (e) => this.onDragOver(e));
        this.game.renderer.canvas.addEventListener('dragleave', (e) => this.onDragLeave(e));
        this.game.renderer.canvas.addEventListener('drop', (e) => this.onDrop(e));
    }

    onDragStart(e) {
        this.draggedItem = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.setData('buildingType', e.target.dataset.type);
    }

    onDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedItem = null;
    }

    onDragOver(e) {
        e.preventDefault();
    }

    onDragLeave(e) {
        e.preventDefault();
    }

    onDrop(e) {
        e.preventDefault();
        
        const buildingType = e.dataTransfer.getData('buildingType');
        if (!buildingType) return;
        
        const rect = this.game.renderer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.tryPlaceBuilding(buildingType, x, y);
    }

    tryPlaceBuilding(type, x, y) {
        if (!this.game.terrain.canBuildAt(x, y)) {
            this.showError('只能在草地上建造！');
            return;
        }
        
        const buildingConfig = this.buildingTypes[type];
        if (!buildingConfig) return;
        
        if (!this.hasEnoughResources(buildingConfig.cost)) {
            this.showError('资源不足！');
            return;
        }
        
        if (!this.isSpaceAvailable(x, y, buildingConfig.size)) {
            this.showError('该位置已有建筑！');
            return;
        }
        
        this.consumeResources(buildingConfig.cost);
        this.game.storage.addBuilding({
            id: Date.now(),
            type,
            x,
            y,
            size: buildingConfig.size,
            emoji: buildingConfig.emoji,
            name: buildingConfig.name
        });
        
        this.updateBuildingCount();
        this.game.renderer.render();
    }

    hasEnoughResources(cost) {
        const resources = this.game.storage.getResources();
        return cost.wood <= resources.wood && cost.stone <= resources.stone;
    }

    consumeResources(cost) {
        const storage = this.game.storage;
        storage.modifyResource('wood', -cost.wood);
        storage.modifyResource('stone', -cost.stone);
        this.updateResourceDisplay();
    }

    isSpaceAvailable(x, y, size) {
        const buildings = this.game.storage.getBuildings();
        const halfSize = size / 2;
        
        return !buildings.some(building => {
            const dx = Math.abs(x - building.x);
            const dy = Math.abs(y - building.y);
            return dx < (halfSize + building.size / 2) && dy < (halfSize + building.size / 2);
        });
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(231, 76, 60, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 2000);
    }

    updateResourceDisplay() {
        const resources = this.game.storage.getResources();
        document.getElementById('wood').textContent = resources.wood;
        document.getElementById('stone').textContent = resources.stone;
        document.getElementById('food').textContent = resources.food;
    }

    updateBuildingCount() {
        const count = this.game.storage.getBuildings().length;
        document.getElementById('buildings').textContent = count;
    }

    getBuildingTypes() {
        return this.buildingTypes;
    }
}