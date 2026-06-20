export class ShopPanel {
    constructor(game) {
        this.game = game;
        this.panel = null;
        this.overlay = null;
        this.activeTab = 'buy';
        this.activeCategory = 'all';
        this.init();
    }

    init() {
        this.createOverlay();
        this.createPanel();
        this.setupEventListeners();
    }

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'shop-overlay';
        overlay.className = 'inventory-overlay';
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    createPanel() {
        const container = document.createElement('div');
        container.id = 'shop-panel';
        container.className = 'inventory-panel';
        container.style.display = 'none';
        container.style.width = '500px';
        container.style.height = '550px';

        const header = document.createElement('div');
        header.className = 'shop-header';
        const headerTop = document.createElement('div');
        headerTop.className = 'shop-header-top';
        const title = document.createElement('h3');
        title.textContent = '🏪 海岛商店';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.id = 'shop-close-btn';
        closeBtn.textContent = '✕';
        headerTop.appendChild(title);
        headerTop.appendChild(closeBtn);

        const goldDisplay = document.createElement('div');
        goldDisplay.className = 'gold-display';
        goldDisplay.innerHTML = '<span class="gold-emoji">💰</span><span class="gold-amount">0</span>';
        header.appendChild(headerTop);
        header.appendChild(goldDisplay);

        const tabs = document.createElement('div');
        tabs.className = 'shop-tabs';
        tabs.innerHTML = '<button class="shop-tab active" data-tab="buy">🛒 购买</button><button class="shop-tab" data-tab="sell">💰 出售</button>';

        const categoryTabs = document.createElement('div');
        categoryTabs.className = 'shop-category-tabs';
        categoryTabs.innerHTML = '<button class="shop-category-tab active" data-category="all">全部</button>';

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'shop-items';

        container.appendChild(header);
        container.appendChild(tabs);
        container.appendChild(categoryTabs);
        container.appendChild(itemsContainer);

        document.getElementById('game-container').appendChild(container);
        this.panel = container;
    }

    setupEventListeners() {
        const closeBtn = this.panel.querySelector('#shop-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.hide());

        const shopTabs = this.panel.querySelector('.shop-tabs');
        shopTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('shop-tab')) this.switchTab(e.target.dataset.tab);
        });

        const categoryTabs = this.panel.querySelector('.shop-category-tabs');
        categoryTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('shop-category-tab')) this.switchCategory(e.target.dataset.category);
        });

        const shopBtn = document.querySelector('.shop-btn');
        if (shopBtn) shopBtn.addEventListener('click', () => this.toggle());
    }

    toggle() {
        if (this.panel.style.display === 'none') this.show();
        else this.hide();
    }

    show() {
        if (this.overlay) this.overlay.style.display = 'block';
        this.panel.style.display = 'block';
        this.updateShop();
        this.centerPanel();
    }

    hide() {
        if (this.overlay) this.overlay.style.display = 'none';
        this.panel.style.display = 'none';
    }

    isVisible() {
        return this.panel.style.display !== 'none';
    }

    centerPanel() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;
        const canvasRect = canvas.getBoundingClientRect();
        const panelRect = this.panel.getBoundingClientRect();
        const left = canvasRect.left + (canvasRect.width - panelRect.width) / 2;
        const top = canvasRect.top + (canvasRect.height - panelRect.height) / 2;
        this.panel.style.position = 'fixed';
        this.panel.style.left = left + 'px';
        this.panel.style.top = top + 'px';
        this.panel.style.transform = 'none';
    }

    switchTab(tab) {
        this.activeTab = tab;
        const tabs = this.panel.querySelectorAll('.shop-tab');
        tabs.forEach(t => t.classList.remove('active'));
        const activeTab = this.panel.querySelector('[data-tab="' + tab + '"]');
        if (activeTab) activeTab.classList.add('active');
        this.renderItems();
    }

    switchCategory(category) {
        this.activeCategory = category;
        const tabs = this.panel.querySelectorAll('.shop-category-tab');
        tabs.forEach(t => t.classList.remove('active'));
        const activeTab = this.panel.querySelector('[data-category="' + category + '"]');
        if (activeTab) activeTab.classList.add('active');
        this.renderItems();
    }

    updateShop() {
        this.updateGoldDisplay();
        this.updateCategoryTabs();
        this.renderItems();
    }

    updateGoldDisplay() {
        const storage = this.game.getStorage();
        const goldAmount = storage.getResource('gold');
        const goldAmountElement = this.panel.querySelector('.gold-amount');
        if (goldAmountElement) goldAmountElement.textContent = goldAmount;
    }

    updateCategoryTabs() {
        const shop = this.game.getShop();
        const categories = shop.getShopCategories();
        const categoryTabs = this.panel.querySelector('.shop-category-tabs');
        let tabsHTML = '<button class="shop-category-tab active" data-category="all">全部</button>';
        for (const [key, category] of Object.entries(categories)) {
            tabsHTML += '<button class="shop-category-tab" data-category="' + key + '">' + category.icon + ' ' + category.name + '</button>';
        }
        categoryTabs.innerHTML = tabsHTML;
        const activeTab = categoryTabs.querySelector('[data-category="' + this.activeCategory + '"]');
        if (activeTab) activeTab.classList.add('active');
    }

    renderItems() {
        const shop = this.game.getShop();
        const storage = this.game.getStorage();
        const resourceInfo = storage.getAllResourceInfo();
        let itemsToRender = this.activeTab === 'buy' ? shop.getBuyItemsByCategory(this.activeCategory) : shop.getSellItemsByCategory(this.activeCategory);
        const itemsContainer = this.panel.querySelector('.shop-items');
        itemsContainer.innerHTML = '';

        for (const [key, config] of Object.entries(itemsToRender)) {
            const info = resourceInfo[key];
            if (!info) continue;
            const currentAmount = storage.getResource(key);
            const price = config.price;
            const amount = config.amount;

            let maxQuantity = 1;
            if (this.activeTab === 'buy') {
                const gold = storage.getResource('gold');
                maxQuantity = Math.floor(gold / price);
                const remainingCapacity = storage.getStorageCapacity() - storage.getTotalResourceAmount();
                const maxByCapacity = Math.floor(remainingCapacity / amount);
                maxQuantity = Math.max(0, Math.min(maxQuantity, maxByCapacity));
            } else {
                maxQuantity = Math.floor(currentAmount / amount);
            }
            const canAfford = maxQuantity >= 1;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            itemDiv.dataset.resource = key;

            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'shop-item-emoji';
            emojiSpan.textContent = info.emoji;

            const infoDiv = document.createElement('div');
            infoDiv.className = 'shop-item-info';
            const nameDiv = document.createElement('div');
            nameDiv.className = 'shop-item-name';
            nameDiv.textContent = info.name;
            const amountDiv = document.createElement('div');
            amountDiv.className = 'shop-item-amount';
            amountDiv.textContent = '数量: ' + currentAmount;
            infoDiv.appendChild(nameDiv);
            infoDiv.appendChild(amountDiv);

            const priceDiv = document.createElement('div');
            priceDiv.className = 'shop-item-price';
            const priceSpan = document.createElement('span');
            priceSpan.className = 'price-text';
            priceSpan.textContent = this.activeTab === 'buy' ? '💰 ' + price + ' / ' + amount + '个' : '💰 +' + price + ' / ' + amount + '个';
            priceDiv.appendChild(priceSpan);

            const quantityDiv = document.createElement('div');
            quantityDiv.className = 'shop-quantity-control';

            const minusBtn = document.createElement('button');
            minusBtn.className = 'quantity-btn quantity-minus';
            minusBtn.textContent = '-';
            minusBtn.dataset.resource = key;
            minusBtn.dataset.action = 'minus';

            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'quantity-input';
            input.min = '1';
            input.max = maxQuantity || '1';
            input.value = '1';
            input.dataset.resource = key;

            const plusBtn = document.createElement('button');
            plusBtn.className = 'quantity-btn quantity-plus';
            plusBtn.textContent = '+';
            plusBtn.dataset.resource = key;
            plusBtn.dataset.action = 'plus';

            const maxBtn = document.createElement('button');
            maxBtn.className = 'quantity-btn quantity-max';
            maxBtn.textContent = '最大';
            maxBtn.dataset.resource = key;
            maxBtn.dataset.action = 'max';
            maxBtn.dataset.max = maxQuantity;

            quantityDiv.appendChild(minusBtn);
            quantityDiv.appendChild(input);
            quantityDiv.appendChild(plusBtn);
            quantityDiv.appendChild(maxBtn);

            const btn = document.createElement('button');
            btn.className = 'shop-action-btn' + (canAfford ? '' : ' disabled');
            btn.dataset.action = this.activeTab === 'buy' ? 'buy' : 'sell';
            btn.dataset.resource = key;
            btn.textContent = this.activeTab === 'buy' ? '购买' : '出售';

            itemDiv.appendChild(emojiSpan);
            itemDiv.appendChild(infoDiv);
            itemDiv.appendChild(priceDiv);
            itemDiv.appendChild(quantityDiv);
            itemDiv.appendChild(btn);
            itemsContainer.appendChild(itemDiv);
        }
        this.setupItemEventListeners();
    }

    setupItemEventListeners() {
        const buttons = this.panel.querySelectorAll('.shop-action-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const resourceKey = e.target.dataset.resource;
                const action = e.target.dataset.action;
                const quantity = this.getQuantityInput(resourceKey);
                if (action === 'buy') this.onBuyItem(resourceKey, quantity);
                else if (action === 'sell') this.onSellItem(resourceKey, quantity);
            });
        });

        const quantityBtns = this.panel.querySelectorAll('.quantity-btn');
        quantityBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const resourceKey = e.target.dataset.resource;
                const action = e.target.dataset.action;
                this.updateQuantityInput(resourceKey, action);
            });
        });
    }

    getQuantityInput(resourceKey) {
        const input = this.panel.querySelector('.quantity-input[data-resource="' + resourceKey + '"]');
        if (input) {
            const value = parseInt(input.value);
            const max = parseInt(input.max);
            const min = parseInt(input.min);
            return Math.max(min, Math.min(max, isNaN(value) ? 1 : value));
        }
        return 1;
    }

    updateQuantityInput(resourceKey, action) {
        const input = this.panel.querySelector('.quantity-input[data-resource="' + resourceKey + '"]');
        if (!input) return;

        let value = parseInt(input.value);
        const max = parseInt(input.max);
        const min = parseInt(input.min);

        if (action === 'minus') {
            value = Math.max(min, value - 1);
        } else if (action === 'plus') {
            value = Math.min(max, value + 1);
        } else if (action === 'max') {
            value = max;
        }

        input.value = value;
    }

    onBuyItem(resourceKey, quantity = 1) {
        const shop = this.game.getShop();
        const result = shop.buyItem(resourceKey, quantity);
        this.showToast(result.message, result.success ? 'success' : 'error');
        this.updateShop();
    }

    onSellItem(resourceKey, quantity = 1) {
        const shop = this.game.getShop();
        const result = shop.sellItem(resourceKey, quantity);
        this.showToast(result.message, result.success ? 'success' : 'error');
        this.updateShop();
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        const colors = { error: 'rgba(231, 76, 60, 0.9)', success: 'rgba(46, 204, 113, 0.9)', info: 'rgba(52, 152, 219, 0.9)' };
        toast.style.background = colors[type] || colors.info;
        toast.style.whiteSpace = 'pre-line';
        toast.style.padding = '15px 25px';
        toast.style.maxWidth = '300px';
        toast.style.textAlign = 'center';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
    }

    destroy() {
        if (this.overlay) this.overlay.remove();
        if (this.panel) this.panel.remove();
    }
}