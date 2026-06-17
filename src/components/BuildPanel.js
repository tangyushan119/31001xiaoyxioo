import { BUILDING_TYPES, GAME_CONFIG } from '../config.js';

export class BuildPanel {
    constructor(game) {
        this.game = game;
        this.panel = document.getElementById('build-panel');
        this.items = [];
        this.draggedItem = null;
        this.isDragging = false;
        this.buildingTypes = { ...BUILDING_TYPES };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateResourceDisplay();
        this.updateBuildingCount();
        this.updateBuildItemStates();
        this.selectedBuilding = null;
        this.expandedCategory = null;
        this.selectedShipId = null;
        this.selectedDestinationId = null;
        this.currentFoodCost = 0;
        this.shipBuildingUnlocked = false;
    }

    unlockShipBuilding() {
        this.shipBuildingUnlocked = true;
        this.updateBuildItemStates();
        this.showSuccess('造船功能已解锁！');
    }

    isShipBuildingUnlocked() {
        return this.shipBuildingUnlocked;
    }

    lockShipBuilding() {
        this.shipBuildingUnlocked = false;
        this.updateBuildItemStates();
    }

    setupEventListeners() {
        const categoryBtns = this.panel.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.onCategoryClick(e));
        });

        const buildItems = this.panel.querySelectorAll('.build-item');

        buildItems.forEach(item => {
            if (!item.classList.contains('inventory-btn')) {
                item.addEventListener('dragstart', (e) => this.onDragStart(e));
                item.addEventListener('dragend', (e) => this.onDragEnd(e));
                item.addEventListener('click', (e) => this.onBuildItemClick(e));
                item.addEventListener('mouseenter', (e) => this.onBuildItemHover(e));
                item.addEventListener('mouseleave', (e) => this.onBuildItemLeave(e));
            }
        });

        if (this.game && this.game.renderer && this.game.renderer.canvas) {
            this.game.renderer.canvas.addEventListener('dragover', (e) => this.onDragOver(e));
            this.game.renderer.canvas.addEventListener('drop', (e) => this.onDrop(e));
        }

        document.addEventListener('mousemove', (e) => this.onMouseMove(e));

        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.onResetClick());
        }
    }

    onCategoryClick(e) {
        const btn = e.target.closest('.category-btn');
        const category = btn.dataset.category;

        const allCategoryBtns = this.panel.querySelectorAll('.category-btn');
        const allSubItems = this.panel.querySelectorAll('.sub-items');

        allCategoryBtns.forEach(b => b.classList.remove('active'));
        allSubItems.forEach(s => s.classList.remove('expanded'));

        if (this.expandedCategory !== category) {
            btn.classList.add('active');
            const subItems = this.panel.querySelector(`.sub-items[data-category="${category}"]`);
            if (subItems) {
                subItems.classList.add('expanded');
            }
            this.expandedCategory = category;
        } else {
            this.expandedCategory = null;
        }
    }

    onDragStart(e) {
        const item = e.target;
        const buildingType = item.dataset.type;
        const config = this.buildingTypes[buildingType];

        if (!config || item.classList.contains('disabled')) {
            e.preventDefault();
            return;
        }

        this.isDragging = true;
        this.draggedItem = item;
        this.selectedBuilding = buildingType;

        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', buildingType);

        this.showDragPreview(e, config.emoji);
    }

    onDragEnd(e) {
        this.isDragging = false;
        this.draggedItem = null;
        this.hideDragPreview();
    }

    onDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    onDrop(e) {
        e.preventDefault();

        if (!this.isDragging || !this.selectedBuilding) return;

        const buildingType = e.dataTransfer.getData('text/plain');
        const config = this.buildingTypes[buildingType];

        if (!config) return;

        const rect = this.game.renderer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.tryPlaceBuilding(buildingType, x, y);
        this.clearSelectedBuilding();
    }

    tryPlaceBuilding(buildingType, x, y) {
        const config = this.buildingTypes[buildingType];

        if (!this.game.terrain.canBuildAt(x, y)) {
            this.showError('无法在此位置建造！');
            return;
        }

        if (!this.isSpaceAvailable(x, y, config.size)) {
            this.showError('建造空间不足！');
            return;
        }

        if (this.isOverlappingFarmArea(x, y, config.size)) {
            this.showError('与农田区域重叠！');
            return;
        }

        const resources = this.game.storage.getResources();
        const missingResources = [];

        for (const [key, value] of Object.entries(config.cost)) {
            const current = resources[key] || 0;
            if (current < value) {
                const resourceInfo = this.game.storage.getResourceInfo(key);
                const emoji = resourceInfo ? resourceInfo.emoji : '?';
                const name = resourceInfo ? resourceInfo.name : key;
                missingResources.push(`${emoji} ${name}: ${current}/${value}`);
            }
        }

        if (missingResources.length > 0) {
            const message = `资源不足！\n需要：\n${missingResources.join('\n')}`;
            this.showError(message);
            return;
        }

        const alignedPos = this.snapToGrid(x, y, config.size);
        const building = {
            id: Date.now(),
            type: buildingType,
            x: alignedPos.x,
            y: alignedPos.y,
            size: config.size,
            emoji: config.emoji,
            name: config.name,
            health: config.health,
            maxHealth: config.maxHealth,
            goldPerSecond: config.goldPerSecond,
            storageBonus: config.storageBonus,
            isTurret: config.isTurret,
            isDock: config.isDock
        };

        this.game.storage.consumeResources(config.cost);
        this.game.storage.addBuilding(building);

        if (config.isTurret && this.game.turretManager) {
            this.game.turretManager.addTurret({
                id: building.id,
                x: building.x,
                y: building.y,
                type: buildingType,
                emoji: building.emoji,
                health: building.health,
                maxHealth: building.maxHealth,
                attackRange: config.attackRange,
                attackDamage: config.attackDamage,
                attackInterval: config.attackInterval
            });
        }

        if (config.isDock && this.game.dock) {
            this.game.dock.onDockBuilt(building);
            this.unlockShipBuilding();
        }

        this.showSuccess(`成功建造 ${config.name}！`);
        this.updateResourceDisplay();
        this.updateBuildingCount();
        this.updateBuildItemStates();
    }

    onBuildItemClick(e) {
        if (this.isDragging) return;

        const item = e.target;
        const buildingType = item.dataset.type;
        const soldierType = item.dataset.soldier;
        const shipType = item.dataset.ship;

        if (soldierType) {
            this.onTrainSoldier(soldierType);
            return;
        }

        if (shipType) {
            this.onBuildShip(shipType);
            return;
        }

        const config = this.buildingTypes[buildingType];

        if (!config) {
            this.showError('未知建筑类型！');
            return;
        }

        const resources = this.game.storage.getResources();
        const missingResources = [];

        for (const [key, value] of Object.entries(config.cost)) {
            const current = resources[key] || 0;
            if (current < value) {
                const resourceInfo = this.game.storage.getResourceInfo(key);
                const emoji = resourceInfo ? resourceInfo.emoji : '?';
                const name = resourceInfo ? resourceInfo.name : key;
                missingResources.push(`${emoji} ${name}: ${current}/${value}`);
            }
        }

        if (missingResources.length > 0) {
            const message = `资源不足！\n需要：\n${missingResources.join('\n')}`;
            this.showError(message);
            return;
        }

        this.selectBuilding(buildingType);
    }

    onBuildShip(shipType) {
        if (!this.game.dock) {
            this.showError('需要先建造码头！');
            return;
        }

        const hasDock = this.hasDock();
        if (!hasDock) {
            this.showError('需要先建造码头！');
            return;
        }

        const result = this.game.dock.buildShip(shipType);

        if (result.success) {
            this.showSuccess(result.message);
            this.updateResourceDisplay();
            this.updateBuildItemStates();
            this.showSailPanel();
        } else {
            this.showError(result.message);
        }
    }

    showSailPanel() {
        const sailPanel = document.getElementById('sail-panel');
        if (!sailPanel) return;

        this.updateSailPanel();
        sailPanel.style.display = 'block';
    }

    updateSailPanel() {
        const dock = this.game.dock;
        const storage = this.game.storage;
        const barracks = this.game.barracks;

        if (!dock || !storage || !barracks) return;

        const shipsList = document.getElementById('ships-list');
        const destinationsList = document.getElementById('destinations-list');
        const foodCostElement = document.getElementById('sail-food-cost');
        const currentFoodElement = document.getElementById('current-food');
        const currentSoldiersElement = document.getElementById('current-soldiers');
        const sailBtn = document.getElementById('sail-btn');

        const ships = dock.getDockedShips();
        const destinations = dock.getDestinations();
        const wheat = storage.getResource('wheatHarvest');
        const totalSoldiers = barracks.getTotalSoldiers();

        shipsList.innerHTML = '';
        ships.forEach(ship => {
            const shipItem = document.createElement('div');
            shipItem.className = 'ship-item';
            shipItem.dataset.shipId = ship.id;
            shipItem.innerHTML = `
                <span class="ship-emoji">${ship.emoji}</span>
                <span class="ship-name">${ship.name}</span>
            `;
            shipItem.addEventListener('click', () => this.selectSailShip(ship.id));
            shipsList.appendChild(shipItem);
        });

        destinationsList.innerHTML = '';
        Object.entries(destinations).forEach(([id, dest]) => {
            if (id === 'home') return;

            const destItem = document.createElement('div');
            destItem.className = 'destination-item';
            destItem.dataset.destinationId = id;

            let dangerHtml = '';
            if (dest.dangerLevel) {
                dangerHtml = `<span class="destination-danger danger-${dest.dangerLevel}">${dest.dangerLevel === 'high' ? '⚠️ 危险' : '💀 极危'}</span>`;
            }

            destItem.innerHTML = `
                <span class="destination-emoji">${dest.emoji}</span>
                <span class="destination-name">${dest.name}</span>
                ${dangerHtml}
            `;

            const canAfford = wheat >= dock.getFoodConsumption(id);
            const hasRequiredSoldiers = !dest.requiresSoldiers || totalSoldiers >= 1;

            if (!canAfford || !hasRequiredSoldiers) {
                destItem.classList.add('disabled');
            }

            destItem.addEventListener('click', () => this.selectSailDestination(id));
            destinationsList.appendChild(destItem);
        });

        currentFoodElement.textContent = `${wheat} 🌾`;
        currentSoldiersElement.textContent = `${totalSoldiers} ⚔️`;

        sailBtn.disabled = true;
        sailBtn.onclick = null;

        this.selectedShipId = null;
        this.selectedDestinationId = null;
        this.currentFoodCost = 0;
        foodCostElement.textContent = '0 🌾';
    }

    selectSailShip(shipId) {
        const shipItems = document.querySelectorAll('.ship-item');
        shipItems.forEach(item => item.classList.remove('selected'));

        const selectedItem = document.querySelector(`[data-ship-id="${shipId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        this.selectedShipId = shipId;
        this.updateSailButton();
    }

    selectSailDestination(destinationId) {
        const destItems = document.querySelectorAll('.destination-item');
        destItems.forEach(item => item.classList.remove('selected'));

        const selectedItem = document.querySelector(`[data-destination-id="${destinationId}"]`);
        if (selectedItem && !selectedItem.classList.contains('disabled')) {
            selectedItem.classList.add('selected');
            this.selectedDestinationId = destinationId;

            const foodCost = this.game.dock.getFoodConsumption(destinationId);
            this.currentFoodCost = foodCost;
            document.getElementById('sail-food-cost').textContent = `${foodCost} 🌾`;
        } else {
            this.selectedDestinationId = null;
            this.currentFoodCost = 0;
            document.getElementById('sail-food-cost').textContent = '0 🌾';
        }

        this.updateSailButton();
    }

    updateSailButton() {
        const sailBtn = document.getElementById('sail-btn');
        const dock = this.game.dock;

        if (!this.selectedShipId || !this.selectedDestinationId) {
            sailBtn.disabled = true;
            sailBtn.onclick = null;
            return;
        }

        const canSailResult = dock.canSail(this.selectedDestinationId, this.selectedShipId);

        if (canSailResult.canSail) {
            sailBtn.disabled = false;
            sailBtn.onclick = () => this.startSail();
        } else {
            sailBtn.disabled = true;
            sailBtn.onclick = null;
        }
    }

    startSail() {
        const dock = this.game.dock;

        if (!this.selectedShipId || !this.selectedDestinationId) return;

        const result = dock.startSail(this.selectedDestinationId, this.selectedShipId);

        if (result.success) {
            this.showSuccess(result.message);
            document.getElementById('sail-panel').style.display = 'none';
            this.updateResourceDisplay();
        } else {
            this.showError(result.message);
        }
    }

    onTrainSoldier(soldierType) {
        if (!this.game.barracks) return;

        const result = this.game.barracks.train(soldierType);

        if (result.success) {
            this.showSuccess(result.message);
            this.updateResourceDisplay();
        } else {
            this.showError(result.message);
        }
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
        if (this.isDragging && this.draggedItem && this.draggedItem.dataset.type) {
            this.updateDragPreview(e);
        }

        if (this.selectedBuilding && !this.isDragging && this.game.renderer && this.game.renderer.canvas) {
            const rect = this.game.renderer.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const isOnCanvas = x >= 0 && x <= this.game.renderer.width &&
                               y >= 0 && y <= this.game.renderer.height;

            if (isOnCanvas) {
                const alignedPos = this.snapToGrid(x, y, this.buildingTypes[this.selectedBuilding].size);
                this.previewBuildingPosition = alignedPos;
            } else {
                this.previewBuildingPosition = null;
            }
        }
    }

    snapToGrid(x, y, size) {
        const gridSize = GAME_CONFIG.GRID_SIZE;
        const halfSize = size / 2;
        const halfGrid = gridSize / 2;

        const snappedX = Math.round((x - halfGrid) / gridSize) * gridSize + halfGrid;
        const snappedY = Math.round((y - halfGrid) / gridSize) * gridSize + halfGrid;

        return { x: snappedX, y: snappedY };
    }

    selectBuilding(type) {
        this.selectedBuilding = type;
        this.showSuccess(`已选择 ${this.buildingTypes[type].name}，点击空地放置`);
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

    isSpaceAvailable(x, y, size) {
        const buildings = this.game.storage.getBuildings();
        const halfSize = size / 2;

        return !buildings.some(building => {
            const dx = Math.abs(x - building.x);
            const dy = Math.abs(y - building.y);
            const minDistance = halfSize + building.size / 2 + GAME_CONFIG.BUILDING_SPACING;
            return dx < minDistance && dy < minDistance;
        });
    }

    isOverlappingFarmArea(x, y, size) {
        const halfSize = size / 2;

        if (this.game.plotSystem) {
            const farmBounds = this.game.plotSystem.getFarmBounds();
            if (farmBounds) {
                return !(x + halfSize < farmBounds.x ||
                         x - halfSize > farmBounds.x + farmBounds.width ||
                         y + halfSize < farmBounds.y ||
                         y - halfSize > farmBounds.y + farmBounds.height);
            }
        }

        return false;
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
            const emoji = resourceInfo ? resourceInfo.emoji : '?';
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
            <div style="color: rgba(255,255,255,0.6); font-size: 11px; margin-bottom: 8px;">建造消耗</div>
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
        toast.style.whiteSpace = 'pre-line';
        toast.style.padding = '15px 25px';
        toast.style.maxWidth = '300px';
        toast.style.textAlign = 'center';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
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
        const allResourceInfo = this.game.storage.getAllResourceInfo();

        Object.keys(allResourceInfo).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = resources[key] || 0;
            }
        });

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

        const hasDock = this.hasDock();

        buildItems.forEach(item => {
            const type = item.dataset.type;
            const shipType = item.dataset.ship;
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
                    item.classList.add('can-afford');
                    item.style.cursor = 'pointer';
                } else {
                    item.classList.add('disabled');
                    item.classList.remove('can-afford');
                    item.style.cursor = 'not-allowed';
                }
            }

            if (shipType) {
                const dock = this.game.dock;
                if (!dock) {
                    item.classList.add('disabled');
                    item.style.cursor = 'not-allowed';
                    return;
                }

                const shipConfig = dock.shipTypes[shipType];
                if (!shipConfig) return;

                let canBuildShip = this.shipBuildingUnlocked && hasDock;
                if (canBuildShip) {
                    for (const [key, value] of Object.entries(shipConfig.cost)) {
                        if ((resources[key] || 0) < value) {
                            canBuildShip = false;
                            break;
                        }
                    }
                }

                if (canBuildShip) {
                    item.classList.remove('disabled');
                    item.style.cursor = 'pointer';
                } else {
                    item.classList.add('disabled');
                    item.style.cursor = 'not-allowed';
                }
            }
        });
    }

    hasDock() {
        const buildings = this.game.storage.getBuildings();
        return buildings.some(b => b.type === 'dock');
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

    formatCost(cost) {
        const parts = [];
        for (const [key, value] of Object.entries(cost)) {
            const resourceInfo = this.game.storage.getResourceInfo(key);
            const emoji = resourceInfo ? resourceInfo.emoji : '?';
            parts.push(`${emoji} ${value}`);
        }
        return parts.join(', ');
    }
}