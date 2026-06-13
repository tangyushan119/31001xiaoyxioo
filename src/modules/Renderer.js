export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 600;
        this.height = 600;
        this.game = null;
        
        this.init();
    }

    init() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    setGame(game) {
        this.game = game;
    }

    render() {
        this.clear();
        this.renderTerrain();
        this.renderBuildings();
        this.renderPlayer();
        this.renderUI();
    }

    clear() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    renderTerrain() {
        if (this.game && this.game.terrain) {
            this.game.terrain.render();
        }
    }

    renderBuildings() {
        if (!this.game || !this.game.storage) return;
        
        const buildings = this.game.storage.getBuildings();
        buildings.forEach(building => {
            this.renderBuilding(building);
        });
    }

    renderBuilding(building) {
        const centerX = building.x;
        const centerY = building.y;
        const size = building.size;
        
        this.ctx.save();
        
        this.ctx.font = `${size * 0.8}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(building.emoji, centerX, centerY);
        
        this.ctx.restore();
    }

    renderPlayer() {
        if (this.game && this.game.player) {
            this.game.player.render(this.ctx);
        }
    }

    renderUI() {
        this.renderGrid();
    }

    renderGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 30;
        
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    drawCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
    }

    drawText(text, x, y, color = '#ffffff', fontSize = 16) {
        this.ctx.save();
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    getWidth() {
        return this.width;
    }

    getHeight() {
        return this.height;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
    }
}