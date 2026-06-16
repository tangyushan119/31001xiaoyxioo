export class Dock {
    constructor(game) {
        this.game = game;
        this.ships = [];
        this.isSailing = false;
        this.sailDuration = 10000;
        this.sailStartTime = null;
        this.currentDestination = null;
        this.exploredLocations = ['home'];
        
        this.shipTypes = {
            smallShip: {
                name: '小型船',
                emoji: '⛵',
                cost: { wood: 50, ore: 20 },
                capacity: 5,
                speed: 1,
                cargoSpace: 50
            },
            largeShip: {
                name: '大型船',
                emoji: '🚢',
                cost: { wood: 120, ore: 50, gold: 50 },
                capacity: 15,
                speed: 0.7,
                cargoSpace: 150
            },
            warShip: {
                name: '战船',
                emoji: '⚓',
                cost: { wood: 100, ore: 80, gold: 80 },
                capacity: 10,
                speed: 0.8,
                cargoSpace: 80,
                defense: 50
            }
        };
        
        this.destinations = {
            home: {
                name: '家园',
                emoji: '🏠',
                distance: 0,
                resources: []
            },
            nearbyIsland: {
                name: '近岛',
                emoji: '🏝️',
                distance: 1,
                resources: ['wood', 'stone', 'apple']
            },
            resourceIsland: {
                name: '资源岛',
                emoji: '⛰️',
                distance: 2,
                resources: ['ore', 'gold', 'pear']
            },
            enemyIsland: {
                name: '敌岛',
                emoji: '🏴‍☠️',
                distance: 3,
                resources: ['gold', 'ore', 'fruitSeed'],
                requiresSoldiers: true,
                dangerLevel: 'high'
            },
            treasureIsland: {
                name: '宝藏岛',
                emoji: '💎',
                distance: 4,
                resources: ['gold', 'ore'],
                requiresSoldiers: true,
                dangerLevel: 'extreme'
            }
        };
        
        this.foodConsumptionPerSail = {
            nearbyIsland: 10,
            resourceIsland: 20,
            enemyIsland: 30,
            treasureIsland: 40
        };
        
        this.init();
    }
    
    init() {
        this.loadFromStorage();
    }
    
    loadFromStorage() {
        const storage = this.game.getStorage();
        const savedShips = storage.getResource('ships');
        const savedLocations = storage.getResource('exploredLocations');
        
        if (savedShips && typeof savedShips === 'object') {
            this.ships = savedShips;
        }
        
        if (savedLocations && Array.isArray(savedLocations)) {
            this.exploredLocations = savedLocations;
        }
    }
    
    saveToStorage() {
        const storage = this.game.getStorage();
        storage.resources.ships = [...this.ships];
        storage.resources.exploredLocations = [...this.exploredLocations];
        storage.saveToLocalStorage();
    }
    
    canBuildShip(shipType) {
        const config = this.shipTypes[shipType];
        if (!config) return false;
        
        const storage = this.game.getStorage();
        return storage.hasEnoughResources(config.cost);
    }
    
    buildShip(shipType) {
        const config = this.shipTypes[shipType];
        if (!config) {
            return { success: false, message: '未知船只类型' };
        }
        
        const storage = this.game.getStorage();
        
        if (!storage.hasEnoughResources(config.cost)) {
            return { success: false, message: '资源不足，无法建造船只' };
        }
        
        storage.consumeResources(config.cost);
        
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
            cargo: {}
        };
        
        if (config.defense) {
            ship.defense = config.defense;
        }
        
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
        
        if (!destination || !ship) return { canSail: false, reason: '无效的目的地或船只' };
        
        if (!ship.isDocked) return { canSail: false, reason: '船只不在码头' };
        
        const barracks = this.game.getBarracks();
        const totalSoldiers = barracks.getTotalSoldiers();
        
        if (destination.requiresSoldiers && totalSoldiers < 1) {
            return { canSail: false, reason: '需要至少一名士兵才能远航' };
        }
        
        const foodNeeded = this.foodConsumptionPerSail[destinationId];
        if (!foodNeeded) return { canSail: false, reason: '未知的食物消耗' };
        
        const storage = this.game.getStorage();
        const wheatHarvest = storage.getResource('wheatHarvest');
        
        if (wheatHarvest < foodNeeded) {
            return { canSail: false, reason: `粮食不足！需要 ${foodNeeded} 小麦` };
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
        const storage = this.game.getStorage();
        storage.modifyResource('wheatHarvest', -foodNeeded);
        
        ship.isDocked = false;
        ship.currentDestination = destinationId;
        
        this.isSailing = true;
        this.sailStartTime = Date.now();
        this.currentDestination = destinationId;
        
        const adjustedDuration = this.sailDuration / ship.speed;
        
        setTimeout(() => {
            this.completeSail(destinationId, shipId);
        }, adjustedDuration);
        
        this.saveToStorage();
        
        return { 
            success: true, 
            message: `🚢 船只已出发前往 ${destination.emoji} ${destination.name}！消耗了 ${foodNeeded} 小麦` 
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
        
        const rewards = this.generateRewards(destination);
        const storage = this.game.getStorage();
        
        Object.entries(rewards).forEach(([resource, amount]) => {
            storage.modifyResource(resource, amount);
        });
        
        this.saveToStorage();
        
        let rewardText = `⚓ 船只返回港口！获得奖励：`;
        Object.entries(rewards).forEach(([resource, amount]) => {
            const info = storage.getResourceInfo(resource);
            rewardText += ` ${info?.emoji || '❓'} ${info?.name || resource} x${amount}`;
        });
        
        this.showSailResult(rewardText);
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
        
        if (destination.dangerLevel === 'high') {
            const barracks = this.game.getBarracks();
            const randomSoldierType = Math.random() > 0.5 ? 'infantry' : 'archer';
            if (Math.random() > 0.3) {
                barracks.removeSoldier(randomSoldierType, 1);
            }
        }
        
        if (destination.dangerLevel === 'extreme') {
            const barracks = this.game.getBarracks();
            if (Math.random() > 0.5) {
                const randomSoldierType = Math.random() > 0.5 ? 'infantry' : 'archer';
                barracks.removeSoldier(randomSoldierType, 1);
            }
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
        
        const elapsed = Date.now() - this.sailStartTime;
        const progress = Math.min(100, (elapsed / this.sailDuration) * 100);
        
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
        ctx.fillText(`🚢 航行中: ${destination.emoji} ${destination.name}`, panelX + panelWidth / 2, panelY + 25);
        
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
        
        const storage = this.game.getStorage();
        const docks = storage.getBuildings().filter(b => b.type === 'dock');
        if (docks.length === 0) return;
        
        const dockedShips = this.getDockedShips();
        if (dockedShips.length === 0) return;
        
        const dock = docks[0];
        const terrain = this.game.terrain;
        const center = terrain.getIslandCenter();
        const beachOuterRadius = terrain.getBeachOuterRadius();
        
        const dx = dock.x - center.x;
        const dy = dock.y - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
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
    
    destroy() {
        this.ships = [];
        this.isSailing = false;
    }
}