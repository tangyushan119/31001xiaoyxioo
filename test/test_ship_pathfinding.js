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

global.setTimeout = (fn) => { return fn; };
global.clearTimeout = (fn) => {};
global.setInterval = () => 0;
global.clearInterval = () => {};
global.performance = { now: () => Date.now() };

import { Terrain } from '../src/modules/Terrain.js';
import { Storage } from '../src/modules/Storage.js';
import { Dock } from '../src/modules/Dock.js';

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
        getPlayer: () => ({ getPosition: () => ({ x: 400, y: 300 }), x: 400, y: 300 }),
        showToast: () => {},
        barracks: { getTotalSoldiers: () => 1, getSoldiers: () => [{ id: 1 }], removeSoldier: () => {} }
    };
    
    return game;
}

function setupDockWithShip(game) {
    const dock = new Dock(game);
    
    const center = game.terrain.getIslandCenter();
    const beachOuterRadius = game.terrain.getBeachOuterRadius();
    
    game.storage.addBuilding({
        id: 1,
        type: 'dock',
        x: center.x + beachOuterRadius * 0.95 * Math.cos(-Math.PI / 2),
        y: center.y + beachOuterRadius * 0.95 * Math.sin(-Math.PI / 2),
        size: 60,
        health: 100,
        maxHealth: 100,
        emoji: '⛵',
        name: '码头',
        isDock: true
    });
    
    game.storage.modifyResource('wood', 100);
    game.storage.modifyResource('stone', 50);
    game.storage.modifyResource('ore', 50);
    game.storage.modifyResource('wheatHarvest', 100);
    
    dock.buildShip('smallShip');
    
    return dock;
}

function testLineIntersectsIsland() {
    console.log('\n=== 测试：直线与岛屿相交检测 ===');
    
    const game = createMockGame();
    const terrain = game.terrain;
    const center = terrain.getIslandCenter();
    const beachOuterRadius = terrain.getBeachOuterRadius();
    
    const dock = new Dock(game);
    
    let passed = true;
    
    const testCases = [
        {
            name: '起点和终点都在岛屿内',
            start: { x: center.x, y: center.y },
            end: { x: center.x + 50, y: center.y + 50 },
            expected: true
        },
        {
            name: '起点和终点都在岛屿外，直线不穿过岛屿',
            start: { x: center.x + beachOuterRadius + 100, y: center.y },
            end: { x: center.x + beachOuterRadius + 200, y: center.y + 100 },
            expected: false
        },
        {
            name: '起点在岛屿内，终点在岛屿外',
            start: { x: center.x, y: center.y },
            end: { x: center.x + beachOuterRadius + 100, y: center.y },
            expected: true
        },
        {
            name: '起点在岛屿外，终点在岛屿内',
            start: { x: center.x + beachOuterRadius + 100, y: center.y },
            end: { x: center.x, y: center.y },
            expected: true
        },
        {
            name: '起点和终点都在岛屿外，直线穿过岛屿',
            start: { x: center.x - beachOuterRadius - 100, y: center.y },
            end: { x: center.x + beachOuterRadius + 100, y: center.y },
            expected: true
        }
    ];
    
    testCases.forEach(({ name, start, end, expected }) => {
        const result = dock.lineIntersectsIsland(start, end, center, beachOuterRadius);
        if (result === expected) {
            console.log(`✅ ${name}: 返回 ${result}`);
        } else {
            console.log(`❌ ${name}: 期望 ${expected}，实际返回 ${result}`);
            passed = false;
        }
    });
    
    return passed;
}

