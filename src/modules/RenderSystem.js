export class RenderSystem {
    constructor(game) {
        this.game = game;
    }

    render() {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        if (!this.game.isReady) {
            renderer.render();
            return;
        }

        renderer.render();

        const resourceManager = this.game.getResourceManager();
        if (resourceManager) {
            resourceManager.render(renderer.ctx);
        }
    }

    renderLoadingScreen() {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        renderer.renderLoadingScreen();
    }

    renderTerrain() {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        renderer.renderTerrain();
    }

    renderBuildings() {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        renderer.renderBuildings();
    }

    renderPlayer() {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        renderer.renderPlayer();
    }

    renderEnemies() {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        renderer.renderEnemies();
    }

    renderTurrets() {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        renderer.renderTurrets();
    }

    renderShips() {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        renderer.renderShips();
    }

    renderBuildingPreview() {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        renderer.renderBuildingPreview();
    }

    renderSailProgress() {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        renderer.renderSailProgress();
    }

    renderGrid() {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        renderer.renderGrid();
    }

    clear() {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        renderer.clear();
    }

    drawCircle(x, y, radius, color) {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        renderer.drawCircle(x, y, radius, color);
    }

    drawRect(x, y, width, height, color) {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        renderer.drawRect(x, y, width, height, color);
    }

    drawText(text, x, y, color = '#ffffff', fontSize = 16) {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        renderer.drawText(text, x, y, color, fontSize);
    }

    drawImage(spriteName, x, y, width, height) {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        renderer.drawImage(spriteName, x, y, width, height);
    }

    fillPattern(spriteName, x, y, width, height) {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        renderer.fillPattern(spriteName, x, y, width, height);
    }

    resize(width, height) {
        const renderer = this.game.getRenderer();
        if (!renderer) return;

        renderer.resize(width, height);
    }

    getWidth() {
        const renderer = this.game.getRenderer();
        return renderer ? renderer.getWidth() : 0;
    }

    getHeight() {
        const renderer = this.game.getRenderer();
        return renderer ? renderer.getHeight() : 0;
    }
}