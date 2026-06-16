export class BuildingSystem {
    constructor(game) {
        this.game = game;
        this.selectedBuilding = null;
        this.previewBuildingPosition = null;
    }

    update(deltaTime) {
        this.checkSelectedBuildingPlacement();
    }

    checkSelectedBuildingPlacement() {
        const buildPanel = this.game.getBuildPanel();
        if (!buildPanel || !buildPanel.selectedBuilding) return;

        const input = this.game.getInput();
        const hasClick = input.wasClicked();
        const hasRelease = input.wasReleased();

        if (!hasClick && !hasRelease) return;

        const mousePos = input.getCanvasMousePosition();
        const buildingType = buildPanel.selectedBuilding;
        const buildingConfig = buildPanel.buildingTypes[buildingType];

        if (!buildingConfig) return;

        const terrain = this.game.getTerrain();
        const terrainType = terrain.getTerrainType(mousePos.x, mousePos.y);

        if (buildingConfig.isDock) {
            if (terrainType === 'water') {
                return;
            }
        } else {
            if (terrainType !== 'land') {
                return;
            }
        }

        const resources = this.game.getStorage().getResources();
        let canAfford = true;
        for (const [key, value] of Object.entries(buildingConfig.cost)) {
            if ((resources[key] || 0) < value) {
                canAfford = false;
                break;
            }
        }

        if (!canAfford) {
            return;
        }

        buildPanel.tryPlaceBuilding(buildingType, mousePos.x, mousePos.y);
        buildPanel.clearSelectedBuilding();
    }

    setSelectedBuilding(type) {
        this.selectedBuilding = type;
    }

    clearSelectedBuilding() {
        this.selectedBuilding = null;
        this.previewBuildingPosition = null;
    }

    setPreviewPosition(x, y) {
        this.previewBuildingPosition = { x, y };
    }

    getPreviewPosition() {
        return this.previewBuildingPosition;
    }

    getSelectedBuilding() {
        return this.selectedBuilding;
    }

    isBuildingPlacementValid(x, y, buildingType) {
        const buildPanel = this.game.getBuildPanel();
        const buildingConfig = buildPanel.buildingTypes[buildingType];
        if (!buildingConfig) return false;

        const terrain = this.game.getTerrain();
        const terrainType = terrain.getTerrainType(x, y);

        if (buildingConfig.isDock) {
            return terrainType !== 'water';
        }

        return terrainType === 'land';
    }
}