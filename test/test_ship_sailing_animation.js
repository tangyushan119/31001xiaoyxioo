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

function testSailingPositionInitialization() {
    console.log('\n=== 测试：航行位置初始化 ===');
    
    const game = createMockGame();
    const dock = setupDockWithShip(game);
    
    const ship = dock.getShips()[0];
    const destinationId = 'resourceIsland';
    
    console.log(`船只列表:`, dock.getShips());
    console.log(`船只ID:`, ship?.id);
    console.log(`停靠船只:`, dock.getDockedShips());
    console.log(`建筑列表:`, game.storage.getBuildings());
    
    let passed = true;
    
    if (dock.sailingShipPosition === null) {
        console.log('✅ 初始状态下航行位置为null');
    } else {
        console.log('❌ 初始状态下航行位置应为null');
        passed = false;
    }
    
    const startPos = dock.getDockedShipPosition(ship.id);
    const targetPos = dock.getIslandPosition(destinationId);
    console.log(`起始位置:`, startPos);
    console.log(`目标位置:`, targetPos);
    
    const sailResult = dock.startSail(destinationId, ship.id);
    console.log(`startSail 结果:`, sailResult);
    
    if (dock.sailingShipStartPos !== null) {
        console.log(`✅ 出发后起始位置已设置: (${Math.round(dock.sailingShipStartPos.x)}, ${Math.round(dock.sailingShipStartPos.y)})`);
    } else {
        console.log('❌ 出发后起始位置应为非null');
        passed = false;
    }
    
    if (dock.sailingShipTargetPos !== null) {
        console.log(`✅ 出发后目标位置已设置: (${Math.round(dock.sailingShipTargetPos.x)}, ${Math.round(dock.sailingShipTargetPos.y)})`);
    } else {
        console.log('❌ 出发后目标位置应为非null');
        passed = false;
    }
    
    if (dock.sailingShipPosition !== null) {
        console.log(`✅ 出发后当前位置已设置: (${Math.round(dock.sailingShipPosition.x)}, ${Math.round(dock.sailingShipPosition.y)})`);
    } else {
        console.log('❌ 出发后当前位置应为非null');
        passed = false;
    }
    
    if (dock.sailingShipStartPos && dock.sailingShipPosition) {
        const dist = Math.sqrt(
            Math.pow(dock.sailingShipStartPos.x - dock.sailingShipPosition.x, 2) +
            Math.pow(dock.sailingShipStartPos.y - dock.sailingShipPosition.y, 2)
        );
        if (dist < 1) {
            console.log('✅ 出发时当前位置等于起始位置');
        } else {
            console.log('❌ 出发时当前位置应等于起始位置');
            passed = false;
        }
    }
    
    return passed;
}

function testShipMovementDuringSailing() {
    console.log('\n=== 测试：航行过程中船只移动 ===');
    
    const game = createMockGame();
    const dock = setupDockWithShip(game);
    
    const ship = dock.getShips()[0];
    const destinationId = 'resourceIsland';
    
    let passed = true;
    
    dock.startSail(destinationId, ship.id);
    
    const initialPos = { ...dock.sailingShipPosition };
    
    dock.sailStartTime = Date.now() - 5000;
    
    const totalUpdates = 10;
    const dt = 0.16;
    
    for (let i = 0; i < totalUpdates; i++) {
        dock.update(dt);
    }
    
    if (dock.sailingShipPosition) {
        const dist = Math.sqrt(
            Math.pow(initialPos.x - dock.sailingShipPosition.x, 2) +
            Math.pow(initialPos.y - dock.sailingShipPosition.y, 2)
        );
        
        if (dist > 10) {
            console.log(`✅ 船只已移动: 距离变化 ${Math.round(dist)} 像素`);
        } else {
            console.log(`❌ 船只移动距离过小: 仅 ${Math.round(dist)} 像素`);
            passed = false;
        }
        
        const targetDist = Math.sqrt(
            Math.pow(dock.sailingShipTargetPos.x - dock.sailingShipPosition.x, 2) +
            Math.pow(dock.sailingShipTargetPos.y - dock.sailingShipPosition.y, 2)
        );
        
        const startDist = Math.sqrt(
            Math.pow(dock.sailingShipTargetPos.x - dock.sailingShipStartPos.x, 2) +
            Math.pow(dock.sailingShipTargetPos.y - dock.sailingShipStartPos.y, 2)
        );
        
        if (targetDist < startDist) {
            console.log(`✅ 船只正在靠近目标: 剩余距离 ${Math.round(targetDist)} / ${Math.round(startDist)}`);
        } else {
            console.log(`❌ 船只未靠近目标`);
            passed = false;
        }
    }
    
    return passed;
}

