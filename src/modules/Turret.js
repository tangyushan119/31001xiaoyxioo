export class Turret {
    constructor(game, x, y, type) {
        this.game = game;
        this.id = Date.now() + Math.random();
        this.x = x;
        this.y = y;
        this.type = type;
        
        this.config = this.getTurretConfig(type);
        
        this.size = this.config.size;
        this.emoji = this.config.emoji;
        this.name = this.config.name;
        
        this.health = this.config.health;
        this.maxHealth = this.config.health;
        
        this.attackRange = this.config.attackRange;
        this.attackDamage = this.config.attackDamage;
        this.attackInterval = this.config.attackInterval;
        this.attackTimer = 0;
        
        this.target = null;
        this.isAttacking = false;
        
        this.projectiles = [];
        this.damageNumbers = [];
    }
    
    getTurretConfig(type) {
        const configs = {
            machineGun: {
                name: '机枪炮塔',
                emoji: '🔫',
                size: 45,
                health: 150,
                attackRange: 180,
                attackDamage: 15,
                attackInterval: 0.3,
                projectileSpeed: 8,
                projectileColor: '#ff4444',
                projectileSize: 5,
                bulletSpread: 0.15
            },
            catapult: {
                name: '投石炮塔',
                emoji: '🪨',
                size: 55,
                health: 200,
                attackRange: 250,
                attackDamage: 45,
                attackInterval: 1.5,
                projectileSpeed: 4,
                projectileColor: '#8b7355',
                projectileSize: 12,
                bulletSpread: 0
            }
        };
        
        return configs[type] || configs.machineGun;
    }
    
    update(deltaTime) {
        this.attackTimer += deltaTime;
        
        this.findTarget();
        this.updateProjectiles(deltaTime);
        this.updateDamageNumbers(deltaTime);
        
        if (this.target && !this.target.isDead && this.isInRange(this.target)) {
            if (this.attackTimer >= this.attackInterval) {
                this.attackTimer = 0;
                this.attack();
            }
        }
    }
    
    findTarget() {
        const enemies = this.game.enemyManager.getEnemies();
        
        if (enemies.length === 0) {
            this.target = null;
            return;
        }
        
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        
        enemies.forEach(enemy => {
            if (enemy.isDead) return;
            
            const distance = this.getDistance(enemy.x, enemy.y);
            if (distance <= this.attackRange && distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        });
        
        this.target = nearestEnemy;
    }
    
    isInRange(enemy) {
        return this.getDistance(enemy.x, enemy.y) <= this.attackRange;
    }
    
    getDistance(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    attack() {
        if (!this.target || this.target.isDead) return;
        
        this.isAttacking = true;
        
        if (this.type === 'machineGun') {
            this.fireBullets();
        } else {
            this.launchProjectile();
        }
        
        setTimeout(() => {
            this.isAttacking = false;
        }, 200);
    }
    
    fireBullets() {
        const bulletCount = 3;
        const target = this.target;
        
        for (let i = 0; i < bulletCount; i++) {
            setTimeout(() => {
                if (!target || target.isDead) return;
                
                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const angle = Math.atan2(dy, dx);
                
                const spread = (Math.random() - 0.5) * this.config.bulletSpread * 2;
                
                const projectile = {
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle + spread) * this.config.projectileSpeed,
                    vy: Math.sin(angle + spread) * this.config.projectileSpeed,
                    color: this.config.projectileColor,
                    size: this.config.projectileSize,
                    damage: Math.floor(this.config.attackDamage / bulletCount)
                };
                
                this.projectiles.push(projectile);
            }, i * 50);
        }
    }
    
    launchProjectile() {
        if (!this.target || this.target.isDead) return;
        
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const projectile = {
            x: this.x,
            y: this.y,
            vx: (dx / distance) * this.config.projectileSpeed,
            vy: (dy / distance) * this.config.projectileSpeed,
            color: this.config.projectileColor,
            size: this.config.projectileSize,
            damage: this.config.attackDamage,
            isCatapult: true,
            startY: this.y,
            arcHeight: -80
        };
        
        this.projectiles.push(projectile);
    }
    
    updateProjectiles(deltaTime) {
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.x += projectile.vx * deltaTime * 60;
            projectile.y += projectile.vy * deltaTime * 60;
            
            if (projectile.isCatapult) {
                projectile.vy += 0.3 * deltaTime * 60;
            }
            
            const enemies = this.game.enemyManager.getEnemies();
            for (const enemy of enemies) {
                if (enemy.isDead) continue;
                
                const dist = Math.sqrt(
                    Math.pow(projectile.x - enemy.x, 2) + 
                    Math.pow(projectile.y - enemy.y, 2)
                );
                
                if (dist < enemy.size / 2 + projectile.size) {
                    enemy.takeDamage(projectile.damage);
                    this.showDamageNumber(enemy.x, enemy.y, projectile.damage);
                    return false;
                }
            }
            
            const maxDist = this.attackRange + 50;
            const distFromTurret = Math.sqrt(
                Math.pow(projectile.x - this.x, 2) + 
                Math.pow(projectile.y - this.y, 2)
            );
            
            return distFromTurret < maxDist;
        });
    }
    
    updateDamageNumbers(deltaTime) {
        this.damageNumbers = this.damageNumbers.filter(dmg => {
            dmg.y -= 30 * deltaTime;
            dmg.alpha -= 2 * deltaTime;
            dmg.scale += 0.5 * deltaTime;
            return dmg.alpha > 0;
        });
    }
    
    showDamageNumber(x, y, damage) {
        this.damageNumbers.push({
            x,
            y,
            damage,
            alpha: 1,
            scale: 1,
            color: '#ff6b6b'
        });
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.destroy();
        }
    }
    
    destroy() {
        this.game.storage.removeBuilding(this.id);
        this.game.showToast(`💥 ${this.name} 被摧毁了！`);
    }
    
    render(ctx) {
        ctx.save();
        
        this.drawShadow(ctx);
        
        const pulseScale = this.isAttacking ? 1.1 : 1;
        ctx.font = `${this.size * 0.8 * pulseScale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (this.isAttacking) {
            ctx.shadowColor = '#ff4444';
            ctx.shadowBlur = 15;
        }
        
        ctx.fillText(this.emoji, this.x, this.y);
        
        ctx.restore();
        
        this.drawAttackRange(ctx);
        this.drawProjectiles(ctx);
        this.drawDamageNumbers(ctx);
        this.drawHealthBar(ctx);
    }
    
    drawShadow(ctx) {
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.size * 0.3, this.size * 0.4, this.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawAttackRange(ctx) {
        const buildings = this.game.storage.getBuildings();
        const isSelected = buildings.some(b => b.selected && b.id === this.id);
        
        if (!isSelected && !this.target) return;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.attackRange, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }
    
    drawProjectiles(ctx) {
        this.projectiles.forEach(projectile => {
            ctx.save();
            
            if (projectile.isCatapult) {
                ctx.fillStyle = '#8b7355';
                ctx.beginPath();
                ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#6b5344';
                ctx.beginPath();
                ctx.arc(projectile.x - 3, projectile.y - 3, projectile.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = projectile.color;
                ctx.shadowColor = projectile.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }
    
    drawDamageNumbers(ctx) {
        this.damageNumbers.forEach(dmg => {
            ctx.save();
            ctx.globalAlpha = dmg.alpha;
            ctx.font = `${18 * dmg.scale}px Arial`;
            ctx.fillStyle = dmg.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`-${dmg.damage}`, dmg.x, dmg.y);
            ctx.restore();
        });
    }
    
    drawHealthBar(ctx) {
        if (this.health >= this.maxHealth) return;
        
        const barWidth = this.size * 1.2;
        const barHeight = 5;
        const barY = this.y - this.size / 2 - 12;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        const gradient = ctx.createLinearGradient(
            this.x - barWidth / 2, barY,
            this.x + barWidth / 2, barY
        );
        
        if (healthPercent > 0.6) {
            gradient.addColorStop(0, '#22c55e');
            gradient.addColorStop(1, '#4ade80');
        } else if (healthPercent > 0.3) {
            gradient.addColorStop(0, '#eab308');
            gradient.addColorStop(1, '#facc15');
        } else {
            gradient.addColorStop(0, '#ef4444');
            gradient.addColorStop(1, '#f87171');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barWidth / 2, barY, barWidth, barHeight);
    }
    
    getPosition() {
        return { x: this.x, y: this.y };
    }
    
    getSize() {
        return this.size;
    }
    
    getType() {
        return this.type;
    }
}