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
        this.mouse.clicked = true;
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
        this.mouse.clicked = false;
        this.mouse.released = false;
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