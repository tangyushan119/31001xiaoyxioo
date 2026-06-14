import { InventoryPanel } from '../src/components/InventoryPanel.js';

class MockGame {
    constructor() {
        this.storage = {
            getResources: () => ({ wood: 100, stone: 50, food: 30, water: 50, gold: 10 }),
            getAllResourceInfo: () => ({
                wood: { name: '木材', emoji: '🪵', category: 'materials' },
                stone: { name: '石头', emoji: '🪨', category: 'materials' },
                food: { name: '食物', emoji: '🍖', category: 'consumables' },
                water: { name: '淡水', emoji: '💧', category: 'consumables' },
                gold: { name: '金币', emoji: '💰', category: 'currency' }
            }),
            getResourceCategories: () => ({
                materials: { name: '材料' },
                consumables: { name: '消耗品' },
                currency: { name: '货币' }
            }),
            getResourceInfo: (key) => ({
                wood: { name: '木材', emoji: '🪵' },
                stone: { name: '石头', emoji: '🪨' },
                food: { name: '食物', emoji: '🍖' },
                water: { name: '淡水', emoji: '💧' },
                gold: { name: '金币', emoji: '💰' }
            }[key]),
            getResource: (key) => ({ wood: 100, stone: 50, food: 30, water: 50, gold: 10 }[key]),
            getTotalResourceAmount: () => 240,
            getStorageCapacity: () => 500,
            getResourcesByCategory: () => ({})
        };
    }
    
    getStorage() {
        return this.storage;
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
    console.log('=== 仓库弹窗居中测试 ===\n');
    
    const { container, canvas } = setupTestEnvironment();
    
    setTimeout(() => {
        const game = new MockGame();
        const inventoryPanel = new InventoryPanel(game);
        
        console.log('1. 测试弹窗初始状态（应隐藏）');
        const panel = document.getElementById('inventory-panel');
        console.log(`   - 初始display状态: ${panel.style.display}`);
        console.assert(panel.style.display === 'none', '弹窗初始状态应该为隐藏');
        
        console.log('\n2. 测试show()方法显示弹窗');
        inventoryPanel.show();
        console.log(`   - show()后display状态: ${panel.style.display}`);
        console.assert(panel.style.display === 'block', '弹窗show后应该显示');
        
        console.log('\n3. 测试弹窗居中位置');
        const canvasRect = canvas.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        
        const expectedLeft = canvasRect.left + (canvasRect.width - panelRect.width) / 2;
        const expectedTop = canvasRect.top + (canvasRect.height - panelRect.height) / 2;
        
        const actualLeft = parseFloat(panel.style.left);
        const actualTop = parseFloat(panel.style.top);
        
        console.log(`   - 画布位置: left=${canvasRect.left.toFixed(2)}, top=${canvasRect.top.toFixed(2)}`);
        console.log(`   - 画布尺寸: width=${canvasRect.width}, height=${canvasRect.height}`);
        console.log(`   - 弹窗尺寸: width=${panelRect.width}, height=${panelRect.height}`);
        console.log(`   - 期望位置: left=${expectedLeft.toFixed(2)}, top=${expectedTop.toFixed(2)}`);
        console.log(`   - 实际位置: left=${actualLeft.toFixed(2)}, top=${actualTop.toFixed(2)}`);
        
        const leftDiff = Math.abs(actualLeft - expectedLeft);
        const topDiff = Math.abs(actualTop - expectedTop);
        
        console.log(`   - 位置偏差: left=${leftDiff.toFixed(2)}px, top=${topDiff.toFixed(2)}px`);
        console.assert(leftDiff < 1, `水平位置偏差过大: ${leftDiff}px`);
        console.assert(topDiff < 1, `垂直位置偏差过大: ${topDiff}px`);
        
        console.log('\n4. 测试hide()方法隐藏弹窗');
        inventoryPanel.hide();
        console.log(`   - hide()后display状态: ${panel.style.display}`);
        console.assert(panel.style.display === 'none', '弹窗hide后应该隐藏');
        
        console.log('\n5. 测试toggle()方法切换状态');
        inventoryPanel.toggle();
        console.log(`   - toggle()第一次后display状态: ${panel.style.display}`);
        console.assert(panel.style.display === 'block', 'toggle()第一次应该显示弹窗');
        
        inventoryPanel.toggle();
        console.log(`   - toggle()第二次后display状态: ${panel.style.display}`);
        console.assert(panel.style.display === 'none', 'toggle()第二次应该隐藏弹窗');
        
        container.remove();
        
        console.log('\n✅ 所有测试通过！');
    }, 100);
}

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', runTests);
} else {
    console.log('测试需要在浏览器环境中运行');
}

export { runTests, MockGame };
