export class Storage {
    constructor() {
        this.resources = {
            wood: 100,
            stone: 50,
            food: 30,
            water: 50,
            gold: 0
        };
        
        this.buildings = [];
        this.farms = [];
        this.animals = [];
        this.plantations = [];
        
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('islandGameData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.resources = { ...this.resources, ...data.resources };
                this.buildings = data.buildings || [];
                this.farms = data.farms || [];
                this.animals = data.animals || [];
                this.plantations = data.plantations || [];
            } catch (e) {
                console.warn('Failed to load saved data:', e);
            }
        }
    }

    saveToLocalStorage() {
        const data = {
            resources: this.resources,
            buildings: this.buildings,
            farms: this.farms,
            animals: this.animals,
            plantations: this.plantations
        };
        localStorage.setItem('islandGameData', JSON.stringify(data));
    }

    getResources() {
        return { ...this.resources };
    }

    getResource(key) {
        return this.resources[key] || 0;
    }

    modifyResource(key, amount) {
        if (this.resources.hasOwnProperty(key)) {
            this.resources[key] = Math.max(0, this.resources[key] + amount);
            this.saveToLocalStorage();
        }
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

    clearAll() {
        this.resources = {
            wood: 100,
            stone: 50,
            food: 30,
            water: 50,
            gold: 0
        };
        this.buildings = [];
        this.farms = [];
        this.animals = [];
        this.plantations = [];
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
}