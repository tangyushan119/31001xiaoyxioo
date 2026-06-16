export class ShipSystem {
    constructor(game) {
        this.game = game;
    }

    showShipBuildingPanel() {
        const shipPanel = document.getElementById('ship-building-panel');
        if (!shipPanel) return;

        this.updateShipBuildingPanel();
        shipPanel.style.display = 'block';
    }

    updateShipBuildingPanel() {
        const dock = this.game.getDock();
        const storage = this.game.getStorage();

        if (!dock || !storage) return;

        const shipTypes = dock.getShipTypes();
        const resources = storage.getResources();
        const shipList = document.getElementById('ship-types-list');

        shipList.innerHTML = '';

        Object.entries(shipTypes).forEach(([key, shipInfo]) => {
            let canAfford = true;
            const missingResources = [];

            for (const [resKey, value] of Object.entries(shipInfo.cost)) {
                const current = resources[resKey] || 0;
                if (current < value) {
                    canAfford = false;
                    const resInfo = storage.getResourceInfo(resKey);
                    missingResources.push(`${resInfo?.emoji || '❓'} ${current}/${value}`);
                }
            }

            const shipItem = document.createElement('div');
            shipItem.className = `ship-type-item ${canAfford ? '' : 'disabled'}`;
            shipItem.dataset.shipType = key;

            let costHtml = '';
            for (const [resKey, value] of Object.entries(shipInfo.cost)) {
                const resInfo = storage.getResourceInfo(resKey);
                const current = resources[resKey] || 0;
                const color = current >= value ? '#4ade80' : '#ef4444';
                costHtml += `<span style="color: ${color}; font-size: 11px;">${resInfo?.emoji} ${current}/${value}</span>`;
            }

            shipItem.innerHTML = `
                <div class="ship-emoji">${shipInfo.emoji}</div>
                <div class="ship-info">
                    <div class="ship-name">${shipInfo.name}</div>
                    <div class="ship-cost">${costHtml}</div>
                    <div class="ship-stats">
                        <span title="容量">👥 ${shipInfo.capacity}</span>
                        <span title="速度">⚡ ${shipInfo.speed}</span>
                        <span title="货舱">📦 ${shipInfo.cargoSpace}</span>
                    </div>
                </div>
            `;

            if (canAfford) {
                shipItem.addEventListener('click', () => this.buildShip(key));
            }

            shipList.appendChild(shipItem);
        });

        const dockedShips = dock.getDockedShips();
        const ownedShipsList = document.getElementById('owned-ships-list');
        ownedShipsList.innerHTML = '';

        if (dockedShips.length === 0) {
            ownedShipsList.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.5); padding: 20px;">暂无船只</div>';
        } else {
            dockedShips.forEach(ship => {
                const shipItem = document.createElement('div');
                shipItem.className = 'owned-ship-item';
                shipItem.innerHTML = `
                    <span class="owned-ship-emoji">${ship.emoji}</span>
                    <span class="owned-ship-name">${ship.name}</span>
                `;
                ownedShipsList.appendChild(shipItem);
            });
        }
    }

    buildShip(shipType) {
        const result = this.game.getDock().buildShip(shipType);

        if (result.success) {
            this.game.showToast(result.message);
            this.updateShipBuildingPanel();
            this.game.getBuildPanel().updateResourceDisplay();
        } else {
            this.game.showToast(result.message);
        }
    }

    getDockedShips() {
        return this.game.getDock().getDockedShips();
    }

    getShipTypes() {
        return this.game.getDock().getShipTypes();
    }
}