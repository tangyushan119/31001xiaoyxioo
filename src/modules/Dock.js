import { SHIP_TYPES, DESTINATIONS, FOOD_CONSUMPTION_PER_SAIL, GAME_CONFIG, ENEMY_ISLAND_TEMPLATES } from '../config.js';

export class Dock {
    constructor(game) {
        this.game = game;
        this.ships = [];
        this.isSailing = false;
        this.sailDuration = GAME_CONFIG.SAIL_DURATION;
        this.sailStartTime = null;
        this.currentDestination = null;
        this.exploredLocations = ['home'];
        this.shipTypes = { ...SHIP_TYPES };
        this.destinations = { ...DESTINATIONS };
        this.foodConsumptionPerSail = { ...FOOD_CONSUMPTION_PER_SAIL };
        this.sailingShipId = null;
        this.sailTimer = null;
        this.destroyedIslands = new Set();
        this.refreshTimers = {};

        this.init();
    }

    init() {
        this.loadFromStorage();
    }

    loadFromStorage() {
        if (!this.game.storage) return;

        const savedShips = this.game.storage.getShips();
        const savedLocations = this.game.storage.getExploredLocations();

        if (savedShips && Array.isArray(savedShips)) {
            this.ships = savedShips;
        }

        if (savedLocations && Array.isArray(savedLocations)) {
            this.exploredLocations = savedLocations;
        }
    }

    saveToStorage() {
        if (!this.game.storage) return;

        this.ships.forEach(ship => {
            this.game.storage.addShip(ship);
        });

        this.exploredLocations.forEach(loc => {
            this.game.storage.addExploredLocation(loc);
        });

        this.game.storage.saveToLocalStorage();
    }

    onDockBuilt(building) {
        this.dockPosition = { x: building.x, y: building.y };
    }

    canBuildShip(shipType) {
        const config = this.shipTypes[shipType];
        if (!config) return false;

        return this.game.storage.hasEnoughResources(config.cost);
    }

    buildShip(shipType) {
        const config = this.shipTypes[shipType];
        if (!config) {
            return { success: false, message: '未知船只类型' };
        }

        if (!this.game.storage.hasEnoughResources(config.cost)) {
            return { success: false, message: '资源不足，无法建造船只' };
        }

        this.game.storage.consumeResources(config.cost);

        const ship = {
            id: Date.now(),
            type: shipType,
            name: config.name,
            emoji: config.emoji,
            capacity: config.capacity,
            speed: config.speed,
            cargoSpace: config.cargoSpace,
            crew: 0,
            isDocked: true,
            cargo: {},
            defense: config.defense || 0
        };

        this.ships.push(ship);
        this.saveToStorage();

        return { success: true, message: `建造了 ${config.emoji} ${config.name}！` };
    }

    getShipTypes() {
        return { ...this.shipTypes };
    }

    getShips() {
        return [...this.ships];
    }

    getShipById(id) {
        return this.ships.find(ship => ship.id === id);
    }

