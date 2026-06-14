export class InventoryPanel {
    constructor(game) {
        this.game = game;
        this.panel = null;
        this.tooltip = null;
        this.activeCategory = 'all';
        
        this.init();
    }
    
    init() {
        this.createPanel();
        this.createTooltip();
        this.setupEventListeners();
        this.updateInventory();
    }
    
    createPanel() {
        const container = document.createElement('div');
        container.id = 'inventory-panel';
        container.className = 'inventory-panel';
        
        const header = document.createElement('div');
        header.className = 'inventory-header';
        header.innerHTML = `
            <h3>📦 仓库</h3>
            <div class="storage-bar-container">
                <div class="storage-bar">
                    <div class="storage-fill"></div>
                </div>
                <span class="storage-text"></span>
            </div>
        `;
        container.appendChild(header);
        
        const categoryTabs = document.createElement('div');
        categoryTabs.className = 'category-tabs';
        categoryTabs.innerHTML = `
            <button class="category-tab active" data-category="all">全部</button>
        `;
        container.appendChild(categoryTabs);
        
        const inventoryGrid = document.createElement('div');
        inventoryGrid.className = 'inventory-grid';
        container.appendChild(inventoryGrid);
        
        document.getElementById('game-container').appendChild(container);
        this.panel = container;
    }
    
    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.id = 'inventory-tooltip';
        tooltip.className = 'inventory-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);
        this.tooltip = tooltip;
    }
    
    setupEventListeners() {
        const categoryTabs = this.panel.querySelector('.category-tabs');
        categoryTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-tab')) {
                this.switchCategory(e.target.dataset.category);
            }
        });
        
        const inventoryGrid = this.panel.querySelector('.inventory-grid');
        inventoryGrid.addEventListener('mouseover', (e) => {
            const itemSlot = e.target.closest('.inventory-item');
            if (itemSlot) {
                this.showTooltip(itemSlot, e.clientX, e.clientY);
            }
        });
        
        inventoryGrid.addEventListener('mouseout', () => {
            this.hideTooltip();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.tooltip.style.display !== 'none') {
                this.tooltip.style.left = e.clientX + 15 + 'px';
                this.tooltip.style.top = e.clientY + 15 + 'px';
            }
        });
    }
    
    updateInventory() {
        this.updateCategoryTabs();
        this.updateStorageBar();
        this.renderItems();
    }
    
    updateCategoryTabs() {
        const storage = this.game.getStorage();
        const categories = storage.getResourceCategories();
        const categoryTabs = this.panel.querySelector('.category-tabs');
        
        let tabsHTML = '<button class="category-tab active" data-category="all">全部</button>';
        for (const [key, category] of Object.entries(categories)) {
            tabsHTML += `<button class="category-tab" data-category="${key}">${category.name}</button>`;
        }
        categoryTabs.innerHTML = tabsHTML;
        
        const activeTab = categoryTabs.querySelector(`[data-category="${this.activeCategory}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }
    
    updateStorageBar() {
        const storage = this.game.getStorage();
        const total = storage.getTotalResourceAmount();
        const capacity = storage.getStorageCapacity();
        const percentage = (total / capacity) * 100;
        
        const storageFill = this.panel.querySelector('.storage-fill');
        const storageText = this.panel.querySelector('.storage-text');
        
        storageFill.style.width = percentage + '%';
        storageFill.style.backgroundColor = percentage > 90 ? '#ef4444' : percentage > 70 ? '#f59e0b' : '#22c55e';
        storageText.textContent = `${total}/${capacity}`;
    }
    
    switchCategory(categoryKey) {
        this.activeCategory = categoryKey;
        
        const categoryTabs = this.panel.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => tab.classList.remove('active'));
        
        const activeTab = this.panel.querySelector(`[data-category="${categoryKey}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        this.renderItems();
    }
    
    renderItems() {
        const storage = this.game.getStorage();
        const allResources = storage.getResources();
        const resourceInfo = storage.getAllResourceInfo();
        const categories = storage.getResourceCategories();
        
        let itemsToRender = {};
        
        if (this.activeCategory === 'all') {
            itemsToRender = allResources;
        } else {
            itemsToRender = storage.getResourcesByCategory(this.activeCategory);
        }
        
        const inventoryGrid = this.panel.querySelector('.inventory-grid');
        let html = '';
        
        for (const [key, amount] of Object.entries(itemsToRender)) {
            const info = resourceInfo[key];
            if (info) {
                html += `
                    <div class="inventory-item" data-resource="${key}">
                        <span class="item-emoji">${info.emoji}</span>
                        <span class="item-count">${amount}</span>
                    </div>
                `;
            }
        }
        
        inventoryGrid.innerHTML = html;
    }
    
    showTooltip(itemSlot, x, y) {
        const resourceKey = itemSlot.dataset.resource;
        const storage = this.game.getStorage();
        const info = storage.getResourceInfo(resourceKey);
        const amount = storage.getResource(resourceKey);
        
        if (info) {
            this.tooltip.innerHTML = `
                <div class="tooltip-header">
                    <span class="tooltip-emoji">${info.emoji}</span>
                    <span class="tooltip-name">${info.name}</span>
                </div>
                <div class="tooltip-info">
                    <span>数量: <strong>${amount}</strong></span>
                </div>
            `;
            this.tooltip.style.display = 'block';
            this.tooltip.style.left = x + 15 + 'px';
            this.tooltip.style.top = y + 15 + 'px';
        }
    }
    
    hideTooltip() {
        this.tooltip.style.display = 'none';
    }
    
    destroy() {
        if (this.panel) {
            this.panel.remove();
        }
        if (this.tooltip) {
            this.tooltip.remove();
        }
    }
}