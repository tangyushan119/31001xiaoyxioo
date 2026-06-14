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

async function testEnemyPathfindingToBuilding() {
    console.log('=== 测试怪物寻路到建筑 ===');
    
    const mockGame = {
        terrain: {
            getIslandCenter: () => ({ x: 400, y: 300 }),
            isOnIsland: () => true
        },
        storage: {
            getBuildings: () => [
                { id: 'target_building', x: 400, y: 300, health: 100 }
            ],
            getFarmPlots: () => [],
            getBuildingById: (id) => ({ id: 'target_building', x: 400, y: 300, health: 100 }),
            damageBuilding: () => ({ destroyed: false, health: 92 })
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
    
    console.log(`  - 怪物初始位置: (${enemy.x}, ${enemy.y})`);
    console.log(`  - 目标建筑位置: (400, 300)`);
    
    let reachedTarget = false;
    let moveCount = 0;
    
    for (let i = 0; i < 100; i++) {
        enemy.update(0.1);
        moveCount++;
        
        const dx = enemy.x - 400;
        const dy = enemy.y - 300;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= enemy.attackRange) {
            reachedTarget = true;
            break;
        }
    }
    
    console.log(`  - 到达目标所需更新次数: ${moveCount}`);
    console.log(`  - 最终位置: (${Math.round(enemy.x)}, ${Math.round(enemy.y)})`);
    console.log(`  - 是否到达攻击范围: ${reachedTarget}`);
    console.log(`  - 当前目标: ${enemy.target ? enemy.target.id : '无'}`);
    
    const success = reachedTarget && enemy.target && enemy.target.id === 'target_building';
    console.log(`  - 测试结果: ${success ? '通过 ✓' : '失败 ✗'}`);
    
    return success;
}

async function testEnemyAttackBuildingComplete() {
    console.log('=== 测试怪物完整攻击建筑流程 ===');
    
    let damageLog = [];
    let buildingDestroyed = false;
    
    const mockGame = {
        terrain: {
            getIslandCenter: () => ({ x: 400, y: 300 }),
            isOnIsland: () => true
        },
        storage: {
            buildings: [{ id: 'target', x: 200, y: 200, health: 50, maxHealth: 50 }],
            getBuildings: function() { return this.buildings; },
            getFarmPlots: () => [],
            getBuildingById: function(id) { return this.buildings.find(b => b.id === id); },
            damageBuilding: function(id, amount) {
                const building = this.buildings.find(b => b.id === id);
                if (building) {
                    building.health -= amount;
                    damageLog.push({ id, amount, remainingHealth: building.health });
                    if (building.health <= 0) {
                        this.buildings = this.buildings.filter(b => b.id !== id);
                        buildingDestroyed = true;
                        return { destroyed: true, health: 0 };
                    }
                }
                return { destroyed: false, health: building ? building.health : 0 };
            }
        },
        resourceManager: {
            addResource: () => {}
        },
        showToast: (msg) => {
            if (!msg.includes('敌军')) console.log(`    Toast: ${msg}`);
        },
        enemyManager: {
            removeEnemy: () => {}
        }
    };
    
    const { Enemy } = await import('../src/modules/Enemy.js');
    const enemy = new Enemy(mockGame, 200, 200);
    
    console.log(`  - 初始建筑生命值: 50`);
    
    for (let i = 0; i < 20; i++) {
        enemy.update(0.5);
    }
    
    console.log(`  - 攻击日志:`);
    damageLog.forEach((log, index) => {
        console.log(`    攻击${index + 1}: 伤害=${log.amount}, 剩余生命=${log.remainingHealth}`);
    });
    console.log(`  - 建筑是否被摧毁: ${buildingDestroyed}`);
    
    const success = buildingDestroyed && damageLog.length === 7;
    console.log(`  - 测试结果: ${success ? '通过 ✓' : '失败 ✗'}`);
    
    return success;
}

async function testEnemyTargetSelectionPriority() {
    console.log('=== 测试怪物目标选择优先级 ===');
    
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
                { id: 'building_far', x: 500, y: 500, health: 100 },
                { id: 'building_near', x: 250, y: 250, health: 100 }
            ],
            getFarmPlots: () => [
                { id: 'plot_very_close', col: 2, row: 2, crop: 'wheat' }
            ],
            getBuildingById: (id) => ({ id, x: 250, y: 250, health: 100 }),
            damageBuilding: () => ({ destroyed: false, health: 92 }),
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
    const enemy = new Enemy(mockGame, 225, 225);
    
    enemy.update(0.1);
    
    console.log(`  - 怪物位置: (${enemy.x}, ${enemy.y})`);
    console.log(`  - 最近农田位置: (225, 225)，距离 0`);
    console.log(`  - 近建筑位置: (250, 250)，距离约 35.4`);
    console.log(`  - 远建筑位置: (500, 500)，距离约 388.9`);
    console.log(`  - 选中目标: ${enemy.target ? enemy.target.id : '无'}`);
    console.log(`  - 目标类型: ${enemy.target ? enemy.target.type : '无'}`);
    
    const success = enemy.target && enemy.target.id === 'plot_very_close' && enemy.target.type === 'farm';
    console.log(`  - 测试结果: ${success ? '通过 ✓' : '失败 ✗'}`);
    
    return success;
}

