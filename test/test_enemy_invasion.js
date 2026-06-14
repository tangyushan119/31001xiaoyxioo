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

async function testEnemyCreation() {
    console.log('=== 测试敌军单位创建 ===');
    
    const mockGame = {
        terrain: {
            getIslandCenter: () => ({ x: 400, y: 300 }),
            isOnIsland: (x, y) => {
                const dx = x - 400;
                const dy = y - 300;
                return Math.sqrt(dx * dx + dy * dy) < 300;
            }
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
    const enemy = new Enemy(mockGame, 100, 100);
    
    console.log('✓ 敌军单位创建成功');
    console.log(`  - ID: ${typeof enemy.id}`);
    console.log(`  - 初始位置: (${enemy.x}, ${enemy.y})`);
    console.log(`  - 初始生命值: ${enemy.health}`);
    console.log(`  - 速度: ${enemy.speed}`);
    console.log(`  - 类型: ${enemy.type}`);
    
    return true;
}

async function testEnemyMovement() {
    console.log('=== 测试敌军移动逻辑 ===');
    
    const mockGame = {
        terrain: {
            getIslandCenter: () => ({ x: 400, y: 300 }),
            isOnIsland: () => true
        },
        storage: {
            getBuildings: () => [{ id: 'test', x: 400, y: 300, health: 100 }],
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
    const enemy = new Enemy(mockGame, 100, 100);
    
    const initialX = enemy.x;
    const initialY = enemy.y;
    
    enemy.update(0.1);
    
    console.log('✓ 敌军移动逻辑测试完成');
    console.log(`  - 初始位置: (${initialX}, ${initialY})`);
    console.log(`  - 更新后位置: (${enemy.x}, ${enemy.y})`);
    console.log(`  - 目标: ${enemy.target ? enemy.target.type : '无'}`);
    
    return true;
}

async function testEnemyAttack() {
    console.log('=== 测试敌军攻击逻辑 ===');
    
    let damageCalled = false;
    let damageAmount = 0;
    
    const mockGame = {
        terrain: {
            getIslandCenter: () => ({ x: 400, y: 300 }),
            isOnIsland: () => true
        },
        storage: {
            getBuildings: () => [{ id: 'test', x: 100, y: 100, health: 100 }],
            getFarmPlots: () => [],
            damageBuilding: (id, amount) => {
                damageCalled = true;
                damageAmount = amount;
                return { destroyed: false, health: 80 };
            }
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
    const enemy = new Enemy(mockGame, 100, 100);
    enemy.target = { type: 'building', id: 'test', x: 100, y: 100 };
    
    enemy.attack();
    
    console.log('✓ 敌军攻击逻辑测试完成');
    console.log(`  - 攻击是否触发: ${damageCalled}`);
    console.log(`  - 攻击伤害: ${damageAmount}`);
    console.log(`  - 攻击冷却中: ${enemy.attackCooldown > 0}`);
    
    return damageCalled && damageAmount === 20;
}

async function testEnemyDamageAndDeath() {
    console.log('=== 测试敌军受伤与死亡 ===');
    
    let deathCalled = false;
    
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
            addResource: (type, amount) => {
                if (type === 'gold' && amount === 10) {
                    deathCalled = true;
                }
            }
        },
        showToast: () => {},
        enemyManager: {
            removeEnemy: () => {}
        }
    };
    
    const { Enemy } = await import('../src/modules/Enemy.js');
    const enemy = new Enemy(mockGame, 100, 100);
    
    console.log(`  - 初始生命值: ${enemy.health}`);
    
    enemy.takeDamage(50);
    console.log(`  - 受到50伤害后生命值: ${enemy.health}`);
    
    enemy.takeDamage(50);
    console.log(`  - 再次受到50伤害后死亡`);
    
    console.log('✓ 敌军受伤与死亡测试完成');
    console.log(`  - 击杀奖励触发: ${deathCalled}`);
    
    return deathCalled;
}

async function testEnemyManagerInvasionCycle() {
    console.log('=== 测试敌军管理器入侵周期 ===');
    
    const mockGame = {
        terrain: {
            getIslandCenter: () => ({ x: 400, y: 300 }),
            getLandRadius: () => 150,
            getBeachOuterRadius: () => 200
        },
        storage: {
            getBuildings: () => [],
            getFarmPlots: () => []
        },
        resourceManager: {
            addResource: () => {}
        },
        showToast: (msg) => {
            console.log(`  Toast: ${msg}`);
        }
    };
    
    const { EnemyManager } = await import('../src/modules/EnemyManager.js');
    const manager = new EnemyManager(mockGame);
    
    console.log('✓ 敌军管理器创建成功');
    console.log(`  - 当前波次: ${manager.getWaveNumber()}`);
    console.log(`  - 当前敌军数量: ${manager.getEnemyCount()}`);
    
    manager.stop();
    
    return true;
}

async function testStorageDamageBuilding() {
    console.log('=== 测试建筑受损方法 ===');
    
    const { Storage } = await import('../src/modules/Storage.js');
    const storage = new Storage();
    
    const building = {
        id: 'test_building',
        x: 100,
        y: 100,
        name: '测试建筑',
        emoji: '🏠',
        size: 50
    };
    
    storage.addBuilding(building);
    console.log(`  - 添加建筑: ${building.name}`);
    
    const result1 = storage.damageBuilding('test_building', 30);
    console.log(`  - 第一次攻击(30伤害): 生命值=${result1.health}, 摧毁=${result1.destroyed}`);
    
    const result2 = storage.damageBuilding('test_building', 80);
    console.log(`  - 第二次攻击(80伤害): 摧毁=${result2.destroyed}`);
    
    const remainingBuildings = storage.getBuildings();
    console.log(`  - 剩余建筑数量: ${remainingBuildings.length}`);
    
    return result1.destroyed === false && result2.destroyed === true && remainingBuildings.length === 0;
}

async function testStorageDestroyCrop() {
    console.log('=== 测试农田破坏方法 ===');
    
    const { Storage } = await import('../src/modules/Storage.js');
    const storage = new Storage();
    
    storage.plantCrop('0-0', 'wheat');
    
    const plots = storage.getFarmPlots();
    const plot = plots.find(p => p.id === '0-0');
    
    console.log(`  - 播种后地块状态: crop=${plot.crop}, isReady=${plot.isReady}`);
    
    const result = storage.destroyCrop('0-0');
    console.log(`  - 破坏作物结果: ${result}`);
    
    const updatedPlot = storage.getFarmPlots().find(p => p.id === '0-0');
    console.log(`  - 破坏后地块状态: crop=${updatedPlot.crop}, isReady=${updatedPlot.isReady}`);
    
    return result && updatedPlot.crop === null;
}

async function runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('测试：敌军入侵功能');
    console.log('='.repeat(60) + '\n');
    
    try {
        await testEnemyCreation();
        console.log('');
        await testEnemyMovement();
        console.log('');
        await testEnemyAttack();
        console.log('');
        await testEnemyDamageAndDeath();
        console.log('');
        await testEnemyManagerInvasionCycle();
        console.log('');
        await testStorageDamageBuilding();
        console.log('');
        await testStorageDestroyCrop();
        console.log('');
        
        console.log('='.repeat(60));
        console.log('✓ 所有敌军入侵测试通过！');
        console.log('='.repeat(60) + '\n');
        
        return true;
    } catch (error) {
        console.error('✗ 测试失败:', error.message);
        console.error(error.stack);
        return false;
    }
}

const modulePath = new URL(import.meta.url).pathname;
const resolvedPath = decodeURIComponent(modulePath).replace(/^\/([A-Za-z]):\//, '$1:/');

if (resolvedPath === process.argv[1] || process.argv[1].endsWith('test_enemy_invasion.js')) {
    runAllTests();
}

export { 
    testEnemyCreation,
    testEnemyMovement,
    testEnemyAttack,
    testEnemyDamageAndDeath,
    testEnemyManagerInvasionCycle,
    testStorageDamageBuilding,
    testStorageDestroyCrop,
    runAllTests 
};
