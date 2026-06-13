export class Player {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.size = 30;
        this.speed = 5;
        this.direction = 'right';
        this.animationFrame = 0;
        this.isMoving = false;
        
        this.init();
    }

    init() {
        const center = this.game.terrain.getIslandCenter();
        this.x = center.x;
        this.y = center.y;
    }

    update(deltaTime) {
        this.handleMovement();
        this.animationFrame += deltaTime * 10;
    }

    handleMovement() {
        const keys = this.game.input.keys;
        let dx = 0;
        let dy = 0;

        if (keys['ArrowUp'] || keys['KeyW']) dy -= this.speed;
        if (keys['ArrowDown'] || keys['KeyS']) dy += this.speed;
        if (keys['ArrowLeft'] || keys['KeyA']) {
            dx -= this.speed;
            this.direction = 'left';
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            dx += this.speed;
            this.direction = 'right';
        }

        if (dx !== 0 || dy !== 0) {
            this.isMoving = true;
            const newX = this.x + dx;
            const newY = this.y + dy;
            
            if (this.game.terrain.isOnIsland(newX, newY)) {
                this.x = newX;
                this.y = newY;
            }
        } else {
            this.isMoving = false;
        }
    }

    render(ctx) {
        ctx.save();
        
        if (this.direction === 'left') {
            ctx.translate(this.x + this.size, this.y);
            ctx.scale(-1, 1);
            ctx.translate(-this.x, -this.y);
        }

        this.drawBody(ctx);
        this.drawHead(ctx);
        this.drawLegs(ctx);
        
        ctx.restore();
    }

    drawBody(ctx) {
        ctx.fillStyle = '#3498db';
        ctx.fillRect(this.x - 10, this.y + 15, 20, 25);
    }

    drawHead(ctx) {
        ctx.fillStyle = '#f5cba7';
        ctx.beginPath();
        ctx.arc(this.x, this.y + 5, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y + 3, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 4, this.y + 3, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#f5cba7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y + 7, 4, 0, Math.PI);
        ctx.stroke();
    }

    drawLegs(ctx) {
        const legOffset = this.isMoving ? Math.sin(this.animationFrame) * 5 : 0;
        
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(this.x - 8, this.y + 38, 6, 15);
        ctx.fillRect(this.x + 2, this.y + 38, 6, 15);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - 8, this.y + 50 + legOffset, 6, 4);
        ctx.fillRect(this.x + 2, this.y + 50 - legOffset, 6, 4);
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    setPosition(x, y) {
        if (this.game.terrain.isOnIsland(x, y)) {
            this.x = x;
            this.y = y;
        }
    }

    getSize() {
        return this.size;
    }
}