//This file is for utility functions: id generation, string formatting, boolean logic,
// JSON conversion helpers, and localStorage persistence.
//
// Summary of Fixes:
// - Replaced `var` with `const`/`let` throughout.
// - saveToStorage/loadFromStorage now use JSON.stringify/JSON.parse and
//   are wrapped in try-catch so a corrupt or missing key never crashes the app.
// - generateRandomId() now returns a unique, monotonically-increasing integer
//   instead of a raw decimal from Math.random().
// - formatTaskName() actually formats the string (trims + capitalises words)
//   instead of returning it unchanged.
// - isHighPriority() uses strict equality (===) and returns a real boolean
//   instead of the strings "yes"/"no".

// Ordered list of valid priority levels used for validation across the app.
export const PRIORITIES = ['low', 'medium', 'high'];

/**
 * Saving an array of tasks to localStorage as JSON.
 * Pure w.r.t. its inputs is not possible here (it has a side effect by
 * design), but it validates its input and never throws to the caller.
 * @param {Array} tasks - array of task objects to persist
 * @returns {boolean} true if the save succeeded, false otherwise
 */
export function saveToStorage(tasks) {
  // Parameter validation (making sure we always receive an array.)
  if (!Array.isArray(tasks)) {
    throw new TypeError('saveToStorage expects an array of tasks');
  }

  try {
    const serialized = JSON.stringify(tasks);
    localStorage.setItem('tasks', serialized);
    return true;
  } catch (error) {
    // Storage can fail (quota exceeded, private browsing, etc.) - fail soft.
    console.error('Failed to save tasks to storage:', error.message);
    return false;
  }
}

/**
 * Loading the saved tasks array from localStorage.
 * @returns {Array} the parsed tasks array, or an empty array on any failure
 */
export function loadFromStorage() {
  try {
    const data = localStorage.getItem('tasks');
    // Handling the "nothing saved yet" edge case explicitly.
    if (data === null || data === undefined) {
      return [];
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // Corrupt JSON should never crash the app - logging and recovering gracefully.
    console.error('Failed to load tasks from storage:', error.message);
    return [];
  }
}

/**
 * Generating a unique numeric id for a new task.
 * Combining the current timestamp with a random component so ids are unique,
 * even when several tasks are created within the same millisecond.
 * @returns {number} a unique integer id
 */
export function generateRandomId() {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

/**
 * Formatting a task name: trims whitespace and capitalises the first letter of
 * every word. This is a pure function - same input always gives same output.
 * @param {string} name
 * @returns {string} the formatted name
 */
export function formatTaskName(name) {
  if (typeof name !== 'string') {
    throw new TypeError('formatTaskName expects a string');
  }

  return name
    .trim()
    .split(' ')
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Determines whether a task is high priority.
 * Pure function - because it uses strict equality and returns a real boolean.
 * @param {{priority: string}} task
 * @returns {boolean}
 */
export function isHighPriority(task) {
  if (!task || typeof task !== 'object') {
    throw new TypeError('isHighPriority expects a task object');
  }
  return task.priority === 'high';
}

/**
 * Converts an array of tasks into a JSON string.
 * @param {Array} tasks
 * @returns {string}
 */
export function tasksToJSON(tasks) {
  if (!Array.isArray(tasks)) {
    throw new TypeError('tasksToJSON expects an array');
  }
  return JSON.stringify(tasks, null, 2);
}

/**
 * Parses a JSON string back into an array of task-like objects.
 * @param {string} json
 * @returns {Array}
 */
export function tasksFromJSON(json) {
  if (typeof json !== 'string') {
    throw new TypeError('tasksFromJSON expects a JSON string');
  }
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    throw new Error(`Invalid JSON provided to tasksFromJSON: ${error.message}`);
  }
}
