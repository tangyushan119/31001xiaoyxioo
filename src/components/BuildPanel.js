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
            },
            campfire: {
                name: '篝火',
                emoji: '🔥',
                cost: { wood: 15 },
                size: 35
            },
            well: {
                name: '水井',
                emoji: '⛏️',
                cost: { wood: 20, stone: 25 },
                size: 45
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateResourceDisplay();
        this.updateBuildingCount();
        this.updateBuildItemStates();
    }

    setupEventListeners() {
        const buildItems = this.panel.querySelectorAll('.build-item');
        
        buildItems.forEach(item => {
            item.addEventListener('dragstart', (e) => this.onDragStart(e));
            item.addEventListener('dragend', (e) => this.onDragEnd(e));
            item.addEventListener('dragenter', (e) => this.onDragEnter(e));
            item.addEventListener('dragleave', (e) => this.onDragLeave(e));
        });
        
        if (this.game && this.game.renderer && this.game.renderer.canvas) {
            this.game.renderer.canvas.addEventListener('dragover', (e) => this.onDragOver(e));
            this.game.renderer.canvas.addEventListener('dragleave', (e) => this.onDragLeaveCanvas(e));
            this.game.renderer.canvas.addEventListener('drop', (e) => this.onDrop(e));
        }
        
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.onResetClick());
        }
    }

    onDragStart(e) {
        this.draggedItem = e.target;
        e.target.classList.add('dragging');
        
        const buildingType = e.target.dataset.type;
        e.dataTransfer.setData('buildingType', buildingType);
        e.dataTransfer.setData('buildingEmoji', e.target.textContent);
        e.dataTransfer.effectAllowed = 'copy';
        
        this.showDragPreview(e, e.target.textContent);
    }

    onDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedItem = null;
        this.hideDragPreview();
    }

    onDragEnter(e) {
        e.preventDefault();
    }

    onDragLeave(e) {
        e.preventDefault();
    }

    onDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        
        this.game.renderer.canvas.style.cursor = 'copy';
    }

    onDragLeaveCanvas(e) {
        this.game.renderer.canvas.style.cursor = 'default';
    }

    onDrop(e) {
        e.preventDefault();
        this.game.renderer.canvas.style.cursor = 'default';
        
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
        this.updateBuildItemStates();
        
        if (this.game.renderer) {
            this.game.renderer.render();
        }
        
        this.showSuccess(`建造了 ${buildingConfig.name}！`);
    }

    hasEnoughResources(cost) {
        const resources = this.game.storage.getResources();
        for (const [key, value] of Object.entries(cost)) {
            if ((resources[key] || 0) < value) {
                return false;
            }
        }
        return true;
    }

    consumeResources(cost) {
        const storage = this.game.storage;
        for (const [key, value] of Object.entries(cost)) {
            storage.modifyResource(key, -value);
        }
        this.updateResourceDisplay();
    }

    isSpaceAvailable(x, y, size) {
        const buildings = this.game.storage.getBuildings();
        const halfSize = size / 2;
        
        return !buildings.some(building => {
            const dx = Math.abs(x - building.x);
            const dy = Math.abs(y - building.y);
            const minDistance = halfSize + building.size / 2 + 10;
            return dx < minDistance && dy < minDistance;
        });
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        
        const colors = {
            error: 'rgba(231, 76, 60, 0.9)',
            success: 'rgba(46, 204, 113, 0.9)',
            info: 'rgba(52, 152, 219, 0.9)'
        };
        
        toast.style.background = colors[type] || colors.info;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2000);
    }

    showDragPreview(e, emoji) {
        const overlay = document.getElementById('drag-overlay');
        const preview = document.getElementById('drag-preview');
        
        if (overlay && preview) {
            preview.textContent = emoji;
            overlay.classList.add('active');
            this.updateDragPreview(e);
        }
    }

    hideDragPreview() {
        const overlay = document.getElementById('drag-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    updateDragPreview(e) {
        const overlay = document.getElementById('drag-overlay');
        const preview = document.getElementById('drag-preview');
        
        if (overlay && preview) {
            overlay.style.left = e.clientX + 'px';
            overlay.style.top = e.clientY + 'px';
            overlay.style.transform = 'translate(-50%, -50%)';
        }
    }

    updateResourceDisplay() {
        const resources = this.game.storage.getResources();
        
        const elements = {
            wood: document.getElementById('wood'),
            stone: document.getElementById('stone'),
            food: document.getElementById('food'),
            water: document.getElementById('water')
        };
        
        for (const [key, element] of Object.entries(elements)) {
            if (element) {
                element.textContent = resources[key] || 0;
            }
        }
    }

    updateBuildingCount() {
        const count = this.game.storage.getBuildings().length;
        const buildingsElement = document.getElementById('buildings');
        if (buildingsElement) {
            buildingsElement.textContent = count;
        }
    }

    updateBuildItemStates() {
        const resources = this.game.storage.getResources();
        const buildItems = this.panel.querySelectorAll('.build-item');
        
        buildItems.forEach(item => {
            const type = item.dataset.type;
            const config = this.buildingTypes[type];
            
            if (config) {
                let canAfford = true;
                for (const [key, value] of Object.entries(config.cost)) {
                    if ((resources[key] || 0) < value) {
                        canAfford = false;
                        break;
                    }
                }
                
                if (canAfford) {
                    item.classList.remove('disabled');
                } else {
                    item.classList.add('disabled');
                }
            }
        });
    }

    onResetClick() {
        if (confirm('确定要重置所有存档吗？这将删除所有建筑和资源！')) {
            this.game.restart();
            this.showSuccess('存档已重置！');
        }
    }

    getBuildingTypes() {
        return this.buildingTypes;
    }
}