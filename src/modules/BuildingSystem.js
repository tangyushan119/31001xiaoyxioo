import { BUILDING_TYPES, GAME_CONFIG } from '../config.js';

export class BuildingSystem {
    constructor(game) {
        this.game = game;
        this.selectedBuilding = null;
        this.previewBuildingPosition = null;
        this.isPlacing = false;
    }

    update(deltaTime) {
        if (this.isPlacing && this.selectedBuilding) {
            this.updatePreviewPosition();
        }
    }

    updatePreviewPosition() {
        if (!this.game.input || !this.game.renderer) return;

        const mousePos = this.game.input.getMousePosition();
        const canvas = this.game.renderer.canvas;
        
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = mousePos.x - rect.left;
        const y = mousePos.y - rect.top;

        const isOnCanvas = x >= 0 && x <= this.game.renderer.width &&
                           y >= 0 && y <= this.game.renderer.height;

        if (isOnCanvas) {
            const buildingConfig = BUILDING_TYPES[this.selectedBuilding];
            if (buildingConfig) {
                this.previewBuildingPosition = this.snapToGrid(x, y, buildingConfig.size);
            }
        } else {
            this.previewBuildingPosition = null;
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

    handleClick(x, y) {
        if (!this.isPlacing || !this.selectedBuilding) {
            this.trySelectBuilding(x, y);
            return;
        }

        const buildingType = this.selectedBuilding;
        const buildingConfig = BUILDING_TYPES[buildingType];

        if (!buildingConfig) return;

        if (!this.canPlaceAt(x, y, buildingConfig)) {
            return;
        }

        if (!this.hasEnoughResources(buildingConfig.cost)) {
            if (this.game.buildPanel) {
                this.game.buildPanel.showError('资源不足！');
            }
            return;
        }

        const alignedPos = this.snapToGrid(x, y, buildingConfig.size);
        this.placeBuilding(buildingType, alignedPos.x, alignedPos.y);
        this.cancelPlacement();
    }

    canPlaceAt(x, y, buildingConfig) {
        if (!this.game.terrain) return false;

        const terrainType = this.game.terrain.getTerrainType(x, y);

        if (buildingConfig.isDock) {
            if (!this.game.terrain.canBuildDockOnBeachAt(x, y)) {
                return false;
            }
        } else {
            if (!this.game.terrain.canBuildAt(x, y)) {
                return false;
            }
        }

        if (!this.isSpaceAvailable(x, y, buildingConfig.size)) {
            return false;
        }

        if (this.isOverlappingFarmArea(x, y, buildingConfig.size)) {
            return false;
        }

        return true;
    }

    isSpaceAvailable(x, y, size) {
        if (!this.game.storage) return false;

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
        let farmBounds = null;

        if (this.game.plotSystem) {
            farmBounds = this.game.plotSystem.getFarmBounds();
        }

        if (!farmBounds && this.game.terrain && this.game.terrain.landRenderer) {
            farmBounds = this.game.terrain.landRenderer.getFarmArea();
        }

        if (farmBounds) {
            return !(x + halfSize < farmBounds.x ||
                     x - halfSize > farmBounds.x + farmBounds.width ||
                     y + halfSize < farmBounds.y ||
                     y - halfSize > farmBounds.y + farmBounds.height);
        }

        return false;
    }

    hasEnoughResources(cost) {
        if (!this.game.storage) return false;

        const resources = this.game.storage.getResources();

        for (const [key, value] of Object.entries(cost)) {
            if ((resources[key] || 0) < value) {
                return false;
            }
        }

        return true;
    }

    placeBuilding(buildingType, x, y) {
        const buildingConfig = BUILDING_TYPES[buildingType];
        if (!buildingConfig || !this.game.storage) return;

        this.game.storage.consumeResources(buildingConfig.cost);

        const building = {
            id: Date.now(),
            type: buildingType,
            x,
            y,
            size: buildingConfig.size,
            emoji: buildingConfig.emoji,
            name: buildingConfig.name,
            health: buildingConfig.health,
            maxHealth: buildingConfig.maxHealth,
            goldPerSecond: buildingConfig.goldPerSecond,
            storageBonus: buildingConfig.storageBonus,
            isTurret: buildingConfig.isTurret,
            isDock: buildingConfig.isDock
        };

        this.game.storage.addBuilding(building);

        if (buildingConfig.isTurret && this.game.turretManager) {
            this.game.turretManager.addTurret({
                id: building.id,
                x: building.x,
                y: building.y,
                type: buildingType,
                emoji: building.emoji,
                health: building.health,
                maxHealth: building.maxHealth,
                attackRange: buildingConfig.attackRange,
                attackDamage: buildingConfig.attackDamage,
                attackInterval: buildingConfig.attackInterval
            });
        }

        if (buildingConfig.isDock && this.game.dock) {
            this.game.dock.onDockBuilt(building);
            if (this.game.buildPanel) {
                this.game.buildPanel.unlockShipBuilding();
            }
        }

        if (buildingConfig.isBarracks && this.game.buildPanel) {
            this.game.buildPanel.unlockTraining();
        }

        if (this.game.buildPanel) {
            this.game.buildPanel.showSuccess(`成功建造 ${buildingConfig.name}！`);
            this.game.buildPanel.updateResourceDisplay();
            this.game.buildPanel.updateBuildingCount();
            this.game.buildPanel.updateBuildItemStates();
        }
    }

    trySelectBuilding(x, y) {
        if (!this.game.storage) return;

        const buildings = this.game.storage.getBuildings();

        for (const building of buildings) {
            const dx = x - building.x;
            const dy = y - building.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= building.size / 2 + GAME_CONFIG.CLOSEST_BUILDING_DISTANCE) {
                this.selectBuilding(building);
                return;
            }
        }

        this.deselectBuilding();
    }

    selectBuilding(building) {
        this.selectedBuilding = building;
        this.isPlacing = false;

        if (this.game.buildPanel) {
            this.game.buildPanel.highlightSelectedItem(building.type);
        }
    }

    deselectBuilding() {
        this.selectedBuilding = null;
        this.isPlacing = false;

        if (this.game.buildPanel) {
            this.game.buildPanel.clearSelectedBuilding();
        }
    }

    startPlacement(buildingType) {
        const buildingConfig = BUILDING_TYPES[buildingType];
        if (!buildingConfig) return;

        if (!this.hasEnoughResources(buildingConfig.cost)) {
            if (this.game.buildPanel) {
                this.game.buildPanel.showError('资源不足！');
            }
            return;
        }

        this.selectedBuilding = buildingType;
        this.isPlacing = true;

        if (this.game.buildPanel) {
            this.game.buildPanel.selectBuilding(buildingType);
        }
    }

    cancelPlacement() {
        this.isPlacing = false;
        this.selectedBuilding = null;
        this.previewBuildingPosition = null;

        if (this.game.buildPanel) {
            this.game.buildPanel.clearSelectedBuilding();
        }
    }

    getSelectedBuilding() {
        return this.selectedBuilding;
    }

    isPlacingBuilding() {
        return this.isPlacing;
    }

    getPreviewPosition() {
        return this.previewBuildingPosition;
    }

    getPlacingBuildingType() {
        return this.isPlacing ? this.selectedBuilding : null;
    }
}