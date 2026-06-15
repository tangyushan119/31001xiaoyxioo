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

async function testEnemyDeathFlag() {
    console.log('=== 测试怪物死亡标志设置 ===');
    
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
    const enemy = new Enemy(mockGame, 100, 100);
    
    console.log(`  - 初始isDead状态: ${enemy.isDead}`);
    
    enemy.takeDamage(100);
    console.log(`  - 受到100伤害后isDead状态: ${enemy.isDead}`);
    
    const result = enemy.isDead === true;
    console.log(`  ✓ 测试${result ? '通过' : '失败'}`);
    
    return result;
}

async function testEnemyDeathPreventDoubleCall() {
    console.log('=== 测试防止重复调用die()方法 ===');
    
    let dieCallCount = 0;
    
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
                if (type === 'gold') {
                    dieCallCount++;
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
    
    enemy.takeDamage(100);
    enemy.die();
    enemy.die();
    
    console.log(`  - die()调用次数: ${dieCallCount}`);
    
    const result = dieCallCount === 1;
    console.log(`  ✓ 测试${result ? '通过' : '失败'}`);
    
    return result;
}

async function testEnemyDeathResourceReward() {
    console.log('=== 测试怪物死亡资源奖励 ===');
    
    let goldAdded = 0;
    
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
                if (type === 'gold') {
                    goldAdded += amount;
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
    
    enemy.takeDamage(100);
    
    console.log(`  - 击杀获得金币: ${goldAdded}`);
    
    const result = goldAdded === 10;
    console.log(`  ✓ 测试${result ? '通过' : '失败'}`);
    
    return result;
}

async function testEnemyRemoveFromManager() {
    console.log('=== 测试怪物死亡后从管理器移除 ===');
    
    const enemies = [];
    let removedId = null;
    
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
            removeEnemy: (id) => {
                removedId = id;
            }
        }
    };
    
    const { Enemy } = await import('../src/modules/Enemy.js');
    const enemy = new Enemy(mockGame, 100, 100);
    const enemyId = enemy.id;
    
    enemies.push(enemy);
    console.log(`  - 初始敌人列表数量: ${enemies.length}`);
    
    enemy.takeDamage(100);
    
    console.log(`  - 移除的敌人ID: ${removedId}`);
    console.log(`  - 移除的ID是否匹配: ${removedId === enemyId}`);
    
    const result = removedId === enemyId;
    console.log(`  ✓ 测试${result ? '通过' : '失败'}`);
    
    return result;
}

async function testTurretIgnoreDeadEnemy() {
    console.log('=== 测试炮塔忽略已死亡怪物 ===');
    
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
            getEnemies: () => [deadEnemy],
            removeEnemy: () => {}
        }
    };
    
    const { Enemy } = await import('../src/modules/Enemy.js');
    const deadEnemy = new Enemy(mockGame, 100, 100);
    deadEnemy.isDead = true;
    
    const { Turret } = await import('../src/modules/Turret.js');
    const turret = new Turret(mockGame, 200, 200, 'machineGun');
    
    turret.findTarget();
    
    console.log(`  - 炮塔目标: ${turret.target ? '有' : '无'}`);
    
    const result = turret.target === null;
    console.log(`  ✓ 测试${result ? '通过' : '失败'}`);
    
    return result;
}

async function testTurretAttackDeadEnemy() {
    console.log('=== 测试炮塔不攻击已死亡怪物 ===');
    
    let attackCalled = false;
    
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
            getEnemies: () => [deadEnemy],
            removeEnemy: () => {}
        }
    };
    
    const { Enemy } = await import('../src/modules/Enemy.js');
    const deadEnemy = new Enemy(mockGame, 100, 100);
    deadEnemy.isDead = true;
    
    const { Turret } = await import('../src/modules/Turret.js');
    const turret = new Turret(mockGame, 200, 200, 'machineGun');
    turret.target = deadEnemy;
    
    const originalFireBullets = turret.fireBullets.bind(turret);
    turret.fireBullets = () => {
        attackCalled = true;
        originalFireBullets();
    };
    
    turret.attack();
    
    console.log(`  - 炮塔是否尝试攻击死亡怪物: ${attackCalled}`);
    
    const result = attackCalled === false;
    console.log(`  ✓ 测试${result ? '通过' : '失败'}`);
    
    return result;
}

async function testProjectileIgnoreDeadEnemy() {
    console.log('=== 测试子弹忽略已死亡怪物 ===');
    
    let damageCalled = false;
    
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
            getEnemies: () => [deadEnemy],
            removeEnemy: () => {}
        }
    };
    
    const { Enemy } = await import('../src/modules/Enemy.js');
    const deadEnemy = new Enemy(mockGame, 150, 150);
    deadEnemy.isDead = true;
    deadEnemy.takeDamage = () => {
        damageCalled = true;
    };
    
    const { Turret } = await import('../src/modules/Turret.js');
    const turret = new Turret(mockGame, 100, 100, 'machineGun');
    
    turret.projectiles.push({
        x: 100,
        y: 100,
        vx: 1,
        vy: 1,
        color: '#ff4444',
        size: 5,
        damage: 10
    });
    
    turret.updateProjectiles(0.1);
    
    console.log(`  - 子弹是否对死亡怪物造成伤害: ${damageCalled}`);
    
    const result = damageCalled === false;
    console.log(`  ✓ 测试${result ? '通过' : '失败'}`);
    
    return result;
}

async function runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('测试：怪物死亡处理逻辑');
    console.log('='.repeat(60) + '\n');
    
    let allPassed = true;
    
    try {
        allPassed = await testEnemyDeathFlag() && allPassed;
        console.log('');
        allPassed = await testEnemyDeathPreventDoubleCall() && allPassed;
        console.log('');
        allPassed = await testEnemyDeathResourceReward() && allPassed;
        console.log('');
        allPassed = await testEnemyRemoveFromManager() && allPassed;
        console.log('');
        allPassed = await testTurretIgnoreDeadEnemy() && allPassed;
        console.log('');
        allPassed = await testTurretAttackDeadEnemy() && allPassed;
        console.log('');
        allPassed = await testProjectileIgnoreDeadEnemy() && allPassed;
        console.log('');
        
        console.log('='.repeat(60));
        if (allPassed) {
            console.log('✓ 所有怪物死亡处理测试通过！');
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

if (resolvedPath === process.argv[1] || process.argv[1].endsWith('test_enemy_death.js')) {
    runAllTests();
}

export { 
    testEnemyDeathFlag,
    testEnemyDeathPreventDoubleCall,
    testEnemyDeathResourceReward,
    testEnemyRemoveFromManager,
    testTurretIgnoreDeadEnemy,
    testTurretAttackDeadEnemy,
    testProjectileIgnoreDeadEnemy,
    runAllTests 
};