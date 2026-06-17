import { Turret } from './Turret.js';
import { TURRET_CONFIGS, BUILDING_TYPES } from '../config.js';

export class TurretManager {
    constructor(game) {
        this.game = game;
        this.turrets = [];
    }

    init() {
        this.loadTurretsFromStorage();
    }

    loadTurretsFromStorage() {
        if (!this.game.storage) return;

        const buildings = this.game.storage.getBuildings();

        buildings.forEach(building => {
            if (building.isTurret) {
                const turret = new Turret(this.game, building.x, building.y, building.type);
                turret.id = building.id;
                turret.health = building.health;
                turret.maxHealth = building.maxHealth;
                this.turrets.push(turret);
            }
        });
    }

    addTurret(turretData) {
        const { type, x, y, id, emoji, health, maxHealth, attackRange, attackDamage, attackInterval } = turretData;

        const turret = new Turret(this.game, x, y, type);
        
        if (id) turret.id = id;
        if (emoji) turret.emoji = emoji;
        if (health !== undefined) turret.health = health;
        if (maxHealth !== undefined) turret.maxHealth = maxHealth;
        if (attackRange !== undefined) turret.attackRange = attackRange;
        if (attackDamage !== undefined) turret.attackDamage = attackDamage;
        if (attackInterval !== undefined) turret.attackInterval = attackInterval;

        this.turrets.push(turret);

        return turret;
    }

    removeTurret(turretId) {
        const turretIndex = this.turrets.findIndex(t => t.id === turretId);
        if (turretIndex !== -1) {
            const turret = this.turrets[turretIndex];
            
            if (turret.config && turret.config.refund && this.game.storage) {
                this.game.storage.modifyResource('wood', turret.config.refund.wood || 0);
                this.game.storage.modifyResource('stone', turret.config.refund.stone || 0);
            }

            this.turrets.splice(turretIndex, 1);
        }

        if (this.game.storage) {
            this.game.storage.removeBuilding(turretId);
        }
    }

    updateTurrets(deltaTime) {
        this.turrets.forEach(turret => {
            turret.update(deltaTime);
        });

        this.syncTurretsWithStorage();
    }

    syncTurretsWithStorage() {
        if (!this.game.storage) return;

        this.turrets.forEach(turret => {
            const building = this.game.storage.getBuildingById(turret.id);
            if (building) {
                building.health = turret.health;
                building.maxHealth = turret.maxHealth;
                this.game.storage.saveToLocalStorage();
            }
        });
    }

    damageTurret(turretId, amount) {
        const turret = this.turrets.find(t => t.id === turretId);
        if (!turret) return false;

        turret.takeDamage(amount);

        if (turret.health <= 0) {
            this.removeTurret(turretId);
            return { destroyed: true };
        }

        return { destroyed: false, health: turret.health, maxHealth: turret.maxHealth };
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
        return Object.entries(TURRET_CONFIGS).map(([type, config]) => ({
            type,
            name: config.name,
            emoji: config.emoji,
            cost: BUILDING_TYPES[type]?.cost || {}
        }));
    }

    clearAll() {
        this.turrets = [];
    }

    reset() {
        this.clearAll();
    }
}
