export class ResourceSystem {
    constructor(game) {
        this.game = game;
    }

    update(deltaTime) {
        this.updateBuildingsProduction();
        this.updateFarmPlotsGrowth();
    }

    updateBuildingsProduction() {
        const storage = this.game.getStorage();
        const buildings = storage.getBuildings();
        const now = Date.now();

        buildings.forEach(building => {
            if (building.goldPerSecond && building.lastGoldTime) {
                const timeSinceLastGold = now - building.lastGoldTime;
                const goldInterval = 1000;

                if (timeSinceLastGold >= goldInterval) {
                    const goldToAdd = Math.floor(timeSinceLastGold / goldInterval) * building.goldPerSecond;
                    storage.modifyResource('gold', goldToAdd);
                    building.lastGoldTime = now;
                }
            }
        });
    }

    updateFarmPlotsGrowth() {
        const storage = this.game.getStorage();
        storage.updateFarmPlots();
    }

    addResource(resourceType, amount) {
        const storage = this.game.getStorage();
        storage.modifyResource(resourceType, amount);
        this.game.getBuildPanel().updateResourceDisplay();
    }

    consumeResource(resourceType, amount) {
        const storage = this.game.getStorage();
        storage.modifyResource(resourceType, -amount);
        this.game.getBuildPanel().updateResourceDisplay();
    }

    getResource(resourceType) {
        return this.game.getStorage().getResource(resourceType);
    }

    getResources() {
        return this.game.getStorage().getResources();
    }

    hasEnoughResources(cost) {
        return this.game.getStorage().hasEnoughResources(cost);
    }

    consumeResources(cost) {
        const storage = this.game.getStorage();
        storage.consumeResources(cost);
        this.game.getBuildPanel().updateResourceDisplay();
    }

    getResourceInfo(resourceType) {
        return this.game.getStorage().getResourceInfo(resourceType);
    }

    getTotalResourceAmount() {
        return this.game.getStorage().getTotalResourceAmount();
    }

    getStorageCapacity() {
        return this.game.getStorage().getStorageCapacity();
    }

    addStorageCapacity(amount) {
        this.game.getStorage().addStorageCapacity(amount);
    }
}