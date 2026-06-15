export class Storage {
    constructor() {
        this.resources = {
            wood: 200,
            stone: 200,
            ore: 200,
            apple: 200,
            pear: 200,
            treeSeed: 200,
            fruitSeed: 200,
            wheatSeed: 200,
            carrotSeed: 200,
            tomatoSeed: 200,
            cornSeed: 200,
            wheatHarvest: 0,
            carrotHarvest: 0,
            tomatoHarvest: 0,
            cornHarvest: 0,
            water: 0,
            gold: 200
        };
        
        this.storageCapacity = 3000;
        
        this.resourceCategories = {
            materials: {
                name: '材料',
                items: ['wood', 'stone', 'ore']
            },
            fruits: {
                name: '水果',
                items: ['apple', 'pear']
            },
            seeds: {
                name: '种子',
                items: ['treeSeed', 'fruitSeed', 'wheatSeed', 'carrotSeed', 'tomatoSeed', 'cornSeed']
            },
            harvests: {
                name: '收获',
                items: ['wheatHarvest', 'carrotHarvest', 'tomatoHarvest', 'cornHarvest']
            },
            supplies: {
                name: '补给',
                items: ['water']
            },
            currency: {
                name: '货币',
                items: ['gold']
            }
        };
        
        this.resourceInfo = {
            wood: { name: '木材', emoji: '🪵', category: 'materials' },
            stone: { name: '石头', emoji: '🪨', category: 'materials' },
            ore: { name: '矿石', emoji: '💎', category: 'materials' },
            apple: { name: '苹果', emoji: '🍎', category: 'fruits' },
            pear: { name: '梨子', emoji: '🍐', category: 'fruits' },
            treeSeed: { name: '树木种子', emoji: '🌱', category: 'seeds' },
            fruitSeed: { name: '水果种子', emoji: '🍑', category: 'seeds' },
            wheatSeed: { name: '小麦种子', emoji: '🌾', category: 'seeds' },
            carrotSeed: { name: '胡萝卜种子', emoji: '🥕', category: 'seeds' },
            tomatoSeed: { name: '番茄种子', emoji: '🍅', category: 'seeds' },
            cornSeed: { name: '玉米种子', emoji: '🌽', category: 'seeds' },
            wheatHarvest: { name: '小麦', emoji: '🌾', category: 'harvests' },
            carrotHarvest: { name: '胡萝卜', emoji: '🥕', category: 'harvests' },
            tomatoHarvest: { name: '番茄', emoji: '🍅', category: 'harvests' },
            cornHarvest: { name: '玉米', emoji: '🌽', category: 'harvests' },
            water: { name: '淡水', emoji: '💧', category: 'supplies' },
            gold: { name: '金币', emoji: '💰', category: 'currency' },
            wheatHarvest: { name: '小麦', emoji: '🌾', category: 'food' },
            carrotHarvest: { name: '胡萝卜', emoji: '🥕', category: 'food' },
            tomatoHarvest: { name: '番茄', emoji: '🍅', category: 'food' },
            cornHarvest: { name: '玉米', emoji: '🌽', category: 'food' }
        };
        
        this.resourceCategories.food = {
            name: '食物',
            items: ['wheatHarvest', 'carrotHarvest', 'tomatoHarvest', 'cornHarvest']
        };
        
        this.buildings = [];
        this.farms = [];
        this.animals = [];
        this.plantations = [];
        this.farmPlots = [];
        this.playerPosition = null;
        this.ships = [];
        this.exploredLocations = ['home'];
        
        this.autoSaveInterval = null;
        
        this.cropTypes = {
            wheat: { name: '小麦', emoji: '🌾', growthTime: 10000, yield: 3, seedCost: { wheatSeed: 1 } },
            carrot: { name: '胡萝卜', emoji: '🥕', growthTime: 8000, yield: 2, seedCost: { carrotSeed: 1 } },
            tomato: { name: '番茄', emoji: '🍅', growthTime: 12000, yield: 4, seedCost: { tomatoSeed: 1 } },
            corn: { name: '玉米', emoji: '🌽', growthTime: 15000, yield: 3, seedCost: { cornSeed: 1 } }
        };
        
        this.initFarmPlots();
        
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.startAutoSave();
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('islandGameData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                
                if (data.version && data.version >= 2) {
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
            version: 2,
            resources: this.resources,
            buildings: this.buildings,
            farms: this.farms,
            animals: this.animals,
            plantations: this.plantations,
            farmPlots: this.farmPlots,
            playerPosition: this.playerPosition
        };
        
        try {
            localStorage.setItem('islandGameData', JSON.stringify(data));
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
        }, 5000);
        
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
        this.resources = {
            wood: 200,
            stone: 200,
            ore: 200,
            apple: 200,
            pear: 200,
            treeSeed: 200,
            fruitSeed: 200,
            wheatSeed: 200,
            carrotSeed: 200,
            tomatoSeed: 200,
            cornSeed: 200,
            wheatHarvest: 0,
            carrotHarvest: 0,
            tomatoHarvest: 0,
            cornHarvest: 0,
            water: 0,
            gold: 200
        };
        this.buildings = [];
        this.farms = [];
        this.animals = [];
        this.plantations = [];
        this.farmPlots = [];
        this.playerPosition = null;
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
                const currentTotal = this.getTotalResourceAmount();
                const otherResourcesTotal = currentTotal - currentValue;
                const maxCanAdd = this.storageCapacity - otherResourcesTotal;
                
                if (maxCanAdd > 0) {
                    const actualAmount = Math.min(amount, maxCanAdd);
                    this.resources[key] = currentValue + actualAmount;
                    this.saveToLocalStorage();
                    return actualAmount;
                } else {
                    return 0;
                }
            } else {
                this.resources[key] = Math.max(0, currentValue + amount);
                this.saveToLocalStorage();
                return amount;
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
            const gridSize = 4;
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
        localStorage.removeItem('islandGameData');
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
}