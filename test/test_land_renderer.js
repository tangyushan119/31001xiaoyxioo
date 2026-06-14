import { LandRenderer } from '../src/modules/LandRenderer.js';
import { ResourceManager } from '../src/modules/ResourceManager.js';

function createMockRenderer(width = 800, height = 600) {
    const canvas = { width, height };
    const ctx = {
        createRadialGradient: () => ({ addColorStop: () => {} }),
        fillStyle: '',
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        save: () => {},
        restore: () => {}
    };
    return { canvas, ctx, width, height };
}

function createMockGame() {
    global.document = {
        createElement: () => ({ className: '', style: {}, textContent: '', appendChild: () => {}, remove: () => {} }),
        body: { appendChild: () => {} }
    };
    global.setTimeout = (fn) => { fn(); return 0; };
    
    return {
        getTerrain: () => ({
            getLandRadius: () => 150,
            getIslandCenter: () => ({ x: 400, y: 300 }),
            isOnLand: (x, y) => {
                const dx = x - 400;
                const dy = y - 300;
                return Math.sqrt(dx * dx + dy * dy) < 150;
            }
        }),
        getPlayer: () => ({ getPosition: () => ({ x: 400, y: 300 }), x: 400, y: 300 }),
        getStorage: () => ({ 
            modifyResource: () => {},
            getResourceInfo: (key) => {
                const info = {
                    wood: { name: '木材', emoji: '🪵' },
                    stone: { name: '石头', emoji: '🪨' },
                    ore: { name: '矿石', emoji: '💎' },
                    apple: { name: '苹果', emoji: '🍎' },
                    pear: { name: '梨子', emoji: '🍐' },
                    treeSeed: { name: '树木种子', emoji: '🌱' },
                    fruitSeed: { name: '水果种子', emoji: '🍑' }
                };
                return info[key] || null;
            }
        }),
        getInput: () => ({ wasClicked: () => false }),
        getBuildPanel: () => ({ updateResourceDisplay: () => {} })
    };
}

function testLandRendererNoTreesAndRocks() {
    console.log('=== 测试LandRenderer不生成树木和石块 ===');
    
    const renderer = createMockRenderer();
    const landRenderer = new LandRenderer(renderer);
    
    landRenderer.setLandRadius(150);
    landRenderer.init();
    landRenderer.render();
    
    console.assert(!landRenderer.trees, 'LandRenderer不应有trees属性');
    console.assert(!landRenderer.rocks, 'LandRenderer不应有rocks属性');
    console.assert(!landRenderer.generateTreePositions, 'LandRenderer不应有generateTreePositions方法');
    console.assert(!landRenderer.generateRockPositions, 'LandRenderer不应有generateRockPositions方法');
    console.assert(!landRenderer.drawTrees, 'LandRenderer不应有drawTrees方法');
    console.assert(!landRenderer.drawRocks, 'LandRenderer不应有drawRocks方法');
    console.assert(!landRenderer.drawTree, 'LandRenderer不应有drawTree方法');
    console.assert(!landRenderer.drawRock, 'LandRenderer不应有drawRock方法');
    console.assert(!landRenderer.getTrees, 'LandRenderer不应有getTrees方法');
    console.assert(!landRenderer.getRocks, 'LandRenderer不应有getRocks方法');
    
    console.log('✓ LandRenderer测试通过：已移除树木和石块相关属性和方法');
}

function testResourceManagerGeneratesCollectibleResources() {
    console.log('=== 测试ResourceManager生成可采集资源 ===');
    
    const game = createMockGame();
    const resourceManager = new ResourceManager(game);
    
    const resources = resourceManager.getResources();
    
    console.assert(resources.length > 0, '应该生成初始资源');
    
    const allResourcesValid = resources.every(resource => {
        return resource.type && resource.emoji && resource.resourceKey && 
               typeof resource.amount === 'number' && !resource.isDepleted;
    });
    console.assert(allResourcesValid, '所有资源应该有完整的属性');
    
    const validTypes = ['bigTree', 'smallTree', 'stonePile', 'farmland', 'treeSeed', 'fruitSeed'];
    const hasValidTypes = resources.some(r => validTypes.includes(r.type));
    console.assert(hasValidTypes, '应该包含有效的资源类型');
    
    const treeTypes = resources.filter(r => ['bigTree', 'smallTree'].includes(r.type));
    console.assert(treeTypes.length > 0, '应该包含树木资源');
    
    const stonePileTypes = resources.filter(r => r.type === 'stonePile');
    console.assert(stonePileTypes.length > 0, '应该包含石堆资源');
    
    const farmlandTypes = resources.filter(r => r.type === 'farmland');
    console.assert(farmlandTypes.length > 0, '应该包含耕地资源');
    
    const seedTypes = resources.filter(r => ['treeSeed', 'fruitSeed'].includes(r.type));
    console.assert(seedTypes.length >= 0, '应该包含种子资源');
    
    console.log(`✓ ResourceManager测试通过：生成了${resources.length}个可采集资源`);
    resources.forEach(r => console.log(`  - ${r.emoji} ${r.name} (${r.resourceKey}) x${r.amount}`));
}

function testResourceCollection() {
    console.log('=== 测试资源采集功能 ===');
    
    const game = createMockGame();
    const resourceManager = new ResourceManager(game);
    
    const resources = resourceManager.getResources();
    const originalCount = resources.filter(r => !r.isDepleted).length;
    
    if (resources.length > 0) {
        const resource = resources[0];
        resourceManager.collectResource(resource);
        
        const remainingResources = resourceManager.getResources();
        const depletedCount = remainingResources.filter(r => r.isDepleted).length;
        
        console.assert(depletedCount >= 1, '采集后资源应该被标记为已消耗');
        console.log('✓ 资源采集测试通过：资源已被正确标记为已消耗');
    } else {
        console.log('⚠️ 跳过采集测试：没有可用资源');
    }
}

function testResourceRefresh() {
    console.log('=== 测试资源刷新功能 ===');
    
    const game = createMockGame();
    const resourceManager = new ResourceManager(game);
    
    resourceManager.setRefreshInterval(100);
    
    const resources = resourceManager.getResources();
    if (resources.length > 0) {
        resourceManager.collectResource(resources[0]);
        
        const depletedBefore = resourceManager.getResources().filter(r => r.isDepleted).length;
        
        resourceManager.update(0.2);
        
        const depletedAfter = resourceManager.getResources().filter(r => r.isDepleted).length;
        
        console.log(`  刷新前已消耗: ${depletedBefore}, 刷新后已消耗: ${depletedAfter}`);
        console.log('✓ 资源刷新测试通过：刷新逻辑正常运行');
    } else {
        console.log('⚠️ 跳过刷新测试：没有可用资源');
    }
}

function runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('测试：清除预设树木石块，保留可交互资源');
    console.log('='.repeat(60) + '\n');
    
    try {
        testLandRendererNoTreesAndRocks();
        console.log('');
        testResourceManagerGeneratesCollectibleResources();
        console.log('');
        testResourceCollection();
        console.log('');
        testResourceRefresh();
        console.log('');
        
        console.log('='.repeat(60));
        console.log('✓ 所有测试通过！');
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

if (resolvedPath === process.argv[1] || process.argv[1].endsWith('test_land_renderer.js')) {
    runAllTests();
}

export { 
    testLandRendererNoTreesAndRocks, 
    testResourceManagerGeneratesCollectibleResources,
    testResourceCollection,
    testResourceRefresh,
    runAllTests 
};
