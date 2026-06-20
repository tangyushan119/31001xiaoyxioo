$content = @"
export class ShopPanel {
    constructor(game) {
        this.game = game;
        this.panel = null;
        this.overlay = null;
        this.activeTab = "buy";
        this.activeCategory = "all";

        this.init();
    }

    init() {
        this.createOverlay();
        this.createPanel();
        this.setupEventListeners();
    }

    createOverlay() {
        const overlay = document.createElement("div");
        overlay.id = "shop-overlay";
        overlay.className = "inventory-overlay";
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    createPanel() {
        const container = document.createElement("div");
        container.id = "shop-panel";
        container.className = "inventory-panel";
        container.style.display = "none";
        container.style.width = "500px";
        container.style.height = "550px";

        container.innerHTML = `
            <div class="shop-header">
                <div class="shop-header-top">
                    <h3>🏪 海岛商店</h3>
                    <button class="close-btn" id="shop-close-btn">✕</button>
                </div>
                <div class="gold-display">
                    <span class="gold-emoji">💰</span>
                    <span class="gold-amount">0</span>
                </div>
            </div>
            <div class="shop-tabs">
                <button class="shop-tab active" data-tab="buy">🛒 购买</button>
                <button class="shop-tab" data-tab="sell">💰 出售</button>
            </div>
            <div class="shop-category-tabs">
                <button class="shop-category-tab active" data-category="all">全部</button>
            </div>
            <div class="shop-items">
            </div>
        `;

        document.getElementById("game-container").appendChild(container);
        this.panel = container;
    }

    setupEventListeners() {
        const closeBtn = this.panel.querySelector("#shop-close-btn");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => this.hide());
        }

        const shopTabs = this.panel.querySelector(".shop-tabs");
        shopTabs.addEventListener("click", (e) => {
            if (e.target.classList.contains("shop-tab")) {
                this.switchTab(e.target.dataset.tab);
            }
        });

        const categoryTabs = this.panel.querySelector(".shop-category-tabs");
        categoryTabs.addEventListener("click", (e) => {
            if (e.target.classList.contains("shop-category-tab")) {
                this.switchCategory(e.target.dataset.category);
            }
        });