function testEaseInOutQuadFunction() {
    console.log('\n=== 测试：缓动函数 ===');
    
    const game = createMockGame();
    const dock = new Dock(game);
    
    let passed = true;
    
    if (dock.easeInOutQuad(0) === 0) {
        console.log('✅ t=0 时返回0');
    } else {
        console.log(`❌ t=0 时应返回0，实际返回 ${dock.easeInOutQuad(0)}`);
        passed = false;
    }
    
    if (dock.easeInOutQuad(1) === 1) {
        console.log('✅ t=1 时返回1');
    } else {
        console.log(`❌ t=1 时应返回1，实际返回 ${dock.easeInOutQuad(1)}`);
        passed = false;
    }
    
    const midValue = dock.easeInOutQuad(0.5);
    if (midValue === 0.5) {
        console.log(`✅ t=0.5 时返回 ${midValue.toFixed(4)}`);
    } else {
        console.log(`❌ t=0.5 时应等于0.5，实际返回 ${midValue.toFixed(4)}`);
        passed = false;
    }
    
    const t1 = dock.easeInOutQuad(0.25);
    const t2 = dock.easeInOutQuad(0.75);
    if (t1 < t2) {
        console.log(`✅ 递增性验证: t=0.25 返回 ${t1.toFixed(4)}, t=0.75 返回 ${t2.toFixed(4)}`);
    } else {
        console.log(`❌ 函数应该递增`);
        passed = false;
    }
    
    return passed;
}

function testSailingStateResetOnComplete() {
    console.log('\n=== 测试：航行完成后状态重置 ===');
    
    const game = createMockGame();
    const dock = setupDockWithShip(game);
    
    const ship = dock.getShips()[0];
    const destinationId = 'resourceIsland';
    
    let passed = true;
    
    dock.startSail(destinationId, ship.id);
    
    if (dock.isSailing) {
        console.log('✅ 航行中 isSailing 为true');
    } else {
        console.log('❌ 航行中 isSailing 应为true');
        passed = false;
    }
    
    dock.completeSail(destinationId, ship.id);
    
    if (!dock.isSailing) {
        console.log('✅ 完成后 isSailing 为false');
    } else {
        console.log('❌ 完成后 isSailing 应为false');
        passed = false;
    }
    
    if (dock.sailingShipPosition === null) {
        console.log('✅ 完成后航行位置为null');
    } else {
        console.log('❌ 完成后航行位置应为null');
        passed = false;
    }
    
    if (dock.sailingShipStartPos === null) {
        console.log('✅ 完成后起始位置为null');
    } else {
        console.log('❌ 完成后起始位置应为null');
        passed = false;
    }
    
    if (dock.sailingShipTargetPos === null) {
        console.log('✅ 完成后目标位置为null');
    } else {
        console.log('❌ 完成后目标位置应为null');
        passed = false;
    }
    
    if (ship.isDocked) {
        console.log('✅ 完成后船只已停靠');
    } else {
        console.log('❌ 完成后船只应停靠');
        passed = false;
    }
    
    return passed;
}

function testUpdateWithNoActiveSailing() {
    console.log('\n=== 测试：无航行时update方法 ===');
    
    const game = createMockGame();
    const dock = setupDockWithShip(game);
    
    let passed = true;
    
    try {
        dock.update(0.16);
        console.log('✅ 无航行时update方法正常执行');
    } catch (e) {
        console.log(`❌ 无航行时update方法抛出异常: ${e.message}`);
        passed = false;
    }
    
    return passed;
}

function runAllTests() {
    console.log('='.repeat(60));
    console.log('🚢 船只航行动画测试套件');
    console.log('='.repeat(60));
    
    const tests = [
        { name: '航行位置初始化', fn: testSailingPositionInitialization },
        { name: '航行过程中船只移动', fn: testShipMovementDuringSailing },
        { name: '缓动函数', fn: testEaseInOutQuadFunction },
        { name: '航行完成后状态重置', fn: testSailingStateResetOnComplete },
        { name: '无航行时update方法', fn: testUpdateWithNoActiveSailing }
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
        console.log('\n🎉 所有船只航行动画测试通过！');
        process.exit(0);
    } else {
        console.log('\n⚠️ 部分测试失败，请检查代码');
        process.exit(1);
    }
}

runAllTests();