function testGenerateSailingPath() {
    console.log('\n=== 测试：航行路径生成 ===');
    
    const game = createMockGame();
    const terrain = game.terrain;
    const center = terrain.getIslandCenter();
    const beachOuterRadius = terrain.getBeachOuterRadius();
    
    const dock = setupDockWithShip(game);
    
    let passed = true;
    
    const ship = dock.getShips()[0];
    const startPos = dock.getDockedShipPosition(ship.id);
    
    console.log(`岛屿中心: (${Math.round(center.x)}, ${Math.round(center.y)})`);
    console.log(`沙滩外半径: ${beachOuterRadius}`);
    console.log(`起点位置: (${Math.round(startPos.x)}, ${Math.round(startPos.y)})`);
    
    const testDestinations = [
        {
            id: 'nearIsland',
            position: {
                x: center.x + (beachOuterRadius + 50) * Math.cos(Math.PI / 4),
                y: center.y + (beachOuterRadius + 50) * Math.sin(Math.PI / 4)
            },
            shouldBypass: true
        },
        {
            id: 'farIsland',
            position: {
                x: center.x + (beachOuterRadius + 300) * Math.cos(Math.PI),
                y: center.y + (beachOuterRadius + 300) * Math.sin(Math.PI)
            },
            shouldBypass: false
        }
    ];
    
    testDestinations.forEach(({ id, position, shouldBypass }) => {
        const path = dock.generateSailingPath(startPos, position);
        
        console.log(`\n目的地 ${id}: (${Math.round(position.x)}, ${Math.round(position.y)})`);
        console.log(`路径点数: ${path.length}`);
        
        if (path.length >= 2) {
            console.log(`✅ 路径至少包含起点和终点`);
        } else {
            console.log(`❌ 路径应该至少包含起点和终点`);
            passed = false;
        }
        
        const firstPoint = path[0];
        const lastPoint = path[path.length - 1];
        
        const startDist = Math.sqrt(Math.pow(firstPoint.x - startPos.x, 2) + Math.pow(firstPoint.y - startPos.y, 2));
        const endDist = Math.sqrt(Math.pow(lastPoint.x - position.x, 2) + Math.pow(lastPoint.y - position.y, 2));
        
        if (startDist < 1) {
            console.log(`✅ 路径起点正确`);
        } else {
            console.log(`❌ 路径起点不正确，距离 ${startDist}`);
            passed = false;
        }
        
        if (endDist < 1) {
            console.log(`✅ 路径终点正确`);
        } else {
            console.log(`❌ 路径终点不正确，距离 ${endDist}`);
            passed = false;
        }
        
        const hasBypass = path.length > 2;
        if (hasBypass === shouldBypass) {
            console.log(`✅ 绕行检测正确: ${hasBypass ? '已绕行' : '直线航行'}`);
        } else {
            console.log(`❌ 绕行检测不正确: 期望 ${shouldBypass ? '已绕行' : '直线航行'}，实际 ${hasBypass ? '已绕行' : '直线航行'}`);
            passed = false;
        }
        
        if (hasBypass) {
            let allPointsOnWater = true;
            path.forEach((point, index) => {
                const dist = Math.sqrt(Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2));
                if (dist < beachOuterRadius) {
                    console.log(`❌ 路径点 ${index} (${Math.round(point.x)}, ${Math.round(point.y)}) 距离岛屿中心 ${Math.round(dist)}，进入了陆地/沙滩区域`);
                    allPointsOnWater = false;
                }
            });
            if (allPointsOnWater) {
                console.log(`✅ 所有路径点均在水域内`);
            } else {
                passed = false;
            }
        }
    });
    
    return passed;
}

function testShipPositionDuringPathNavigation() {
    console.log('\n=== 测试：航行过程中船只位置沿路径移动 ===');
    
    const game = createMockGame();
    const terrain = game.terrain;
    const center = terrain.getIslandCenter();
    const beachOuterRadius = terrain.getBeachOuterRadius();
    
    const dock = setupDockWithShip(game);
    
    const ship = dock.getShips()[0];
    const destinationId = 'resourceIsland';
    
    let passed = true;
    
    const sailResult = dock.startSail(destinationId, ship.id);
    if (!sailResult.success) {
        console.log(`❌ 启动航行失败: ${sailResult.message}`);
        return false;
    }
    
    console.log(`路径点数: ${dock.sailingPathPoints.length}`);
    console.log(`起始位置: (${Math.round(dock.sailingShipPosition.x)}, ${Math.round(dock.sailingShipPosition.y)})`);
    
    const positions = [];
    const totalUpdates = 20;
    
    for (let i = 0; i <= totalUpdates; i++) {
        const progress = i / totalUpdates;
        dock.updateShipPositionAlongPath(progress);
        
        positions.push({
            x: dock.sailingShipPosition.x,
            y: dock.sailingShipPosition.y,
            progress: progress
        });
    }
    
    if (positions.length > 0) {
        console.log(`✅ 记录了 ${positions.length} 个位置点`);
    } else {
        console.log(`❌ 未记录任何位置点`);
        passed = false;
    }
    
    let allPointsValid = true;
    positions.forEach((pos, index) => {
        const dist = Math.sqrt(Math.pow(pos.x - center.x, 2) + Math.pow(pos.y - center.y, 2));
        if (dist < beachOuterRadius) {
            console.log(`❌ 位置点 ${index} (进度 ${Math.round(pos.progress * 100)}%) 在陆地/沙滩内: 距离中心 ${Math.round(dist)}，沙滩外半径 ${beachOuterRadius}`);
            allPointsValid = false;
        }
    });
    
    if (allPointsValid) {
        console.log(`✅ 所有位置点均在水域内`);
    } else {
        passed = false;
    }
    
    if (positions.length >= 2) {
        const firstPos = positions[0];
        const lastPos = positions[positions.length - 1];
        const totalDist = Math.sqrt(Math.pow(lastPos.x - firstPos.x, 2) + Math.pow(lastPos.y - firstPos.y, 2));
        
        if (totalDist > 10) {
            console.log(`✅ 船只从起点移动到终点，总距离 ${Math.round(totalDist)} 像素`);
        } else {
            console.log(`❌ 船只移动距离过小: ${Math.round(totalDist)} 像素`);
            passed = false;
        }
    }
    
    return passed;
}

