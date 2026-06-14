import { Enemy } from './Enemy.js';

export class EnemyManager {
    constructor(game) {
        this.game = game;
        this.enemies = [];
        this.invasionInterval = null;
        this.lastInvasionTime = 0;
        this.invasionCooldown = 30000;
        this.invasionWarningTime = 5000;
        this.isWarning = false;
        this.waveNumber = 0;
        
        this.init();
    }

    init() {
        this.startInvasionCycle();
    }

    startInvasionCycle() {
        this.invasionInterval = setInterval(() => {
            this.update();
        }, 1000);
    }

    update() {
        const now = Date.now();
        const timeSinceLastInvasion = now - this.lastInvasionTime;
        
        if (timeSinceLastInvasion >= this.invasionCooldown - this.invasionWarningTime && !this.isWarning) {
            this.startWarning();
        }
        
        if (timeSinceLastInvasion >= this.invasionCooldown) {
            this.triggerInvasion();
        }
    }

    startWarning() {
        this.isWarning = true;
        this.game.showToast(`⚠️ 敌军即将入侵！准备防御！`);
        
        setTimeout(() => {
            this.game.showToast(`⚔️ 敌军正在靠近海滩！`);
        }, 2000);
    }

    triggerInvasion() {
        this.waveNumber++;
        this.lastInvasionTime = Date.now();
        this.isWarning = false;
        
        const enemyCount = Math.min(3 + this.waveNumber, 10);
        
        this.game.showToast(`💀 第 ${this.waveNumber} 波敌军来袭！(${enemyCount} 个敌人)`);
        
        for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => {
                this.spawnEnemy();
            }, i * 500);
        }
        
        this.adjustInvasionCooldown();
    }

    adjustInvasionCooldown() {
        this.invasionCooldown = Math.max(15000, 30000 - this.waveNumber * 2000);
    }

    spawnEnemy() {
        const spawnPoint = this.getRandomBeachPosition();
        const enemy = new Enemy(this.game, spawnPoint.x, spawnPoint.y);
        this.enemies.push(enemy);
        
        this.game.showToast(`👹 敌军登陆了！`);
    }

    getRandomBeachPosition() {
        const terrain = this.game.terrain;
        const center = terrain.getIslandCenter();
        const beachRadius = terrain.getBeachOuterRadius();
        
        const angle = Math.random() * Math.PI * 2;
        const distance = terrain.getLandRadius() + Math.random() * (beachRadius - terrain.getLandRadius());
        
        return {
            x: center.x + Math.cos(angle) * distance,
            y: center.y + Math.sin(angle) * distance
        };
    }

    updateEnemies(deltaTime) {
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime);
        });
        
        this.removeOffIslandEnemies();
    }

    removeOffIslandEnemies() {
        this.enemies = this.enemies.filter(enemy => {
            if (!enemy.isOnIsland()) {
                return false;
            }
            return true;
        });
    }

    removeEnemy(enemyId) {
        this.enemies = this.enemies.filter(e => e.id !== enemyId);
    }

    renderEnemies(ctx) {
        this.enemies.forEach(enemy => {
            enemy.render(ctx);
        });
    }

    getEnemies() {
        return [...this.enemies];
    }

    getEnemyCount() {
        return this.enemies.length;
    }

    getWaveNumber() {
        return this.waveNumber;
    }

    getTimeUntilNextInvasion() {
        const now = Date.now();
        const timeSinceLast = now - this.lastInvasionTime;
        const remaining = Math.max(0, this.invasionCooldown - timeSinceLast);
        return remaining;
    }

    takeDamageToEnemy(enemyId, amount) {
        const enemy = this.enemies.find(e => e.id === enemyId);
        if (enemy) {
            enemy.takeDamage(amount);
        }
    }

    clearAllEnemies() {
        this.enemies = [];
    }

    stop() {
        if (this.invasionInterval) {
            clearInterval(this.invasionInterval);
            this.invasionInterval = null;
        }
        this.clearAllEnemies();
    }

    reset() {
        this.stop();
        this.waveNumber = 0;
        this.lastInvasionTime = 0;
        this.invasionCooldown = 30000;
        this.isWarning = false;
        this.init();
    }
}