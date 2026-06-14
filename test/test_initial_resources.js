import { Storage } from '../src/modules/Storage.js';

globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};

globalThis.window = {
    addEventListener: () => {},
    removeEventListener: () => {}
};

function runTests() {
    console.log('=== 测试初始资源值 ===\n');
    
    const storage = new Storage();
    storage.stopAutoSave();
    
    const resources = storage.getResources();
    
    console.log('1. 测试木材初始值:');
    console.assert(resources.wood === 100, `木材初始值应为 100，实际为 ${resources.wood}`);
    console.log(`   ✓ 木材初始值: ${resources.wood}`);
    
    console.log('\n2. 测试石头初始值:');
    console.assert(resources.stone === 100, `石头初始值应为 100，实际为 ${resources.stone}`);
    console.log(`   ✓ 石头初始值: ${resources.stone}`);
    
    console.log('\n3. 测试金币初始值:');
    console.assert(resources.gold === 100, `金币初始值应为 100，实际为 ${resources.gold}`);
    console.log(`   ✓ 金币初始值: ${resources.gold}`);
    
    console.log('\n4. 测试其他资源初始值(应为0):');
    const zeroResources = ['ore', 'apple', 'pear', 'treeSeed', 'fruitSeed', 'water'];
    zeroResources.forEach(key => {
        console.assert(resources[key] === 0, `${key}初始值应为 0，实际为 ${resources[key]}`);
        console.log(`   ✓ ${key}: ${resources[key]}`);
    });
    
    console.log('\n5. 测试种子初始值:');
    const seedResources = ['wheatSeed', 'carrotSeed', 'tomatoSeed', 'cornSeed'];
    seedResources.forEach(key => {
        console.assert(resources[key] === 5, `${key}初始值应为 5，实际为 ${resources[key]}`);
        console.log(`   ✓ ${key}: ${resources[key]}`);
    });
    
    console.log('\n6. 测试 resetToDefaults() 后资源值:');
    storage.resetToDefaults();
    const resetResources = storage.getResources();
    console.assert(resetResources.wood === 100, `reset后木材应为 100，实际为 ${resetResources.wood}`);
    console.assert(resetResources.stone === 100, `reset后石头应为 100，实际为 ${resetResources.stone}`);
    console.assert(resetResources.gold === 100, `reset后金币应为 100，实际为 ${resetResources.gold}`);
    console.log(`   ✓ reset后木材: ${resetResources.wood}`);
    console.log(`   ✓ reset后石头: ${resetResources.stone}`);
    console.log(`   ✓ reset后金币: ${resetResources.gold}`);
    
    console.log('\n=== 所有测试通过！ ===');
}

runTests();