const checkmark = '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> </svg>'
const trashcan = '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const reverse = '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M2 10C2 10 4.00498 7.26822 5.63384 5.63824C7.26269 4.00827 9.5136 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.89691 21 4.43511 18.2543 3.35177 14.5M2 10V4M2 10H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> </svg>'

class TaskManager {
    constructor(timer) {
        this.tasks = new Map(); // id -> task object
        this.selectedTaskId = null;
        this.timer = timer;
        this.listeners = new Set();

        this.timer.listeners.add((action) => {
            if (action.type == "timer-advance") { this.trackSeconds(); }
            if ((action.type == "timer-stop") || (action.type == "timer-complete")) {
                this.saveToStorage();
            }
        });

        this.init();
    }

    init() {
        this.loadFromStorage();
    }

    loadFromStorage() {
        const taskArray = JSON.parse(localStorage.getItem('tasks') || '[]');
        this.tasks = new Map(taskArray.map(task => [task.id, task]));
    }

    saveToStorage() {
        const taskArray = Array.from(this.tasks.values());
        localStorage.setItem('tasks', JSON.stringify(taskArray));
    }
    
    notify(action) {
        this.listeners.forEach(listener => listener(action));
    }

    nextId() {
        if (this.tasks.size === 0) {
            return 1;
        }
        return Math.max(...this.tasks.keys()) + 1;
    }

    addTask(text) {
        const task = {
            id: this.nextId(),
            text: text,
            status: "active",
            createdAt: new Date(),
            trackedTime: 0,
        }
        this.tasks.set(this.nextId(), task);
        this.notify({ type: "task-added", task: task });
        this.saveToStorage();
    }

    deleteTask(id) {
        if (this.selectedTaskId == id) {
            this.toggleSelect(id);
        }
        this.notify({ type: "task-deleted", id: id });
        this.tasks.delete(id);
        this.saveToStorage();
    }

    toggleSelect(id) {
        if (this.selectedTaskId == id) {
            this.selectedTaskId = null;
            this.notify({ type: "task-deselected", id: id });
        }
        else {
            if (this.selectedTaskId !== null) { 
                this.notify({ type: "task-deselected", id: this.selectedTaskId }); 
            }
            this.selectedTaskId = id;
            this.notify({ type: "task-selected", id: id });
        }
        this.saveToStorage();
    }

    toggleComplete(id) {
        const sourceStatus = this.tasks.get(id).status;
        const targetStatus = (sourceStatus == "active") ? "completed" : "active";

        if ((sourceStatus == "active") && (id == this.selectedTaskId)) {
            this.toggleSelect(id);
        }

        this.tasks.get(id).status = targetStatus;
        this.notify( { type: "status-changed", id: id, source: sourceStatus, target: targetStatus } );
        this.saveToStorage();
    }

    trackSeconds() {
        if (this.selectedTaskId !== null) {
            this.tasks.get(this.selectedTaskId).trackedTime++;
            this.notify({ type: "track-seconds", id: this.selectedTaskId });
        }
    }
}

class TaskUI {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.taskElements = new Map(); // id -> an object with task UI elements
        this.listByStatus = new Map([
            ["active", document.getElementById('active-task-list')],
            ["completed", document.getElementById('completed-task-list')]
        ]); // completion status -> list of task elements
        this.symbolByStatus = new Map([
            ["active", checkmark],
            ["completed", reverse]
        ]);

        this.currentTaskLabel = document.getElementById("current-task");
        this.newTaskInput = document.getElementById("new-task-input");
        this.addTaskButton = document.getElementById("add-task-button");

        this.addTaskButton.addEventListener("click", () => this.createTaskFromInput());
        this.newTaskInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                this.createTaskFromInput();
            }    
        });

        this.setupEventHandling();

        this.taskManager.tasks.forEach( task => this.renderTask(task) );
    }

    setupEventHandling() {
        this.taskManager.listeners.add( (action) => {
            if (action.type == "task-added") { this.renderTask(action.task); }
            if (action.type == "task-deleted") {
                const status = this.taskManager.tasks.get(action.id).status;
                const taskContainer = this.taskElements.get(action.id).taskContainer;
                this.listByStatus.get(status).removeChild(taskContainer);
                this.taskElements.delete(action.id);
            }
            if (action.type == "task-selected") {
                this.taskElements.get(action.id).taskButton.classList.add("selected");
                this.currentTaskLabel.textContent = this.taskManager.tasks.get(action.id).text;
                this.currentTaskLabel.classList.remove("no-task");
            }
            if (action.type == "task-deselected") {
                this.taskElements.get(action.id).taskButton.classList.remove("selected");
                this.currentTaskLabel.textContent = "No task";
                this.currentTaskLabel.classList.add("no-task");
            }
            if (action.type == "status-changed") {
                const taskContainer = this.taskElements.get(action.id).taskContainer;
                this.listByStatus.get(action.source).removeChild(taskContainer);
                this.listByStatus.get(action.target).appendChild(taskContainer);

                const completed = (action.target == "completed");
                this.taskElements.get(action.id).taskButton.disabled = completed ;
                this.taskElements.get(action.id).taskButton.classList.toggle("completed", completed);

                this.taskElements.get(action.id).completeButton.innerHTML = this.symbolByStatus.get(action.target);
                this.taskElements.get(action.id).completeButton.classList.remove(action.source);
                this.taskElements.get(action.id).completeButton.classList.add(action.target);
            }
            if (action.type == "track-seconds") {
                const formattedTime = formatTime(this.taskManager.tasks.get(action.id).trackedTime);
                this.taskElements.get(action.id).timeTracker.textContent = formattedTime;
            }
        });
    }

    renderTask(task) {
        const taskElement = {
            taskContainer: document.createElement("div"),
            taskButton: document.createElement("button"),
            timeTracker: document.createElement("span"),
            completeButton: document.createElement("button"),
            deleteButton: document.createElement("button")
        }

        taskElement.taskContainer.classList.add("task-container");

        taskElement.taskButton.classList.add("task");
        taskElement.taskButton.textContent = task.text;
        taskElement.taskButton.addEventListener("click", () => this.taskManager.toggleSelect(task.id) );
        taskElement.taskButton.disabled = (task.status == "completed");
        taskElement.taskButton.classList.toggle("completed", (task.status == "completed"));

        taskElement.timeTracker.textContent = formatTime(task.trackedTime);
        taskElement.timeTracker.classList.add("time-tracker");

        taskElement.completeButton.classList.add("complete");
        taskElement.completeButton.innerHTML = this.symbolByStatus.get(task.status);
        taskElement.completeButton.classList.add(task.status);
        taskElement.completeButton.addEventListener("click", () => this.taskManager.toggleComplete(task.id) );

        taskElement.deleteButton.classList.add("delete");
        taskElement.deleteButton.innerHTML = trashcan;
        taskElement.deleteButton.addEventListener("click", () => this.taskManager.deleteTask(task.id) );

        [taskElement.completeButton, taskElement.taskButton, taskElement.timeTracker, taskElement.deleteButton].forEach(
            button => taskElement.taskContainer.appendChild(button)
        );

        this.listByStatus.get(task.status).appendChild(taskElement.taskContainer);
        this.taskElements.set(task.id, taskElement);
    }

    createTaskFromInput() {
        const defaultName = "Task #" + this.taskManager.nextId();
        const newTaskName = (this.newTaskInput.value) ? this.newTaskInput.value : defaultName;
        this.newTaskInput.value = "";
        this.taskManager.addTask(newTaskName);
    }
}

const taskManager = new TaskManager(timer);
const taskUI = new TaskUI(taskManager);