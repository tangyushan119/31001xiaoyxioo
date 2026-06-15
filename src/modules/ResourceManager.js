export class ResourceManager {
    constructor(game) {
        this.game = game;
        this.resources = [];
        this.collectionRange = 60;
        this.refreshInterval = 30000;
        this.lastRefreshTime = Date.now();
        
        this.collectionAnimations = [];
        
        this.resourceTypes = {
            bigTree: {
                emoji: '🌳',
                name: '大树',
                resourceKey: 'wood',
                amount: 8,
                color: '#1e4d2b',
                spawnChance: 0.12
            },
            smallTree: {
                emoji: '🌲',
                name: '小树',
                resourceKey: 'wood',
                amount: 4,
                color: '#2d5a27',
                spawnChance: 0.2
            },
            stonePile: {
                emoji: '🪨',
                name: '石堆',
                resourceKey: 'stone',
                amount: 3,
                color: '#5a5a5a',
                spawnChance: 0.2,
                secondaryResource: { key: 'ore', amount: 1, chance: 0.3 }
            },
            farmland: {
                emoji: '🌾',
                name: '耕地',
                resourceKey: 'apple',
                amount: 3,
                color: '#8b4513',
                spawnChance: 0.15,
                alternateResource: { key: 'pear', amount: 3, chance: 0.5 }
            },
            treeSeed: {
                emoji: '🌱',
                name: '树木种子',
                resourceKey: 'treeSeed',
                amount: 1,
                color: '#4ade80',
                spawnChance: 0.08
            },
            fruitSeed: {
                emoji: '🍑',
                name: '水果种子',
                resourceKey: 'fruitSeed',
                amount: 1,
                color: '#fb923c',
                spawnChance: 0.05
            },
            wheatSeed: {
                emoji: '🌾',
                name: '小麦种子',
                resourceKey: 'wheatSeed',
                amount: 1,
                color: '#f4d03f',
                spawnChance: 0.05
            },
            carrotSeed: {
                emoji: '🥕',
                name: '胡萝卜种子',
                resourceKey: 'carrotSeed',
                amount: 1,
                color: '#e67e22',
                spawnChance: 0.05
            },
            tomatoSeed: {
                emoji: '🍅',
                name: '番茄种子',
                resourceKey: 'tomatoSeed',
                amount: 1,
                color: '#e74c3c',
                spawnChance: 0.05
            },
            cornSeed: {
                emoji: '🌽',
                name: '玉米种子',
                resourceKey: 'cornSeed',
                amount: 1,
                color: '#f39c12',
                spawnChance: 0.05
            }
        };
        
        this.init();
    }
    
    init() {
        this.generateInitialResources();
    }
    
    generateInitialResources() {
        const terrain = this.game.getTerrain();
        const landRadius = terrain.getLandRadius();
        const center = terrain.getIslandCenter();
        
        const resourceCount = 8;
        
        for (let i = 0; i < resourceCount; i++) {
            const angle = (i / resourceCount) * Math.PI * 2;
            const distance = (Math.random() * 0.6 + 0.2) * landRadius;
            
            const x = center.x + Math.cos(angle) * distance;
            const y = center.y + Math.sin(angle) * distance;
            
            if (terrain.isOnLand(x, y) && !this.isInFarmArea(x, y)) {
                const type = this.getRandomResourceType();
                this.spawnResource(x, y, type);
            }
        }
    }
    
    isInFarmArea(x, y) {
        const terrain = this.game.getTerrain();
        if (!terrain || !terrain.landRenderer) return false;
        
        const farmArea = terrain.landRenderer.getFarmArea();
        return x >= farmArea.x && x <= farmArea.x + farmArea.width &&
               y >= farmArea.y && y <= farmArea.y + farmArea.height;
    }
    
    getRandomResourceType() {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [type, config] of Object.entries(this.resourceTypes)) {
            cumulative += config.spawnChance;
            if (rand < cumulative) {
                return type;
            }
        }
        
        return 'tree';
    }
    
    spawnResource(x, y, type) {
        const config = this.resourceTypes[type];
        const resource = {
            id: Date.now() + Math.random(),
            x,
            y,
            type,
            emoji: config.emoji,
            name: config.name,
            resourceKey: config.resourceKey,
            amount: config.amount,
            color: config.color,
            isDepleted: false,
            respawnTimer: 0
        };
        
        this.resources.push(resource);
    }
    
    update(deltaTime) {
        const currentTime = Date.now();
        
        if (currentTime - this.lastRefreshTime >= this.refreshInterval) {
            this.refreshDepletedResources();
            this.lastRefreshTime = currentTime;
        }
        
        this.resources.forEach(resource => {
            if (resource.isDepleted) {
                resource.respawnTimer += deltaTime * 1000;
                if (resource.respawnTimer >= this.refreshInterval) {
                    resource.isDepleted = false;
                    resource.respawnTimer = 0;
                }
            }
        });
        
        this.updateCollectionAnimations(deltaTime);
        
        this.checkPlayerProximity();
    }
    
    refreshDepletedResources() {
        const terrain = this.game.getTerrain();
        const landRadius = terrain.getLandRadius();
        const center = terrain.getIslandCenter();
        
        const depletedCount = this.resources.filter(r => r.isDepleted).length;
        
        if (depletedCount > 0) {
            const newResourceCount = Math.min(depletedCount, 2);
            
            for (let i = 0; i < newResourceCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = (Math.random() * 0.6 + 0.2) * landRadius;
                
                const x = center.x + Math.cos(angle) * distance;
                const y = center.y + Math.sin(angle) * distance;
                
                if (terrain.isOnLand(x, y) && !this.isInFarmArea(x, y)) {
                    const existingResource = this.resources.find(r => !r.isDepleted && 
                        Math.abs(r.x - x) < 50 && Math.abs(r.y - y) < 50);
                    
                    if (!existingResource) {
                        const type = this.getRandomResourceType();
                        const depletedResource = this.resources.find(r => r.isDepleted);
                        if (depletedResource) {
                            depletedResource.x = x;
                            depletedResource.y = y;
                            depletedResource.type = type;
                            const config = this.resourceTypes[type];
                            depletedResource.emoji = config.emoji;
                            depletedResource.name = config.name;
                            depletedResource.resourceKey = config.resourceKey;
                            depletedResource.amount = config.amount;
                            depletedResource.color = config.color;
                            depletedResource.isDepleted = false;
                            depletedResource.respawnTimer = 0;
                        } else {
                            this.spawnResource(x, y, type);
                        }
                    }
                }
            }
        }
    }
    
    checkPlayerProximity() {
        const player = this.game.getPlayer();
        const input = this.game.getInput();
        
        if (!player || !input) return;
        
        const mousePos = input.getCanvasMousePosition();
        
        if (this.isInFarmArea(mousePos.x, mousePos.y)) {
            return;
        }
        
        const playerPos = player.getPosition();
        
        this.resources.forEach(resource => {
            if (resource.isDepleted) return;
            
            const dx = playerPos.x - resource.x;
            const dy = playerPos.y - resource.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.collectionRange && input.wasClicked()) {
                this.collectResource(resource);
            }
        });
    }
    
    collectResource(resource) {
        const storage = this.game.getStorage();
        
        const config = this.resourceTypes[resource.type];
        let collectedResourceKey = resource.resourceKey;
        let collectedAmount = resource.amount;
        
        if (config.alternateResource && Math.random() < config.alternateResource.chance) {
            collectedResourceKey = config.alternateResource.key;
            collectedAmount = config.alternateResource.amount;
        }
        
        storage.modifyResource(collectedResourceKey, collectedAmount);
        
        if (config.secondaryResource && Math.random() < config.secondaryResource.chance) {
            storage.modifyResource(config.secondaryResource.key, config.secondaryResource.amount);
            this.addCollectionAnimation(resource.x, resource.y, this.getResourceEmoji(config.secondaryResource.key), config.secondaryResource.key);
        }
        
        resource.isDepleted = true;
        resource.respawnTimer = 0;
        
        this.addCollectionAnimation(resource.x, resource.y, resource.emoji, collectedResourceKey);
        
        this.game.getBuildPanel().updateResourceDisplay();
        this.game.getBuildPanel().updateBuildItemStates();
        
        this.showCollectionToast(resource, collectedResourceKey, collectedAmount);
    }
    
    getResourceEmoji(resourceKey) {
        const storage = this.game.getStorage();
        const info = storage.getResourceInfo(resourceKey);
        return info ? info.emoji : '❓';
    }
    
    addCollectionAnimation(x, y, emoji, resourceKey) {
        const animation = {
            id: Date.now() + Math.random(),
            x,
            y,
            targetX: this.game.getPlayer().x,
            targetY: this.game.getPlayer().y - 30,
            emoji,
            resourceKey,
            progress: 0,
            duration: 0.5,
            startTime: Date.now()
        };
        
        this.collectionAnimations.push(animation);
    }
    
    updateCollectionAnimations(deltaTime) {
        const now = Date.now();
        
        this.collectionAnimations = this.collectionAnimations.filter(animation => {
            const elapsed = (now - animation.startTime) / 1000;
            animation.progress = Math.min(elapsed / animation.duration, 1);
            
            if (animation.progress >= 1) {
                return false;
            }
            
            const easeProgress = this.easeOutQuad(animation.progress);
            
            animation.x = animation.x + (animation.targetX - animation.x) * easeProgress * deltaTime * 2;
            animation.y = animation.y + (animation.targetY - animation.y) * easeProgress * deltaTime * 2;
            
            return true;
        });
    }
    
    easeOutQuad(t) {
        return t * (2 - t);
    }
    
    showCollectionToast(resource, collectedResourceKey = null, collectedAmount = null) {
        const storage = this.game.getStorage();
        const displayKey = collectedResourceKey || resource.resourceKey;
        const displayAmount = collectedAmount || resource.amount;
        
        const resourceInfo = storage.getResourceInfo(displayKey);
        const resourceName = resourceInfo ? resourceInfo.name : resource.name;
        const emoji = resourceInfo ? resourceInfo.emoji : '';
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.background = 'rgba(39, 174, 96, 0.9)';
        toast.textContent = `✅ 采集到 ${emoji} ${resourceName} x${displayAmount}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2000);
    }
    
    render(ctx) {
        this.resources.forEach(resource => {
            if (!resource.isDepleted) {
                this.renderResource(ctx, resource);
            } else {
                this.renderDepletedResource(ctx, resource);
            }
        });
        
        this.renderCollectionAnimations(ctx);
        
        this.renderProximityHint(ctx);
    }
    
    renderResource(ctx, resource) {
        const size = 40;
        
        ctx.save();
        
        const player = this.game.getPlayer();
        const playerPos = player.getPosition();
        const dx = playerPos.x - resource.x;
        const dy = playerPos.y - resource.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const isNear = distance < this.collectionRange;
        
        if (isNear) {
            ctx.shadowColor = '#4ade80';
            ctx.shadowBlur = 15;
        }
        
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let bounceOffset = 0;
        if (isNear) {
            bounceOffset = Math.sin(Date.now() * 0.01) * 5;
        }
        
        ctx.fillText(resource.emoji, resource.x, resource.y + bounceOffset);
        
        ctx.restore();
    }
    
    renderDepletedResource(ctx, resource) {
        const size = 25;
        
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🪨', resource.x, resource.y);
        ctx.restore();
        
        const progress = resource.respawnTimer / this.refreshInterval;
        const barWidth = 40;
        const barHeight = 4;
        const barX = resource.x - barWidth / 2;
        const barY = resource.y + 20;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    }
    
    renderCollectionAnimations(ctx) {
        this.collectionAnimations.forEach(animation => {
            ctx.save();
            
            const size = 30;
            ctx.font = `${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 1 - animation.progress;
            
            ctx.fillText(animation.emoji, animation.x, animation.y);
            
            ctx.restore();
        });
    }
    
    renderProximityHint(ctx) {
        const player = this.game.getPlayer();
        const playerPos = player.getPosition();
        
        let nearestResource = null;
        let minDistance = Infinity;
        
        this.resources.forEach(resource => {
            if (resource.isDepleted) return;
            
            const dx = playerPos.x - resource.x;
            const dy = playerPos.y - resource.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.collectionRange && distance < minDistance) {
                minDistance = distance;
                nearestResource = resource;
            }
        });
        
        if (nearestResource) {
            this.renderFloatingHint(ctx, nearestResource);
        }
    }
    
    renderFloatingHint(ctx, resource) {
        const hintY = resource.y - 50;
        const padding = 10;
        const text = `${resource.name} (点击采集)`;
        
        ctx.save();
        
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textWidth = ctx.measureText(text).width;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = 28;
        
        const gradient = ctx.createLinearGradient(resource.x - boxWidth / 2, hintY - boxHeight / 2, 
                                                 resource.x + boxWidth / 2, hintY + boxHeight / 2);
        gradient.addColorStop(0, 'rgba(30, 30, 30, 0.9)');
        gradient.addColorStop(1, 'rgba(50, 50, 50, 0.9)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(resource.x - boxWidth / 2, hintY - boxHeight / 2, boxWidth, boxHeight, 6);
        ctx.fill();
        
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, resource.x, hintY);
        
        const arrowSize = 8;
        ctx.beginPath();
        ctx.moveTo(resource.x - arrowSize, hintY + boxHeight / 2);
        ctx.lineTo(resource.x, hintY + boxHeight / 2 + arrowSize);
        ctx.lineTo(resource.x + arrowSize, hintY + boxHeight / 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.restore();
    }
    
    getResources() {
        return [...this.resources];
    }
    
    getCollectionRange() {
        return this.collectionRange;
    }
    
    setCollectionRange(range) {
        this.collectionRange = range;
    }
    
    getRefreshInterval() {
        return this.refreshInterval;
    }
    
    setRefreshInterval(interval) {
        this.refreshInterval = interval;
    }
    
    addResource(type, amount) {
        const storage = this.game.getStorage();
        storage.modifyResource(type, amount);
        this.game.getBuildPanel().updateResourceDisplay();
    }
}