async function testEnemyPathfindingStraightLine() {
    console.log('=== 测试怪物直线寻路 ===');
    
    const mockGame = {
        terrain: {
            getIslandCenter: () => ({ x: 400, y: 300 }),
            isOnIsland: () => true
        },
        storage: {
            buildings: [
                { id: 'target', x: 350, y: 250, health: 100 }
            ],
            getBuildings: function() { return this.buildings; },
            getFarmPlots: () => [],
            getBuildingById: function(id) { return this.buildings.find(b => b.id === id); },
            damageBuilding: () => ({ destroyed: false, health: 92 })
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
    
    console.log(`  - 怪物初始位置: (${enemy.x}, ${enemy.y})`);
    console.log(`  - 目标建筑位置: (350, 250)`);
    
    const initialDistance = Math.sqrt((350 - 150) ** 2 + (250 - 150) ** 2);
    
    for (let i = 0; i < 80; i++) {
        enemy.update(0.1);
    }
    
    const finalDistance = Math.sqrt((350 - enemy.x) ** 2 + (250 - enemy.y) ** 2);
    const reachedTarget = finalDistance <= enemy.attackRange;
    const movedCloser = finalDistance < initialDistance;
    
    console.log(`  - 初始距离: ${Math.round(initialDistance)}`);
    console.log(`  - 最终位置: (${Math.round(enemy.x)}, ${Math.round(enemy.y)})`);
    console.log(`  - 最终距离: ${Math.round(finalDistance)}`);
    console.log(`  - 是否靠近目标: ${movedCloser}`);
    console.log(`  - 是否到达攻击范围: ${reachedTarget}`);
    
    const success = movedCloser && reachedTarget;
    console.log(`  - 测试结果: ${success ? '通过 ✓' : '失败 ✗'}`);
    
    return success;
}

async function testEnemyDeathAndReward() {
    console.log('=== 测试怪物死亡与奖励机制 ===');
    
    let rewardGiven = false;
    let rewardType = null;
    let rewardAmount = 0;
    let enemyRemoved = false;
    
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
                rewardGiven = true;
                rewardType = type;
                rewardAmount = amount;
            }
        },
        showToast: (msg) => {
            console.log(`    Toast: ${msg}`);
        },
        enemyManager: {
            removeEnemy: (id) => {
                enemyRemoved = true;
            }
        }
    };
    
    const { Enemy } = await import('../src/modules/Enemy.js');
    const enemy = new Enemy(mockGame, 200, 200);
    
    console.log(`  - 初始生命值: ${enemy.health}`);
    
    enemy.takeDamage(50);
    console.log(`  - 受到50伤害后生命值: ${enemy.health}`);
    
    enemy.takeDamage(60);
    console.log(`  - 死亡触发`);
    
    console.log(`  - 奖励是否发放: ${rewardGiven}`);
    console.log(`  - 奖励类型: ${rewardType}`);
    console.log(`  - 奖励数量: ${rewardAmount}`);
    console.log(`  - 怪物是否被移除: ${enemyRemoved}`);
    
    const success = rewardGiven && rewardType === 'gold' && rewardAmount === 10 && enemyRemoved;
    console.log(`  - 测试结果: ${success ? '通过 ✓' : '失败 ✗'}`);
    
    return success;
}

