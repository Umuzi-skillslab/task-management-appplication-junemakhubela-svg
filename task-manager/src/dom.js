// This file is for all DOM manipulation and event wiring for the task manager user interface.
// Full details about errors and fixes can be found on the issues identified and readme documents.

import { addTask, updateTaskPriority, TaskManager } from './app.js';
import { persistTasks, restoreTasks } from './storage.js';

/**
 * Wiring up every interactive element on the page.
 * FIX: getElementById(".add-task-btn") mixed an ID lookup with a class
 * selector - replaced with querySelector(".add-task-btn"). Also fixed the
 * missing "#" on the task-input selector, and added null checks before
 * attaching any listener so a missing element never throws.
 */
export function setupEventListeners() {
  const addButton = document.querySelector('.add-task-btn');
  const taskForm = document.getElementById('task-form');
  const taskListContainer = document.getElementById('task-list');
  const filterButtons = document.querySelectorAll('.filter-btn');

  // Null check before attaching a listener.
  if (addButton) {
    addButton.addEventListener('click', handleAddTask);
  }

  // Handling form submission.
  if (taskForm) {
    taskForm.addEventListener('submit', handleAddTask);
  }

  // Event delegation: one listener on the container handles clicks on any
  // current or future task's toggle/delete buttons.
  if (taskListContainer) {
    taskListContainer.addEventListener('click', handleTaskListClick);
  }

  // Filter buttons - (all / active / completed).
  if (filterButtons && filterButtons.length > 0) {
    for (const button of filterButtons) {
      button.addEventListener('click', handleFilterClick);
    }
  }

  // Keep the UI in sync if tasks are changed in another browser tab.
  window.addEventListener('storage', handleStorageSync);
}

/**
 * Handling adding a new task from the form.
 * FIX: added event.preventDefault(), input validation, a priority field
 * that was previously missing, a try-catch around task creation, and
 * clearing the inputs afterwards.
 * @param {Event} event
 */
export function handleAddTask(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  const titleInput = document.getElementById('title');
  const descInput = document.getElementById('description');
  const priorityInput = document.getElementById('priority');

  // Null checks before touching .value.
  if (!titleInput || !descInput) {
    console.error('Required form inputs are missing from the DOM');
    return;
  }

  const title = titleInput.value.trim();
  const description = descInput.value.trim();
  const priority = priorityInput ? Number(priorityInput.value) : 3;

  if (!title) {
    showFormError('Task title is required.');
    return;
  }

  try {
    addTask(TaskManager.tasks, title, description, priority);
    persistTasks(TaskManager.tasks);
    displayTasks(TaskManager.tasks);
    clearFormInputs(titleInput, descInput, priorityInput);
  } catch (error) {
    showFormError(error.message);
  }
}

/**
 * Rendering the full task list into the DOM.
 * FIX: clearing existing content first, adding a null check on the container,
 * using template literals + insertAdjacentHTML instead of repeated string
 * concatenation, and now id/completion state and action buttons are included.
 * @param {Array} taskList
 */
export function displayTasks(taskList) {
  const container = document.getElementById('task-list');

  if (!container) {
    console.error('#task-list element not found in the DOM');
    return;
  }

  // Clearing existing content before re-rendering.
  container.innerHTML = '';

  if (!Array.isArray(taskList) || taskList.length === 0) {
    container.insertAdjacentHTML('beforeend', '<p class="empty-state">No tasks yet. Add one above!</p>');
    updateStatistics();
    return;
  }

  for (const task of taskList) {
    const taskHTML = `
      <div class="task ${task.completed ? 'task--completed' : ''}" data-task-id="${task.id}">
        <div class="task__content">
          <h3 class="task__title">${task.title}</h3>
          <p class="task__description">${task.description}</p>
          <span class="task__priority task__priority--${task.priority}">Priority: ${task.priority}</span>
        </div>
        <div class="task__actions">
          <button class="task__toggle-btn" data-action="toggle" data-task-id="${task.id}">
            ${task.completed ? 'Undo' : 'Complete'}
          </button>
          <button class="task__delete-btn" data-action="delete" data-task-id="${task.id}">Delete</button>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', taskHTML);
  }

  updateStatistics();
}

/**
 * Event delegation handler for clicks anywhere inside the task list.
 * FIX: using event.target with .closest() to reliably find the clicked
 * button (even if the click landed on a child element), instead of
 * reading event.target.id directly.
 * @param {Event} event
 */
export function handleTaskListClick(event) {
  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) {
    return;
  }

  const taskId = Number(actionButton.dataset.taskId);
  const action = actionButton.dataset.action;

  if (action === 'toggle') {
    const task = TaskManager.findById(taskId);
    if (task) {
      task.toggleCompletion();
      persistTasks(TaskManager.tasks);
      displayTasks(TaskManager.tasks);
    }
  } else if (action === 'delete') {
    TaskManager.tasks = TaskManager.tasks.filter((task) => task.id !== taskId);
    persistTasks(TaskManager.tasks);
    displayTasks(TaskManager.tasks);
  }
}

/**
 * Filtering the displayed tasks by status (all / active / completed).
 * @param {Event} event
 */
export function handleFilterClick(event) {
  const filter = event.target.dataset.filter;
  let filtered = TaskManager.tasks;

  if (filter === 'active') {
    filtered = TaskManager.tasks.filter((task) => !task.completed);
  } else if (filter === 'completed') {
    filtered = TaskManager.getCompletedTasks();
  }

  displayTasks(filtered);
}

/**
 * Re-rendering the task list when localStorage changes in another tab.
 */
function handleStorageSync() {
  TaskManager.tasks = restoreTasks();
  displayTasks(TaskManager.tasks);
}

/**
 * Updating the statistics panel using TaskManager's derived data.
 */
function updateStatistics() {
  const statsContainer = document.getElementById('statistics');
  if (!statsContainer) {
    return;
  }

  const { total, completed, averagePriority } = TaskManager.getStatistics();
  statsContainer.innerHTML = `
    <p>Total tasks: ${total}</p>
    <p>Completed: ${completed}</p>
    <p>Average priority: ${averagePriority}</p>
  `;
}

/**
 * Showing a validation error message near the add-task form.
 * @param {string} message
 */
function showFormError(message) {
  const errorEl = document.getElementById('form-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  } else {
    console.error(message);
  }
}

/**
 * Resetting the add-task form inputs after a successful submission.
 */
function clearFormInputs(titleInput, descInput, priorityInput) {
  titleInput.value = '';
  descInput.value = '';
  if (priorityInput) {
    priorityInput.value = '3';
  }
  const errorEl = document.getElementById('form-error');
  if (errorEl) {
    errorEl.hidden = true;
  }
}

/**
 * Application bootstrap: restore any saved tasks and render the UI.
 * FIX: initialisation now waits for DOMContentLoaded instead of running
 * setupEventListeners() at parse time, before the DOM exists.
 */
function initializeApp() {
  TaskManager.tasks = restoreTasks();
  setupEventListeners();
  displayTasks(TaskManager.tasks);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initializeApp);
}
