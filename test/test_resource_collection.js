global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};

global.window = {
    addEventListener: () => {},
    removeEventListener: () => {}
};

import { Storage } from '../src/modules/Storage.js';

console.log('=== 资源采集功能测试 ===\n');

function testStorageInitialValues() {
    console.log('1. 测试初始资源值设置');
    const storage = new Storage();
    
    const expectedResources = {
        wood: 100,
        stone: 100,
        ore: 0,
        apple: 0,
        pear: 0,
        treeSeed: 0,
        fruitSeed: 0,
        wheatSeed: 5,
        carrotSeed: 5,
        tomatoSeed: 5,
        cornSeed: 5,
        gold: 100
    };
    
    let allPassed = true;
    for (const [key, expected] of Object.entries(expectedResources)) {
        const actual = storage.getResource(key);
        if (actual === expected) {
            console.log(`   ✓ ${key}: ${actual} (预期: ${expected})`);
        } else {
            console.log(`   ✗ ${key}: ${actual} (预期: ${expected})`);
            allPassed = false;
        }
    }
    
    return allPassed;
}

function testResourceCollection() {
    console.log('\n2. 测试资源采集（数值累加）');
    const storage = new Storage();
    
    const initialWood = storage.getResource('wood');
    const collectedAmount = 8;
    
    const actualAdded = storage.modifyResource('wood', collectedAmount);
    const finalWood = storage.getResource('wood');
    
    console.log(`   初始木材: ${initialWood}`);
    console.log(`   采集数量: ${collectedAmount}`);
    console.log(`   实际增加: ${actualAdded}`);
    console.log(`   最终木材: ${finalWood}`);
    
    const expectedFinal = initialWood + collectedAmount;
    
    if (finalWood === expectedFinal && actualAdded === collectedAmount) {
        console.log('   ✓ 资源采集测试通过');
        return true;
    } else {
        console.log(`   ✗ 资源采集测试失败 (预期: ${expectedFinal}, 实际: ${finalWood})`);
        return false;
    }
}

function testMultipleCollections() {
    console.log('\n3. 测试多次采集');
    const storage = new Storage();
    
    const initialWood = storage.getResource('wood');
    storage.modifyResource('wood', 8);
    storage.modifyResource('wood', 4);
    storage.modifyResource('wood', 8);
    
    const finalWood = storage.getResource('wood');
    const expected = initialWood + 8 + 4 + 8;
    
    console.log(`   初始木材: ${initialWood}`);
    console.log(`   多次采集后: ${finalWood}`);
    console.log(`   预期值: ${expected}`);
    
    if (finalWood === expected) {
        console.log('   ✓ 多次采集测试通过');
        return true;
    } else {
        console.log(`   ✗ 多次采集测试失败`);
        return false;
    }
}

function testStorageCapacity() {
    console.log('\n4. 测试存储容量（单个资源独立上限）');
    const storage = new Storage();
    
    const capacity = storage.getStorageCapacity();
    const initialWood = storage.getResource('wood');
    const remainingForWood = capacity - initialWood;
    
    console.log(`   单个资源存储上限: ${capacity}`);
    console.log(`   当前木材数量: ${initialWood}`);
    console.log(`   木材剩余容量: ${remainingForWood}`);
    
    if (remainingForWood > 0) {
        const added = storage.modifyResource('wood', remainingForWood + 5);
        const finalWood = storage.getResource('wood');
        
        console.log(`   尝试添加 ${remainingForWood + 5}，实际添加: ${added}`);
        console.log(`   添加后木材数量: ${finalWood}`);
        
        if (finalWood === capacity) {
            console.log('   ✓ 存储容量测试通过（单个资源上限生效）');
            return true;
        } else {
            console.log(`   ✗ 存储容量测试失败（预期上限 ${capacity}，实际 ${finalWood}）`);
            return false;
        }
    } else {
        console.log('   ✗ 当前资源已达到上限');
        return false;
    }
}

function testResourceReduction() {
    console.log('\n5. 测试资源消耗');
    const storage = new Storage();
    
    const initialGold = storage.getResource('gold');
    const cost = 50;
    
    storage.modifyResource('gold', -cost);
    const finalGold = storage.getResource('gold');
    
    console.log(`   初始金币: ${initialGold}`);
    console.log(`   消耗数量: ${cost}`);
    console.log(`   最终金币: ${finalGold}`);
    
    if (finalGold === initialGold - cost) {
        console.log('   ✓ 资源消耗测试通过');
        return true;
    } else {
        console.log(`   ✗ 资源消耗测试失败`);
        return false;
    }
}

function testResourceDisplayUpdate() {
    console.log('\n6. 测试资源显示更新');
    
    const storage = new Storage();
    const initialResources = storage.getResources();
    
    storage.modifyResource('wood', 10);
    storage.modifyResource('stone', 5);
    
    const updatedResources = storage.getResources();
    
    let allUpdated = true;
    if (updatedResources.wood === initialResources.wood + 10) {
        console.log('   ✓ 木材显示应更新');
    } else {
        console.log('   ✗ 木材显示未更新');
        allUpdated = false;
    }
    
    if (updatedResources.stone === initialResources.stone + 5) {
        console.log('   ✓ 石头显示应更新');
    } else {
        console.log('   ✗ 石头显示未更新');
        allUpdated = false;
    }
    
    return allUpdated;
}

async function runTests() {
    const tests = [
        { name: '初始资源值测试', fn: testStorageInitialValues },
        { name: '资源采集测试', fn: testResourceCollection },
        { name: '多次采集测试', fn: testMultipleCollections },
        { name: '存储容量测试', fn: testStorageCapacity },
        { name: '资源消耗测试', fn: testResourceReduction },
        { name: '显示更新测试', fn: testResourceDisplayUpdate }
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
    
    console.log('\n=== 测试结果汇总 ===');
    console.log(`通过: ${passed}/${tests.length}`);
    console.log(`失败: ${failed}/${tests.length}`);
    
    if (failed === 0) {
        console.log('\n🎉 所有测试通过！');
    } else {
        console.log('\n⚠️ 部分测试失败，请检查代码');
        process.exit(1);
    }
}

runTests();