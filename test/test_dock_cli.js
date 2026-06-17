global.document = {
    createElement: () => ({ className: '', style: {}, textContent: '', appendChild: () => {}, remove: () => {}, querySelectorAll: () => [] }),
    body: { appendChild: () => {}, removeChild: () => {} },
    getElementById: (id) => {
        if (id === 'build-panel') {
            return { querySelectorAll: () => [], addEventListener: () => {}, classList: { add: () => {}, remove: () => {} } };
        }
        return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {}
};

global.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
};

global.setTimeout = (fn) => { fn(); return 0; };
global.clearTimeout = () => {};
global.setInterval = () => 0;
global.clearInterval = () => {};
global.performance = { now: () => Date.now() };

import { Terrain } from '../src/modules/Terrain.js';
import { Storage } from '../src/modules/Storage.js';
import { BuildPanel } from '../src/components/BuildPanel.js';

function createMockRenderer(width = 800, height = 600) {
    return {
        width,
        height,
        canvas: { width, height, addEventListener: () => {}, removeEventListener: () => {} },
        ctx: {
            createRadialGradient: () => ({ addColorStop: () => {} }),
            fillStyle: '',
            beginPath: () => {},
            arc: () => {},
            fill: () => {},
            save: () => {},
            restore: () => {},
            fillRect: () => {},
            strokeStyle: '',
            lineWidth: 0,
            strokeRect: () => {},
            globalAlpha: 1,
            font: '',
            textAlign: '',
            textBaseline: '',
            fillText: () => {},
            shadowColor: '',
            shadowBlur: 0,
            createLinearGradient: () => ({ addColorStop: () => {} }),
            measureText: () => ({ width: 100 }),
            roundRect: () => {}
        },
        isReady: () => true,
        setGame: () => {},
        render: () => {}
    };
}

function createMockGame() {
    const renderer = createMockRenderer();
    const terrain = new Terrain(renderer);
    terrain.init();
    
    const storage = new Storage();
    storage.stopAutoSave();
    
    const game = {
        renderer,
        terrain,
        storage,
        isReady: true,
        getTerrain: () => terrain,
        getStorage: () => storage,
        getBuildPanel: () => ({ updateResourceDisplay: () => {}, updateBuildItemStates: () => {} }),
        getInput: () => ({ wasClicked: () => false, getCanvasMousePosition: () => ({ x: 0, y: 0 }) }),
        getPlayer: () => ({ getPosition: () => ({ x: 400, y: 300 }), x: 400, y: 300 })
    };
    
    return game;
}

function testDockBuildingType() {
    console.log('\n=== 测试：码头建筑类型定义 ===');
    
    const game = createMockGame();
    const buildPanel = new BuildPanel(game);
    
    const buildingTypes = buildPanel.getBuildingTypes();
    const dockConfig = buildingTypes.dock;
    
    let passed = true;
    
    if (dockConfig) {
        console.log(`✅ 码头配置存在`);
    } else {
        console.log(`❌ 码头配置不存在`);
        passed = false;
    }
    
    if (dockConfig?.name === '码头') {
        console.log(`✅ 码头名称正确: ${dockConfig.name}`);
    } else {
        console.log(`❌ 码头名称错误: ${dockConfig?.name}`);
        passed = false;
    }
    
    if (dockConfig?.emoji === '⛵') {
        console.log(`✅ 码头表情符号正确: ${dockConfig.emoji}`);
    } else {
        console.log(`❌ 码头表情符号错误: ${dockConfig?.emoji}`);
        passed = false;
    }
    
    if (dockConfig?.isDock === true) {
        console.log(`✅ 码头标记正确: ${dockConfig.isDock}`);
    } else {
        console.log(`❌ 码头标记错误: ${dockConfig?.isDock}`);
        passed = false;
    }
    
    if (dockConfig?.cost.wood === 80) {
        console.log(`✅ 木材成本正确: ${dockConfig.cost.wood}`);
    } else {
        console.log(`❌ 木材成本错误: ${dockConfig?.cost?.wood}`);
        passed = false;
    }
    
    if (dockConfig?.cost.stone === 40) {
        console.log(`✅ 石材成本正确: ${dockConfig.cost.stone}`);
    } else {
        console.log(`❌ 石材成本错误: ${dockConfig?.cost?.stone}`);
        passed = false;
    }
    
    return passed;
}

