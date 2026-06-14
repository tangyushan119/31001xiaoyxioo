export class LandRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.ctx = renderer.ctx;
        this.centerX = renderer.width / 2;
        this.centerY = renderer.height / 2;
        this.landRadius = 0;
        
        this.farmGridSize = 4;
        this.plotSize = 50;
        this.farmOffsetX = 0;
        this.farmOffsetY = 0;
    }

    updateDimensions() {
        this.centerX = this.renderer.width / 2;
        this.centerY = this.renderer.height / 2;
        this.calculateFarmPosition();
    }

    setLandRadius(radius) {
        this.landRadius = radius;
        this.calculateFarmPosition();
    }

    calculateFarmPosition() {
        const totalWidth = this.farmGridSize * this.plotSize + (this.farmGridSize - 1) * 5;
        const totalHeight = this.farmGridSize * this.plotSize + (this.farmGridSize - 1) * 5;
        this.farmOffsetX = this.centerX - totalWidth / 2;
        this.farmOffsetY = this.centerY - totalHeight / 2 + 50;
    }

    init() {
        this.calculateFarmPosition();
    }

    render() {
        this.drawLand();
        this.drawFarmGrid();
    }

    drawLand() {
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.landRadius
        );
        gradient.addColorStop(0, '#2ecc71');
        gradient.addColorStop(0.6, '#27ae60');
        gradient.addColorStop(1, '#1e8449');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.landRadius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawFarmGrid() {
        this.ctx.save();
        
        for (let row = 0; row < this.farmGridSize; row++) {
            for (let col = 0; col < this.farmGridSize; col++) {
                const x = this.farmOffsetX + col * (this.plotSize + 5);
                const y = this.farmOffsetY + row * (this.plotSize + 5);
                
                this.drawPlot(x, y, row, col);
            }
        }
        
        this.ctx.restore();
    }

    drawPlot(x, y, row, col) {
        const centerX = x + this.plotSize / 2;
        const centerY = y + this.plotSize / 2;
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x, y, this.plotSize, this.plotSize);
        
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, this.plotSize, this.plotSize);
        
        this.ctx.fillStyle = '#6B8E23';
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillRect(x + 3, y + 3, this.plotSize - 6, this.plotSize - 6);
        this.ctx.globalAlpha = 1;
        
        if (this.renderer.game && this.renderer.game.storage) {
            const plots = this.renderer.game.storage.getFarmPlots();
            const plot = plots.find(p => p.row === row && p.col === col);
            if (plot) {
                this.drawCrop(centerX, centerY, plot);
            }
        }
    }

    drawCrop(x, y, plot) {
        if (!plot.crop) return;
        
        const cropTypes = this.renderer.game.storage.getCropTypes();
        const cropInfo = cropTypes[plot.crop];
        
        if (!cropInfo) return;
        
        this.ctx.save();
        
        if (plot.isReady) {
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 10;
        }
        
        this.ctx.font = `${this.plotSize * 0.6}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        let emoji = cropInfo.emoji;
        if (!plot.isReady) {
            const stages = ['🌱', '🌿', '🌾'];
            const stageIndex = Math.min(2, Math.floor(plot.growthProgress / 34));
            emoji = stages[stageIndex];
        }
        
        this.ctx.fillText(emoji, x, y);
        
        if (!plot.isReady && plot.growthProgress > 0) {
            this.drawGrowthBar(x, y + this.plotSize / 2 + 5, plot.growthProgress);
        }
        
        this.ctx.restore();
    }

    drawGrowthBar(x, y, progress) {
        const barWidth = this.plotSize - 10;
        const barHeight = 4;
        
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);
        
        const gradient = this.ctx.createLinearGradient(x - barWidth / 2, y, x + barWidth / 2, y);
        gradient.addColorStop(0, '#4ade80');
        gradient.addColorStop(1, '#22c55e');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x - barWidth / 2, y, barWidth * (progress / 100), barHeight);
    }

    isOnLand(x, y) {
        const distance = Math.sqrt(Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2));
        return distance < this.landRadius;
    }

    getCoordinateRange() {
        return {
            type: 'land',
            minRadius: 0,
            maxRadius: this.landRadius,
            center: { x: this.centerX, y: this.centerY }
        };
    }

    getPlotAtPosition(x, y) {
        if (x < this.farmOffsetX || y < this.farmOffsetY) return null;
        
        const totalWidth = this.farmGridSize * this.plotSize + (this.farmGridSize - 1) * 5;
        const totalHeight = this.farmGridSize * this.plotSize + (this.farmGridSize - 1) * 5;
        
        if (x > this.farmOffsetX + totalWidth || y > this.farmOffsetY + totalHeight) return null;
        
        const col = Math.floor((x - this.farmOffsetX) / (this.plotSize + 5));
        const row = Math.floor((y - this.farmOffsetY) / (this.plotSize + 5));
        
        if (row >= 0 && row < this.farmGridSize && col >= 0 && col < this.farmGridSize) {
            return { row, col, id: `${row}-${col}` };
        }
        
        return null;
    }

    getFarmArea() {
        const totalWidth = this.farmGridSize * this.plotSize + (this.farmGridSize - 1) * 5;
        const totalHeight = this.farmGridSize * this.plotSize + (this.farmGridSize - 1) * 5;
        
        return {
            x: this.farmOffsetX,
            y: this.farmOffsetY,
            width: totalWidth,
            height: totalHeight
        };
    }

    getPlotSize() {
        return this.plotSize;
    }
}