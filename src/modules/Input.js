export class Input {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            canvasX: 0,
            canvasY: 0,
            down: false,
            clicked: false,
            released: false
        };
        
        this.game = null;
        this.draggedBuilding = null;
        this.selectedIsland = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setGame(game) {
        this.game = game;
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        document.addEventListener('dragstart', (e) => this.onDragStart(e));
        document.addEventListener('dragend', (e) => this.onDragEnd(e));
        document.addEventListener('dragover', (e) => this.onDragOver(e));
        document.addEventListener('drop', (e) => this.onDrop(e));
    }

    onKeyDown(e) {
        this.keys[e.code] = true;
        
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
            e.preventDefault();
        }
        
        if (e.code === 'Escape') {
            this.reset();
        }
    }

    onKeyUp(e) {
        this.keys[e.code] = false;
    }

    onMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        
        if (this.game && this.game.renderer && this.game.renderer.canvas) {
            const rect = this.game.renderer.canvas.getBoundingClientRect();
            this.mouse.canvasX = e.clientX - rect.left;
            this.mouse.canvasY = e.clientY - rect.top;
        }
        
        this.updateDragPreview(e);
    }

    onMouseDown(e) {
        this.mouse.down = true;
        if (e.button === 0) {
            this.mouse.clicked = true;
        }
    }

    onMouseUp(e) {
        this.mouse.down = false;
        this.mouse.released = true;
    }

    onDragStart(e) {
        const target = e.target;
        if (target.classList.contains('build-item')) {
            this.draggedBuilding = {
                type: target.dataset.type,
                emoji: target.textContent
            };
            
            e.dataTransfer.setData('buildingType', target.dataset.type);
            e.dataTransfer.setData('buildingEmoji', target.textContent);
            e.dataTransfer.effectAllowed = 'copy';
            
            target.classList.add('dragging');
            
            this.showDragOverlay(e, target.textContent);
        }
    }

    onDragEnd(e) {
        const target = e.target;
        if (target.classList.contains('build-item')) {
            target.classList.remove('dragging');
        }
        
        this.draggedBuilding = null;
        this.hideDragOverlay();
    }

    onDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        
        if (this.game && this.game.renderer && this.game.renderer.canvas) {
            const rect = this.game.renderer.canvas.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                this.game.renderer.canvas.classList.add('drag-over');
            }
        }
    }

    onDrop(e) {
        e.preventDefault();
        
        if (this.game && this.game.renderer && this.game.renderer.canvas) {
            this.game.renderer.canvas.classList.remove('drag-over');
        }
        
        const buildingType = e.dataTransfer.getData('buildingType');
        if (!buildingType || !this.game) return;
        
        const rect = this.game.renderer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.game.buildPanel) {
            this.game.buildPanel.tryPlaceBuilding(buildingType, x, y);
        }
        
        this.draggedBuilding = null;
        this.hideDragOverlay();
    }

    updateDragPreview(e) {
        const overlay = document.getElementById('drag-overlay');
        const preview = document.getElementById('drag-preview');
        
        if (overlay && preview && this.draggedBuilding) {
            overlay.style.left = e.clientX + 'px';
            overlay.style.top = e.clientY + 'px';
            preview.textContent = this.draggedBuilding.emoji;
            
            overlay.style.transform = 'translate(-50%, -50%)';
        }
    }

    showDragOverlay(e, emoji) {
        const overlay = document.getElementById('drag-overlay');
        const preview = document.getElementById('drag-preview');
        
        if (overlay && preview) {
            preview.textContent = emoji;
            overlay.classList.add('active');
            
            this.updateDragPreview(e);
        }
    }

    hideDragOverlay() {
        const overlay = document.getElementById('drag-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    isKeyPressed(key) {
        return this.keys[key] || false;
    }

    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    getCanvasMousePosition() {
        return { x: this.mouse.canvasX, y: this.mouse.canvasY };
    }

    isMouseDown() {
        return this.mouse.down;
    }

    wasClicked() {
        const clicked = this.mouse.clicked;
        this.mouse.clicked = false;
        return clicked;
    }
    
    wasReleased() {
        const released = this.mouse.released;
        this.mouse.released = false;
        return released;
    }

    update() {
        if (this.game && this.wasClicked()) {
            this.handleIslandClick();
        }
        
        this.updateHoveredIsland();
    }
    
    updateHoveredIsland() {
        if (!this.game || !this.game.dock) return;
        
        const mousePos = this.getCanvasMousePosition();
        const destinations = this.game.dock.getDestinations();
        const explored = this.game.dock.getExploredLocations();
        
        let hovered = null;
        
        for (const id of Object.keys(destinations)) {
            if (id === 'home') continue;
            
            const pos = this.game.dock.getIslandPosition(id);
            if (!pos) continue;
            
            const distance = Math.sqrt(
                Math.pow(mousePos.x - pos.x, 2) + 
                Math.pow(mousePos.y - pos.y, 2)
            );
            
            if (distance <= pos.radius && explored.includes(id)) {
                hovered = id;
                break;
            }
        }
        
        this.game.hoveredIsland = hovered;
    }
    
    handleIslandClick() {
        if (!this.game || !this.game.dock) return;
        
        const mousePos = this.getCanvasMousePosition();
        const destinations = this.game.dock.getDestinations();
        const explored = this.game.dock.getExploredLocations();
        
        for (const id of Object.keys(destinations)) {
            if (id === 'home') continue;
            
            const pos = this.game.dock.getIslandPosition(id);
            if (!pos) continue;
            
            const distance = Math.sqrt(
                Math.pow(mousePos.x - pos.x, 2) + 
                Math.pow(mousePos.y - pos.y, 2)
            );
            
            if (distance <= pos.radius) {
                if (explored.includes(id)) {
                    this.selectedIsland = id;
                    this.game.selectedIsland = id;
                    
                    if (destinations[id].requiresSoldiers) {
                        this.showBattleConfirmModal(id);
                    } else {
                        this.game.showToast(`📍 已选中: ${destinations[id].emoji} ${destinations[id].name}`);
                    }
                } else {
                    this.game.showToast(`❓ 未知岛屿，需要先探索`);
                }
                break;
            }
        }
    }
    
    showBattleConfirmModal(islandId) {
        const dock = this.game.dock;
        const destination = dock.destinations[islandId];
        const barracks = this.game.getBarracks();
        const soldiers = barracks.getAllSoldiers();
        const totalSoldiers = barracks.getTotalSoldiers();
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(30, 30, 30, 0.95);
            border: 2px solid #ef4444;
            border-radius: 15px;
            padding: 30px;
            width: 350px;
            z-index: 1000;
            box-shadow: 0 0 50px rgba(239, 68, 68, 0.5);
        `;
        
        const title = document.createElement('h3');
        title.style.cssText = `
            color: #ef4444;
            text-align: center;
            margin: 0 0 20px 0;
            font-size: 24px;
        `;
        title.innerHTML = `⚔️ 进攻 ${destination.emoji} ${destination.name}`;
        modal.appendChild(title);
        
        const dangerColors = { low: '#22c55e', medium: '#eab308', high: '#ef4444', extreme: '#dc2626' };
        const dangerColor = dangerColors[destination.dangerLevel] || '#9ca3af';
        
        const info = document.createElement('div');
        info.style.cssText = `
            color: #ffffff;
            margin-bottom: 20px;
            line-height: 1.8;
        `;
        info.innerHTML = `
            <p><strong>危险等级:</strong> <span style="color: ${dangerColor}">${destination.dangerLevel || '未知'}</span></p>
            <p><strong>预计战利品:</strong> ${destination.resources.map(r => dock.game.getStorage().getResourceInfo(r)?.emoji || '❓').join(' ')}</p>
            <p><strong>我方兵力:</strong> ⚔️步兵 ${soldiers.infantry} 🏹弓箭手 ${soldiers.archer}</p>
            <p><strong>消耗粮食:</strong> 🌾 ${dock.foodConsumptionPerSail[islandId]} 小麦</p>
        `;
        modal.appendChild(info);
        
        const buttons = document.createElement('div');
        buttons.style.cssText = `
            display: flex;
            gap: 15px;
            justify-content: center;
        `;
        
        const attackBtn = document.createElement('button');
        attackBtn.style.cssText = `
            padding: 12px 30px;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
        `;
        attackBtn.textContent = '⚔️ 发起进攻';
        attackBtn.onmouseover = () => attackBtn.style.transform = 'scale(1.05)';
        attackBtn.onmouseout = () => attackBtn.style.transform = 'scale(1)';
        attackBtn.onclick = () => {
            modal.remove();
            if (totalSoldiers === 0) {
                this.game.showToast('⚠️ 需要至少一名士兵才能发起进攻！');
                return;
            }
            
            const ships = dock.getDockedShips();
            if (ships.length === 0) {
                this.game.showToast('⚠️ 需要有船只才能远航！');
                return;
            }
            
            const result = dock.startSail(islandId, ships[0].id);
            this.game.showToast(result.message);
        };
        
        const cancelBtn = document.createElement('button');
        cancelBtn.style.cssText = `
            padding: 12px 30px;
            background: #4b5563;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
        `;
        cancelBtn.textContent = '取消';
        cancelBtn.onmouseover = () => cancelBtn.style.transform = 'scale(1.05)';
        cancelBtn.onmouseout = () => cancelBtn.style.transform = 'scale(1)';
        cancelBtn.onclick = () => modal.remove();
        
        buttons.appendChild(attackBtn);
        buttons.appendChild(cancelBtn);
        modal.appendChild(buttons);
        
        document.body.appendChild(modal);
        
        const closeModal = (e) => {
            if (e.target === modal) {
                modal.remove();
                document.removeEventListener('click', closeModal);
            }
        };
        document.addEventListener('click', closeModal);
    }

    reset() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            canvasX: 0,
            canvasY: 0,
            down: false,
            clicked: false,
            released: false
        };
        this.draggedBuilding = null;
        this.hideDragOverlay();
    }

    getDraggedBuilding() {
        return this.draggedBuilding;
    }
}