export class Barracks {
    constructor(game) {
        this.game = game;
        this.soldiers = {
            infantry: 0,
            archer: 0
        };
        
        this.trainingCosts = {
            infantry: {
                gold: 20,
                wheatHarvest: 10
            },
            archer: {
                gold: 35,
                wheatHarvest: 15
            }
        };
        
        this.soldierInfo = {
            infantry: {
                name: '步兵',
                emoji: '⚔️',
                description: '基础近战单位，攻防均衡',
                attack: 10,
                defense: 8,
                health: 100
            },
            archer: {
                name: '弓箭手',
                emoji: '🏹',
                description: '远程攻击单位，攻击力高',
                attack: 15,
                defense: 4,
                health: 60
            }
        };
        
        this.trainingQueue = [];
        this.trainingInterval = null;
        this.trainingDuration = 3000;
        
        this.init();
    }
    
    init() {
        this.loadFromStorage();
        this.startTrainingProcess();
    }
    
    loadFromStorage() {
        const storage = this.game.getStorage();
        const saved = storage.getResource('soldiers');
        if (saved && typeof saved === 'object') {
            this.soldiers = { ...this.soldiers, ...saved };
        }
    }
    
    saveToStorage() {
        const storage = this.game.getStorage();
        storage.modifyResource('soldiers', 0);
        storage.resources.soldiers = { ...this.soldiers };
        storage.saveToLocalStorage();
    }
    
    startTrainingProcess() {
        if (this.trainingInterval) {
            clearInterval(this.trainingInterval);
        }
        
        this.trainingInterval = setInterval(() => {
            this.processTrainingQueue();
        }, 100);
    }
    
    processTrainingQueue() {
        if (this.trainingQueue.length === 0) return;
        
        const now = Date.now();
        const completedTrainings = this.trainingQueue.filter(item => now >= item.completeTime);
        
        completedTrainings.forEach(item => {
            this.soldiers[item.type]++;
            this.saveToStorage();
            this.showTrainingCompleteToast(item.type);
        });
        
        this.trainingQueue = this.trainingQueue.filter(item => now < item.completeTime);
        
        this.updateTrainingUI();
    }
    
    canTrain(type) {
        const cost = this.trainingCosts[type];
        if (!cost) return false;
        
        const storage = this.game.getStorage();
        return storage.hasEnoughResources(cost);
    }
    
    train(type, count = 1) {
        if (!this.trainingCosts[type]) {
            return { success: false, message: '未知兵种类型' };
        }
        
        const totalCost = {};
        Object.entries(this.trainingCosts[type]).forEach(([key, value]) => {
            totalCost[key] = value * count;
        });
        
        const storage = this.game.getStorage();
        
        if (!storage.hasEnoughResources(totalCost)) {
            return { success: false, message: '资源不足' };
        }
        
        storage.consumeResources(totalCost);
        
        const now = Date.now();
        for (let i = 0; i < count; i++) {
            this.trainingQueue.push({
                id: now + i,
                type,
                startTime: now,
                completeTime: now + this.trainingDuration
            });
        }
        
        this.updateTrainingUI();
        
        return { success: true, message: `开始训练 ${count} 名${this.soldierInfo[type].name}` };
    }
    
    getSoldierCount(type) {
        return this.soldiers[type] || 0;
    }
    
    getAllSoldiers() {
        return { ...this.soldiers };
    }
    
    getTotalSoldiers() {
        return Object.values(this.soldiers).reduce((sum, count) => sum + count, 0);
    }
    
    getTrainingCost(type) {
        return { ...this.trainingCosts[type] };
    }
    
    getSoldierInfo(type) {
        return { ...this.soldierInfo[type] };
    }
    
    getAllSoldierInfo() {
        return { ...this.soldierInfo };
    }
    
    getTrainingQueue() {
        return [...this.trainingQueue];
    }
    
    getTrainingProgress() {
        const now = Date.now();
        return this.trainingQueue.map(item => ({
            ...item,
            progress: Math.min(100, ((now - item.startTime) / this.trainingDuration) * 100)
        }));
    }
    
    getTrainingDuration() {
        return this.trainingDuration;
    }
    
    setTrainingDuration(duration) {
        this.trainingDuration = duration;
    }
    
    removeSoldier(type, count = 1) {
        if (this.soldiers[type] >= count) {
            this.soldiers[type] -= count;
            this.saveToStorage();
            return true;
        }
        return false;
    }
    
    showTrainingCompleteToast(type) {
        const info = this.soldierInfo[type];
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.background = 'rgba(59, 130, 246, 0.9)';
        toast.textContent = `✅ 训练完成！${info.emoji} ${info.name} +1`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2000);
    }
    
    updateTrainingUI() {
        const buildPanel = this.game.getBuildPanel();
        if (buildPanel && buildPanel.updateSoldierDisplay) {
            buildPanel.updateSoldierDisplay();
        }
    }
    
    renderTrainingProgress(ctx) {
        if (this.trainingQueue.length === 0) return;
        
        const progressList = this.getTrainingProgress();
        const panelX = 20;
        const panelY = 200;
        const panelWidth = 250;
        const panelHeight = 100 + progressList.length * 40;
        
        ctx.save();
        
        ctx.fillStyle = 'rgba(30, 30, 30, 0.8)';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.fill();
        
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('🏭 训练中', panelX + 10, panelY + 25);
        
        progressList.forEach((item, index) => {
            const y = panelY + 45 + index * 35;
            const info = this.soldierInfo[item.type];
            
            ctx.font = '12px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${info.emoji} ${info.name}`, panelX + 10, y);
            
            const barWidth = 200;
            const barHeight = 8;
            const barX = panelX + 10;
            const barY = y + 15;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(barX, barY, barWidth * (item.progress / 100), barHeight);
            
            ctx.fillStyle = '#9ca3af';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`${Math.round(item.progress)}%`, panelX + barWidth + 10, y + 18);
        });
        
        ctx.restore();
    }
    
    destroy() {
        if (this.trainingInterval) {
            clearInterval(this.trainingInterval);
        }
    }
}