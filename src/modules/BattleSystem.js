export class BattleSystem {
    constructor(game) {
        this.game = game;
        this.isBattling = false;
        this.currentBattle = null;
        this.battleLog = [];
        this.battleConfig = { attackInterval: 1000, damageAnimationDuration: 500 };
    }
    startBattle(destinationId, shipId) {
        const dock = this.game.getDock();
        const destination = dock.destinations[destinationId];
        const ship = dock.getShipById(shipId);
        if (!destination || !ship) return { success: false, message: "无效的目的地或船只" };
        if (!destination.requiresSoldiers) return { success: false, message: "该岛屿不需要战斗" };
        const barracks = this.game.getBarracks();
        const soldiers = barracks.getAllSoldiers();
        const totalSoldiers = barracks.getTotalSoldiers();
        if (totalSoldiers === 0) return { success: false, message: "需要至少一名士兵才能发起攻击" };
        const enemyTurrets = this.generateEnemyTurrets(destination.dangerLevel);
        const enemyResources = this.generateEnemyResources(destination);
        this.currentBattle = { destinationId, shipId, ship, destination, soldiers: { ...soldiers }, totalSoldiers, enemyTurrets, enemyResources, phase: "attacking", startTime: Date.now(), lastAttackTime: Date.now(), lootCollected: {} };
        this.isBattling = true;
        this.battleLog = [];
        this.addBattleLog("⚔️ 进攻 " + destination.emoji + " " + destination.name + "！", "system");
        this.addBattleLog("我方兵力: ⚔️步兵 " + soldiers.infantry + " 🏹弓箭手 " + soldiers.archer, "info");
        if (enemyTurrets.length > 0) this.addBattleLog("敌方防御: " + enemyTurrets.map(t => t.emoji).join(" "), "warning");
        this.game.showToast("⚔️ 战斗开始！进攻 " + destination.emoji + " " + destination.name);
        return { success: true, message: "战斗开始" };
    }
    generateEnemyTurrets(dangerLevel) {
        const turretConfigs = {
            machineGun: { emoji: "🏰", name: "堡垒炮塔", health: 150, maxHealth: 150, damage: 15, attackInterval: 1500 },
            catapult: { emoji: "🪨", name: "投石炮塔", health: 200, maxHealth: 200, damage: 30, attackInterval: 2500 },
            cannon: { emoji: "💥", name: "加农炮", health: 250, maxHealth: 250, damage: 45, attackInterval: 3000 }
        };
        const turrets = [];
        const counts = { low: 0, medium: 1, high: 2, extreme: 3 };
        const count = counts[dangerLevel] || 0;
        for (let i = 0; i < count; i++) {
            const types = dangerLevel === "extreme" ? ["machineGun", "catapult", "cannon"] : dangerLevel === "high" ? ["machineGun", "catapult"] : ["machineGun"];
            const type = types[Math.floor(Math.random() * types.length)];
            turrets.push({ id: Date.now() + i, type, ...turretConfigs[type], lastAttackTime: Date.now() + Math.random() * 1000 });
        }
        return turrets;
    }
    generateEnemyResources(destination) {
        const resources = {};
        destination.resources.forEach(resource => {
            const baseAmount = 20 + Math.floor(Math.random() * 30);
            const dangerMultiplier = destination.dangerLevel === "extreme" ? 2 : destination.dangerLevel === "high" ? 1.5 : 1;
            resources[resource] = Math.floor(baseAmount * dangerMultiplier);
        });
        return resources;
    }
    update(deltaTime) {
        if (!this.isBattling || !this.currentBattle) return;
        const now = Date.now();
        if (this.currentBattle.phase === "attacking") {
            if (now - this.currentBattle.lastAttackTime >= this.battleConfig.attackInterval) {
                this.playerAttack();
                this.currentBattle.lastAttackTime = now;
            }
            this.currentBattle.enemyTurrets.forEach(turret => {
                if (now - turret.lastAttackTime >= turret.attackInterval) {
                    this.enemyTurretAttack(turret);
                    turret.lastAttackTime = now;
                }
            });
            this.checkBattleEnd();
        } else if (this.currentBattle.phase === "looting") {
            this.continueLooting(deltaTime);
        }
    }
    playerAttack() {
        const soldiers = this.currentBattle.soldiers;
        if (soldiers.infantry === 0 && soldiers.archer === 0) return;
        const aliveTurrets = this.currentBattle.enemyTurrets.filter(t => t.health > 0);
        if (aliveTurrets.length === 0) return;
        const targetTurret = aliveTurrets[Math.floor(Math.random() * aliveTurrets.length)];
        let totalDamage = 0;
        if (soldiers.infantry > 0) totalDamage += soldiers.infantry * 10;
        if (soldiers.archer > 0) totalDamage += soldiers.archer * 15;
        targetTurret.health -= totalDamage;
        if (targetTurret.health <= 0) {
            targetTurret.health = 0;
            this.addBattleLog("💥 摧毁了敌方 " + targetTurret.emoji + " " + targetTurret.name + "！", "success");
        } else {
            this.addBattleLog("⚔️ 攻击敌方 " + targetTurret.emoji + "，造成 " + totalDamage + " 点伤害", "attack");
        }
    }
    enemyTurretAttack(turret) {
        const barracks = this.game.getBarracks();
        const soldiers = this.currentBattle.soldiers;
        if (soldiers.infantry === 0 && soldiers.archer === 0) return;
        const damage = turret.damage;
        const targetType = soldiers.infantry > 0 && (soldiers.archer === 0 || Math.random() > 0.5) ? "infantry" : "archer";
        if (soldiers[targetType] > 0) {
            const killed = Math.min(1, Math.floor(damage / (targetType === "infantry" ? 100 : 60)));
            soldiers[targetType] -= killed;
            const info = barracks.getSoldierInfo(targetType);
            this.addBattleLog("🔥 敌方 " + turret.emoji + " 反击，" + info.emoji + " " + info.name + " 伤亡 " + killed + " 人！", "damage");
        }
    }
    checkBattleEnd() {
        const aliveTurrets = this.currentBattle.enemyTurrets.filter(t => t.health > 0);
        const aliveSoldiers = this.currentBattle.soldiers.infantry + this.currentBattle.soldiers.archer;
        if (aliveTurrets.length === 0) this.startLooting();
        else if (aliveSoldiers === 0) this.loseBattle();
    }
    startLooting() {
        this.currentBattle.phase = "looting";
        this.currentBattle.lootStartTime = Date.now();
        this.currentBattle.lootDuration = 3000;
        this.addBattleLog("🎉 战斗胜利！开始掠夺资源...", "success");
        this.game.showToast("🎉 战斗胜利！开始掠夺资源");
    }
    continueLooting(deltaTime) {
        const elapsed = Date.now() - this.currentBattle.lootStartTime;
        const progress = Math.min(1, elapsed / this.currentBattle.lootDuration);
        if (progress >= 1) this.completeLooting();
    }
    completeLooting() {
        const enemyResources = this.currentBattle.enemyResources;
        const ship = this.currentBattle.ship;
        const capacity = ship.cargoSpace;
        let totalLooted = 0;
        const lootedResources = {};
        Object.entries(enemyResources).forEach(([resource, amount]) => {
            const lootAmount = Math.floor(amount * (0.5 + Math.random() * 0.5));
            const actualAmount = Math.min(lootAmount, capacity - totalLooted);
            if (actualAmount > 0) {
                lootedResources[resource] = actualAmount;
                totalLooted += actualAmount;
            }
        });
        this.currentBattle.lootCollected = lootedResources;
        this.addBattleLog("💰 掠夺完成！", "success");
        Object.entries(lootedResources).forEach(([resource, amount]) => {
            const info = this.game.getStorage().getResourceInfo(resource);
            this.addBattleLog("  " + (info?.emoji || "❓") + " " + (info?.name || resource) + ": +" + amount, "loot");
        });
        this.endBattle(true);
    }
    loseBattle() {
        this.addBattleLog("💀 全军覆没，战斗失败！", "danger");
        this.game.showToast("💀 战斗失败！全军覆没");
        this.endBattle(false);
    }
    endBattle(victory) {
        const dock = this.game.getDock();
        if (victory) {
            const storage = this.game.getStorage();
            Object.entries(this.currentBattle.lootCollected).forEach(([resource, amount]) => {
                storage.modifyResource(resource, amount);
            });
            dock.completeSail(this.currentBattle.destinationId, this.currentBattle.shipId);
            let rewardText = "🏆 胜利返航！获得战利品：";
            Object.entries(this.currentBattle.lootCollected).forEach(([resource, amount]) => {
                const info = storage.getResourceInfo(resource);
                rewardText += " " + (info?.emoji || "❓") + " " + (info?.name || resource) + " x" + amount;
            });
            this.game.showToast(rewardText);
        } else {
            const ship = this.currentBattle.ship;
            ship.isDocked = true;
            ship.currentDestination = null;
            dock.isSailing = false;
            dock.sailStartTime = null;
            dock.currentDestination = null;
            this.game.showToast("💀 战败返航，损失惨重");
        }
        const barracks = this.game.getBarracks();
        barracks.soldiers = { ...this.currentBattle.soldiers };
        barracks.saveToStorage();
        this.isBattling = false;
        this.currentBattle = null;
        this.battleLog = [];
    }
    addBattleLog(message, type = "info") {
        this.battleLog.push({ message, type, timestamp: Date.now() });
        if (this.battleLog.length > 50) this.battleLog.shift();
    }
    getBattleLog() { return [...this.battleLog]; }
    isActive() { return this.isBattling; }
    getCurrentBattle() { return this.currentBattle ? { ...this.currentBattle } : null; }
    renderBattleUI(ctx) {
        if (!this.isBattling || !this.currentBattle) return;
        const panelX = this.game.renderer.width - 280;
        const panelY = 20;
        const panelWidth = 260;
        const panelHeight = Math.min(300, 100 + this.currentBattle.enemyTurrets.length * 20);
        ctx.save();
        ctx.fillStyle = "rgba(30, 30, 30, 0.9)";
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.fill();
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("⚔️ " + this.currentBattle.destination.emoji + " 战斗中", panelX + panelWidth / 2, panelY + 25);
        const soldiersY = panelY + 45;
        ctx.font = "12px Arial";
        ctx.textAlign = "left";
        ctx.fillStyle = "#4ade80";
        ctx.fillText("我方士兵: ⚔️" + this.currentBattle.soldiers.infantry + " 🏹" + this.currentBattle.soldiers.archer, panelX + 10, soldiersY);
        const aliveTurrets = this.currentBattle.enemyTurrets.filter(t => t.health > 0);
        if (aliveTurrets.length > 0) {
            ctx.fillStyle = "#ef4444";
            ctx.fillText("敌方炮塔: " + aliveTurrets.length + " 座", panelX + 10, soldiersY + 18);
            aliveTurrets.forEach((turret, index) => {
                const barX = panelX + 10;
                const barY = soldiersY + 35 + index * 18;
                const barWidth = 220;
                const barHeight = 6;
                ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
                ctx.fillRect(barX, barY, barWidth, barHeight);
                const healthPercent = turret.health / turret.maxHealth;
                ctx.fillStyle = healthPercent > 0.5 ? "#ef4444" : healthPercent > 0.25 ? "#eab308" : "#22c55e";
                ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
                ctx.fillStyle = "#ffffff";
                ctx.font = "11px Arial";
                ctx.fillText(turret.emoji + " " + Math.round(healthPercent * 100) + "%", barX + 5, barY - 3);
            });
        } else if (this.currentBattle.phase === "looting") {
            ctx.fillStyle = "#fbbf24";
            ctx.fillText("正在掠夺资源...", panelX + 10, soldiersY + 18);
            const elapsed = Date.now() - this.currentBattle.lootStartTime;
            const progress = Math.min(1, elapsed / this.currentBattle.lootDuration);
            const barX = panelX + 10;
            const barY = soldiersY + 35;
            const barWidth = 220;
            const barHeight = 8;
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = "#fbbf24";
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);
            ctx.fillStyle = "#9ca3af";
            ctx.font = "10px Arial";
            ctx.textAlign = "right";
            ctx.fillText(Math.round(progress * 100) + "%", panelX + panelWidth - 15, barY + 12);
        }
        ctx.restore();
    }
    
    renderBattleLog(ctx) {
        if (!this.isBattling || !this.currentBattle || this.battleLog.length === 0) return;
        
        const panelX = 20;
        const panelY = 320;
        const panelWidth = 260;
        const panelHeight = 180;
        
        ctx.save();
        
        ctx.fillStyle = 'rgba(30, 30, 30, 0.9)';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.fill();
        
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📜 战斗日志', panelX + panelWidth / 2, panelY + 20);
        
        const logY = panelY + 35;
        const lineHeight = 16;
        const visibleLogs = this.battleLog.slice(-8);
        
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        
        visibleLogs.forEach((log, index) => {
            const y = logY + index * lineHeight;
            
            let color = '#9ca3af';
            if (log.type === 'system') color = '#3b82f6';
            else if (log.type === 'success') color = '#22c55e';
            else if (log.type === 'danger') color = '#ef4444';
            else if (log.type === 'warning') color = '#eab308';
            else if (log.type === 'attack') color = '#6366f1';
            else if (log.type === 'damage') color = '#f97316';
            else if (log.type === 'loot') color = '#fbbf24';
            
            ctx.fillStyle = color;
            ctx.fillText(log.message, panelX + 8, y);
        });
        
        ctx.restore();
    }
}