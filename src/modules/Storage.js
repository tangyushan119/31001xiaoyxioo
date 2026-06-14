export class Storage {
    constructor() {
        this.resources = {
            wood: 0,
            stone: 0,
            ore: 0,
            apple: 0,
            pear: 0,
            treeSeed: 0,
            fruitSeed: 0,
            water: 0,
            gold: 0
        };
        
        this.storageCapacity = 500;
        
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
                items: ['treeSeed', 'fruitSeed']
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
            water: { name: '淡水', emoji: '💧', category: 'supplies' },
            gold: { name: '金币', emoji: '💰', category: 'currency' }
        };
        
        this.buildings = [];
        this.farms = [];
        this.animals = [];
        this.plantations = [];
        this.playerPosition = null;
        
        this.autoSaveInterval = null;
        
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
                
                if (data.resources) {
                    this.resources = { ...this.resources, ...data.resources };
                }
                
                this.buildings = data.buildings || [];
                this.farms = data.farms || [];
                this.animals = data.animals || [];
                this.plantations = data.plantations || [];
                this.playerPosition = data.playerPosition || null;
            } catch (e) {
                console.warn('Failed to load saved data:', e);
                this.resetToDefaults();
            }
        }
    }

    saveToLocalStorage() {
        const data = {
            resources: this.resources,
            buildings: this.buildings,
            farms: this.farms,
            animals: this.animals,
            plantations: this.plantations,
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
            wood: 0,
            stone: 0,
            ore: 0,
            apple: 0,
            pear: 0,
            treeSeed: 0,
            fruitSeed: 0,
            water: 0,
            gold: 0
        };
        this.buildings = [];
        this.farms = [];
        this.animals = [];
        this.plantations = [];
        this.playerPosition = null;
    }

    getResources() {
        return { ...this.resources };
    }

    getResource(key) {
        return this.resources[key] || 0;
    }

    modifyResource(key, amount) {
        if (this.resources.hasOwnProperty(key)) {
            const currentTotal = this.getTotalResourceAmount();
            const otherResourcesTotal = currentTotal - (this.resources[key] || 0);
            const maxCanAdd = this.storageCapacity - otherResourcesTotal;
            const actualAmount = Math.min(amount, maxCanAdd);
            this.resources[key] = Math.max(0, this.resources[key] + actualAmount);
            this.saveToLocalStorage();
            return actualAmount;
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
        this.buildings = this.buildings.filter(b => b.id !== id);
        this.saveToLocalStorage();
    }

    getBuildingById(id) {
        return this.buildings.find(b => b.id === id);
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