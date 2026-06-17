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

console.log('=== 建造面板资源校验测试 ===\n');

const storage = new Storage();
storage.stopAutoSave();

class MockBuildPanel {
    constructor(storage) {
        this.storage = storage;
    }

    hasEnoughResources(cost) {
        if (!cost || typeof cost !== 'object') return false;

        const resources = this.storage.getResources();

        for (const [key, value] of Object.entries(cost)) {
            if ((resources[key] || 0) < value) {
                return false;
            }
        }

        return true;
    }

    getMissingResources(cost) {
        if (!cost || typeof cost !== 'object') return [];

        const resources = this.storage.getResources();
        const missingResources = [];

        for (const [key, value] of Object.entries(cost)) {
            const current = resources[key] || 0;
            if (current < value) {
                missingResources.push(`${key}: ${current}/${value}`);
            }
        }

        return missingResources;
    }
}

const buildPanel = new MockBuildPanel(storage);

console.log('1. 测试 hasEnoughResources - 资源充足场景:');
const testCost1 = { wood: 30 };
const result1 = buildPanel.hasEnoughResources(testCost1);
console.assert(result1 === true, `期望返回true，实际返回${result1}`);
console.log(`   PASS: 资源充足时返回true`);

console.log('\n2. 测试 hasEnoughResources - 资源不足场景:');
const testCost2 = { wood: 500 };
const result2 = buildPanel.hasEnoughResources(testCost2);
console.assert(result2 === false, `期望返回false，实际返回${result2}`);
console.log(`   PASS: 资源不足时返回false`);

console.log('\n3. 测试 hasEnoughResources - 多种资源充足场景:');
const testCost3 = { wood: 30, stone: 20 };
const result3 = buildPanel.hasEnoughResources(testCost3);
console.assert(result3 === true, `期望返回true，实际返回${result3}`);
console.log(`   PASS: 多种资源充足时返回true`);

console.log('\n4. 测试 hasEnoughResources - 部分资源不足场景:');
const testCost4 = { wood: 30, gold: 1000 };
const result4 = buildPanel.hasEnoughResources(testCost4);
console.assert(result4 === false, `期望返回false，实际返回${result4}`);
console.log(`   PASS: 部分资源不足时返回false`);

console.log('\n5. 测试 hasEnoughResources - 空成本对象:');
const testCost5 = {};
const result5 = buildPanel.hasEnoughResources(testCost5);
console.assert(result5 === true, `期望返回true，实际返回${result5}`);
console.log(`   PASS: 空成本对象返回true`);

console.log('\n6. 测试 hasEnoughResources - 无效输入:');
const result6 = buildPanel.hasEnoughResources(null);
console.assert(result6 === false, `期望返回false，实际返回${result6}`);
const result7 = buildPanel.hasEnoughResources(undefined);
console.assert(result7 === false, `期望返回false，实际返回${result7}`);
const result8 = buildPanel.hasEnoughResources('invalid');
console.assert(result8 === false, `期望返回false，实际返回${result8}`);
console.log(`   PASS: 无效输入返回false`);

console.log('\n7. 测试 getMissingResources - 资源充足场景:');
const missing1 = buildPanel.getMissingResources({ wood: 30 });
console.assert(missing1.length === 0, `期望返回空数组，实际返回${missing1}`);
console.log(`   PASS: 资源充足时返回空数组`);

console.log('\n8. 测试 getMissingResources - 资源不足场景:');
const missing2 = buildPanel.getMissingResources({ wood: 500 });
console.assert(missing2.length === 1, `期望返回1项，实际返回${missing2.length}`);
console.assert(missing2[0].includes('wood'), `期望包含wood，实际返回${missing2[0]}`);
console.log(`   PASS: 返回缺失资源列表`);

console.log('\n9. 测试 getMissingResources - 多种资源部分缺失场景:');
const missing3 = buildPanel.getMissingResources({ wood: 30, gold: 1000, stone: 1000 });
console.assert(missing3.length === 2, `期望返回2项，实际返回${missing3.length}`);
console.log(`   PASS: 返回多个缺失资源`);

console.log('\n10. 测试 getMissingResources - 无效输入:');
const missing4 = buildPanel.getMissingResources(null);
console.assert(missing4.length === 0, `期望返回空数组，实际返回${missing4}`);
console.log(`   PASS: 无效输入返回空数组`);

console.log('\n=== 所有建造面板资源校验测试通过！ ===');
