export class DockPlacementTest {
    constructor() {
        this.testResults = [];
        this.currentTest = '';
    }

    logTest(name) {
        this.currentTest = name;
        console.log(`\n🚀 测试: ${name}`);
    }

    assert(condition, message) {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            this.testResults.push({ test: this.currentTest, result: 'PASS', message });
        } else {
            console.log(`❌ FAIL: ${message}`);
            this.testResults.push({ test: this.currentTest, result: 'FAIL', message });
        }
    }

    assertEqual(actual, expected, message) {
        if (actual === expected) {
            console.log(`✅ PASS: ${message} (期望值: ${expected}, 实际值: ${actual})`);
            this.testResults.push({ test: this.currentTest, result: 'PASS', message });
        } else {
            console.log(`❌ FAIL: ${message} (期望值: ${expected}, 实际值: ${actual})`);
            this.testResults.push({ test: this.currentTest, result: 'FAIL', message });
        }
    }

    runAllTests() {
        console.log('========================================');
        console.log('⛵ 码头放置测试套件');
        console.log('========================================');

        this.testDockBuildingType();
        this.testDockPlacementOnBeach();
        this.testDockPlacementOnLand();
        this.testDockCannotPlaceOnWater();
        this.testDockClickOpensShipBuilding();
        this.testDockBuildCost();

        this.printSummary();
    }

    testDockBuildingType() {
        this.logTest('码头建筑类型定义测试');
        
        if (window.game && window.game.buildPanel) {
            const buildingTypes = window.game.buildPanel.getBuildingTypes();
            const dockConfig = buildingTypes.dock;
            
            this.assert(dockConfig, '码头配置存在');
            this.assertEqual(dockConfig.name, '码头', '码头名称正确');
            this.assertEqual(dockConfig.emoji, '⛵', '码头表情符号正确');
            this.assertEqual(dockConfig.isDock, true, '码头标记正确');
            this.assert(dockConfig.cost.wood === 80, '木材成本正确');
            this.assert(dockConfig.cost.stone === 40, '石材成本正确');
        } else {
            console.log('⚠️ 游戏未加载，跳过码头建筑类型测试');
        }
    }

    testDockPlacementOnBeach() {
        this.logTest('码头沙滩放置测试');
        
        if (window.game && window.game.buildPanel) {
            const terrain = window.game.getTerrain();
            const buildPanel = window.game.buildPanel;
            const storage = window.game.getStorage();
            
            const center = terrain.getIslandCenter();
            const landRadius = terrain.getLandRadius();
            const beachOuterRadius = terrain.getBeachOuterRadius();
            
            const beachX = center.x + (landRadius + beachOuterRadius) / 2 * Math.cos(-Math.PI / 2);
            const beachY = center.y + (landRadius + beachOuterRadius) / 2 * Math.sin(-Math.PI / 2);
            
            const terrainType = terrain.getTerrainType(beachX, beachY);
            this.assertEqual(terrainType, 'beach', '测试点位于沙滩');
            
            const originalWood = storage.getResource('wood');
            const originalStone = storage.getResource('stone');
            
            storage.modifyResource('wood', 100);
            storage.modifyResource('stone', 50);
            
            const result = buildPanel.tryPlaceBuilding('dock', beachX, beachY);
            
            this.assert(result === true, '码头可在沙滩上建造');
            
            const buildings = storage.getBuildings();
            const dock = buildings.find(b => b.type === 'dock');
            this.assert(dock, '码头建筑已创建');
            
            buildings.forEach(b => storage.removeBuilding(b.id));
            
            storage.modifyResource('wood', originalWood - storage.getResource('wood'));
            storage.modifyResource('stone', originalStone - storage.getResource('stone'));
        } else {
            console.log('⚠️ 游戏未加载，跳过沙滩放置测试');
        }
    }

    testDockPlacementOnLand() {
        this.logTest('码头陆地放置测试');
        
        if (window.game && window.game.buildPanel) {
            const terrain = window.game.getTerrain();
            const buildPanel = window.game.buildPanel;
            const storage = window.game.getStorage();
            
            const center = terrain.getIslandCenter();
            
            const terrainType = terrain.getTerrainType(center.x, center.y);
            this.assertEqual(terrainType, 'land', '测试点位于陆地');
            
            const originalWood = storage.getResource('wood');
            const originalStone = storage.getResource('stone');
            
            storage.modifyResource('wood', 100);
            storage.modifyResource('stone', 50);
            
            const result = buildPanel.tryPlaceBuilding('dock', center.x, center.y);
            
            this.assert(result === true, '码头可在普通陆地上建造');
            
            const buildings = storage.getBuildings();
            const dock = buildings.find(b => b.type === 'dock');
            this.assert(dock, '码头建筑已创建');
            
            buildings.forEach(b => storage.removeBuilding(b.id));
            
            storage.modifyResource('wood', originalWood - storage.getResource('wood'));
            storage.modifyResource('stone', originalStone - storage.getResource('stone'));
        } else {
            console.log('⚠️ 游戏未加载，跳过陆地放置测试');
        }
    }

    testDockCannotPlaceOnWater() {
        this.logTest('码头水域放置测试');
        
        if (window.game && window.game.buildPanel) {
            const terrain = window.game.getTerrain();
            const buildPanel = window.game.buildPanel;
            const storage = window.game.getStorage();
            
            const center = terrain.getIslandCenter();
            const beachOuterRadius = terrain.getBeachOuterRadius();
            
            const waterX = center.x + beachOuterRadius * 1.5;
            const waterY = center.y;
            
            const terrainType = terrain.getTerrainType(waterX, waterY);
            this.assertEqual(terrainType, 'water', '测试点位于水域');
            
            const originalWood = storage.getResource('wood');
            const originalStone = storage.getResource('stone');
            
            storage.modifyResource('wood', 100);
            storage.modifyResource('stone', 50);
            
            const result = buildPanel.tryPlaceBuilding('dock', waterX, waterY);
            
            this.assertEqual(result, undefined, '码头无法在水域建造');
            
            const buildings = storage.getBuildings();
            const dockCount = buildings.filter(b => b.type === 'dock').length;
            this.assertEqual(dockCount, 0, '水域未创建码头');
            
            storage.modifyResource('wood', originalWood - storage.getResource('wood'));
            storage.modifyResource('stone', originalStone - storage.getResource('stone'));
        } else {
            console.log('⚠️ 游戏未加载，跳过于水域放置测试');
        }
    }

    testDockClickOpensShipBuilding() {
        this.logTest('码头点击打开造船窗口测试');
        
        if (window.game && window.game.buildPanel) {
            const buildPanel = window.game.buildPanel;
            const storage = window.game.getStorage();
            
            const terrain = window.game.getTerrain();
            const center = terrain.getIslandCenter();
            
            const originalWood = storage.getResource('wood');
            const originalStone = storage.getResource('stone');
            
            storage.modifyResource('wood', 100);
            storage.modifyResource('stone', 50);
            
            buildPanel.tryPlaceBuilding('dock', center.x, center.y);
            
            const buildings = storage.getBuildings();
            const dock = buildings.find(b => b.type === 'dock');
            
            if (dock) {
                window.game.onBuildingClick(dock);
                
                const shipPanel = document.getElementById('ship-building-panel');
                this.assert(shipPanel && shipPanel.style.display === 'block', '造船窗口已打开');
                
                this.assert(buildPanel.isShipBuildingUnlocked(), '造船功能已解锁');
                
                shipPanel.style.display = 'none';
            }
            
            buildings.forEach(b => storage.removeBuilding(b.id));
            
            buildPanel.lockShipBuilding();
            
            storage.modifyResource('wood', originalWood - storage.getResource('wood'));
            storage.modifyResource('stone', originalStone - storage.getResource('stone'));
        } else {
            console.log('⚠️ 游戏未加载，跳过点击测试');
        }
    }

    testDockBuildCost() {
        this.logTest('码头建造成本测试');
        
        if (window.game && window.game.buildPanel) {
            const buildPanel = window.game.buildPanel;
            const storage = window.game.getStorage();
            
            const terrain = window.game.getTerrain();
            const center = terrain.getIslandCenter();
            
            const originalWood = storage.getResource('wood');
            const originalStone = storage.getResource('stone');
            
            storage.modifyResource('wood', 79);
            storage.modifyResource('stone', 40);
            
            const result = buildPanel.tryPlaceBuilding('dock', center.x, center.y);
            
            this.assertEqual(result, undefined, '木材不足时无法建造');
            
            storage.modifyResource('wood', 1);
            storage.modifyResource('stone', -39);
            
            const result2 = buildPanel.tryPlaceBuilding('dock', center.x, center.y);
            
            this.assertEqual(result2, undefined, '石材不足时无法建造');
            
            storage.modifyResource('wood', 0);
            storage.modifyResource('stone', 1);
            
            const result3 = buildPanel.tryPlaceBuilding('dock', center.x, center.y);
            
            this.assertEqual(result3, undefined, '资源都不足时无法建造');
            
            storage.modifyResource('wood', 100);
            storage.modifyResource('stone', 50);
            
            const result4 = buildPanel.tryPlaceBuilding('dock', center.x, center.y);
            
            this.assert(result4 === true, '资源充足时可以建造');
            
            const newWood = storage.getResource('wood');
            const newStone = storage.getResource('stone');
            
            this.assertEqual(newWood, originalWood + 21, '木材消耗正确');
            this.assertEqual(newStone, originalStone + 10, '石材消耗正确');
            
            const buildings = storage.getBuildings();
            buildings.forEach(b => storage.removeBuilding(b.id));
            
            storage.modifyResource('wood', originalWood - storage.getResource('wood'));
            storage.modifyResource('stone', originalStone - storage.getResource('stone'));
        } else {
            console.log('⚠️ 游戏未加载，跳过于建造成本测试');
        }
    }

    printSummary() {
        console.log('\n========================================');
        console.log('📊 码头测试结果汇总');
        console.log('========================================');
        
        const passed = this.testResults.filter(r => r.result === 'PASS').length;
        const failed = this.testResults.filter(r => r.result === 'FAIL').length;
        const total = this.testResults.length;
        
        console.log(`总测试数: ${total}`);
        console.log(`✅ 通过: ${passed}`);
        console.log(`❌ 失败: ${failed}`);
        
        if (failed > 0) {
            console.log('\n失败的测试:');
            this.testResults.filter(r => r.result === 'FAIL').forEach(r => {
                console.log(`  - ${r.test}: ${r.message}`);
            });
        }
        
        console.log('\n' + '='.repeat(40));
        if (failed === 0) {
            console.log('🎉 所有码头测试通过！');
        } else {
            console.log('⚠️ 部分测试失败，请检查代码');
        }
        console.log('='.repeat(40));
    }
}

if (typeof window !== 'undefined') {
    window.DockPlacementTest = DockPlacementTest;
    
    const runTests = () => {
        if (window.game && window.game.isReady) {
            const test = new DockPlacementTest();
            test.runAllTests();
        } else {
            setTimeout(runTests, 1000);
        }
    };
    
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(runTests, 2000);
    });
}