const defaultInterval = 25 * 60;

function formatNumber(number) {
    let zeros_count = 2 - number.toString().length;
    return "0".repeat(zeros_count) + number.toString();
}

function formatTime(seconds) {
    return formatNumber(Math.floor(seconds / 60)) + ":" + formatNumber(Math.floor(seconds) % 60);
}


document.addEventListener('alpine:init', () => {
    Alpine.store('timer', {
        focusing: false,
        running: false,
        defaultInterval: defaultInterval,
        countdown: defaultInterval,
        intervalID: null,
        started_at: null,
        duration: null,

        time() {
            return formatTime(this.countdown);
        },

        advance() {
            this.duration += 1;
            this.countdown -= 1;
            if (this.countdown == 0) {
                this.reset();
            }
        },

        start() {
            this.started_at = new Date();
            this.duration = 0;
            this.running = true;
            this.focusing = true;
            this.intervalID = setInterval(() => this.advance(), 1000);
        },

        stop() {
            this.running = false;
            if (this.intervalID != null) {
                clearInterval(this.intervalID);
                this.intervalID = null;
            }
        },

        switch() {
            if (this.running) { this.stop(); }
            else { this.start(); }
        },

        reset() {
            if (this.focusing){
                Alpine.store('tasks').trackSession(this.started_at, new Date(), this.duration);
            }
            this.stop();
            this.started_at = null;
            this.duration = 0;
            this.focusing = false;
            this.countdown = this.defaultInterval;
        },

        switchText() {
            if (this.running)
                return "pause";
            else {
                return this.focusing ? "continue" : "start";
            }
        }
    });

    Alpine.store('tasks', {
        items: new Map(),
        selectedId: null,

        async init() {
            const response = await taskService.getAll();
            if (response.status == 200) {
                const taskArray = response.data;
                this.items = new Map(taskArray.map((task) => [task.id, task]));
            }
        },

        tasksByCompletion(status) {
            return Array.from(this.items.values()).filter(task => task.completed === status);
        },

        currentTaskText() {
            return (this.selectedId === null) ? 'No task' : this.items.get(this.selectedId).task_text
        },

        async refreshTask(id) {
            const response = await taskService.getOne(id);
            if (response.status == 200) {
                const task = response.data;
                this.items.set(id, task);
            }
        },

        async addTask(task_text) {
            task_text = (task_text.length === 0) ? "New task" : task_text;
            const data = {
                task_text: task_text,
                completed: false,
            }
            const response = await taskService.create(data);
            if (response.status == 201) {
                const task = response.data;
                this.items.set(task.id, task);
            }
        },

        async updateTask(id, data) {
            const response = await taskService.update(id, data);
            if (response.status == 200) {
                const task = response.data;
                this.items.set(task.id, task);
            }
        },

        async deleteTask(id) {
            if (id == this.selectedId) {
                this.toggleSelect(id);
            }
            const response = await taskService.delete(id);
            if (response.status == 204) {
                this.items.delete(id);
            }
        },

        toggleSelect(id) {
            this.selectedId = (this.selectedId == id) ? null : id;
        },

        async toggleComplete(id) {
            const task = this.items.get(id);
            if ((task.completed == false) && (id == this.selectedId)) {
                this.toggleSelect(id);
            }
            await this.updateTask(id, {
                task_text: task.task_text,
                completed: !task.completed,
            });
        },

        async trackSession(started_at, finished_at, duration) {
            const id = this.selectedId;
            if (id !== null) {
                timer_session = {
                    task_id: id,
                    started_at: started_at,
                    finished_at: finished_at,
                    duration: duration
                }
                const response = await sessionService.create(timer_session);
                if (response.status == 201) { await this.refreshTask(id); }
            }
        }
    });

    Alpine.store('checkmark', '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> </svg>');
    Alpine.store('reverse', '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M2 10C2 10 4.00498 7.26822 5.63384 5.63824C7.26269 4.00827 9.5136 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.89691 21 4.43511 18.2543 3.35177 14.5M2 10V4M2 10H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> </svg>');
    Alpine.store('trashcan', '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
    Alpine.store('downarrow', '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
    Alpine.store('uparrow', '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>')
});