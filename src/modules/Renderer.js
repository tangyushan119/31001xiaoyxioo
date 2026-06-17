export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 800;
        this.height = 600;
        this.game = null;
        this.sprites = {};
        this.isLoaded = false;
        this.loadedCount = 0;
        this.totalSprites = 3;
        
        this.init();
    }

    init() {
        this.resizeToFit();
        this.loadSprites();
        this.setupResizeListener();
    }

    setupResizeListener() {
        window.addEventListener('resize', () => {
            this.resizeToFit();
            if (this.game && this.game.terrain) {
                this.game.terrain.updateDimensions();
            }
        });
    }

    resizeToFit() {
        const container = this.canvas.parentElement;
        const padding = 250;
        this.width = container.clientWidth - padding;
        this.height = container.clientHeight;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    loadSprites() {
        const spriteList = [
            { name: 'grass', path: this.createGrassPattern() },
            { name: 'water', path: this.createWaterPattern() },
            { name: 'beach', path: this.createBeachPattern() }
        ];

        spriteList.forEach(sprite => {
            const img = new Image();
            img.onload = () => {
                this.sprites[sprite.name] = img;
                this.loadedCount++;
                if (this.loadedCount >= this.totalSprites) {
                    this.isLoaded = true;
                }
            };
            img.onerror = () => {
                this.sprites[sprite.name] = null;
                this.loadedCount++;
            };
            img.src = sprite.path;
        });
    }

    createGrassPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        const colors = ['#2ecc71', '#27ae60', '#229954', '#1e8449'];
        for (let i = 0; i < 32; i += 4) {
            for (let j = 0; j < 32; j += 4) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                ctx.fillStyle = color;
                ctx.fillRect(i, j, 4, 4);
            }
        }
        return canvas.toDataURL();
    }

    createWaterPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, 32, 32);
        gradient.addColorStop(0, '#3498db');
        gradient.addColorStop(0.5, '#2980b9');
        gradient.addColorStop(1, '#2c3e50');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 32;
            const y = Math.random() * 32;
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 2 + 1, 0, Math.PI * 2);
            ctx.fill();
        }
        return canvas.toDataURL();
    }

    createBeachPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        const colors = ['#f5deb3', '#f4d03f', '#f0c419', '#e6b800'];
        for (let i = 0; i < 32; i += 4) {
            for (let j = 0; j < 32; j += 4) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                ctx.fillStyle = color;
                ctx.fillRect(i, j, 4, 4);
            }
        }
        return canvas.toDataURL();
    }

    setGame(game) {
        this.game = game;
    }

    render() {
        if (!this.isLoaded) {
            this.renderLoadingScreen();
            return;
        }
        
        this.clear();
        this.renderTerrain();
        this.renderBuildings();
        this.renderTurrets();
        this.renderShips();
        this.renderBuildingPreview();
        this.renderEnemies();
        this.renderPlayer();
        this.renderGrid();
        
        this.renderSailProgress();
        this.renderNPCIslands();
    }
    
    renderShips() {
        if (!this.game || !this.game.dock) return;
        
        this.game.dock.renderShips(this.ctx);
    }
    
    renderNPCIslands() {
        if (!this.game || !this.game.dock) return;
        
        this.game.dock.renderNPCIslands(this.ctx);
    }
    
    renderSailProgress() {
        if (!this.game || !this.game.dock) return;
        
        this.game.dock.renderSailProgress(this.ctx);
    }
    
    renderTurrets() {
        if (!this.game || !this.game.turretManager) return;
        
        this.game.turretManager.renderTurrets(this.ctx);
    }
    
    renderEnemies() {
        if (!this.game || !this.game.enemyManager) return;
        
        this.game.enemyManager.renderEnemies(this.ctx);
    }
    
    renderBuildingPreview() {
        if (!this.game || !this.game.buildPanel) return;
        
        const selectedBuilding = this.game.buildPanel.selectedBuilding;
        const previewPos = this.game.buildPanel.previewBuildingPosition;
        
        if (!selectedBuilding || !previewPos) return;
        
        const buildingConfig = this.game.buildPanel.buildingTypes[selectedBuilding];
        if (!buildingConfig) return;
        
        const canBuild = this.game.terrain.canBuildAt(previewPos.x, previewPos.y) &&
                        this.game.buildPanel.isSpaceAvailable(previewPos.x, previewPos.y, buildingConfig.size) &&
                        !this.game.buildPanel.isOverlappingFarmArea(previewPos.x, previewPos.y, buildingConfig.size);
        
        this.ctx.save();
        
        this.ctx.globalAlpha = canBuild ? 0.7 : 0.4;
        
        const size = buildingConfig.size;
        const halfSize = size / 2;
        
        this.ctx.strokeStyle = canBuild ? '#4ade80' : '#ef4444';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(previewPos.x - halfSize, previewPos.y - halfSize, size, size);
        
        this.ctx.setLineDash([]);
        
        if (canBuild) {
            this.ctx.shadowColor = '#4ade80';
            this.ctx.shadowBlur = 10;
        } else {
            this.ctx.shadowColor = '#ef4444';
            this.ctx.shadowBlur = 10;
        }
        
        this.ctx.font = `${size * 0.8}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(buildingConfig.emoji, previewPos.x, previewPos.y);
        
        this.ctx.restore();
    }

    renderLoadingScreen() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`加载中... ${Math.round((this.loadedCount / this.totalSprites) * 100)}%`, this.width / 2, this.height / 2);
    }

    clear() {
        this.ctx.fillStyle = '#0a1628';
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
            if (!building.isTurret) {
                this.renderBuilding(building);
            }
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
        
        this.drawBuildingHealthBar(building);
    }
    
    drawBuildingHealthBar(building) {
        const health = building.health || building.maxHealth || 100;
        const maxHealth = building.maxHealth || 100;
        
        if (health >= maxHealth) return;
        
        const barWidth = building.size * 1.2;
        const barHeight = 5;
        const barY = building.y - building.size / 2 - 10;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(building.x - barWidth / 2, barY, barWidth, barHeight);
        
        const healthPercent = health / maxHealth;
        const gradient = this.ctx.createLinearGradient(
            building.x - barWidth / 2, barY,
            building.x + barWidth / 2, barY
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
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(building.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(building.x - barWidth / 2, barY, barWidth, barHeight);
    }

    renderPlayer() {
        if (this.game && this.game.player) {
            this.game.player.render(this.ctx);
        }
    }

    renderGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 40;
        
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

    drawImage(spriteName, x, y, width, height) {
        const sprite = this.sprites[spriteName];
        if (sprite && sprite.complete) {
            this.ctx.drawImage(sprite, x, y, width, height);
        }
    }

    fillPattern(spriteName, x, y, width, height) {
        const sprite = this.sprites[spriteName];
        if (sprite && sprite.complete) {
            const pattern = this.ctx.createPattern(sprite, 'repeat');
            this.ctx.fillStyle = pattern;
            this.ctx.fillRect(x, y, width, height);
        }
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

    getSprite(name) {
        return this.sprites[name] || null;
    }

    isReady() {
        return this.isLoaded;
    }
}