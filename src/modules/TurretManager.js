import { Turret } from './Turret.js';

export class TurretManager {
    constructor(game) {
        this.game = game;
        this.turrets = [];
    }
    
    init() {
        this.loadTurretsFromStorage();
    }
    
    loadTurretsFromStorage() {
        const buildings = this.game.storage.getBuildings();
        
        buildings.forEach(building => {
            if (building.type === 'machineGun' || building.type === 'catapult') {
                const turret = new Turret(this.game, building.x, building.y, building.type);
                turret.id = building.id;
                turret.health = building.health;
                turret.maxHealth = building.maxHealth;
                this.turrets.push(turret);
            }
        });
    }
    
    addTurret(type, x, y) {
        const turret = new Turret(this.game, x, y, type);
        this.turrets.push(turret);
        
        const turretConfig = turret.getTurretConfig(type);
        
        const buildingData = {
            id: turret.id,
            type: type,
            x: x,
            y: y,
            size: turret.size,
            emoji: turret.emoji,
            name: turret.name,
            health: turret.health,
            maxHealth: turret.maxHealth,
            isTurret: true
        };
        
        this.game.storage.addBuilding(buildingData);
        
        return turret;
    }
    
    removeTurret(turretId) {
        this.turrets = this.turrets.filter(t => t.id !== turretId);
    }
    
    updateTurrets(deltaTime) {
        this.turrets.forEach(turret => {
            turret.update(deltaTime);
        });
        
        this.syncTurretsWithStorage();
    }
    
    syncTurretsWithStorage() {
        this.turrets.forEach(turret => {
            const building = this.game.storage.getBuildingById(turret.id);
            if (building) {
                building.health = turret.health;
                building.maxHealth = turret.maxHealth;
            }
        });
    }
    
    renderTurrets(ctx) {
        this.turrets.forEach(turret => {
            turret.render(ctx);
        });
    }
    
    getTurrets() {
        return [...this.turrets];
    }
    
    getTurretById(id) {
        return this.turrets.find(t => t.id === id);
    }
    
    getTurretCount() {
        return this.turrets.length;
    }
    
    getTurretTypes() {
        return [
            { type: 'machineGun', name: '机枪炮塔', emoji: '🔫' },
            { type: 'catapult', name: '投石炮塔', emoji: '🪨' }
        ];
    }
    
    clearAll() {
        this.turrets = [];
    }
    
    reset() {
        this.clearAll();
        this.init();
    }
}