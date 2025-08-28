/**
 * Task Tracker Application - Frontend JavaScript
 * 
 * This file contains all the frontend functionality for the Task Tracker application,
 * including API calls, DOM manipulation, and user interactions.
 * 
 * Features:
 * - Task list management (create, edit, delete, switch)
 * - Task management (create, edit, delete, toggle completion)
 * - Real-time updates and notifications
 * - Responsive design interactions
 * - Data persistence through API calls
 */

// Global variables
let currentTaskList = null;
let taskLists = [];
let tasks = [];
let isCreatingTask = false; // Flag to prevent duplicate task creation

// Local storage keys
const STORAGE_KEYS = {
    CURRENT_TASK_LIST: 'currentTaskListId'
};

// DOM elements
const taskListsContainer = document.getElementById('taskListsContainer');
const currentListTitle = document.getElementById('currentListTitle');
const listActions = document.getElementById('listActions');
const taskListContent = document.getElementById('taskListContent');

// Bootstrap components
let toast = null;
let modals = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadTaskLists();
});

/**
 * Initialize the application and Bootstrap components
 */
function initializeApp() {
    // Initialize Bootstrap toast
    const toastElement = document.getElementById('notificationToast');
    toast = new bootstrap.Toast(toastElement);
    
    // Initialize Bootstrap modals
    const modalElements = document.querySelectorAll('.modal');
    modalElements.forEach(modal => {
        const modalId = modal.id;
        modals[modalId] = new bootstrap.Modal(modal);
    });
}

/**
 * Setup event listeners for user interactions
 */
function setupEventListeners() {
    // Create task list
    document.getElementById('createListBtn').addEventListener('click', createTaskList);
    
    // Edit task list
    document.getElementById('editListBtn').addEventListener('click', showEditListModal);
    document.getElementById('updateListBtn').addEventListener('click', updateTaskList);
    
    // Delete task list
    document.getElementById('deleteListBtn').addEventListener('click', showDeleteListConfirmation);
    
    // Create task
    document.getElementById('createTaskBtn').addEventListener('click', createTask);
    
    // Edit task
    document.getElementById('updateTaskBtn').addEventListener('click', updateTask);
    
    // Form submissions
    document.getElementById('createListForm').addEventListener('submit', function(e) {
        e.preventDefault();
        createTaskList();
    });
    
    document.getElementById('editTaskForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updateTask();
    });
}

/**
 * Load all task lists from the API
 */
async function loadTaskLists() {
    try {
        showLoading(taskListsContainer);
        
        const response = await fetch('/api/task-lists');
        if (!response.ok) {
            throw new Error('Failed to load task lists');
        }
        
        taskLists = await response.json();
        renderTaskLists();
        
        // Select the previously selected task list or the first one if available
        if (taskLists.length > 0 && !currentTaskList) {
            const savedTaskListId = localStorage.getItem(STORAGE_KEYS.CURRENT_TASK_LIST);
            if (savedTaskListId) {
                const savedTaskList = taskLists.find(list => list.id === parseInt(savedTaskListId));
                if (savedTaskList) {
                    selectTaskList(savedTaskList.id);
                } else {
                    selectTaskList(taskLists[0].id);
                }
            } else {
                selectTaskList(taskLists[0].id);
            }
        }
        
    } catch (error) {
        console.error('Error loading task lists:', error);
        showNotification('Error loading task lists', 'error');
    }
}

/**
 * Render the task lists in the sidebar
 */
