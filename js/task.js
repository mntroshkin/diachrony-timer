document.addEventListener('alpine:init', () => {
    Alpine.store('tasks', {
        items: new Map(),
        selectedId: null,
        timer: timer,

        init() {
            this.loadFromStorage();
            this.timer.listeners.add((action) => {
                if (action.type == "timer-advance") { this.trackSeconds(); }
                if ((action.type == "timer-stop") || (action.type == "timer-complete")) {
                    this.saveToStorage();
                }
            });
        },

        loadFromStorage() {
            const taskArray = JSON.parse(localStorage.getItem('tasks') || '[]');
            this.items = new Map(taskArray.map(task => [task.id, task]));
        },

        saveToStorage() {
            const taskArray = Array.from(this.items.values());
            localStorage.setItem('tasks', JSON.stringify(taskArray));
        },

        tasksByStatus(status) {
            return Array.from(this.items.values()).filter(task => task.status === status);
        },

        nextId() {
            if (this.items.size === 0) {
                return 1;
            }
            return Math.max(...this.items.keys()) + 1;
        },

        addTask(text) {
            text = (text.length === 0) ? `Task #${ this.nextId() }` : text;
            const task = {
                id: this.nextId(),
                text: text,
                status: "active",
                createdAt: new Date(),
                trackedTime: 0,
            }
            this.items.set(this.nextId(), task);
            this.saveToStorage();
        },

        deleteTask(id) {
            if (this.selectedId == id) {
                this.toggleSelect(id);
            }
            this.items.delete(id);
            this.saveToStorage();
        },

        toggleSelect(id) {
            this.selectedId = (this.selectedId == id) ? null : id;
            this.saveToStorage();
        },

        toggleComplete(id) {
            const sourceStatus = this.items.get(id).status;
            const targetStatus = (sourceStatus == "active") ? "completed" : "active";
            if ((sourceStatus == "active") && (id == this.selectedId)) {
                this.toggleSelect(id);
            }
            this.items.get(id).status = targetStatus;
            this.saveToStorage();
        },

        trackSeconds() {
            if (this.selectedId !== null) {
                this.items.get(this.selectedId).trackedTime++;
            }
        }
    });

    Alpine.store('checkmark', '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> </svg>');
    Alpine.store('reverse', '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M2 10C2 10 4.00498 7.26822 5.63384 5.63824C7.26269 4.00827 9.5136 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.89691 21 4.43511 18.2543 3.35177 14.5M2 10V4M2 10H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> </svg>');
    Alpine.store('trashcan', '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
});