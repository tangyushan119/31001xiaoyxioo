import { SeaRenderer } from './SeaRenderer.js';
import { BeachRenderer } from './BeachRenderer.js';
import { LandRenderer } from './LandRenderer.js';

export class Terrain {
    constructor(renderer) {
        this.renderer = renderer;
        this.canvas = renderer.canvas;
        this.ctx = renderer.ctx;
        this.centerX = renderer.width / 2;
        this.centerY = renderer.height / 2;
        
        this.seaRenderer = new SeaRenderer(renderer);
        this.beachRenderer = new BeachRenderer(renderer);
        this.landRenderer = new LandRenderer(renderer);
        
        this.updateIslandDimensions();
    }

    updateIslandDimensions() {
        this.centerX = this.renderer.width / 2;
        this.centerY = this.renderer.height / 2;
        
        const minDimension = Math.min(this.renderer.width, this.renderer.height);
        this.islandRadius = Math.floor(minDimension * 0.38);
        this.landRadius = Math.floor(this.islandRadius * 0.9);
        this.beachWidth = Math.floor(this.islandRadius * 0.1);
        
        const extendedBeachWidth = Math.floor(this.beachWidth * 1.5);
        this.beachOuterRadius = this.islandRadius + extendedBeachWidth;
        
        this.seaRenderer.setSeaRadius(this.beachOuterRadius);
        this.beachRenderer.setRadiusRange(this.landRadius, this.beachOuterRadius);
        this.landRenderer.setLandRadius(this.landRadius);
    }

    updateDimensions() {
        this.updateIslandDimensions();
        this.seaRenderer.updateDimensions();
        this.beachRenderer.updateDimensions();
        this.landRenderer.updateDimensions();
    }

    init() {
        this.landRenderer.init();
    }

    update(deltaTime) {
        this.seaRenderer.update(deltaTime);
    }

    render() {
        this.seaRenderer.render();
        this.beachRenderer.render();
        this.landRenderer.render();
    }

    isOnLand(x, y) {
        return this.landRenderer.isOnLand(x, y);
    }

    isOnIsland(x, y) {
        const distance = Math.sqrt(Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2));
        return distance < this.beachOuterRadius;
    }

    isOnBeach(x, y) {
        return this.beachRenderer.isOnBeach(x, y);
    }

    isOnWater(x, y) {
        return this.seaRenderer.isInSea(x, y);
    }

    canBuildAt(x, y) {
        return this.isOnLand(x, y);
    }

    getIslandCenter() {
        return { x: this.centerX, y: this.centerY };
    }

    getIslandRadius() {
        return this.beachOuterRadius;
    }

    getBeachOuterRadius() {
        return this.beachOuterRadius;
    }

    getLandRadius() {
        return this.landRadius;
    }

    getTerrainType(x, y) {
        if (this.isOnLand(x, y)) return 'land';
        if (this.isOnBeach(x, y)) return 'beach';
        return 'water';
    }

    getCoordinateRanges() {
        return {
            sea: this.seaRenderer.getCoordinateRange(),
            beach: this.beachRenderer.getCoordinateRange(),
            land: this.landRenderer.getCoordinateRange()
        };
    }

    getSeaRenderer() {
        return this.seaRenderer;
    }

    getBeachRenderer() {
        return this.beachRenderer;
    }

    getLandRenderer() {
        return this.landRenderer;
    }
}