function renderTaskLists() {
    if (taskLists.length === 0) {
        taskListsContainer.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="fas fa-list fa-2x mb-2"></i>
                <p class="mb-0">No task lists yet</p>
                <small>Create your first task list to get started</small>
            </div>
        `;
        return;
    }
    
    taskListsContainer.innerHTML = taskLists.map(list => `
        <div class="task-list-item ${currentTaskList && currentTaskList.id === list.id ? 'active' : ''}" 
             onclick="selectTaskList(${list.id})">
            <div class="task-list-name">${escapeHtml(list.name)}</div>
            ${list.description ? `<div class="task-list-description">${escapeHtml(list.description)}</div>` : ''}
            <div class="task-list-stats">
                ${list.tasks.length} task${list.tasks.length !== 1 ? 's' : ''} • 
                ${list.tasks.filter(t => t.completed).length} completed
            </div>
        </div>
    `).join('');
}

/**
 * Select a task list and load its tasks
 */
async function selectTaskList(listId) {
    try {
        const taskList = taskLists.find(list => list.id === listId);
        if (!taskList) {
            throw new Error('Task list not found');
        }
        
        currentTaskList = taskList;
        tasks = taskList.tasks;
        
        // Update UI
        currentListTitle.innerHTML = `
            <i class="fas fa-clipboard-list me-2"></i>
            ${escapeHtml(taskList.name)}
        `;
        listActions.style.display = 'block';
        
        // Save the selected task list to localStorage
        localStorage.setItem(STORAGE_KEYS.CURRENT_TASK_LIST, listId.toString());
        
        // Update sidebar
        renderTaskLists();
        
        // Render tasks
        renderTasks();
        
    } catch (error) {
        console.error('Error selecting task list:', error);
        showNotification('Error selecting task list', 'error');
    }
}

/**
 * Render the tasks for the current task list
 */
function renderTasks() {
    if (!currentTaskList) {
        taskListContent.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-clipboard-list fa-3x mb-3"></i>
                <h4>No Task List Selected</h4>
                <p>Choose a task list from the sidebar or create a new one to get started.</p>
            </div>
        `;
        return;
    }
    
    if (tasks.length === 0) {
        taskListContent.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-tasks fa-3x mb-3"></i>
                <h4>No Tasks Yet</h4>
                <p>This task list is empty. Add your first task to get started!</p>
                <button class="btn btn-primary" onclick="showCreateTaskModal()">
                    <i class="fas fa-plus me-1"></i>
                    Add First Task
                </button>
            </div>
        `;
        return;
    }
    
    const completedCount = tasks.filter(task => task.completed).length;
    const completionPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
    
    taskListContent.innerHTML = `
        <div class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0">Progress</h6>
                <span class="text-muted">${completedCount} of ${tasks.length} completed</span>
            </div>
            <div class="progress">
                <div class="progress-bar" role="progressbar" 
                     style="width: ${completionPercentage}%" 
                     aria-valuenow="${completionPercentage}" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                </div>
            </div>
        </div>
        
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Tasks</h6>
            <button class="btn btn-primary btn-sm" onclick="showCreateTaskModal()">
                <i class="fas fa-plus me-1"></i>
                Add Task
            </button>
        </div>
        
        <div id="tasksContainer">
            ${tasks.map(task => renderTaskItem(task)).join('')}
        </div>
    `;
}

/**
 * Render a single task item
 */
function renderTaskItem(task) {
    const completedClass = task.completed ? 'completed' : '';
    const completedIcon = task.completed ? 'fas fa-check-circle text-success' : 'far fa-circle text-muted';
    
    return `
        <div class="task-item ${completedClass} fade-in" data-task-id="${task.id}">
            <div class="d-flex align-items-start">
                <button class="btn btn-link p-0 me-3" onclick="toggleTask(${task.id})">
                    <i class="${completedIcon} fa-lg"></i>
                </button>
                <div class="task-content">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                    <div class="task-meta">
                        Created: ${formatDate(task.created_at)}
                        ${task.updated_at ? ` • Updated: ${formatDate(task.updated_at)}` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn edit" onclick="showEditTaskModal(${task.id})" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete" onclick="showDeleteTaskConfirmation(${task.id})" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Create a new task list
 */
async function createTaskList() {
    const name = document.getElementById('listName').value.trim();
    const description = document.getElementById('listDescription').value.trim();
    
    if (!name) {
        showNotification('Task list name is required', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/task-lists', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, description })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create task list');
        }
        
        const newTaskList = await response.json();
        taskLists.push(newTaskList);
        
        // Close modal and reset form
        modals['createListModal'].hide();
        document.getElementById('createListForm').reset();
        
        // Update UI
        renderTaskLists();
        selectTaskList(newTaskList.id);
        
        showNotification('Task list created successfully', 'success');
        
    } catch (error) {
        console.error('Error creating task list:', error);
        showNotification(error.message, 'error');
    }
}

/**
 * Show edit task list modal
 */
function showEditListModal() {
    if (!currentTaskList) return;
    
    document.getElementById('editListId').value = currentTaskList.id;
    document.getElementById('editListName').value = currentTaskList.name;
    document.getElementById('editListDescription').value = currentTaskList.description || '';
    
    modals['editListModal'].show();
}

/**
 * Update an existing task list
 */
async function updateTaskList() {
    const listId = document.getElementById('editListId').value;
    const name = document.getElementById('editListName').value.trim();
    const description = document.getElementById('editListDescription').value.trim();
    
    if (!name) {
        showNotification('Task list name is required', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/task-lists/${listId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, description })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update task list');
        }
        
        const updatedTaskList = await response.json();
        
        // Update local data
        const index = taskLists.findIndex(list => list.id === parseInt(listId));
        if (index !== -1) {
            taskLists[index] = { ...taskLists[index], ...updatedTaskList };
        }
        
        if (currentTaskList && currentTaskList.id === parseInt(listId)) {
            currentTaskList = { ...currentTaskList, ...updatedTaskList };
        }
        
        // Close modal
        modals['editListModal'].hide();
        
        // Update UI
        renderTaskLists();
        if (currentTaskList && currentTaskList.id === parseInt(listId)) {
            currentListTitle.innerHTML = `
                <i class="fas fa-clipboard-list me-2"></i>
                ${escapeHtml(updatedTaskList.name)}
            `;
        }
        
        showNotification('Task list updated successfully', 'success');
        
    } catch (error) {
        console.error('Error updating task list:', error);
        showNotification(error.message, 'error');
    }
}

/**
 * Show delete task list confirmation
 */
function showDeleteListConfirmation() {
    if (!currentTaskList) return;
    
    document.getElementById('confirmMessage').textContent = 
        `Are you sure you want to delete "${currentTaskList.name}"? This will also delete all tasks in this list.`;
    
    // Clear any existing onclick handler and set the correct one
    const confirmBtn = document.getElementById('confirmBtn');
    confirmBtn.onclick = null;
    confirmBtn.onclick = () => {
        deleteTaskList();
    };
    
    modals['confirmModal'].show();
}

/**
 * Delete a task list
 */
async function deleteTaskList() {
    if (!currentTaskList) return;
    
    try {
        const response = await fetch(`/api/task-lists/${currentTaskList.id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete task list');
        }
        
        // Remove from local data
        taskLists = taskLists.filter(list => list.id !== currentTaskList.id);
        
        // Close modal
        modals['confirmModal'].hide();
        
        // Reset current selection
        currentTaskList = null;
        tasks = [];
        
        // Clear the saved task list from localStorage
        localStorage.removeItem(STORAGE_KEYS.CURRENT_TASK_LIST);
        
        // Update UI
        renderTaskLists();
        renderTasks();
        
        currentListTitle.innerHTML = `
            <i class="fas fa-clipboard-list me-2"></i>
            Select a Task List
        `;
        listActions.style.display = 'none';
        
        showNotification('Task list deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting task list:', error);
        showNotification('Error deleting task list', 'error');
    }
}

/**
 * Show create task modal
 */
function showCreateTaskModal() {
    if (!currentTaskList) {
        showNotification('Please select a task list first', 'error');
        return;
    }
    
    document.getElementById('taskListId').value = currentTaskList.id;
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    
    modals['createTaskModal'].show();
}

/**
 * Create a new task
 */
async function createTask() {
    // Prevent duplicate calls
    if (isCreatingTask) {
        return;
    }
    
    isCreatingTask = true;
    
    const taskListId = document.getElementById('taskListId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    
    if (!title) {
        showNotification('Task title is required', 'error');
        isCreatingTask = false;
        return;
    }
    
    try {
        const response = await fetch(`/api/task-lists/${taskListId}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, description })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create task');
        }
        
        const newTask = await response.json();
        
        // Update task lists data - add the new task to the correct task list
        const listIndex = taskLists.findIndex(list => list.id === parseInt(taskListId));
        if (listIndex !== -1) {
            taskLists[listIndex].tasks.push(newTask);
        }
        
        // If this is the currently selected task list, update the current view
        if (currentTaskList && currentTaskList.id === parseInt(taskListId)) {
            // tasks array is already updated since it references the same array
            // No need to push again or reassign
        }
        
        // Close modal and reset form
        modals['createTaskModal'].hide();
        document.getElementById('createTaskForm').reset();
        
        // Update UI
        renderTaskLists();
        renderTasks();
        
        showNotification('Task created successfully', 'success');
        
    } catch (error) {
        console.error('Error creating task:', error);
        showNotification(error.message, 'error');
    } finally {
        isCreatingTask = false;
    }
}

