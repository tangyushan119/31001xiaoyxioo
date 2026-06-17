export class PlayerMovement {
    constructor(game) {
        this.game = game;
        this.collectionRange = 60;
    }

    update(deltaTime) {
        this.handleBuildingInteractions();
    }

    handleBuildingInteractions() {
        const inventoryPanel = this.game.getInventoryPanel();
        if (inventoryPanel && inventoryPanel.isVisible()) return;

        const player = this.game.getPlayer();
        const storage = this.game.getStorage();

        if (!player || !storage) return;

        const playerPos = player.getPosition();
        const buildings = storage.getBuildings();

        buildings.forEach(building => {
            const dx = playerPos.x - building.x;
            const dy = playerPos.y - building.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < building.size) {
                const input = this.game.getInput();
                if (input && input.wasClicked()) {
                    this.onBuildingClick(building);
                }
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

    getCollectionRange() {
        return this.collectionRange;
    }

    setCollectionRange(range) {
        this.collectionRange = range;
    }
}