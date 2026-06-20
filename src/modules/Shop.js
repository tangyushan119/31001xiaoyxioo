import { SHOP_CONFIG } from "../config.js";

export class Shop {
    constructor(game) {
        this.game = game;
        this.buyItems = { ...SHOP_CONFIG.buyItems };
        this.sellItems = { ...SHOP_CONFIG.sellItems };
        this.shopCategories = { ...SHOP_CONFIG.shopCategories };
    }

    buyItem(resourceKey, quantity = 1) {
        const itemConfig = this.buyItems[resourceKey];
        if (!itemConfig) {
            return { success: false, message: "物品不存在" };
        }

        const storage = this.game.getStorage();
        const totalPrice = itemConfig.price * quantity;
        const currentGold = storage.getResource("gold");

        if (currentGold < totalPrice) {
            return { success: false, message: "金币不足！需要 " + totalPrice + " 💰" };
        }

        const totalAmount = itemConfig.amount * quantity;
        const remainingCapacity = storage.getStorageCapacity() - storage.getTotalResourceAmount();

        if (remainingCapacity < totalAmount) {
            return { success: false, message: "仓库容量不足！" };
        }

        storage.modifyResource("gold", -totalPrice);
        storage.modifyResource(resourceKey, totalAmount);

        const resourceInfo = storage.getResourceInfo(resourceKey);
        const name = resourceInfo ? resourceInfo.name : resourceKey;
        const emoji = resourceInfo ? resourceInfo.emoji : "";

        this.updateUI();

        return {
            success: true,
            message: "✅ 购买成功！获得 " + emoji + " " + name + " x" + totalAmount
        };
    }

    sellItem(resourceKey, quantity = 1) {
        const itemConfig = this.sellItems[resourceKey];
        if (!itemConfig) {
            return { success: false, message: "物品不存在" };
        }

        const storage = this.game.getStorage();
        const totalAmount = itemConfig.amount * quantity;
        const currentAmount = storage.getResource(resourceKey);

        if (currentAmount < totalAmount) {
            return { success: false, message: "物品数量不足！" };
        }

        const totalPrice = itemConfig.price * quantity;

        storage.modifyResource(resourceKey, -totalAmount);
        storage.modifyResource("gold", totalPrice);

        const resourceInfo = storage.getResourceInfo(resourceKey);
        const name = resourceInfo ? resourceInfo.name : resourceKey;
        const emoji = resourceInfo ? resourceInfo.emoji : "";

        this.updateUI();

        return {
            success: true,
            message: "✅ 出售成功！获得 💰 " + totalPrice
        };
    }

    canBuyItem(resourceKey) {
        const itemConfig = this.buyItems[resourceKey];
        if (!itemConfig) return false;

        const storage = this.game.getStorage();
        const currentGold = storage.getResource("gold");

        return currentGold >= itemConfig.price;
    }

    canSellItem(resourceKey) {
        const itemConfig = this.sellItems[resourceKey];
        if (!itemConfig) return false;

        const storage = this.game.getStorage();
        const currentAmount = storage.getResource(resourceKey);

        return currentAmount >= itemConfig.amount;
    }

    getBuyItemsByCategory(category) {
        const items = {};
        for (const [key, config] of Object.entries(this.buyItems)) {
            if (category === "all" || config.category === category) {
                items[key] = config;
            }
        }
        return items;
    }

    getSellItemsByCategory(category) {
        const items = {};
        for (const [key, config] of Object.entries(this.sellItems)) {
            if (category === "all" || config.category === category) {
                items[key] = config;
            }
        }
        return items;
    }

    getShopCategories() {
        return this.shopCategories;
    }

    updateUI() {
        if (this.game.buildPanel) {
            this.game.buildPanel.updateResourceDisplay();
        }
        if (this.game.shopPanel) {
            this.game.shopPanel.updateShop();
        }
    }

    getItemBuyPrice(resourceKey) {
        return this.buyItems[resourceKey]?.price || 0;
    }

    getItemSellPrice(resourceKey) {
        return this.sellItems[resourceKey]?.price || 0;
    }

    getItemBuyAmount(resourceKey) {
        return this.buyItems[resourceKey]?.amount || 0;
    }

    getItemSellAmount(resourceKey) {
        return this.sellItems[resourceKey]?.amount || 0;
    }
}
