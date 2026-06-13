export class Player {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.size = 35;
        this.speed = 5;
        this.direction = 'down';
        this.animationFrame = 0;
        this.isMoving = false;
        
        this.eyeBlink = 0;
        this.isBlinking = false;
        
        this.init();
    }

    init() {
        const savedPos = this.game.storage.getPlayerPosition();
        if (savedPos) {
            this.x = savedPos.x;
            this.y = savedPos.y;
        } else {
            const center = this.game.terrain.getIslandCenter();
            this.x = center.x;
            this.y = center.y;
        }
    }

    update(deltaTime) {
        this.handleMovement();
        this.animationFrame += deltaTime * 12;
        this.eyeBlink += deltaTime;
        
        if (this.eyeBlink > 4 && !this.isBlinking) {
            this.isBlinking = true;
            setTimeout(() => { this.isBlinking = false; }, 200);
            this.eyeBlink = 0;
        }
    }

    handleMovement() {
        const keys = this.game.input.keys;
        let dx = 0;
        let dy = 0;

        if (keys['ArrowUp'] || keys['KeyW']) {
            dy -= this.speed;
            this.direction = 'up';
        }
        if (keys['ArrowDown'] || keys['KeyS']) {
            dy += this.speed;
            this.direction = 'down';
        }
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
                this.game.storage.savePlayerPosition(this.x, this.y);
            }
        } else {
            this.isMoving = false;
        }
    }

    render(ctx) {
        ctx.save();
        
        this.applyRotation(ctx);
        
        this.drawShadow(ctx);
        this.drawBody(ctx);
        this.drawHead(ctx);
        this.drawArms(ctx);
        this.drawLegs(ctx);
        
        ctx.restore();
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
        ctx.ellipse(this.x, this.y + this.size * 0.5, this.size * 0.4, this.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBody(ctx) {
        const bodyWidth = this.size * 0.4;
        const bodyHeight = this.size * 0.6;
        const bodyY = this.y + this.size * 0.15;
        
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.roundRect(this.x - bodyWidth / 2, bodyY, bodyWidth, bodyHeight, 5);
        ctx.fill();
        
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        ctx.roundRect(this.x - bodyWidth / 2 + 3, bodyY + 3, bodyWidth - 6, bodyHeight - 6, 3);
        ctx.fill();
        
        ctx.fillStyle = '#1a5276';
        ctx.beginPath();
        ctx.arc(this.x, bodyY + bodyHeight * 0.3, bodyWidth * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHead(ctx) {
        const headRadius = this.size * 0.28;
        const headY = this.y - this.size * 0.15;
        
        ctx.fillStyle = '#f5cba7';
        ctx.beginPath();
        ctx.arc(this.x, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#e8b89d';
        ctx.beginPath();
        ctx.arc(this.x, headY - headRadius * 0.1, headRadius * 0.9, 0, Math.PI * 2);
        ctx.fill();
        
        this.drawEyes(ctx, headY, headRadius);
        this.drawMouth(ctx, headY, headRadius);
        this.drawHair(ctx, headY, headRadius);
    }

    drawEyes(ctx, headY, headRadius) {
        const eyeOffsetX = headRadius * 0.35;
        const eyeOffsetY = headRadius * 0.1;
        
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(this.x - eyeOffsetX, headY - eyeOffsetY, headRadius * 0.15, 0, Math.PI * 2);
        ctx.arc(this.x + eyeOffsetX, headY - eyeOffsetY, headRadius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        if (!this.isBlinking) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x - eyeOffsetX + 2, headY - eyeOffsetY - 2, 4, 0, Math.PI * 2);
            ctx.arc(this.x + eyeOffsetX + 2, headY - eyeOffsetY - 2, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawMouth(ctx, headY, headRadius) {
        const mouthOffsetY = headRadius * 0.25;
        const mouthWidth = headRadius * 0.3;
        
        ctx.strokeStyle = '#d4a574';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        if (this.isMoving) {
            ctx.arc(this.x, headY + mouthOffsetY, mouthWidth, 0.1 * Math.PI, 0.9 * Math.PI);
        } else {
            ctx.moveTo(this.x - mouthWidth, headY + mouthOffsetY);
            ctx.lineTo(this.x + mouthWidth, headY + mouthOffsetY);
        }
        
        ctx.stroke();
    }

    drawHair(ctx, headY, headRadius) {
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.arc(this.x, headY - headRadius * 0.15, headRadius * 1.1, Math.PI, 0);
        ctx.fill();
        
        ctx.fillStyle = '#654321';
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.arc(this.x + i * 5, headY - headRadius * 0.3, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawArms(ctx) {
        const bodyY = this.y + this.size * 0.15;
        const armLength = this.size * 0.4;
        const armWidth = this.size * 0.1;
        
        const swingOffset = this.isMoving ? Math.sin(this.animationFrame) * 15 : 0;
        
        ctx.fillStyle = '#f5cba7';
        
        ctx.save();
        ctx.translate(this.x - this.size * 0.18, bodyY + this.size * 0.1);
        ctx.rotate((-Math.PI / 6) + (swingOffset * 0.03));
        ctx.beginPath();
        ctx.roundRect(-armWidth / 2, 0, armWidth, armLength, 5);
        ctx.fill();
        ctx.restore();
        
        ctx.save();
        ctx.translate(this.x + this.size * 0.18, bodyY + this.size * 0.1);
        ctx.rotate((Math.PI / 6) - (swingOffset * 0.03));
        ctx.beginPath();
        ctx.roundRect(-armWidth / 2, 0, armWidth, armLength, 5);
        ctx.fill();
        ctx.restore();
        
        this.drawHands(ctx, bodyY, armLength, swingOffset);
    }

    drawHands(ctx, bodyY, armLength, swingOffset) {
        const handSize = this.size * 0.12;
        
        ctx.fillStyle = '#f8d4bc';
        
        ctx.beginPath();
        const leftHandX = this.x - this.size * 0.18 + Math.sin(-Math.PI / 6 + swingOffset * 0.03) * armLength;
        const leftHandY = bodyY + this.size * 0.1 + Math.cos(-Math.PI / 6 + swingOffset * 0.03) * armLength;
        ctx.arc(leftHandX, leftHandY, handSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        const rightHandX = this.x + this.size * 0.18 + Math.sin(Math.PI / 6 - swingOffset * 0.03) * armLength;
        const rightHandY = bodyY + this.size * 0.1 + Math.cos(Math.PI / 6 - swingOffset * 0.03) * armLength;
        ctx.arc(rightHandX, rightHandY, handSize, 0, Math.PI * 2);
        ctx.fill();
    }

    drawLegs(ctx) {
        const bodyY = this.y + this.size * 0.15;
        const bodyHeight = this.size * 0.6;
        const legY = bodyY + bodyHeight;
        const legWidth = this.size * 0.12;
        const legLength = this.size * 0.5;
        
        const legOffset = this.isMoving ? Math.sin(this.animationFrame) * 8 : 0;
        
        ctx.fillStyle = '#2c3e50';
        
        ctx.beginPath();
        ctx.roundRect(this.x - legWidth - 3, legY, legWidth, legLength, 5);
        ctx.fill();
        
        ctx.beginPath();
        ctx.roundRect(this.x + 3, legY, legWidth, legLength, 5);
        ctx.fill();
        
        this.drawFeet(ctx, legY, legLength, legOffset);
    }

    drawFeet(ctx, legY, legLength, legOffset) {
        const footWidth = this.size * 0.18;
        const footHeight = this.size * 0.08;
        const footY = legY + legLength - footHeight;
        
        ctx.fillStyle = '#8b4513';
        
        ctx.beginPath();
        ctx.roundRect(this.x - footWidth - 3, footY + legOffset, footWidth, footHeight, 3);
        ctx.fill();
        
        ctx.beginPath();
        ctx.roundRect(this.x + 3, footY - legOffset, footWidth, footHeight, 3);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.roundRect(this.x - footWidth - 2, footY + legOffset + 2, footWidth - 2, footHeight - 4, 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.roundRect(this.x + 4, footY - legOffset + 2, footWidth - 2, footHeight - 4, 2);
        ctx.fill();
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    setPosition(x, y) {
        if (this.game.terrain.isOnIsland(x, y)) {
            this.x = x;
            this.y = y;
            this.game.storage.savePlayerPosition(x, y);
        }
    }

    getSize() {
        return this.size;
    }

    getDirection() {
        return this.direction;
    }
}