function testDockPlacementOnBeach() {
    console.log('\n=== 测试：码头沙滩放置（靠近水边区域） ===');
    
    const game = createMockGame();
    const terrain = game.getTerrain();
    const storage = game.getStorage();
    const buildPanel = new BuildPanel(game);
    
    const center = terrain.getIslandCenter();
    const beachOuterRadius = terrain.getBeachOuterRadius();
    
    const dockZoneX = center.x + beachOuterRadius * 0.95 * Math.cos(-Math.PI / 2);
    const dockZoneY = center.y + beachOuterRadius * 0.95 * Math.sin(-Math.PI / 2);
    
    const terrainType = terrain.getTerrainType(dockZoneX, dockZoneY);
    console.log(`测试点位置: (${Math.round(dockZoneX)}, ${Math.round(dockZoneY)})`);
    console.log(`地形类型: ${terrainType}`);
    
    let passed = true;
    
    if (terrainType === 'beach') {
        console.log(`✅ 测试点位于沙滩`);
    } else {
        console.log(`❌ 测试点不在沙滩，实际为: ${terrainType}`);
        passed = false;
    }
    
    const canBuildDock = terrain.canBuildDockOnBeachAt(dockZoneX, dockZoneY);
    console.log(`可建造码头: ${canBuildDock}`);
    
    if (canBuildDock) {
        console.log(`✅ 测试点位于沙滩可放置区域`);
    } else {
        console.log(`❌ 测试点不在沙滩可放置区域`);
        passed = false;
    }
    
    storage.modifyResource('wood', 100);
    storage.modifyResource('stone', 50);
    
    try {
        const result = buildPanel.tryPlaceBuilding('dock', dockZoneX, dockZoneY);
        console.log(`建造结果: ${result}`);
        
        if (result === true) {
            console.log(`✅ 码头可在沙滩靠近水边区域建造`);
            
            const buildings = storage.getBuildings();
            const dock = buildings.find(b => b.type === 'dock');
            if (dock) {
                console.log(`✅ 码头建筑已创建`);
                buildings.forEach(b => storage.removeBuilding(b.id));
            } else {
                console.log(`❌ 码头建筑未创建`);
                passed = false;
            }
        } else {
            console.log(`❌ 码头无法在沙滩靠近水边区域建造`);
            passed = false;
        }
    } catch (e) {
        console.log(`❌ 建造时发生错误: ${e.message}`);
        passed = false;
    }
    
    storage.modifyResource('wood', -100);
    storage.modifyResource('stone', -50);
    
    return passed;
}

function testDockCannotPlaceOnInnerBeach() {
    console.log('\n=== 测试：码头不可在沙滩内侧区域建造 ===');
    
    const game = createMockGame();
    const terrain = game.getTerrain();
    const storage = game.getStorage();
    const buildPanel = new BuildPanel(game);
    
    const center = terrain.getIslandCenter();
    const landRadius = terrain.getLandRadius();
    const beachOuterRadius = terrain.getBeachOuterRadius();
    
    const innerBeachX = center.x + (landRadius + (beachOuterRadius - landRadius) * 0.2) * Math.cos(-Math.PI / 2);
    const innerBeachY = center.y + (landRadius + (beachOuterRadius - landRadius) * 0.2) * Math.sin(-Math.PI / 2);
    
    console.log(`测试点位置: (${Math.round(innerBeachX)}, ${Math.round(innerBeachY)})`);
    
    let passed = true;
    
    const terrainType = terrain.getTerrainType(innerBeachX, innerBeachY);
    console.log(`地形类型: ${terrainType}`);
    
    if (terrainType === 'beach') {
        console.log(`✅ 测试点位于沙滩`);
    } else {
        console.log(`❌ 测试点不在沙滩，实际为: ${terrainType}`);
        passed = false;
    }
    
    const canBuildDock = terrain.canBuildDockOnBeachAt(innerBeachX, innerBeachY);
    console.log(`可建造码头: ${canBuildDock}`);
    
    if (!canBuildDock) {
        console.log(`✅ 测试点位于沙滩不可放置区域`);
    } else {
        console.log(`❌ 测试点不应该在可放置区域`);
        passed = false;
    }
    
    storage.modifyResource('wood', 100);
    storage.modifyResource('stone', 50);
    
    try {
        const result = buildPanel.tryPlaceBuilding('dock', innerBeachX, innerBeachY);
        console.log(`建造结果: ${result}`);
        
        if (result === undefined || result === false) {
            console.log(`✅ 码头不可在沙滩内侧区域建造`);
            
            const buildings = storage.getBuildings();
            const dockCount = buildings.filter(b => b.type === 'dock').length;
            if (dockCount === 0) {
                console.log(`✅ 沙滩内侧区域未创建码头`);
            } else {
                console.log(`❌ 沙滩内侧区域创建了码头`);
                passed = false;
                buildings.forEach(b => storage.removeBuilding(b.id));
            }
        } else {
            console.log(`❌ 码头不应该在沙滩内侧区域建造成功`);
            passed = false;
            const buildings = storage.getBuildings();
            buildings.forEach(b => storage.removeBuilding(b.id));
        }
    } catch (e) {
        console.log(`❌ 建造时发生错误: ${e.message}`);
        passed = false;
    }
    
    storage.modifyResource('wood', -100);
    storage.modifyResource('stone', -50);
    
    return passed;
}