        const shopBtn = document.querySelector(".shop-btn");
        if (shopBtn) {
            shopBtn.addEventListener("click", () => this.toggle());
        }
    }

    toggle() {
        if (this.panel.style.display === "none") {
            this.show();
        } else {
            this.hide();
        }
    }

    show() {
        if (this.overlay) {
            this.overlay.style.display = "block";
        }
        this.panel.style.display = "block";
        this.updateShop();
        this.centerPanel();
    }

    hide() {
        if (this.overlay) {
            this.overlay.style.display = "none";
        }
        this.panel.style.display = "none";
    }

    isVisible() {
        return this.panel.style.display !== "none";
    }

    centerPanel() {
        const canvas = document.getElementById("game-canvas");
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();
        const panelRect = this.panel.getBoundingClientRect();

        const left = canvasRect.left + (canvasRect.width - panelRect.width) / 2;
        const top = canvasRect.top + (canvasRect.height - panelRect.height) / 2;

        this.panel.style.position = "fixed";
        this.panel.style.left = left + "px";
        this.panel.style.top = top + "px";
        this.panel.style.transform = "none";
    }

    switchTab(tab) {
        this.activeTab = tab;

        const tabs = this.panel.querySelectorAll(".shop-tab");
        tabs.forEach(t => t.classList.remove("active"));

        const activeTab = this.panel.querySelector(`[data-tab="${tab}"]`);
        if (activeTab) {
            activeTab.classList.add("active");
        }

        this.renderItems();
    }

    switchCategory(category) {
        this.activeCategory = category;

        const tabs = this.panel.querySelectorAll(".shop-category-tab");
        tabs.forEach(t => t.classList.remove("active"));

        const activeTab = this.panel.querySelector(`[data-category="${category}"]`);
        if (activeTab) {
            activeTab.classList.add("active");
        }

        this.renderItems();
    }

    updateShop() {
        this.updateGoldDisplay();
        this.updateCategoryTabs();
        this.renderItems();
    }

    updateGoldDisplay() {
        const storage = this.game.getStorage();
        const goldAmount = storage.getResource("gold");

        const goldAmountElement = this.panel.querySelector(".gold-amount");
        if (goldAmountElement) {
            goldAmountElement.textContent = goldAmount;
        }
    }

    updateCategoryTabs() {
        const shop = this.game.getShop();
        const categories = shop.getShopCategories();
        const categoryTabs = this.panel.querySelector(".shop-category-tabs");

        let tabsHTML = '<button class="shop-category-tab active" data-category="all">全部</button>';
        for (const [key, category] of Object.entries(categories)) {
            tabsHTML += '<button class="shop-category-tab" data-category="' + key + '">';
            tabsHTML += category.icon + " " + category.name;
            tabsHTML += '</button>';
        }
        categoryTabs.innerHTML = tabsHTML;

        const activeTab = categoryTabs.querySelector("[data-category='" + this.activeCategory + "']");
        if (activeTab) {
            activeTab.classList.add("active");
        }
    }

    renderItems() {
        const shop = this.game.getShop();
        const storage = this.game.getStorage();
        const resourceInfo = storage.getAllResourceInfo();

        let itemsToRender = {};
        if (this.activeTab === "buy") {
            itemsToRender = shop.getBuyItemsByCategory(this.activeCategory);
        } else {
            itemsToRender = shop.getSellItemsByCategory(this.activeCategory);
        }

        const itemsContainer = this.panel.querySelector(".shop-items");
        let html = "";

        for (const [key, config] of Object.entries(itemsToRender)) {
            const info = resourceInfo[key];
            if (!info) continue;

            const currentAmount = storage.getResource(key);
            const price = config.price;
            const amount = config.amount;

            const canAfford = this.activeTab === "buy" ? storage.getResource("gold") >= price : currentAmount >= amount;

            html += '<div class="shop-item" data-resource="' + key + '">';
            html += '    <span class="shop-item-emoji">' + info.emoji + '</span>';
            html += '    <div class="shop-item-info">';
            html += '        <div class="shop-item-name">' + info.name + '</div>';
            html += '        <div class="shop-item-amount">数量: ' + currentAmount + '</div>';
            html += '    </div>';
            html += '    <div class="shop-item-price">';
            html += '        <span class="price-text">';
            if (this.activeTab === "buy") {
                html += '💰 ' + price + " / " + amount + "个";
            } else {
                html += '💰 +' + price + " / " + amount + "个";
            }
            html += '        </span>';
            html += '    </div>';
            html += '    <button class="shop-action-btn ' + (canAfford ? "" : "disabled") + '" data-action="';
            html += this.activeTab === "buy" ? "buy" : "sell";
            html += '" data-resource="' + key + '">';
            html += this.activeTab === "buy" ? "购买" : "出售";
            html += '</button>';
            html += '</div>';
        }

        itemsContainer.innerHTML = html;

        this.setupItemEventListeners();
    }

    setupItemEventListeners() {
        const buttons = this.panel.querySelectorAll(".shop-action-btn");
        buttons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                const resourceKey = e.target.dataset.resource;
                const action = e.target.dataset.action;

                if (action === "buy") {
                    this.onBuyItem(resourceKey);
                } else if (action === "sell") {
                    this.onSellItem(resourceKey);
                }
            });
        });
    }

    onBuyItem(resourceKey) {
        const shop = this.game.getShop();
        const result = shop.buyItem(resourceKey);

        if (result.success) {
            this.showToast(result.message, "success");
        } else {
            this.showToast(result.message, "error");
        }

        this.updateShop();
    }

    onSellItem(resourceKey) {
        const shop = this.game.getShop();
        const result = shop.sellItem(resourceKey);

        if (result.success) {
            this.showToast(result.message, "success");
        } else {
            this.showToast(result.message, "error");
        }

        this.updateShop();
    }

    showToast(message, type = "info") {
        const toast = document.createElement("div");
        toast.className = "toast";

        const colors = {
            error: "rgba(231, 76, 60, 0.9)",
            success: "rgba(46, 204, 113, 0.9)",
            info: "rgba(52, 152, 219, 0.9)"
        };

        toast.style.background = colors[type] || colors.info;
        toast.style.whiteSpace = "pre-line";
        toast.style.padding = "15px 25px";
        toast.style.maxWidth = "300px";
        toast.style.textAlign = "center";
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    destroy() {
        if (this.overlay) {
            this.overlay.remove();
        }
        if (this.panel) {
            this.panel.remove();
        }
    }
}
"@
Set-Content -Path "d:\9999\31001\31001xiaoyxioo\src\components\ShopPanel.js" -Value $content -Encoding UTF8
Write-Host "ShopPanel.js created successfully"

