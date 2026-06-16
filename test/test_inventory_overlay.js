import { InventoryPanel } from '../src/components/InventoryPanel.js';

class MockStorage {
    constructor() {
        this.resources = { wood: 100, stone: 50, food: 30, water: 50, gold: 10 };
        this.resourceInfo = {
            wood: { name: '木材', emoji: '🪵', category: 'materials' },
            stone: { name: '石头', emoji: '🪨', category: 'materials' },
            food: { name: '食物', emoji: '🍖', category: 'consumables' },
            water: { name: '淡水', emoji: '💧', category: 'consumables' },
            gold: { name: '金币', emoji: '💰', category: 'currency' }
        };
        this.categories = {
            materials: { name: '材料' },
            consumables: { name: '消耗品' },
            currency: { name: '货币' }
        };
    }
    
    getResources() { return this.resources; }
    getAllResourceInfo() { return this.resourceInfo; }
    getResourceCategories() { return this.categories; }
    getResourceInfo(key) { return this.resourceInfo[key]; }
    getResource(key) { return this.resources[key]; }
    getTotalResourceAmount() { return 240; }
    getStorageCapacity() { return 500; }
    getResourcesByCategory() { return {}; }
    getFarmPlots() { return []; }
}

class MockGame {
    constructor() {
        this.storage = new MockStorage();
        this.inventoryPanel = null;
    }
    
    getStorage() {
        return this.storage;
    }
    
    getInventoryPanel() {
        return this.inventoryPanel;
    }
    
    setInventoryPanel(panel) {
        this.inventoryPanel = panel;
    }
    
    showToast(message) {
        console.log(`Toast: ${message}`);
    }
}

function setupTestEnvironment() {
    const container = document.createElement('div');
    container.id = 'game-container';
    container.style.width = '800px';
    container.style.height = '600px';
    container.style.position = 'relative';
    container.style.background = '#1a1a2e';
    
    const canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.width = '800px';
    canvas.style.height = '600px';
    canvas.style.display = 'block';
    
    container.appendChild(canvas);
    document.body.appendChild(container);
    
    return { container, canvas };
}

function runTests() {
    console.log('=== 仓库弹窗遮罩层阻断交互测试 ===\n');
    
    const { container, canvas } = setupTestEnvironment();
    
    setTimeout(() => {
        const game = new MockGame();
        const inventoryPanel = new InventoryPanel(game);
        game.setInventoryPanel(inventoryPanel);
        
        let testPassed = true;
        
        console.log('1. 测试isVisible()方法 - 初始状态');
        const initialVisible = inventoryPanel.isVisible();
        console.log(`   - isVisible()返回: ${initialVisible}`);
        if (!initialVisible) {
            console.log('   ✅ 通过');
        } else {
            console.log('   ❌ 失败 - 初始状态应该为false');
            testPassed = false;
        }
        
        console.log('\n2. 测试isVisible()方法 - show()后');
        inventoryPanel.show();
        const showVisible = inventoryPanel.isVisible();
        console.log(`   - isVisible()返回: ${showVisible}`);
        if (showVisible) {
            console.log('   ✅ 通过');
        } else {
            console.log('   ❌ 失败 - show()后应该为true');
            testPassed = false;
        }
        
        console.log('\n3. 测试遮罩层显示状态');
        const overlay = document.getElementById('inventory-overlay');
        if (overlay && overlay.style.display === 'block') {
            console.log('   ✅ 通过');
        } else {
            console.log('   ❌ 失败 - 遮罩层应该显示');
            testPassed = false;
        }
        
        console.log('\n4. 测试isVisible()方法 - hide()后');
        inventoryPanel.hide();
        const hideVisible = inventoryPanel.isVisible();
        console.log(`   - isVisible()返回: ${hideVisible}`);
        if (!hideVisible) {
            console.log('   ✅ 通过');
        } else {
            console.log('   ❌ 失败 - hide()后应该为false');
            testPassed = false;
        }
        
        console.log('\n5. 测试遮罩层隐藏状态');
        if (overlay && overlay.style.display === 'none') {
            console.log('   ✅ 通过');
        } else {
            console.log('   ❌ 失败 - 遮罩层应该隐藏');
            testPassed = false;
        }
        
        console.log('\n6. 测试遮罩层阻断canvas点击');
        inventoryPanel.show();
        let canvasClicked = false;
        let clickEventTriggered = false;
        
        canvas.addEventListener('click', () => {
            canvasClicked = true;
        });
        
        const overlayRect = overlay.getBoundingClientRect();
        const clickEvent = new MouseEvent('click', {
            clientX: overlayRect.left + overlayRect.width / 2,
            clientY: overlayRect.top + overlayRect.height / 2,
            bubbles: true
        });
        
        overlay.dispatchEvent(clickEvent);
        
        setTimeout(() => {
            console.log(`   - 点击遮罩层后canvas是否被点击: ${canvasClicked}`);
            if (!canvasClicked) {
                console.log('   ✅ 通过');
            } else {
                console.log('   ❌ 失败 - 遮罩层应该阻断canvas点击');
                testPassed = false;
            }
            
            canvas.removeEventListener('click', () => { canvasClicked = true; });
            inventoryPanel.hide();
            
            console.log('\n7. 测试弹窗内操作不受影响');
            const panel = document.getElementById('inventory-panel');
            inventoryPanel.show();
            
            let tabClicked = false;
            const tabs = panel.querySelector('.category-tabs');
            if (tabs) {
                tabs.addEventListener('click', (e) => {
                    if (e.target.classList.contains('category-tab')) {
                        tabClicked = true;
                    }
                });
                
                const tabBtn = tabs.querySelector('.category-tab');
                if (tabBtn) {
                    tabBtn.click();
                    
                    if (tabClicked) {
                        console.log('   ✅ 通过');
                    } else {
                        console.log('   ❌ 失败 - 弹窗内点击应该正常触发');
                        testPassed = false;
                    }
                }
            }
            
            inventoryPanel.hide();
            
            console.log('\n8. 测试toggle()切换时isVisible()状态');
            inventoryPanel.toggle();
            if (inventoryPanel.isVisible()) {
                console.log('   - toggle()第一次: isVisible()=true ✅');
            } else {
                console.log('   - toggle()第一次: isVisible()=false ❌');
                testPassed = false;
            }
            
            inventoryPanel.toggle();
            if (!inventoryPanel.isVisible()) {
                console.log('   - toggle()第二次: isVisible()=false ✅');
            } else {
                console.log('   - toggle()第二次: isVisible()=true ❌');
                testPassed = false;
            }
            
            container.remove();
            
            if (testPassed) {
                console.log('\n✅ 所有测试通过！');
            } else {
                console.log('\n❌ 部分测试失败！');
            }
        }, 100);
    }, 100);
}

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', runTests);
} else {
    console.log('测试需要在浏览器环境中运行');
}

export { runTests, MockGame, MockStorage };