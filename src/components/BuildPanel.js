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
                goldPerSecond: 1,
                health: 150,
                maxHealth: 150
            },
            storageHouse: {
                name: '储物屋',
                emoji: '🏠',
                cost: { wood: 25 },
                size: 45,
                storageBonus: 100,
                health: 120,
                maxHealth: 120
            },
            house: {
                name: '房屋',
                emoji: '🏠',
                cost: { wood: 50, stone: 20 },
                size: 60,
                health: 200,
                maxHealth: 200
            },
            hut: {
                name: '小屋',
                emoji: '🏚️',
                cost: { wood: 30, stone: 10 },
                size: 45,
                health: 100,
                maxHealth: 100
            },
            storage: {
                name: '仓库',
                emoji: '📦',
                cost: { wood: 40, stone: 30 },
                size: 50,
                health: 250,
                maxHealth: 250
            },
            farm: {
                name: '农田',
                emoji: '🌾',
                cost: { wood: 20, stone: 5 },
                size: 55,
                health: 80,
                maxHealth: 80
            },
            fishing: {
                name: '捕鱼站',
                emoji: '🎣',
                cost: { wood: 25, stone: 15 },
                size: 40,
                health: 100,
                maxHealth: 100
            },
            campfire: {
                name: '篝火',
                emoji: '🔥',
                cost: { wood: 15 },
                size: 35,
                health: 60,
                maxHealth: 60
            },
            well: {
                name: '水井',
                emoji: '⛏️',
                cost: { wood: 20, stone: 25 },
                size: 45,
                health: 180,
                maxHealth: 180
            },
            machineGun: {
                name: '机枪炮塔',
                emoji: '🔫',
                cost: { wood: 40, stone: 35 },
                size: 45,
                health: 150,
                maxHealth: 150,
                isTurret: true,
                attackRange: 180,
                attackDamage: 15,
                attackInterval: 0.3
            },
            catapult: {
                name: '投石炮塔',
                emoji: '🪨',
                cost: { wood: 60, stone: 50 },
                size: 55,
                health: 200,
                maxHealth: 200,
                isTurret: true,
                attackRange: 250,
                attackDamage: 45,
                attackInterval: 1.5
            },
            dock: {
                name: '码头',
                emoji: '⛵',
                cost: { wood: 80, stone: 40 },
                size: 80,
                health: 200,
                maxHealth: 200,
                isDock: true
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
        this.expandedCategory = null;
        this.selectedShipId = null;
        this.selectedDestinationId = null;
        this.currentFoodCost = 0;
        this.shipBuildingUnlocked = false;
    }
    
    unlockShipBuilding() {
        this.shipBuildingUnlocked = true;
        this.updateBuildItemStates();
        this.showSuccess('✅ 造船功能已解锁！');
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
        const buildingConfig = this.buildingTypes[type];
        if (!buildingConfig) {
            this.showError('未知建筑类型！');
            return;
        }
        
        const terrainType = this.game.terrain.getTerrainType(x, y);
        
        if (terrainType === 'water') {
            this.showError('❌ 无法在水中建造！');
            return;
        }
        
        if (buildingConfig.isDock) {
            if (terrainType === 'water') {
                this.showError('❌ 无法在水中建造码头！');
                return;
            }
            if (terrainType === 'beach' && !this.game.terrain.canBuildDockOnBeachAt(x, y)) {
                this.showError('❌ 码头只能建造在靠近水边的沙滩区域！');
                return;
            }
        } else {
            if (terrainType === 'beach') {
                this.showError('❌ 沙滩上只能建造码头！');
                return;
            }
            if (terrainType !== 'land') {
                this.showError('❌ 只能在草地上建造！');
                return;
            }
        }
        
        const resources = this.game.storage.getResources();
        const missingResources = [];
        let canAfford = true;
        
        for (const [key, value] of Object.entries(buildingConfig.cost)) {
            const current = resources[key] || 0;
            if (current < value) {
                canAfford = false;
                const resourceInfo = this.game.storage.getResourceInfo(key);
                const emoji = resourceInfo ? resourceInfo.emoji : '❓';
                const name = resourceInfo ? resourceInfo.name : key;
                missingResources.push(`${emoji} ${name}: ${current}/${value}`);
            }
        }
        
        if (!canAfford) {
            const message = `❌ 资源不足！\n需要：\n${missingResources.join('\n')}`;
            this.showError(message);
            return;
        }
        
        const alignedPos = this.snapToGrid(x, y, buildingConfig.size);
        
        if (buildingConfig.isDock) {
            const dockTerrainType = this.game.terrain.getTerrainType(alignedPos.x, alignedPos.y);
            if (dockTerrainType === 'water') {
                this.showError('❌ 无法在水中建造码头！');
                return;
            }
            if (dockTerrainType === 'beach' && !this.game.terrain.canBuildDockOnBeachAt(alignedPos.x, alignedPos.y)) {
                this.showError('❌ 码头只能建造在靠近水边的沙滩区域！');
                return;
            }
        } else {
            if (!this.isPositionOnLand(alignedPos.x, alignedPos.y)) {
                this.showError('❌ 该位置不是草地！');
                return;
            }
            
            if (this.isOverlappingFarmArea(alignedPos.x, alignedPos.y, buildingConfig.size)) {
                this.showError('❌ 无法在农田区域建造！');
                return;
            }
        }
        
        if (!this.isSpaceAvailable(alignedPos.x, alignedPos.y, buildingConfig.size)) {
            this.showError('❌ 该位置已有建筑！');
            return;
        }
        
        this.consumeResources(buildingConfig.cost);
        
        if (buildingConfig.isTurret) {
            if (this.game.turretManager) {
                this.game.turretManager.addTurret(type, alignedPos.x, alignedPos.y);
            }
        } else {
            const buildingData = {
                id: Date.now(),
                type,
                x: alignedPos.x,
                y: alignedPos.y,
                size: buildingConfig.size,
                emoji: buildingConfig.emoji,
                name: buildingConfig.name,
                health: buildingConfig.health || 100,
                maxHealth: buildingConfig.maxHealth || 100
            };
            
            if (buildingConfig.goldPerSecond) {
                buildingData.goldPerSecond = buildingConfig.goldPerSecond;
                buildingData.lastGoldTime = Date.now();
            }
            
            if (buildingConfig.storageBonus) {
                buildingData.storageBonus = buildingConfig.storageBonus;
            }
            
            this.game.storage.addBuilding(buildingData);
        }
        
        if (buildingConfig.storageBonus) {
            this.game.storage.addStorageCapacity(buildingConfig.storageBonus);
        }
        
        this.updateBuildingCount();
        this.updateBuildItemStates();
        
        if (this.game.renderer) {
            this.game.renderer.render();
        }
        
        this.showSuccess(`✅ 建造了 ${buildingConfig.emoji} ${buildingConfig.name}！`);
        
        return true;
    }
    
    isPositionOnLand(x, y) {
        if (!this.game.terrain) return false;
        
        const terrainType = this.game.terrain.getTerrainType(x, y);
        
        return terrainType === 'land';
    }
    
    isPositionOnBeach(x, y) {
        if (!this.game.terrain) return false;
        
        const terrainType = this.game.terrain.getTerrainType(x, y);
        
        return terrainType === 'beach';
    }
    
    isOverlappingFarmArea(x, y, size) {
        if (!this.game.terrain || !this.game.terrain.landRenderer) return false;
        
        const farmArea = this.game.terrain.landRenderer.getFarmArea();
        const halfSize = size / 2;
        
        return x + halfSize > farmArea.x &&
               x - halfSize < farmArea.x + farmArea.width &&
               y + halfSize > farmArea.y &&
               y - halfSize < farmArea.y + farmArea.height;
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
    
    onBuildItemClick(e) {
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
        let canAfford = true;
        
        for (const [key, value] of Object.entries(config.cost)) {
            const current = resources[key] || 0;
            if (current < value) {
                canAfford = false;
                const resourceInfo = this.game.storage.getResourceInfo(key);
                const emoji = resourceInfo ? resourceInfo.emoji : '❓';
                const name = resourceInfo ? resourceInfo.name : key;
                missingResources.push(`${emoji} ${name}: ${current}/${value}`);
            }
        }
        
        if (!canAfford) {
            const message = `❌ 资源不足！\n需要：\n${missingResources.join('\n')}`;
            this.showError(message);
            return;
        }
        
        this.selectBuilding(buildingType);
    }
    
    onBuildShip(shipType) {
        if (!this.game.dock) {
            this.showError('❌ 需要先建造码头！');
            return;
        }
        
        const hasDock = this.hasDock();
        if (!hasDock) {
            this.showError('❌ 需要先建造码头！');
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
                dangerHtml = `<span class="destination-danger danger-${dest.dangerLevel}">${dest.dangerLevel === 'high' ? '⚠️ 危险' : '☠️ 极危'}</span>`;
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
        const storage = this.game.storage;
        const barracks = this.game.barracks;
        
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
        if (this.draggedItem && this.draggedItem.dataset.type) {
            this.updateDragPreview(e);
        }
        
        if (this.selectedBuilding && this.game.renderer && this.game.renderer.canvas) {
            const rect = this.game.renderer.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const isOnCanvas = x >= 0 && x <= this.game.renderer.width && 
                               y >= 0 && y <= this.game.renderer.height;
            
            if (isOnCanvas && this.game.terrain.canBuildAt(x, y)) {
                const alignedPos = this.snapToGrid(x, y, this.buildingTypes[this.selectedBuilding].size);
                this.previewBuildingPosition = alignedPos;
            } else if (isOnCanvas) {
                this.previewBuildingPosition = { x, y };
            } else {
                this.previewBuildingPosition = null;
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