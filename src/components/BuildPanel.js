export class BuildPanel {
    constructor(game) {
        this.game = game;
        this.panel = document.getElementById('build-panel');
        this.items = [];
        this.draggedItem = null;
        
        this.buildingTypes = {
            residence: {
                name: '民居',
                emoji: '🏠',
                cost: { wood: 30 },
                size: 50,
                goldPerSecond: 1
            },
            storageHouse: {
                name: '储物屋',
                emoji: '🏠',
                cost: { wood: 25 },
                size: 45,
                storageBonus: 100
            },
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
        this.selectedBuilding = null;
    }

    setupEventListeners() {
        const buildItems = this.panel.querySelectorAll('.build-item');
        
        buildItems.forEach(item => {
            if (!item.classList.contains('inventory-btn')) {
                item.addEventListener('dragstart', (e) => this.onDragStart(e));
                item.addEventListener('dragend', (e) => this.onDragEnd(e));
                item.addEventListener('dragenter', (e) => this.onDragEnter(e));
                item.addEventListener('dragleave', (e) => this.onDragLeave(e));
                item.addEventListener('click', (e) => this.onBuildItemClick(e));
                item.addEventListener('mouseenter', (e) => this.onBuildItemHover(e));
                item.addEventListener('mouseleave', (e) => this.onBuildItemLeave(e));
            }
        });
        
        if (this.game && this.game.renderer && this.game.renderer.canvas) {
            this.game.renderer.canvas.addEventListener('dragover', (e) => this.onDragOver(e));
            this.game.renderer.canvas.addEventListener('dragleave', (e) => this.onDragLeaveCanvas(e));
            this.game.renderer.canvas.addEventListener('drop', (e) => this.onDrop(e));
        }
        
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
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
        
        const alignedPos = this.snapToGrid(x, y, buildingConfig.size);
        
        if (!this.isSpaceAvailable(alignedPos.x, alignedPos.y, buildingConfig.size)) {
            this.showError('该位置已有建筑！');
            return;
        }
        
        this.consumeResources(buildingConfig.cost);
        
        const buildingData = {
            id: Date.now(),
            type,
            x: alignedPos.x,
            y: alignedPos.y,
            size: buildingConfig.size,
            emoji: buildingConfig.emoji,
            name: buildingConfig.name
        };
        
        if (buildingConfig.goldPerSecond) {
            buildingData.goldPerSecond = buildingConfig.goldPerSecond;
            buildingData.lastGoldTime = Date.now();
        }
        
        if (buildingConfig.storageBonus) {
            buildingData.storageBonus = buildingConfig.storageBonus;
        }
        
        this.game.storage.addBuilding(buildingData);
        
        if (buildingConfig.storageBonus) {
            this.game.storage.addStorageCapacity(buildingConfig.storageBonus);
        }
        
        this.updateBuildingCount();
        this.updateBuildItemStates();
        
        if (this.game.renderer) {
            this.game.renderer.render();
        }
        
        this.showSuccess(`建造了 ${buildingConfig.name}！`);
    }
    
    snapToGrid(x, y, size) {
        const gridSize = 50;
        const halfSize = size / 2;
        
        let alignedX = Math.round(x / gridSize) * gridSize;
        let alignedY = Math.round(y / gridSize) * gridSize;
        
        const terrain = this.game.terrain;
        const maxIterations = 5;
        let iteration = 0;
        
        while (!terrain.canBuildAt(alignedX, alignedY) && iteration < maxIterations) {
            const offsetX = (Math.random() - 0.5) * gridSize * 2;
            const offsetY = (Math.random() - 0.5) * gridSize * 2;
            alignedX = Math.round((x + offsetX) / gridSize) * gridSize;
            alignedY = Math.round((y + offsetY) / gridSize) * gridSize;
            iteration++;
        }
        
        return { x: alignedX, y: alignedY };
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
            water: document.getElementById('water'),
            gold: document.getElementById('gold')
        };
        
        for (const [key, element] of Object.entries(elements)) {
            if (element) {
                element.textContent = resources[key] || 0;
            }
        }
        
        if (this.game.inventoryPanel) {
            this.game.inventoryPanel.updateInventory();
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
    
    onBuildItemClick(e) {
        const item = e.target;
        const buildingType = item.dataset.type;
        const config = this.buildingTypes[buildingType];
        
        if (!config) return;
        
        if (!this.hasEnoughResources(config.cost)) {
            this.showError(`资源不足！需要 ${this.formatCost(config.cost)}`);
            return;
        }
        
        this.selectBuilding(buildingType);
    }
    
    onBuildItemHover(e) {
        const item = e.target;
        const buildingType = item.dataset.type;
        const config = this.buildingTypes[buildingType];
        
        if (config) {
            this.showBuildingTooltip(item, config);
        }
    }
    
    onBuildItemLeave(e) {
        this.hideBuildingTooltip();
    }
    
    onMouseMove(e) {
        if (this.draggedItem && this.draggedItem.dataset.type) {
            this.updateDragPreview(e);
        }
        
        if (this.selectedBuilding && this.game.renderer && this.game.renderer.canvas) {
            const rect = this.game.renderer.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (this.game.terrain.canBuildAt(x, y)) {
                const alignedPos = this.snapToGrid(x, y, this.buildingTypes[this.selectedBuilding].size);
                this.previewBuildingPosition = alignedPos;
            }
        }
    }
    
    selectBuilding(type) {
        this.selectedBuilding = type;
        this.showSuccess(`已选择 ${this.buildingTypes[type].name}，点击草地放置`);
        
        this.highlightSelectedItem(type);
    }
    
    highlightSelectedItem(type) {
        const buildItems = this.panel.querySelectorAll('.build-item');
        
        buildItems.forEach(item => {
            if (item.dataset.type === type) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    clearSelectedBuilding() {
        this.selectedBuilding = null;
        this.previewBuildingPosition = null;
        
        const buildItems = this.panel.querySelectorAll('.build-item');
        buildItems.forEach(item => {
            item.classList.remove('selected');
        });
    }
    
    showBuildingTooltip(item, config) {
        let tooltip = document.getElementById('building-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'building-tooltip';
            tooltip.style.cssText = `
                position: fixed;
                background: rgba(30, 41, 59, 0.95);
                backdrop-filter: blur(12px);
                border-radius: 10px;
                padding: 12px 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                z-index: 2000;
                pointer-events: none;
                border: 1px solid rgba(255, 255, 255, 0.1);
                min-width: 180px;
            `;
            document.body.appendChild(tooltip);
        }
        
        const resources = this.game.storage.getResources();
        let costHtml = '';
        let canAfford = true;
        
        for (const [key, value] of Object.entries(config.cost)) {
            const resourceInfo = this.game.storage.getResourceInfo(key);
            const emoji = resourceInfo ? resourceInfo.emoji : '❓';
            const current = resources[key] || 0;
            const color = current >= value ? '#4ade80' : '#ef4444';
            canAfford = canAfford && (current >= value);
            costHtml += `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
                <span>${emoji}</span>
                <span style="color: rgba(255,255,255,0.7); font-size: 12px;">${resourceInfo?.name || key}</span>
                <span style="color: ${color}; font-weight: 600; margin-left: auto;">${current}/${value}</span>
            </div>`;
        }
        
        let bonusInfo = '';
        if (config.goldPerSecond) {
            bonusInfo += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); color: #fbbf24; font-size: 12px;">💰 +${config.goldPerSecond}/秒</div>`;
        }
        if (config.storageBonus) {
            bonusInfo += `<div style="margin-top: 4px; color: #3b82f6; font-size: 12px;">📦 +${config.storageBonus} 存储</div>`;
        }
        
        tooltip.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <span style="font-size: 28px;">${config.emoji}</span>
                <div>
                    <div style="color: white; font-weight: 600; font-size: 14px;">${config.name}</div>
                    <div style="color: rgba(255,255,255,0.5); font-size: 11px;">尺寸: ${config.size}px</div>
                </div>
            </div>
            <div style="color: rgba(255,255,255,0.6); font-size: 11px; margin-bottom: 8px;">建造消耗:</div>
            ${costHtml}
            ${bonusInfo}
            <div style="margin-top: 8px; color: rgba(255,255,255,0.4); font-size: 10px;">拖拽或点击后放置</div>
        `;
        
        this.updateTooltipPosition();
    }
    
    hideBuildingTooltip() {
        const tooltip = document.getElementById('building-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
    
    updateTooltipPosition() {
        const tooltip = document.getElementById('building-tooltip');
        if (!tooltip) return;
        
        const panelRect = this.panel.getBoundingClientRect();
        tooltip.style.left = (panelRect.right + 15) + 'px';
        tooltip.style.top = (panelRect.top + 20) + 'px';
    }
    
    formatCost(cost) {
        const parts = [];
        for (const [key, value] of Object.entries(cost)) {
            const resourceInfo = this.game.storage.getResourceInfo(key);
            const emoji = resourceInfo ? resourceInfo.emoji : '❓';
            parts.push(`${emoji} ${value}`);
        }
        return parts.join(', ');
    }
}