/**
 * Show edit task modal
 */
function showEditTaskModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('editTaskCompleted').checked = task.completed;
    
    modals['editTaskModal'].show();
}

/**
 * Update an existing task
 */
async function updateTask() {
    const taskId = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDescription').value.trim();
    const completed = document.getElementById('editTaskCompleted').checked;
    
    if (!title) {
        showNotification('Task title is required', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, description, completed })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update task');
        }
        
        const updatedTask = await response.json();
        
        // Update local data
        const taskIndex = tasks.findIndex(t => t.id === parseInt(taskId));
        if (taskIndex !== -1) {
            tasks[taskIndex] = updatedTask;
        }
        
        if (currentTaskList) {
            currentTaskList.tasks = tasks;
        }
        
        // Update task lists data
        const listIndex = taskLists.findIndex(list => list.id === currentTaskList.id);
        if (listIndex !== -1) {
            const listTaskIndex = taskLists[listIndex].tasks.findIndex(t => t.id === parseInt(taskId));
            if (listTaskIndex !== -1) {
                taskLists[listIndex].tasks[listTaskIndex] = updatedTask;
            }
        }
        
        // Close modal
        modals['editTaskModal'].hide();
        
        // Update UI
        renderTaskLists();
        renderTasks();
        
        showNotification('Task updated successfully', 'success');
        
    } catch (error) {
        console.error('Error updating task:', error);
        showNotification(error.message, 'error');
    }
}

