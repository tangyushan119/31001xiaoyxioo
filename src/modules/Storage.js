import { GAME_CONFIG, INITIAL_RESOURCES, RESOURCE_INFO, RESOURCE_CATEGORIES, CROP_TYPES, FARM_GRID_CONFIG } from '../config.js';

export class Storage {
    constructor() {
        this.resources = { ...INITIAL_RESOURCES };
        this.storageCapacity = 2000;
        this.resourceCategories = { ...RESOURCE_CATEGORIES };
        this.resourceInfo = { ...RESOURCE_INFO };
        this.cropTypes = { ...CROP_TYPES };

        this.buildings = [];
        this.farms = [];
        this.animals = [];
        this.plantations = [];
        this.farmPlots = [];
        this.playerPosition = null;
        this.ships = [];
        this.soldiers = [];
        this.exploredLocations = ['home'];
        this.turrets = [];

        this.autoSaveInterval = null;

        this.initFarmPlots();
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.startAutoSave();
    }

    loadFromLocalStorage() {
        if (typeof localStorage === 'undefined') return;
        const saved = localStorage.getItem(GAME_CONFIG.STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);

                if (data.version && data.version >= GAME_CONFIG.STORAGE_VERSION) {
                    if (data.resources) {
                        this.resources = { ...this.resources, ...data.resources };
                    }
                } else {
                    console.log('Detected old save data format, resetting to new defaults');
                    this.resetToDefaults();
                    return;
                }

                this.buildings = data.buildings || [];
                this.farms = data.farms || [];
                this.animals = data.animals || [];
                this.plantations = data.plantations || [];
                this.farmPlots = data.farmPlots || [];
                this.playerPosition = data.playerPosition || null;
                this.ships = data.ships || [];
                this.soldiers = data.soldiers || [];
                this.exploredLocations = data.exploredLocations || ['home'];
                this.turrets = data.turrets || [];
            } catch (e) {
                console.warn('Failed to load saved data:', e);
                this.resetToDefaults();
            }
        }

        if (this.farmPlots.length === 0) {
            this.initFarmPlots();
        }
    }

    saveToLocalStorage() {
        const data = {
            version: GAME_CONFIG.STORAGE_VERSION,
            resources: this.resources,
            buildings: this.buildings,
            farms: this.farms,
            animals: this.animals,
            plantations: this.plantations,
            farmPlots: this.farmPlots,
            playerPosition: this.playerPosition,
            ships: this.ships,
            soldiers: this.soldiers,
            exploredLocations: this.exploredLocations,
            turrets: this.turrets
        };

        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(GAME_CONFIG.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save data:', e);
        }
    }

    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(() => {
            this.saveToLocalStorage();
        }, GAME_CONFIG.AUTO_SAVE_INTERVAL);

        window.addEventListener('beforeunload', () => {
            this.saveToLocalStorage();
        });
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    resetToDefaults() {
        this.resources = { ...INITIAL_RESOURCES };
        this.buildings = [];
        this.farms = [];
        this.animals = [];
        this.plantations = [];
        this.farmPlots = [];
        this.playerPosition = null;
        this.ships = [];
        this.soldiers = [];
        this.exploredLocations = ['home'];
        this.turrets = [];
        this.initFarmPlots();
    }

    getResources() {
        return { ...this.resources };
    }

    getResource(key) {
        return this.resources[key] || 0;
    }

    modifyResource(key, amount) {
        if (this.resources.hasOwnProperty(key)) {
            const currentValue = this.resources[key] || 0;

            if (amount > 0) {
                const totalResources = this.getTotalResourceAmount();
                const maxCanAdd = this.storageCapacity - totalResources;

                if (maxCanAdd > 0) {
                    const actualAmount = Math.min(amount, maxCanAdd);
                    this.resources[key] = currentValue + actualAmount;
                    this.saveToLocalStorage();
                    return actualAmount;
                } else {
                    return 0;
                }
            } else {
                const actualAmount = Math.max(amount, -currentValue);
                this.resources[key] = Math.max(0, currentValue + amount);
                this.saveToLocalStorage();
                return actualAmount;
            }
        }
        return 0;
    }

    getTotalResourceAmount() {
        return Object.values(this.resources).reduce((sum, value) => sum + value, 0);
    }

    getStorageCapacity() {
        return this.storageCapacity;
    }

    setStorageCapacity(capacity) {
        this.storageCapacity = Math.max(100, capacity);
        this.saveToLocalStorage();
    }

    getResourceCategories() {
        return { ...this.resourceCategories };
    }

    getResourceInfo(key) {
        return this.resourceInfo[key] || null;
    }

    getAllResourceInfo() {
        return { ...this.resourceInfo };
    }

    getResourcesByCategory(categoryKey) {
        const category = this.resourceCategories[categoryKey];
        if (!category) return {};

        const result = {};
        category.items.forEach(itemKey => {
            if (this.resources.hasOwnProperty(itemKey)) {
                result[itemKey] = this.resources[itemKey];
            }
        });
        return result;
    }

    setResource(key, value) {
        if (this.resources.hasOwnProperty(key)) {
            this.resources[key] = Math.max(0, value);
            this.saveToLocalStorage();
        }
    }

    getBuildings() {
        return [...this.buildings];
    }

    addBuilding(building) {
        this.buildings.push(building);
        if (building.storageBonus) {
            this.storageCapacity += building.storageBonus;
        }
        this.saveToLocalStorage();
    }

    removeBuilding(id) {
        const building = this.buildings.find(b => b.id === id);
        if (building && building.storageBonus) {
            this.storageCapacity -= building.storageBonus;
        }
        this.buildings = this.buildings.filter(b => b.id !== id);
        this.saveToLocalStorage();
    }

    addStorageCapacity(amount) {
        this.storageCapacity += amount;
        this.saveToLocalStorage();
    }

    getBuildingById(id) {
        return this.buildings.find(b => b.id === id);
    }

    damageBuilding(id, amount) {
        const building = this.buildings.find(b => b.id === id);
        if (!building) return false;

        if (!building.health) {
            building.health = building.maxHealth || 100;
        }

        building.health = Math.max(0, building.health - amount);

        if (building.health <= 0) {
            building.health = 0;
            this.removeBuilding(id);
            return { destroyed: true, building };
        }

        this.saveToLocalStorage();
        return { destroyed: false, health: building.health, maxHealth: building.maxHealth };
    }

    destroyCrop(plotId) {
        const plot = this.farmPlots.find(p => p.id === plotId);
        if (!plot || !plot.crop) return false;

        plot.crop = null;
        plot.plantedAt = null;
        plot.isReady = false;
        plot.growthProgress = 0;

        this.saveToLocalStorage();
        return true;
    }

    getFarms() {
        return [...this.farms];
    }

    addFarm(farm) {
        this.farms.push({
            id: Date.now(),
            ...farm,
            plantedCrops: [],
            harvestTime: null
        });
        this.saveToLocalStorage();
    }

    removeFarm(id) {
        this.farms = this.farms.filter(f => f.id !== id);
        this.saveToLocalStorage();
    }

    getAnimals() {
        return [...this.animals];
    }

    addAnimal(animal) {
        this.animals.push({
            id: Date.now(),
            ...animal,
            health: 100,
            hunger: 0
        });
        this.saveToLocalStorage();
    }

    removeAnimal(id) {
        this.animals = this.animals.filter(a => a.id !== id);
        this.saveToLocalStorage();
    }

    getPlantations() {
        return [...this.plantations];
    }

    addPlantation(plantation) {
        this.plantations.push({
            id: Date.now(),
            ...plantation,
            growthStage: 0,
            plantedAt: Date.now()
        });
        this.saveToLocalStorage();
    }

    removePlantation(id) {
        this.plantations = this.plantations.filter(p => p.id !== id);
        this.saveToLocalStorage();
    }

    updatePlantation(id, updates) {
        const index = this.plantations.findIndex(p => p.id === id);
        if (index !== -1) {
            this.plantations[index] = { ...this.plantations[index], ...updates };
            this.saveToLocalStorage();
        }
    }

    initFarmPlots() {
        if (this.farmPlots.length === 0) {
            const gridSize = FARM_GRID_CONFIG.gridSize;
            const plots = [];
            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    plots.push({
                        id: `${row}-${col}`,
                        row,
                        col,
                        crop: null,
                        plantedAt: null,
                        isReady: false,
                        growthProgress: 0
                    });
                }
            }
            this.farmPlots = plots;
        }
    }

    getFarmPlots() {
        return [...this.farmPlots];
    }

    getCropTypes() {
        return { ...this.cropTypes };
    }

    plantCrop(plotId, cropType) {
        const plot = this.farmPlots.find(p => p.id === plotId);
        if (!plot || plot.crop) return false;

        const cropInfo = this.cropTypes[cropType];
        if (!cropInfo) return false;

        if (!this.hasEnoughResources(cropInfo.seedCost)) return false;

        this.consumeResources(cropInfo.seedCost);

        plot.crop = cropType;
        plot.plantedAt = Date.now();
        plot.isReady = false;
        plot.growthProgress = 0;

        this.saveToLocalStorage();
        return true;
    }

    harvestCrop(plotId) {
        const plot = this.farmPlots.find(p => p.id === plotId);
        if (!plot || !plot.crop || !plot.isReady) return false;

        const cropInfo = this.cropTypes[plot.crop];
        const harvestKey = `${plot.crop}Harvest`;

        if (!this.resources.hasOwnProperty(harvestKey)) {
            this.resources[harvestKey] = 0;
        }

        this.modifyResource(harvestKey, cropInfo.yield);

        plot.crop = null;
        plot.plantedAt = null;
        plot.isReady = false;
        plot.growthProgress = 0;

        this.saveToLocalStorage();
        return true;
    }

    updateFarmPlots() {
        const now = Date.now();
        this.farmPlots.forEach(plot => {
            if (plot.crop && !plot.isReady) {
                const cropInfo = this.cropTypes[plot.crop];
                const elapsed = now - plot.plantedAt;
                plot.growthProgress = Math.min(100, (elapsed / cropInfo.growthTime) * 100);

                if (elapsed >= cropInfo.growthTime) {
                    plot.isReady = true;
                    plot.growthProgress = 100;
                }
            }
        });
    }

    getPlayerPosition() {
        return this.playerPosition ? { ...this.playerPosition } : null;
    }

    savePlayerPosition(x, y) {
        this.playerPosition = { x, y };
        this.saveToLocalStorage();
    }

    clearAll() {
        this.resetToDefaults();
        localStorage.removeItem(GAME_CONFIG.STORAGE_KEY);
    }

    getTotalBuildingCount() {
        return this.buildings.length;
    }

    getTotalFarmCount() {
        return this.farms.length;
    }

    getTotalAnimalCount() {
        return this.animals.length;
    }

    hasEnoughResources(cost) {
        for (const [key, value] of Object.entries(cost)) {
            if (this.resources[key] < value) {
                return false;
            }
        }
        return true;
    }

    consumeResources(cost) {
        for (const [key, value] of Object.entries(cost)) {
            this.modifyResource(key, -value);
        }
    }

    getShips() {
        return [...this.ships];
    }

    addShip(ship) {
        this.ships.push({
            id: Date.now(),
            ...ship
        });
        this.saveToLocalStorage();
    }

    removeShip(id) {
        this.ships = this.ships.filter(s => s.id !== id);
        this.saveToLocalStorage();
    }

    getSoldiers() {
        return [...this.soldiers];
    }

    addSoldier(soldier) {
        this.soldiers.push({
            id: Date.now(),
            ...soldier,
            health: 100
        });
        this.saveToLocalStorage();
    }

    removeSoldier(id) {
        this.soldiers = this.soldiers.filter(s => s.id !== id);
        this.saveToLocalStorage();
    }

    getTotalSoldierCount() {
        return this.soldiers.length;
    }

    getExploredLocations() {
        return [...this.exploredLocations];
    }

    addExploredLocation(location) {
        if (!this.exploredLocations.includes(location)) {
            this.exploredLocations.push(location);
            this.saveToLocalStorage();
        }
    }

    getTurrets() {
        return [...this.turrets];
    }

    addTurret(turret) {
        this.turrets.push({
            id: Date.now(),
            ...turret
        });
        this.saveToLocalStorage();
    }

    removeTurret(id) {
        this.turrets = this.turrets.filter(t => t.id !== id);
        this.saveToLocalStorage();
    }

    updateTurret(id, updates) {
        const index = this.turrets.findIndex(t => t.id === id);
        if (index !== -1) {
            this.turrets[index] = { ...this.turrets[index], ...updates };
            this.saveToLocalStorage();
        }
    }
}