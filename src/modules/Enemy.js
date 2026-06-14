export class Enemy {
    constructor(game, x, y) {
        this.game = game;
        this.id = Date.now() + Math.random();
        this.x = x;
        this.y = y;
        this.size = 30;
        this.speed = 1.5;
        this.health = 100;
        this.maxHealth = 100;
        this.direction = 'up';
        this.animationFrame = 0;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.target = null;
        
        this.emoji = '👹';
        this.type = 'goblin';
    }

    update(deltaTime) {
        this.animationFrame += deltaTime * 8;
        this.attackCooldown -= deltaTime;
        
        this.findTarget();
        this.moveToTarget(deltaTime);
    }

    findTarget() {
        if (!this.target || !this.isTargetValid()) {
            this.target = this.getNearestTarget();
        } else {
            const newTarget = this.getNearestTarget();
            if (newTarget && newTarget.distance < this.target.distance) {
                this.target = newTarget;
            }
        }
    }

    isTargetValid() {
        if (!this.target) return false;
        
        if (this.target.type === 'building') {
            const building = this.game.storage.getBuildingById(this.target.id);
            return building && building.health > 0;
        }
        
        return false;
    }

    getNearestTarget() {
        const targets = [];
        
        const buildings = this.game.storage.getBuildings();
        buildings.forEach(building => {
            if (building.health > 0) {
                const dx = building.x - this.x;
                const dy = building.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                targets.push({ type: 'building', id: building.id, x: building.x, y: building.y, distance });
            }
        });
        
        targets.sort((a, b) => a.distance - b.distance);
        return targets[0] || null;
    }

    getPlotPosition(plot) {
        const landRenderer = this.game.terrain.landRenderer;
        const x = landRenderer.farmOffsetX + plot.col * (landRenderer.plotSize + landRenderer.plotGap) + landRenderer.plotSize / 2;
        const y = landRenderer.farmOffsetY + plot.row * (landRenderer.plotSize + landRenderer.plotGap) + landRenderer.plotSize / 2;
        return { x, y };
    }

    getIslandCenterAsTarget() {
        const center = this.game.terrain.getIslandCenter();
        return { type: 'center', id: 'center', x: center.x, y: center.y, distance: 0 };
    }

    moveToTarget(deltaTime) {
        if (!this.target) {
            return;
        }
        
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 30) {
            this.attack();
            return;
        }
        
        const moveSpeed = this.speed * deltaTime * 60;
        this.x += (dx / distance) * moveSpeed;
        this.y += (dy / distance) * moveSpeed;
        
        this.updateDirection(dx, dy);
    }

    updateDirection(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
    }

    attack() {
        if (this.attackCooldown > 0) return;
        
        this.isAttacking = true;
        this.attackCooldown = 1;
        
        if (this.target.type === 'building') {
            this.game.storage.damageBuilding(this.target.id, 20);
            this.game.showToast(`💥 敌军正在攻击建筑！`);
        } else if (this.target.type === 'farm') {
            this.game.storage.destroyCrop(this.target.id);
            this.game.showToast(`👣 敌军踩踏了作物！`);
        }
        
        setTimeout(() => { this.isAttacking = false; }, 300);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.game.resourceManager.addResource('gold', 10);
        this.game.showToast(`💰 击杀敌军获得 10 金币！`);
        this.game.enemyManager.removeEnemy(this.id);
    }

    isOnIsland() {
        return this.game.terrain.isOnIsland(this.x, this.y);
    }

    render(ctx) {
        ctx.save();
        
        this.applyRotation(ctx);
        
        this.drawShadow(ctx);
        this.drawBody(ctx);
        
        ctx.restore();
        
        this.drawHealthBar(ctx);
    }

    applyRotation(ctx) {
        const pivotX = this.x;
        const pivotY = this.y;
        
        ctx.translate(pivotX, pivotY);
        
        switch (this.direction) {
            case 'up':
                ctx.rotate(0);
                break;
            case 'right':
                ctx.rotate(Math.PI / 2);
                break;
            case 'down':
                ctx.rotate(Math.PI);
                break;
            case 'left':
                ctx.rotate(-Math.PI / 2);
                break;
        }
        
        ctx.translate(-pivotX, -pivotY);
    }

    drawShadow(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.size * 0.4, this.size * 0.35, this.size * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBody(ctx) {
        ctx.font = `${this.size * 0.9}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (this.isAttacking) {
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 10;
            ctx.font = `${this.size * 1.1}px Arial`;
        }
        
        ctx.fillText(this.emoji, this.x, this.y);
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }

    drawHealthBar(ctx) {
        const barWidth = this.size * 1.5;
        const barHeight = 4;
        const barY = this.y - this.size / 2 - 8;
        
        ctx.fillStyle = '#333';
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
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    getSize() {
        return this.size;
    }
}