function setupGlobalMock() {
    global.document = {
        createElement: (tag) => {
            const element = {
                tagName: tag.toUpperCase(),
                className: '',
                id: '',
                style: {},
                textContent: '',
                dataset: {},
                innerHTML: '',
                appendChild: () => {},
                remove: () => {},
                querySelector: () => null,
                querySelectorAll: () => [],
                getElementsByTagName: () => [],
                addEventListener: () => {},
                removeEventListener: () => {},
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
                contains: () => true
            };
            if (tag === 'button') {
                element.onclick = null;
                element.onmouseenter = null;
                element.onmouseleave = null;
            }
            return element;
        },
        body: { appendChild: () => {}, removeChild: () => {} },
        getElementById: (id) => {
            if (id === 'game-canvas') {
                return {
                    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
                    classList: { add: () => {}, remove: () => {} }
                };
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
        localStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {}
        },
        game: null
    };
    
    global.localStorage = global.window.localStorage;
    
    global.setTimeout = (fn, delay) => { if (delay === 0 || delay === undefined) fn(); return 0; };
    global.clearTimeout = () => {};
    global.setInterval = () => 0;
    global.clearInterval = () => {};
    global.performance = { now: () => Date.now() };
    global.requestAnimationFrame = (fn) => { fn(); return 0; };
}

setupGlobalMock();

async function testEnemyTargetNearestBuilding() {
    console.log('=== 测试怪物识别最近建筑 ===');
    
    const mockGame = {
        terrain: {
            getIslandCenter: () => ({ x: 400, y: 300 }),
            isOnIsland: () => true
        },
        storage: {
            getBuildings: () => [
                { id: 'building1', x: 200, y: 200, health: 100 },
                { id: 'building2', x: 500, y: 500, health: 100 },
                { id: 'building3', x: 300, y: 300, health: 100 }
            ],
            getFarmPlots: () => []
        },
        resourceManager: {
            addResource: () => {}
        },
        showToast: () => {},
        enemyManager: {
            removeEnemy: () => {}
        }
    };
    
    const { Enemy } = await import('../src/modules/Enemy.js');
    const enemy = new Enemy(mockGame, 150, 150);
    
    enemy.update(0.1);
    
    console.log('✓ 怪物目标识别测试完成');
    console.log(`  - 怪物位置: (${enemy.x}, ${enemy.y})`);
    console.log(`  - 最近建筑: building1 (200,200)，距离约 70.7`);
    console.log(`  - 选中目标: ${enemy.target ? enemy.target.id : '无'}`);
    console.log(`  - 目标类型: ${enemy.target ? enemy.target.type : '无'}`);
    
    const success = enemy.target && enemy.target.id === 'building1';
    console.log(`  - 测试结果: ${success ? '通过 ✓' : '失败 ✗'}`);
    
    return success;
}

async function testEnemyTargetNearestFarm() {
    console.log('=== 测试怪物识别最近农田 ===');
    
    const mockGame = {
        terrain: {
            getIslandCenter: () => ({ x: 400, y: 300 }),
            isOnIsland: () => true,
            landRenderer: {
                farmOffsetX: 100,
                farmOffsetY: 100,
                plotSize: 50,
                plotGap: 10
            }
        },
        storage: {
            getBuildings: () => [],
            getFarmPlots: () => [
                { id: 'plot1', col: 0, row: 0, crop: 'wheat', isReady: false },
                { id: 'plot2', col: 3, row: 3, crop: 'corn', isReady: false },
                { id: 'plot3', col: 1, row: 1, crop: 'carrot', isReady: false }
            ],
            destroyCrop: () => {}
        },
        resourceManager: {
            addResource: () => {}
        },
        showToast: () => {},
        enemyManager: {
            removeEnemy: () => {}
        }
    };
    
    const { Enemy } = await import('../src/modules/Enemy.js');
    const enemy = new Enemy(mockGame, 130, 130);
    
    enemy.update(0.1);
    
    console.log('✓ 怪物农田目标识别测试完成');
    console.log(`  - 怪物位置: (${enemy.x}, ${enemy.y})`);
    console.log(`  - plot1位置: (125, 125)，距离最近`);
    console.log(`  - 选中目标: ${enemy.target ? enemy.target.id : '无'}`);
    console.log(`  - 目标类型: ${enemy.target ? enemy.target.type : '无'}`);
    
    const success = enemy.target && enemy.target.id === 'plot1';
    console.log(`  - 测试结果: ${success ? '通过 ✓' : '失败 ✗'}`);
    
    return success;
}

async function testEnemyChooseNearestBetweenBuildingAndFarm() {
    console.log('=== 测试怪物在建筑和农田间选择最近目标 ===');
    
    const mockGame = {
        terrain: {
            getIslandCenter: () => ({ x: 400, y: 300 }),
            isOnIsland: () => true,
            landRenderer: {
                farmOffsetX: 100,
                farmOffsetY: 100,
                plotSize: 50,
                plotGap: 10
            }
        },
        storage: {
            getBuildings: () => [
                { id: 'building1', x: 300, y: 300, health: 100 }
            ],
            getFarmPlots: () => [
                { id: 'plot1', col: 2, row: 2, crop: 'wheat', isReady: false }
            ]
        },
        resourceManager: {
            addResource: () => {}
        },
        showToast: () => {},
        enemyManager: {
            removeEnemy: () => {}
        }
    };
    
    const { Enemy } = await import('../src/modules/Enemy.js');
    const enemy = new Enemy(mockGame, 200, 200);
    
    enemy.update(0.1);
    
    console.log('✓ 怪物目标选择测试完成');
    console.log(`  - 怪物位置: (${enemy.x}, ${enemy.y})`);
    console.log(`  - 建筑位置: (300, 300)，距离约 141.4`);
    console.log(`  - 农田位置: (225, 225)，距离约 35.4`);
    console.log(`  - 选中目标: ${enemy.target ? enemy.target.id : '无'}`);
    console.log(`  - 目标类型: ${enemy.target ? enemy.target.type : '无'}`);
    
    const success = enemy.target && enemy.target.id === 'plot1' && enemy.target.type === 'farm';
    console.log(`  - 测试结果: ${success ? '通过 ✓' : '失败 ✗'}`);
    
    return success;
}

async function testEnemyMoveToBuildingAndAttack() {
    console.log('=== 测试怪物移动到建筑并攻击 ===');
    
    let damageCalled = false;
    let damageAmount = 0;
    
    const mockGame = {
        terrain: {
            getIslandCenter: () => ({ x: 400, y: 300 }),
            isOnIsland: () => true
        },
        storage: {
            getBuildings: () => [
                { id: 'target_building', x: 200, y: 200, health: 100 }
            ],
            getFarmPlots: () => [],
            getBuildingById: (id) => ({ id: 'target_building', x: 200, y: 200, health: 80 }),
            damageBuilding: (id, amount) => {
                damageCalled = true;
                damageAmount = amount;
                return { destroyed: false, health: 80 };
            }
        },
        resourceManager: {
            addResource: () => {}
        },
        showToast: (msg) => {
            console.log(`    Toast: ${msg}`);
        },
        enemyManager: {
            removeEnemy: () => {}
        }
    };
    
    const { Enemy } = await import('../src/modules/Enemy.js');
    const enemy = new Enemy(mockGame, 100, 100);
    
    console.log(`  - 初始位置: (${enemy.x}, ${enemy.y})`);
    
    for (let i = 0; i < 50; i++) {
        enemy.update(0.1);
    }
    
    console.log(`  - 更新50次后位置: (${Math.round(enemy.x)}, ${Math.round(enemy.y)})`);
    console.log(`  - 目标: ${enemy.target ? enemy.target.id : '无'}`);
    console.log(`  - 攻击触发: ${damageCalled}`);
    console.log(`  - 攻击伤害: ${damageAmount}`);
    
    const success = damageCalled && damageAmount === 8;
    console.log(`  - 测试结果: ${success ? '通过 ✓' : '失败 ✗'}`);
    
    return success;
}

async function testEnemyMoveToFarmAndDestroyCrop() {
    console.log('=== 测试怪物移动到农田并破坏作物 ===');
    
    let cropDestroyed = false;
    
    const mockGame = {
        terrain: {
            getIslandCenter: () => ({ x: 400, y: 300 }),
            isOnIsland: () => true,
            landRenderer: {
                farmOffsetX: 100,
                farmOffsetY: 100,
                plotSize: 50,
                plotGap: 10
            }
        },
        storage: {
            getBuildings: () => [],
            getFarmPlots: () => [
                { id: 'target_plot', col: 1, row: 1, crop: 'wheat', isReady: false }
            ],
            destroyCrop: (id) => {
                cropDestroyed = true;
                return true;
            }
        },
        resourceManager: {
            addResource: () => {}
        },
        showToast: (msg) => {
            console.log(`    Toast: ${msg}`);
        },
        enemyManager: {
            removeEnemy: () => {}
        }
    };
    
    const { Enemy } = await import('../src/modules/Enemy.js');
    const enemy = new Enemy(mockGame, 50, 50);
    
    console.log(`  - 初始位置: (${enemy.x}, ${enemy.y})`);
    
    for (let i = 0; i < 50; i++) {
        enemy.update(0.1);
    }
    
    console.log(`  - 更新50次后位置: (${Math.round(enemy.x)}, ${Math.round(enemy.y)})`);
    console.log(`  - 目标: ${enemy.target ? enemy.target.id : '无'}`);
    console.log(`  - 作物破坏触发: ${cropDestroyed}`);
    
    const success = cropDestroyed;
    console.log(`  - 测试结果: ${success ? '通过 ✓' : '失败 ✗'}`);
    
    return success;
}

async function testEnemyNoTargetBehavior() {
    console.log('=== 测试怪物无目标时行为 ===');
    
    const mockGame = {
        terrain: {
            getIslandCenter: () => ({ x: 400, y: 300 }),
            isOnIsland: () => true
        },
        storage: {
            getBuildings: () => [],
            getFarmPlots: () => []
        },
        resourceManager: {
            addResource: () => {}
        },
        showToast: () => {},
        enemyManager: {
            removeEnemy: () => {}
        }
    };
    
    const { Enemy } = await import('../src/modules/Enemy.js');
    const enemy = new Enemy(mockGame, 200, 200);
    
    const initialX = enemy.x;
    const initialY = enemy.y;
    
    enemy.update(0.1);
    
    console.log('✓ 怪物无目标行为测试完成');
    console.log(`  - 初始位置: (${initialX}, ${initialY})`);
    console.log(`  - 更新后位置: (${enemy.x}, ${enemy.y})`);
    console.log(`  - 目标: ${enemy.target ? enemy.target.id : '无'}`);
    
    const success = enemy.target === null && enemy.x === initialX && enemy.y === initialY;
    console.log(`  - 测试结果: ${success ? '通过 ✓' : '失败 ✗'}`);
    
    return success;
}

async function runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('测试：怪物目标识别与攻击功能');
    console.log('='.repeat(60) + '\n');
    
    let allPassed = true;
    
    try {
        allPassed = await testEnemyTargetNearestBuilding() && allPassed;
        console.log('');
        
        allPassed = await testEnemyTargetNearestFarm() && allPassed;
        console.log('');
        
        allPassed = await testEnemyChooseNearestBetweenBuildingAndFarm() && allPassed;
        console.log('');
        
        allPassed = await testEnemyMoveToBuildingAndAttack() && allPassed;
        console.log('');
        
        allPassed = await testEnemyMoveToFarmAndDestroyCrop() && allPassed;
        console.log('');
        
        allPassed = await testEnemyNoTargetBehavior() && allPassed;
        console.log('');
        
        console.log('='.repeat(60));
        if (allPassed) {
            console.log('✓ 所有怪物目标识别与攻击测试通过！');
        } else {
            console.log('✗ 部分测试失败！');
        }
        console.log('='.repeat(60) + '\n');
        
        return allPassed;
    } catch (error) {
        console.error('✗ 测试失败:', error.message);
        console.error(error.stack);
        return false;
    }
}

const modulePath = new URL(import.meta.url).pathname;
const resolvedPath = decodeURIComponent(modulePath).replace(/^\/([A-Za-z]):\//, '$1:/');

if (resolvedPath === process.argv[1] || process.argv[1].endsWith('test_enemy_targeting.js')) {
    runAllTests();
}

export { 
    testEnemyTargetNearestBuilding,
    testEnemyTargetNearestFarm,
    testEnemyChooseNearestBetweenBuildingAndFarm,
    testEnemyMoveToBuildingAndAttack,
    testEnemyMoveToFarmAndDestroyCrop,
    testEnemyNoTargetBehavior,
    runAllTests 
};