    removeShip(id) {
        const index = this.ships.findIndex(ship => ship.id === id);
        if (index !== -1) {
            this.ships.splice(index, 1);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    canSail(destinationId, shipId) {
        const destination = this.destinations[destinationId];
        const ship = this.ships.find(s => s.id === shipId);

        if (!destination || !ship) {
            return { canSail: false, reason: '无效的目的地或船只' };
        }

        if (!ship.isDocked) {
            return { canSail: false, reason: '船只不在码头' };
        }

        if (this.isSailing) {
            return { canSail: false, reason: '已有船只正在航行中' };
        }

        const barracks = this.game.barracks;
        if (!barracks) {
            return { canSail: false, reason: '兵营未初始化' };
        }

        const totalSoldiers = barracks.getTotalSoldiers();

        if (destination.requiresSoldiers && totalSoldiers < 1) {
            return { canSail: false, reason: '需要至少一名士兵才能远航' };
        }

        const foodNeeded = this.foodConsumptionPerSail[destinationId];
        if (!foodNeeded) {
            return { canSail: false, reason: '未知的食物消耗' };
        }

        const wheatHarvest = this.game.storage.getResource('wheatHarvest');

        if (wheatHarvest < foodNeeded) {
            return { canSail: false, reason: `粮食不足，需要 ${foodNeeded} 小麦` };
        }

        return { canSail: true, reason: '' };
    }

    startSail(destinationId, shipId) {
        const canSailResult = this.canSail(destinationId, shipId);
        if (!canSailResult.canSail) {
            return { success: false, message: canSailResult.reason };
        }

        const destination = this.destinations[destinationId];
        const ship = this.ships.find(s => s.id === shipId);

        const foodNeeded = this.foodConsumptionPerSail[destinationId];
        this.game.storage.modifyResource('wheatHarvest', -foodNeeded);

        ship.isDocked = false;
        ship.currentDestination = destinationId;

        this.isSailing = true;
        this.sailStartTime = Date.now();
        this.currentDestination = destinationId;
        this.sailingShipId = shipId;

        const adjustedDuration = this.sailDuration / ship.speed;

        if (this.sailTimer) {
            clearTimeout(this.sailTimer);
        }

        this.sailTimer = setTimeout(() => {
            this.completeSail(destinationId, shipId);
        }, adjustedDuration);

        this.saveToStorage();

        return {
            success: true,
            message: `🚢 船只已出发前往 ${destination.emoji} ${destination.name}，消耗了 ${foodNeeded} 小麦`
        };
    }

    completeSail(destinationId, shipId) {
        const destination = this.destinations[destinationId];
        const ship = this.ships.find(s => s.id === shipId);

        if (!destination || !ship) return;

        if (!this.exploredLocations.includes(destinationId)) {
            this.exploredLocations.push(destinationId);
        }

        ship.isDocked = true;
        ship.currentDestination = null;

        this.isSailing = false;
        this.sailStartTime = null;
        this.currentDestination = null;
        this.sailingShipId = null;

        if (destination.requiresSoldiers) {
            this.handleDangerousDestination(destination);
        }

        const rewards = this.generateRewards(destination);
        Object.entries(rewards).forEach(([resource, amount]) => {
            this.game.storage.modifyResource(resource, amount);
        });

        this.saveToStorage();

        let rewardText = `⚓ 船只返回港口，获得奖励：`;
        Object.entries(rewards).forEach(([resource, amount]) => {
            const info = this.game.storage.getResourceInfo(resource);
            rewardText += ` ${info?.emoji || '?'} ${info?.name || resource} x${amount}`;
        });

        this.showSailResult(rewardText);
    }

    handleDangerousDestination(destination) {
        const barracks = this.game.barracks;
        if (!barracks) return;

        const dangerChance = destination.dangerLevel === 'high' ? 0.3 : 0.5;

        if (Math.random() < dangerChance) {
            const soldiers = barracks.getSoldiers();
            if (soldiers.length > 0) {
                const randomIndex = Math.floor(Math.random() * soldiers.length);
                barracks.removeSoldier(soldiers[randomIndex].id);
            }
        }
    }

    generateRewards(destination) {
        const rewards = {};
        const resourceCount = Math.floor(Math.random() * 3) + 2;

        const shuffledResources = [...destination.resources].sort(() => Math.random() - 0.5);

        for (let i = 0; i < Math.min(resourceCount, shuffledResources.length); i++) {
            const resource = shuffledResources[i];
            const baseAmount = 10 + Math.floor(Math.random() * 20);
            const distanceMultiplier = 1 + destination.distance * 0.5;
            rewards[resource] = Math.floor(baseAmount * distanceMultiplier);
        }

        return rewards;
    }

    showSailResult(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.background = 'rgba(59, 130, 246, 0.9)';
        toast.textContent = message;
        toast.style.maxWidth = '400px';
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    getDestinations() {
        return { ...this.destinations };
    }

    getExploredLocations() {
        return [...this.exploredLocations];
    }

    isAnyShipSailing() {
        return this.ships.some(ship => !ship.isDocked);
    }

    getSailProgress() {
        if (!this.isSailing || !this.sailStartTime) return null;

        const ship = this.ships.find(s => s.id === this.sailingShipId);
        const adjustedDuration = ship ? this.sailDuration / ship.speed : this.sailDuration;
        
        const elapsed = Date.now() - this.sailStartTime;
        const progress = Math.min(100, (elapsed / adjustedDuration) * 100);

        return {
            progress,
            destination: this.currentDestination
        };
    }

    getFoodConsumption(destinationId) {
        return this.foodConsumptionPerSail[destinationId] || 0;
    }

    getDockedShips() {
        return this.ships.filter(ship => ship.isDocked);
    }

    renderSailProgress(ctx) {
        const progress = this.getSailProgress();
        if (!progress) return;

        const destination = this.destinations[progress.destination];
        if (!destination) return;

        const panelX = this.game.renderer.width - 220;
        const panelY = 20;
        const panelWidth = 200;
        const panelHeight = 80;

        ctx.save();

        ctx.fillStyle = 'rgba(30, 30, 30, 0.85)';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.fill();

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`🚢 航行中 ${destination.emoji} ${destination.name}`, panelX + panelWidth / 2, panelY + 25);

        const barWidth = 160;
        const barHeight = 8;
        const barX = panelX + 20;
        const barY = panelY + 45;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(barX, barY, barWidth * (progress.progress / 100), barHeight);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.round(progress.progress)}%`, panelX + panelWidth - 15, barY + 12);

        ctx.restore();
    }

    renderShips(ctx) {
        if (!this.game || !this.game.terrain) return;

        const docks = this.game.storage.getBuildings().filter(b => b.type === 'dock');
        if (docks.length === 0) return;

        const dockedShips = this.getDockedShips();
        if (dockedShips.length === 0) return;

        const dock = docks[0];
        const terrain = this.game.terrain;
        const center = terrain.getIslandCenter();
        const beachOuterRadius = terrain.getBeachOuterRadius();

        const dx = dock.x - center.x;
        const dy = dock.y - center.y;
        const angle = Math.atan2(dy, dx);

        const seaStartRadius = beachOuterRadius + 20;
        const shipRadius = seaStartRadius + 40;

        const spacingAngle = 0.15;
        const startAngle = angle - spacingAngle * (dockedShips.length - 1) / 2;

        dockedShips.forEach((ship, index) => {
            const shipAngle = startAngle + index * spacingAngle;
            const x = center.x + Math.cos(shipAngle) * shipRadius;
            const y = center.y + Math.sin(shipAngle) * shipRadius;

            ctx.save();

            ctx.font = '35px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ship.emoji, x, y);

            ctx.font = '10px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText(ship.name, x, y + 25);

            ctx.restore();
        });
    }

    renderNPCIslands(ctx) {
        if (!this.game || !this.game.terrain) return;

        const terrain = this.game.terrain;
        const center = terrain.getIslandCenter();
        const beachOuterRadius = terrain.getBeachOuterRadius();

        const destinations = this.getDestinations();
        const selectedIsland = this.game.selectedIsland;
        const hoveredIsland = this.game.hoveredIsland;

        let index = 0;
        Object.entries(destinations).forEach(([id, destination]) => {
            if (id === 'home') return;

            const angle = (index * 2 * Math.PI / 6) + Math.PI / 4;
            const distance = beachOuterRadius + 120 + destination.distance * 60;

            const x = center.x + Math.cos(angle) * distance;
            const y = center.y + Math.sin(angle) * distance;

            ctx.save();

            const isDestroyed = this.destroyedIslands.has(id);
            const isSelected = selectedIsland === id;
            const isHovered = hoveredIsland === id;

            if (isDestroyed) {
                ctx.font = '30px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillText('💥', x, y);

                ctx.font = '10px Arial';
                ctx.fillText('废墟', x, y + 25);

                ctx.restore();
                index++;
                return;
            }

            if (isSelected || isHovered) {
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, 50);
                if (isSelected) {
                    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
                    gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.2)');
                    gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
                } else {
                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
                    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)');
                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                }

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, 50, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = isSelected ? '#ef4444' : '#3b82f6';
                ctx.lineWidth = 2;
                ctx.setLineDash(isHovered ? [5, 5] : []);
                ctx.beginPath();
                ctx.arc(x, y, 35, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            ctx.font = '40px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (isSelected || isHovered) {
                ctx.shadowColor = isSelected ? '#ef4444' : '#3b82f6';
                ctx.shadowBlur = 15;
            }

            ctx.fillText(destination.emoji, x, y);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(destination.name, x, y + 35);

            if (destination.requiresSoldiers) {
                ctx.font = '14px Arial';
                ctx.fillStyle = '#ef4444';
                ctx.fillText('⚔️', x, y - 35);
            }

            ctx.font = '10px Arial';
            const dangerColors = { low: '#22c55e', medium: '#eab308', high: '#ef4444', extreme: '#dc2626' };
            ctx.fillStyle = dangerColors[destination.dangerLevel] || '#9ca3af';
            ctx.fillText('危险: ' + (destination.dangerLevel || '低'), x, y + 50);

            ctx.restore();

            index++;
        });
    }

    getIslandPosition(destinationId) {
        if (!this.game || !this.game.terrain) return null;

        const terrain = this.game.terrain;
        const center = terrain.getIslandCenter();
        const beachOuterRadius = terrain.getBeachOuterRadius();

        const destinations = this.getDestinations();
        const destination = destinations[destinationId];
        if (!destination || destinationId === 'home') return null;

        const ids = Object.keys(destinations).filter(id => id !== 'home');
        const index = ids.indexOf(destinationId);

        const angle = (index * 2 * Math.PI / 6) + Math.PI / 4;
        const distance = beachOuterRadius + 120 + destination.distance * 60;

        return {
            x: center.x + Math.cos(angle) * distance,
            y: center.y + Math.sin(angle) * distance,
            radius: 30
        };
    }

    destroyAndRefreshEnemyIsland(islandId) {
        const destinations = Object.keys(this.destinations);
        const enemyIds = destinations.filter(id => this.destinations[id].requiresSoldiers);
        
        if (!enemyIds.includes(islandId)) return;

        if (this.refreshTimers[islandId]) {
            clearTimeout(this.refreshTimers[islandId]);
            delete this.refreshTimers[islandId];
        }

        this.destroyedIslands.add(islandId);

        const refreshDelay = 2000;

        this.refreshTimers[islandId] = setTimeout(() => {
            this.spawnNewEnemyIsland(islandId);
            delete this.refreshTimers[islandId];
        }, refreshDelay);

        return {
            success: true,
            message: `💥 ${this.destinations[islandId].emoji} ${this.destinations[islandId].name} 已被摧毁！新岛屿即将出现...`,
            refreshDelay
        };
    }

    spawnNewEnemyIsland(islandId) {
        const templates = [...ENEMY_ISLAND_TEMPLATES];
        const currentTemplate = this.destinations[islandId];
        
        let newTemplate;
        do {
            newTemplate = templates[Math.floor(Math.random() * templates.length)];
        } while (newTemplate.name === currentTemplate.name && templates.length > 1);

        const newIsland = {
            ...newTemplate,
            distance: this.destinations[islandId].distance,
            requiresSoldiers: true,
            defeatedCount: (this.destinations[islandId].defeatedCount || 0) + 1
        };

        this.destinations[islandId] = newIsland;
        this.destroyedIslands.delete(islandId);

        if (!this.exploredLocations.includes(islandId)) {
            this.exploredLocations.push(islandId);
        }

        this.saveToStorage();

        if (this.game) {
            this.game.showToast(`🌋 新的 ${newIsland.emoji} ${newIsland.name} 已出现！危险等级: ${newIsland.dangerLevel}`);
        }

        return {
            success: true,
            message: `🌋 新的 ${newIsland.emoji} ${newIsland.name} 已出现！危险等级: ${newIsland.dangerLevel}`
        };
    }

    destroy() {
        if (this.sailTimer) {
            clearTimeout(this.sailTimer);
        }
        Object.values(this.refreshTimers).forEach(timer => clearTimeout(timer));
        this.refreshTimers = {};
        this.destroyedIslands.clear();
        this.ships = [];
        this.isSailing = false;
    }
}