function testDockPlacementOnLand() {
    console.log('\n=== 测试：码头陆地放置 ===');
    
    const game = createMockGame();
    const terrain = game.getTerrain();
    const storage = game.getStorage();
    const buildPanel = new BuildPanel(game);
    
    const center = terrain.getIslandCenter();
    
    console.log(`测试点位置: (${Math.round(center.x)}, ${Math.round(center.y)})`);
    
    let passed = true;
    
    const terrainType = terrain.getTerrainType(center.x, center.y);
    console.log(`地形类型: ${terrainType}`);
    
    if (terrainType === 'land') {
        console.log(`✅ 测试点位于陆地`);
    } else {
        console.log(`❌ 测试点不在陆地，实际为: ${terrainType}`);
        passed = false;
    }
    
    storage.modifyResource('wood', 100);
    storage.modifyResource('stone', 50);
    
    try {
        const result = buildPanel.tryPlaceBuilding('dock', center.x, center.y);
        console.log(`建造结果: ${result}`);
        
        if (result === true) {
            console.log(`✅ 码头可在普通陆地上建造`);
            
            const buildings = storage.getBuildings();
            const dock = buildings.find(b => b.type === 'dock');
            if (dock) {
                console.log(`✅ 码头建筑已创建`);
                buildings.forEach(b => storage.removeBuilding(b.id));
            } else {
                console.log(`❌ 码头建筑未创建`);
                passed = false;
            }
        } else {
            console.log(`❌ 码头无法在普通陆地上建造`);
            passed = false;
        }
    } catch (e) {
        console.log(`❌ 建造时发生错误: ${e.message}`);
        passed = false;
    }
    
    storage.modifyResource('wood', -100);
    storage.modifyResource('stone', -50);
    
    return passed;
}

function testDockCannotPlaceOnWater() {
    console.log('\n=== 测试：码头水域放置 ===');
    
    const game = createMockGame();
    const terrain = game.getTerrain();
    const storage = game.getStorage();
    const buildPanel = new BuildPanel(game);
    
    const center = terrain.getIslandCenter();
    const beachOuterRadius = terrain.getBeachOuterRadius();
    
    const waterX = center.x + beachOuterRadius * 1.5;
    const waterY = center.y;
    
    console.log(`测试点位置: (${Math.round(waterX)}, ${Math.round(waterY)})`);
    
    let passed = true;
    
    const terrainType = terrain.getTerrainType(waterX, waterY);
    console.log(`地形类型: ${terrainType}`);
    
    if (terrainType === 'water') {
        console.log(`✅ 测试点位于水域`);
    } else {
        console.log(`❌ 测试点不在水域，实际为: ${terrainType}`);
        passed = false;
    }
    
    storage.modifyResource('wood', 100);
    storage.modifyResource('stone', 50);
    
    try {
        const result = buildPanel.tryPlaceBuilding('dock', waterX, waterY);
        console.log(`建造结果: ${result}`);
        
        if (result === undefined || result === false) {
            console.log(`✅ 码头无法在水域建造`);
            
            const buildings = storage.getBuildings();
            const dockCount = buildings.filter(b => b.type === 'dock').length;
            if (dockCount === 0) {
                console.log(`✅ 水域未创建码头`);
            } else {
                console.log(`❌ 水域创建了码头`);
                passed = false;
                buildings.forEach(b => storage.removeBuilding(b.id));
            }
        } else {
            console.log(`❌ 码头不应该在水域建造成功`);
            passed = false;
            const buildings = storage.getBuildings();
            buildings.forEach(b => storage.removeBuilding(b.id));
        }
    } catch (e) {
        console.log(`❌ 建造时发生错误: ${e.message}`);
        passed = false;
    }
    
    storage.modifyResource('wood', -100);
    storage.modifyResource('stone', -50);
    
    return passed;
}