function testNormalizeAngle() {
    console.log('\n=== 测试：角度归一化函数 ===');
    
    const game = createMockGame();
    const dock = new Dock(game);
    
    let passed = true;
    
    const testCases = [
        { input: 0, expected: 0 },
        { input: Math.PI / 2, expected: Math.PI / 2 },
        { input: Math.PI, expected: Math.PI },
        { input: Math.PI * 3 / 2, expected: Math.PI * 3 / 2 },
        { input: Math.PI * 2, expected: 0 },
        { input: Math.PI * 3, expected: Math.PI },
        { input: -Math.PI / 2, expected: Math.PI * 3 / 2 },
        { input: -Math.PI, expected: Math.PI },
        { input: -Math.PI * 3, expected: Math.PI }
    ];
    
    testCases.forEach(({ input, expected }) => {
        const result = dock.normalizeAngle(input);
        const diff = Math.abs(result - expected);
        
        if (diff < 0.0001) {
            console.log(`✅ normalizeAngle(${input.toFixed(3)}) = ${result.toFixed(3)}`);
        } else {
            console.log(`❌ normalizeAngle(${input.toFixed(3)}) 期望 ${expected.toFixed(3)}，实际 ${result.toFixed(3)}`);
            passed = false;
        }
    });
    
    return passed;
}

function testPathfindingEdgeCases() {
    console.log('\n=== 测试：路径规划边界情况 ===');
    
    const game = createMockGame();
    const terrain = game.terrain;
    const center = terrain.getIslandCenter();
    const beachOuterRadius = terrain.getBeachOuterRadius();
    
    const dock = new Dock(game);
    
    let passed = true;
    
    const testCases = [
        {
            name: '起点和终点相同',
            start: { x: center.x + 300, y: center.y },
            end: { x: center.x + 300, y: center.y }
        },
        {
            name: '起点略偏，终点在对面',
            start: { x: center.x + beachOuterRadius + 50, y: center.y },
            end: { x: center.x - beachOuterRadius - 50, y: center.y }
        },
        {
            name: '起点和终点都在岛屿边缘外很近',
            start: { x: center.x + beachOuterRadius + 10, y: center.y },
            end: { x: center.x - beachOuterRadius - 10, y: center.y }
        }
    ];
    
    testCases.forEach(({ name, start, end }) => {
        try {
            const path = dock.generateSailingPath(start, end);
            
            if (path.length >= 2) {
                console.log(`✅ ${name}: 成功生成路径，路径点数 ${path.length}`);
            } else {
                console.log(`❌ ${name}: 路径点数不足，实际 ${path.length}`);
                passed = false;
            }
            
            let allPointsOnWater = true;
            path.forEach((point, index) => {
                const dist = Math.sqrt(Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2));
                if (dist < beachOuterRadius - 5) {
                    console.log(`❌ ${name}: 路径点 ${index} 进入陆地区域`);
                    allPointsOnWater = false;
                }
            });
            
            if (allPointsOnWater) {
                console.log(`✅ ${name}: 所有路径点均在水域内`);
            } else {
                passed = false;
            }
        } catch (e) {
            console.log(`❌ ${name}: 抛出异常 ${e.message}`);
            passed = false;
        }
    });
    
    return passed;
}

function runAllTests() {
    console.log('='.repeat(60));
    console.log('⛵ 船只航行路径规划测试套件');
    console.log('='.repeat(60));
    
    const tests = [
        { name: '直线与岛屿相交检测', fn: testLineIntersectsIsland },
        { name: '航行路径生成', fn: testGenerateSailingPath },
        { name: '航行过程中船只位置沿路径移动', fn: testShipPositionDuringPathNavigation },
        { name: '角度归一化函数', fn: testNormalizeAngle },
        { name: '路径规划边界情况', fn: testPathfindingEdgeCases }
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
        console.log('\n🎉 所有船只航行路径规划测试通过！');
        process.exit(0);
    } else {
        console.log('\n⚠️ 部分测试失败，请检查代码');
        process.exit(1);
    }
}

runAllTests();