export class BuildingPlacementTest {
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
        console.log('🏗️ 建筑放置测试套件');
        console.log('========================================');

        this.testBuildingTypes();
        this.testResourceCheck();
        this.testTerrainCheck();
        this.testGridAlignment();
        this.testSpaceAvailability();
        this.testFarmAreaProtection();

        this.printSummary();
    }

    testBuildingTypes() {
        this.logTest('建筑类型定义测试');
        
        const expectedTypes = ['residence', 'storageHouse', 'house', 'hut', 'storage', 'farm', 'fishing', 'campfire', 'well', 'machineGun', 'catapult', 'dock', 'barracks'];
        
        if (window.game && window.game.buildPanel) {
            const buildingTypes = window.game.buildPanel.getBuildingTypes();
            const actualTypes = Object.keys(buildingTypes);
            
            this.assert(expectedTypes.length === actualTypes.length, `建筑类型数量正确`);
            
            expectedTypes.forEach(type => {
                this.assert(actualTypes.includes(type), `包含建筑类型: ${type}`);
                
                const config = buildingTypes[type];
                this.assert(config.name, `建筑 ${type} 有名称`);
                this.assert(config.emoji, `建筑 ${type} 有表情符号`);
                this.assert(config.cost, `建筑 ${type} 有建造成本`);
                this.assert(config.size > 0, `建筑 ${type} 有有效尺寸`);
            });
        } else {
            console.log('⚠️ 游戏未加载，跳过建筑类型测试');
        }
    }

    testResourceCheck() {
        this.logTest('资源校验测试');
        
        if (window.game && window.game.buildPanel) {
            const storage = window.game.getStorage();
            const buildPanel = window.game.buildPanel;
            
            const originalWood = storage.getResource('wood');
            
            storage.modifyResource('wood', 100);
            
            const hasEnough = buildPanel.hasEnoughResources({ wood: 30 });
            this.assert(hasEnough, '资源足够时返回true');
            
            const hasNotEnough = buildPanel.hasEnoughResources({ wood: 250 });
            this.assert(!hasNotEnough, '资源不足时返回false');
            
            storage.modifyResource('wood', originalWood - storage.getResource('wood'));
        } else {
            console.log('⚠️ 游戏未加载，跳过资源校验测试');
        }
    }

    testTerrainCheck() {
        this.logTest('地形判定测试');
        
        if (window.game && window.game.buildPanel) {
            const terrain = window.game.getTerrain();
            const center = terrain.getIslandCenter();
            const landRadius = terrain.getLandRadius();
            
            this.assert(terrain.canBuildAt(center.x, center.y), '岛屿中心可建造');
            
            const beachX = center.x + landRadius * 1.1;
            const beachY = center.y;
            this.assert(!terrain.canBuildAt(beachX, beachY), '沙滩区域不可建造');
            
            const waterX = center.x + landRadius * 1.5;
            const waterY = center.y;
            this.assert(!terrain.canBuildAt(waterX, waterY), '水域不可建造');
        } else {
            console.log('⚠️ 游戏未加载，跳过地形判定测试');
        }
    }

    testGridAlignment() {
        this.logTest('网格对齐测试');
        
        if (window.game && window.game.buildPanel) {
            const buildPanel = window.game.buildPanel;
            
            const result1 = buildPanel.snapToGrid(123, 456, 50);
            this.assertEqual(result1.x % 50, 0, 'X坐标对齐到50px网格');
            this.assertEqual(result1.y % 50, 0, 'Y坐标对齐到50px网格');
            
            const result2 = buildPanel.snapToGrid(50, 50, 50);
            this.assertEqual(result2.x, 50, '已对齐的坐标保持不变');
            this.assertEqual(result2.y, 50, '已对齐的坐标保持不变');
        } else {
            console.log('⚠️ 游戏未加载，跳过网格对齐测试');
        }
    }

    testSpaceAvailability() {
        this.logTest('空间占用测试');
        
        if (window.game && window.game.buildPanel) {
            const storage = window.game.getStorage();
            const buildPanel = window.game.buildPanel;
            
            const originalBuildings = storage.getBuildings().length;
            
            storage.modifyResource('wood', 100);
            
            const center = window.game.getTerrain().getIslandCenter();
            const pos1 = { x: center.x - 100, y: center.y - 100 };
            
            buildPanel.tryPlaceBuilding('campfire', pos1.x, pos1.y);
            
            const buildings = storage.getBuildings();
            const placedBuilding = buildings.find(b => b.type === 'campfire');
            
            if (placedBuilding) {
                const hasSpace = buildPanel.isSpaceAvailable(placedBuilding.x, placedBuilding.y, 35);
                this.assert(!hasSpace, '已有建筑位置空间不可用');
            }
            
            const farPos = { x: center.x + 100, y: center.y + 100 };
            const hasSpaceFar = buildPanel.isSpaceAvailable(farPos.x, farPos.y, 35);
            this.assert(hasSpaceFar, '远离建筑位置空间可用');
            
            storage.getBuildings().forEach(b => storage.removeBuilding(b.id));
            
            storage.modifyResource('wood', -100);
        } else {
            console.log('⚠️ 游戏未加载，跳过空间占用测试');
        }
    }

    testFarmAreaProtection() {
        this.logTest('农田区域保护测试');
        
        if (window.game && window.game.buildPanel) {
            const terrain = window.game.getTerrain();
            const buildPanel = window.game.buildPanel;
            
            if (terrain.landRenderer) {
                const farmArea = terrain.landRenderer.getFarmArea();
                const farmCenterX = farmArea.x + farmArea.width / 2;
                const farmCenterY = farmArea.y + farmArea.height / 2;
                
                const isOverlapping = buildPanel.isOverlappingFarmArea(farmCenterX, farmCenterY, 50);
                this.assert(isOverlapping, '农田中心区域不可建造');
                
                const farFromFarmX = farmCenterX + 200;
                const farFromFarmY = farmCenterY + 200;
                const isNotOverlapping = buildPanel.isOverlappingFarmArea(farFromFarmX, farFromFarmY, 50);
                this.assert(!isNotOverlapping, '远离农田区域可建造');
            }
        } else {
            console.log('⚠️ 游戏未加载，跳农田区域保护测试');
        }
    }

    printSummary() {
        console.log('\n========================================');
        console.log('📊 测试结果汇总');
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
            console.log('🎉 所有测试通过！');
        } else {
            console.log('⚠️ 部分测试失败，请检查代码');
        }
        console.log('='.repeat(40));
    }
}

if (typeof window !== 'undefined') {
    window.BuildingPlacementTest = BuildingPlacementTest;
    
    const runTests = () => {
        if (window.game && window.game.isReady) {
            const test = new BuildingPlacementTest();
            test.runAllTests();
        } else {
            setTimeout(runTests, 1000);
        }
    };
    
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(runTests, 2000);
    });
}