function testDockBuildCost() {
    console.log('\n=== 测试：码头建造成本 ===');
    
    const game = createMockGame();
    const storage = game.getStorage();
    const buildPanel = new BuildPanel(game);
    const terrain = game.getTerrain();
    const center = terrain.getIslandCenter();
    
    let passed = true;
    
    const initialWood = storage.getResource('wood');
    const initialStone = storage.getResource('stone');
    
    storage.modifyResource('wood', 100);
    storage.modifyResource('stone', 50);
    
    const woodBefore = storage.getResource('wood');
    const stoneBefore = storage.getResource('stone');
    
    console.log(`建造前木材: ${woodBefore}, 建造前石材: ${stoneBefore}`);
    
    try {
        const result = buildPanel.tryPlaceBuilding('dock', center.x, center.y);
        if (result === true) {
            console.log(`✅ 资源充足时可以建造`);
            
            const woodAfter = storage.getResource('wood');
            const stoneAfter = storage.getResource('stone');
            
            console.log(`消耗后木材: ${woodAfter}, 消耗后石材: ${stoneAfter}`);
            
            const woodConsumed = woodBefore - woodAfter;
            const stoneConsumed = stoneBefore - stoneAfter;
            
            console.log(`消耗木材: ${woodConsumed}, 消耗石材: ${stoneConsumed}`);
            
            if (woodConsumed === 80) {
                console.log(`✅ 木材消耗正确`);
            } else {
                console.log(`❌ 木材消耗错误: 预期 80, 实际 ${woodConsumed}`);
                passed = false;
            }
            
            if (stoneConsumed === 40) {
                console.log(`✅ 石材消耗正确`);
            } else {
                console.log(`❌ 石材消耗错误: 预期 40, 实际 ${stoneConsumed}`);
                passed = false;
            }
            
            const buildings = storage.getBuildings();
            buildings.forEach(b => storage.removeBuilding(b.id));
        } else {
            console.log(`❌ 资源充足时应该可以建造`);
            passed = false;
        }
    } catch (e) {
        console.log(`❌ 建造时发生错误: ${e.message}`);
        passed = false;
    }
    
    storage.modifyResource('wood', 79 - storage.getResource('wood'));
    storage.modifyResource('stone', 50);
    
    console.log(`木材不足测试: 当前木材 ${storage.getResource('wood')}, 石材 ${storage.getResource('stone')}`);
    
    try {
        const result2 = buildPanel.tryPlaceBuilding('dock', center.x, center.y);
        if (result2 === undefined) {
            console.log(`✅ 木材不足时无法建造`);
        } else {
            console.log(`❌ 木材不足时不应建造成功`);
            passed = false;
            const buildings = storage.getBuildings();
            buildings.forEach(b => storage.removeBuilding(b.id));
        }
    } catch (e) {
        console.log(`✅ 木材不足时无法建造（通过异常）`);
    }
    
    storage.modifyResource('wood', 80);
    storage.modifyResource('stone', 39 - storage.getResource('stone'));
    
    console.log(`石材不足测试: 当前木材 ${storage.getResource('wood')}, 石材 ${storage.getResource('stone')}`);
    
    try {
        const result3 = buildPanel.tryPlaceBuilding('dock', center.x, center.y);
        if (result3 === undefined) {
            console.log(`✅ 石材不足时无法建造`);
        } else {
            console.log(`❌ 石材不足时不应建造成功`);
            passed = false;
            const buildings = storage.getBuildings();
            buildings.forEach(b => storage.removeBuilding(b.id));
        }
    } catch (e) {
        console.log(`✅ 石材不足时无法建造（通过异常）`);
    }
    
    storage.modifyResource('wood', initialWood - storage.getResource('wood'));
    storage.modifyResource('stone', initialStone - storage.getResource('stone'));
    
    return passed;
}

function runAllTests() {
    console.log('='.repeat(60));
    console.log('⛵ 码头放置测试套件（命令行版本）');
    console.log('='.repeat(60));
    
    const tests = [
        { name: '码头建筑类型定义', fn: testDockBuildingType },
        { name: '码头沙滩放置', fn: testDockPlacementOnBeach },
        { name: '码头不可在沙滩内侧区域建造', fn: testDockCannotPlaceOnInnerBeach },
        { name: '码头陆地放置', fn: testDockPlacementOnLand },
        { name: '码头水域放置', fn: testDockCannotPlaceOnWater },
        { name: '码头建造成本', fn: testDockBuildCost }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        const result = test.fn();
        if (result) {
            passed++;
        } else {
            failed++;
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`测试结果汇总: 通过 ${passed}/${tests.length}, 失败 ${failed}/${tests.length}`);
    console.log('='.repeat(60));
    
    if (failed === 0) {
        console.log('\n🎉 所有码头测试通过！');
        process.exit(0);
    } else {
        console.log('\n⚠️ 部分测试失败，请检查代码');
        process.exit(1);
    }
}

runAllTests();