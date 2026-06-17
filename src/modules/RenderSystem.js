export class RenderSystem {
    constructor(game) {
        this.game = game;
    }

    render() {
        const renderer = this.game.renderer;
        if (!renderer) return;

        if (!this.game.isReady) {
            this.renderLoadingScreen();
            return;
        }

        renderer.clear();

        if (this.game.terrain) {
            this.game.terrain.render();
        }

        if (this.game.resourceManager) {
            this.game.resourceManager.render(renderer.ctx);
        }

        this.renderBuildings();

        if (this.game.turretManager) {
            this.game.turretManager.renderTurrets(renderer.ctx);
        }

        if (this.game.dock) {
            this.game.dock.renderShips(renderer.ctx);
            this.game.dock.renderNPCIslands(renderer.ctx);
            this.game.dock.renderSailProgress(renderer.ctx);
        }

        this.renderBuildingPreview();

        if (this.game.enemyManager) {
            this.game.enemyManager.renderEnemies(renderer.ctx);
        }

        if (this.game.player) {
            this.game.player.render(renderer.ctx);
        }

        renderer.drawGrid();
    }

    renderLoadingScreen() {
        const renderer = this.game.renderer;
        if (!renderer) return;

        renderer.clear('#1a1a2e');
        renderer.drawText('加载中...', renderer.getWidth() / 2, renderer.getHeight() / 2, '#ffffff', 24);
    }

    renderBuildings() {
        const renderer = this.game.renderer;
        if (!renderer || !this.game.storage) return;

        const buildings = this.game.storage.getBuildings();
        buildings.forEach(building => {
            if (!building.isTurret) {
                this.renderBuilding(building, renderer);
            }
        });
    }

    renderBuilding(building, renderer) {
        const centerX = building.x;
        const centerY = building.y;
        const size = building.size;

        renderer.drawEmoji(building.emoji, centerX, centerY, size * 0.8);
        this.drawBuildingHealthBar(building, renderer);
    }

    drawBuildingHealthBar(building, renderer) {
        const health = building.health || building.maxHealth || 100;
        const maxHealth = building.maxHealth || 100;

        if (health >= maxHealth) return;

        const barWidth = building.size * 1.2;
        const barHeight = 5;
        const barX = building.x - barWidth / 2;
        const barY = building.y - building.size / 2 - 10;

        renderer.drawHealthBar(barX, barY, barWidth, barHeight, health, maxHealth);
    }

    renderBuildingPreview() {
        const renderer = this.game.renderer;
        if (!renderer || !this.game.buildPanel) return;

        const selectedBuilding = this.game.buildPanel.selectedBuilding;
        const previewPos = this.game.buildPanel.previewBuildingPosition;

        if (!selectedBuilding || !previewPos) return;

        const buildingConfig = this.game.buildPanel.buildingTypes[selectedBuilding];
        if (!buildingConfig) return;

        const canBuild = this.game.terrain.canBuildAt(previewPos.x, previewPos.y) &&
                        this.game.buildPanel.isSpaceAvailable(previewPos.x, previewPos.y, buildingConfig.size) &&
                        !this.game.buildPanel.isOverlappingFarmArea(previewPos.x, previewPos.y, buildingConfig.size);

        renderer.drawPreviewRect(previewPos.x, previewPos.y, buildingConfig.size, canBuild);
        renderer.drawEmoji(buildingConfig.emoji, previewPos.x, previewPos.y, buildingConfig.size * 0.8, {
            globalAlpha: canBuild ? 0.7 : 0.4,
            shadowColor: canBuild ? '#4ade80' : '#ef4444',
            shadowBlur: 10
        });
    }

    renderTerrain() {
        const renderer = this.game.renderer;
        if (!renderer) return;

        if (this.game.terrain) {
            this.game.terrain.render();
        }
    }

    renderPlayer() {
        const renderer = this.game.renderer;
        if (!renderer) return;

        if (this.game.player) {
            this.game.player.render(renderer.ctx);
        }
    }

    renderEnemies() {
        const renderer = this.game.renderer;
        if (!renderer) return;

        if (this.game.enemyManager) {
            this.game.enemyManager.renderEnemies(renderer.ctx);
        }
    }

    renderTurrets() {
        const renderer = this.game.renderer;
        if (!renderer) return;

        if (this.game.turretManager) {
            this.game.turretManager.renderTurrets(renderer.ctx);
        }
    }

    renderShips() {
        const renderer = this.game.renderer;
        if (!renderer) return;

        if (this.game.dock) {
            this.game.dock.renderShips(renderer.ctx);
        }
    }

    renderSailProgress() {
        const renderer = this.game.renderer;
        if (!renderer) return;

        if (this.game.dock) {
            this.game.dock.renderSailProgress(renderer.ctx);
        }
    }

    renderGrid() {
        const renderer = this.game.renderer;
        if (!renderer) return;

        renderer.drawGrid();
    }

    clear() {
        const renderer = this.game.renderer;
        if (!renderer) return;

        renderer.clear();
    }

    drawCircle(x, y, radius, color) {
        const renderer = this.game.renderer;
        if (!renderer) return;

        renderer.drawCircle(x, y, radius, color);
    }

    drawRect(x, y, width, height, color) {
        const renderer = this.game.renderer;
        if (!renderer) return;

        renderer.drawRect(x, y, width, height, color);
    }

    drawText(text, x, y, color = '#ffffff', fontSize = 16) {
        const renderer = this.game.renderer;
        if (!renderer) return;

        renderer.drawText(text, x, y, color, fontSize);
    }

    drawImage(spriteName, x, y, width, height) {
        const renderer = this.game.renderer;
        if (!renderer) return;

        renderer.drawImage(spriteName, x, y, width, height);
    }

    fillPattern(spriteName, x, y, width, height) {
        const renderer = this.game.renderer;
        if (!renderer) return;

        renderer.fillPattern(spriteName, x, y, width, height);
    }

    resize(width, height) {
        const renderer = this.game.renderer;
        if (!renderer) return;

        renderer.resize(width, height);
    }

    getWidth() {
        const renderer = this.game.renderer;
        return renderer ? renderer.getWidth() : 0;
    }

    getHeight() {
        const renderer = this.game.renderer;
        return renderer ? renderer.getHeight() : 0;
    }
}