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
        this.seaRenderer.init();
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

    canBuildDockOnBeachAt(x, y) {
        if (!this.isOnBeach(x, y)) return false;
        
        const distance = Math.sqrt(Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2));
        const beachInnerRadius = this.landRadius;
        const beachOuterRadius = this.beachOuterRadius;
        
        const dockZoneWidth = (beachOuterRadius - beachInnerRadius) * 0.6;
        const dockZoneStartRadius = beachOuterRadius - dockZoneWidth;
        
        return distance >= dockZoneStartRadius;
    }

    isInDockZone(x, y) {
        const distance = Math.sqrt(Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2));
        const beachOuterRadius = this.beachOuterRadius;
        const dockZoneWidth = (beachOuterRadius - this.landRadius) * 0.6;
        const dockZoneStartRadius = beachOuterRadius - dockZoneWidth;
        
        return distance >= dockZoneStartRadius && distance <= beachOuterRadius + 30;
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
    
    getBeachArea() {
        return {
            x: this.centerX - this.beachOuterRadius,
            y: this.centerY - this.beachWidth,
            width: this.beachOuterRadius * 2,
            height: this.beachWidth * 2
        };
    }
    
    getDockPlacementPositions() {
        const positions = [];
        const numPositions = 3;
        const startAngle = -Math.PI / 2 - 0.5;
        const angleStep = 1.0;
        
        for (let i = 0; i < numPositions; i++) {
            const angle = startAngle + i * angleStep;
            const radius = (this.landRadius + this.beachOuterRadius) / 2;
            
            positions.push({
                x: this.centerX + Math.cos(angle) * radius,
                y: this.centerY + Math.sin(angle) * radius,
                angle: angle
            });
        }
        
        return positions;
    }
    
    canBuildDockAt(x, y) {
        const dockPositions = this.getDockPlacementPositions();
        const tolerance = 40;
        
        return dockPositions.some(pos => {
            const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
            return distance < tolerance;
        });
    }
    
    isNearDock(x, y) {
        const buildings = this.renderer.game?.storage?.getBuildings();
        if (!buildings) return false;
        
        const docks = buildings.filter(b => b.type === 'dock');
        if (docks.length === 0) return false;
        
        const tolerance = 80;
        
        return docks.some(dock => {
            const distance = Math.sqrt(Math.pow(x - dock.x, 2) + Math.pow(y - dock.y, 2));
            return distance < tolerance;
        });
    }
}