/**
 * Toggle task completion status
 */
async function toggleTask(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/toggle`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('Failed to toggle task');
        }
        
        const result = await response.json();
        
        // Update local data
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = result.completed;
            tasks[taskIndex].updated_at = result.updated_at;
        }
        
        if (currentTaskList) {
            currentTaskList.tasks = tasks;
        }
        
        // Update task lists data
        const listIndex = taskLists.findIndex(list => list.id === currentTaskList.id);
        if (listIndex !== -1) {
            const listTaskIndex = taskLists[listIndex].tasks.findIndex(t => t.id === taskId);
            if (listTaskIndex !== -1) {
                taskLists[listIndex].tasks[listTaskIndex].completed = result.completed;
                taskLists[listIndex].tasks[listTaskIndex].updated_at = result.updated_at;
            }
        }
        
        // Update UI
        renderTaskLists();
        renderTasks();
        
    } catch (error) {
        console.error('Error toggling task:', error);
        showNotification('Error updating task', 'error');
    }
}

/**
 * Show delete task confirmation
 */
function showDeleteTaskConfirmation(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    document.getElementById('confirmMessage').textContent = 
        `Are you sure you want to delete "${task.title}"?`;
    
    // Clear any existing onclick handler and set the correct one
    const confirmBtn = document.getElementById('confirmBtn');
    confirmBtn.onclick = null;
    confirmBtn.onclick = () => {
        deleteTask(taskId);
    };
    
    modals['confirmModal'].show();
}

/**
 * Delete a task
 */
async function deleteTask(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete task');
        }
        
        // Remove from local data
        tasks = tasks.filter(t => t.id !== taskId);
        
        if (currentTaskList) {
            currentTaskList.tasks = tasks;
        }
        
        // Update task lists data
        const listIndex = taskLists.findIndex(list => list.id === currentTaskList.id);
        if (listIndex !== -1) {
            taskLists[listIndex].tasks = taskLists[listIndex].tasks.filter(t => t.id !== taskId);
        }
        
        // Close modal
        modals['confirmModal'].hide();
        
        // Update UI
        renderTaskLists();
        renderTasks();
        
        showNotification('Task deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Error deleting task', 'error');
    }
}

/**
 * Show loading spinner
 */
function showLoading(container) {
    container.innerHTML = `
        <div class="text-center py-4">
            <div class="loading-spinner"></div>
            <p class="mt-2 text-muted">Loading...</p>
        </div>
    `;
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'info') {
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    const toastElement = document.getElementById('notificationToast');
    
    // Set icon and title based on type
    let icon = 'fas fa-info-circle';
    let title = 'Notification';
    
    switch (type) {
        case 'success':
            icon = 'fas fa-check-circle';
            title = 'Success';
            toastElement.classList.add('bg-success', 'text-white');
            break;
        case 'error':
            icon = 'fas fa-exclamation-triangle';
            title = 'Error';
            toastElement.classList.add('bg-danger', 'text-white');
            break;
        case 'warning':
            icon = 'fas fa-exclamation-circle';
            title = 'Warning';
            toastElement.classList.add('bg-warning');
            break;
        default:
            toastElement.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'text-white');
    }
    
    toastTitle.innerHTML = `<i class="${icon} me-2"></i>${title}`;
    toastMessage.textContent = message;
    
    toast.show();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Today';
    } else if (diffDays === 2) {
        return 'Yesterday';
    } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}
