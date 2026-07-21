//This file bridges the Task model with localStorage persistence, using the JSON
// helpers from utils.js. and it is kept as its own module to keep app.js focused on
// task logic and utils.js focused on generic helpers.

import { saveToStorage, loadFromStorage } from './utils.js';
import { Task } from './app.js';

/**
 * Persists the current task list to localStorage.
 * @param {Array<Task>} taskList
 * @returns {boolean} success flag
 */
export function persistTasks(taskList) {
  if (!Array.isArray(taskList)) {
    throw new TypeError('persistTasks expects an array');
  }
  return saveToStorage(taskList);
}

/**
 * Loads tasks from localStorage into Task instances.
 * Plain objects from JSON.parse are not Task instances, so this restores
 * class methods like toggleCompletion()/getInfo().
 * @returns {Array<Task>}
 */
export function restoreTasks() {
  const rawTasks = loadFromStorage();

  return rawTasks.map((raw) => {
    try {
      const task = new Task(raw.title, raw.description, raw.priority);
      // Preserve the original id/completed/createdAt rather than
      // regenerating them.
      task.id = raw.id;
      task.completed = Boolean(raw.completed);
      task.createdAt = raw.createdAt;
      return task;
    } catch (error) {
      console.error('Skipping corrupt stored task:', error.message);
      return null;
    }
  }).filter((task) => task !== null);
}
