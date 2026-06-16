export class PlayerMovement {
    constructor(game) {
        this.game = game;
        this.collectionRange = 60;
    }

    update(deltaTime) {
        this.handleBuildingInteractions();
        this.handlePlotInteractions();
    }

    handleBuildingInteractions() {
        const player = this.game.getPlayer();
        const storage = this.game.getStorage();
        const input = this.game.getInput();

        if (!player || !storage || !input) return;

        const playerPos = player.getPosition();
        const buildings = storage.getBuildings();

        buildings.forEach(building => {
            const dx = playerPos.x - building.x;
            const dy = playerPos.y - building.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < building.size && input.wasClicked()) {
                this.onBuildingClick(building);
            }
        });
    }

    onBuildingClick(building) {
        console.log('Clicked on building:', building.name);

        if (building.type === 'dock') {
            if (this.game.getBuildPanel() && !this.game.getBuildPanel().isShipBuildingUnlocked()) {
                this.game.getBuildPanel().unlockShipBuilding();
            }
            this.game.showShipBuildingPanel();
        }
    }

    handlePlotInteractions() {
        const input = this.game.getInput();
        if (!input.wasClicked()) return;

        const mousePos = input.getCanvasMousePosition();
        const terrain = this.game.getTerrain();

        if (!terrain || !terrain.landRenderer) return;

        const plot = terrain.landRenderer.getPlotAtPosition(mousePos.x, mousePos.y);

        if (plot) {
            const plots = this.game.getStorage().getFarmPlots();
            const targetPlot = plots.find(p => p.id === plot.id);

            if (targetPlot) {
                if (targetPlot.isReady) {
                    this.game.harvestCrop(targetPlot.id);
                } else if (!targetPlot.crop) {
                    this.game.showSeedSelection(plot);
                }
            }
        }
    }

    getCollectionRange() {
        return this.collectionRange;
    }

    setCollectionRange(range) {
        this.collectionRange = range;
    }
}