async function testEnemyTargetSwitching() {
    console.log('=== 测试怪物目标切换 ===');
    
    let targetSwitched = false;
    let initialTarget = null;
    
    const mockGame = {
        terrain: {
            getIslandCenter: () => ({ x: 400, y: 300 }),
            isOnIsland: () => true
        },
        storage: {
            buildings: [
                { id: 'building1', x: 300, y: 300, health: 100 },
                { id: 'building2', x: 100, y: 100, health: 100 }
            ],
            getBuildings: function() { return this.buildings; },
            getFarmPlots: () => [],
            getBuildingById: function(id) { return this.buildings.find(b => b.id === id); },
            damageBuilding: function(id, amount) {
                const building = this.buildings.find(b => b.id === id);
                if (building) {
                    building.health -= amount;
                    if (building.health <= 0) {
                        this.buildings = this.buildings.filter(b => b.id !== id);
                        return { destroyed: true, health: 0 };
                    }
                }
                return { destroyed: false, health: building ? building.health : 0 };
            }
        },
        resourceManager: {
            addResource: () => {}
        },
        showToast: (msg) => {
            if (msg.includes('摧毁')) console.log(`    Toast: ${msg}`);
        },
        enemyManager: {
            removeEnemy: () => {}
        }
    };
    
    const { Enemy } = await import('../src/modules/Enemy.js');
    const enemy = new Enemy(mockGame, 50, 50);
    
    enemy.update(0.1);
    initialTarget = enemy.target ? enemy.target.id : null;
    
    console.log(`  - 怪物位置: (${enemy.x}, ${enemy.y})`);
    console.log(`  - 初始目标: ${initialTarget}`);
    
    for (let i = 0; i < 80; i++) {
        enemy.update(0.1);
    }
    
    const finalTarget = enemy.target ? enemy.target.id : null;
    targetSwitched = initialTarget !== finalTarget && finalTarget !== null;
    
    console.log(`  - 最终目标: ${finalTarget}`);
    console.log(`  - 是否切换目标: ${targetSwitched}`);
    
    const success = initialTarget === 'building2' && finalTarget === 'building1' && targetSwitched;
    console.log(`  - 测试结果: ${success ? '通过 ✓' : '失败 ✗'}`);
    
    return success;
}

async function runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('测试：怪物攻击建筑与寻路功能');
    console.log('='.repeat(60) + '\n');
    
    let allPassed = true;
    
    try {
        allPassed = await testEnemyPathfindingToBuilding() && allPassed;
        console.log('');
        
        allPassed = await testEnemyAttackBuildingComplete() && allPassed;
        console.log('');
        
        allPassed = await testEnemyTargetSelectionPriority() && allPassed;
        console.log('');
        
        allPassed = await testEnemyPathfindingStraightLine() && allPassed;
        console.log('');
        
        allPassed = await testEnemyDeathAndReward() && allPassed;
        console.log('');
        
        allPassed = await testEnemyTargetSwitching() && allPassed;
        console.log('');
        
        console.log('='.repeat(60));
        if (allPassed) {
            console.log('✓ 所有怪物攻击建筑与寻路测试通过！');
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

if (resolvedPath === process.argv[1] || process.argv[1].endsWith('test_enemy_attack_navigation.js')) {
    runAllTests();
}

export { 
    testEnemyPathfindingToBuilding,
    testEnemyAttackBuildingComplete,
    testEnemyTargetSelectionPriority,
    testEnemyPathfindingStraightLine,
    testEnemyDeathAndReward,
    testEnemyTargetSwitching,
    runAllTests 
};