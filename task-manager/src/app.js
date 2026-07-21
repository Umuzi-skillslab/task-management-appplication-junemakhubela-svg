// This file is for core application logic: Task/SubTask classes, task list functions, and the
// TaskManager object. Complete details about the errors and fixes can be found in the
// issues identified document and the README.md.

import { generateRandomId } from './utils.js';

// Valid priority levels, used for parameter validation.
const VALID_PRIORITIES = [1, 2, 3, 4, 5];

/**
 * Represents a single task.
 */
export class Task {
  constructor(title, description, priority) {
    // Parameter validation with typeof checks (was completely missing).
    if (typeof title !== 'string' || title.trim().length === 0) {
      throw new TypeError('Task title must be a non-empty string');
    }
    if (typeof description !== 'string') {
      throw new TypeError('Task description must be a string');
    }
    if (typeof priority !== 'number') {
      throw new TypeError('Task priority must be a number');
    }

    this.id = generateRandomId(); // FIX: id property was missing entirely.
    this.title = title;
    this.description = description;
    this.priority = priority;
    this.completed = false;
    this.createdAt = new Date().toISOString();
  }

  // FIX: toggleCompletion method was missing from the Task class.
  toggleCompletion() {
    this.completed = !this.completed;
    return this.completed;
  }

  getInfo() {
    // FIX: replaced string concatenation with a template literal.
    return `Task: ${this.title} - Priority: ${this.priority} - Completed: ${this.completed}`;
  }
}

/**
 * A Task that belongs to a parent Task, for inheritance.
 */
export class SubTask extends Task {
  constructor(title, description, priority, parentTask) {
    // FIX: the super() call was missing, which is a hard error in a
    // derived class constructor before `this` can be used.
    super(title, description, priority);

    if (!(parentTask instanceof Task)) {
      throw new TypeError('parentTask must be a Task instance');
    }
    this.parentTask = parentTask;
  }

  // Method overriding: extend the parent's getInfo with parent task context.
  getInfo() {
    return `${super.getInfo()} - Subtask of: ${this.parentTask.title}`;
  }
}

/**
 * Add a new task to a task list.
 * @param {Array<Task>} taskList
 * @param {string} title
 * @param {string} description
 * @param {number} priority
 * @returns {Task} the newly created task
 */
export function addTask(taskList, title, description, priority) {
  if (!Array.isArray(taskList)) {
    throw new TypeError('addTask expects taskList to be an array');
  }

  try {
    const newTask = new Task(title, description, priority);
    taskList.push(newTask);
    return newTask;
  } catch (error) {
    // Re-throw with context so callers know which operation failed.
    throw new Error(`Failed to add task: ${error.message}`);
  }
}

/**
 * Print every task's title to the console.
 * FIX: off-by-one error (`i <= taskList.length`) replaced with a for-of loop.
 * @param {Array<Task>} taskList
 */
export function displayAllTasks(taskList) {
  if (!Array.isArray(taskList)) {
    throw new TypeError('displayAllTasks expects an array');
  }

  for (const task of taskList) {
    console.log(task.title);
  }
}

/**
 * Find the first task with a matching title.
 * FIX: the `title` parameter was missing entirely, and `==` was used
 * instead of `===`.
 * @param {Array<Task>} taskList
 * @param {string} title
 * @returns {Task|undefined}
 */
export function findTaskByTitle(taskList, title) {
  if (!Array.isArray(taskList)) {
    throw new TypeError('findTaskByTitle expects taskList to be an array');
  }
  if (typeof title !== 'string') {
    throw new TypeError('findTaskByTitle expects title to be a string');
  }

  let i = 0;
  while (i < taskList.length) {
    if (taskList[i].title === title) {
      return taskList[i];
    }
    i++; // FIX: missing increment caused an infinite loop.
  }
  return undefined;
}

/**
 * Update the priority of a task identified by id.
 * FIX: `=` (assignment) was used inside the if-condition instead of `===`.
 * @param {Array<Task>} taskList
 * @param {number} taskId
 * @param {number} newPriority
 * @returns {boolean} true if a task was updated
 */
export function updateTaskPriority(taskList, taskId, newPriority) {
  if (!Array.isArray(taskList)) {
    throw new TypeError('updateTaskPriority expects taskList to be an array');
  }
  if (typeof taskId !== 'number' || typeof newPriority !== 'number') {
    throw new TypeError('taskId and newPriority must both be numbers');
  }
  if (!VALID_PRIORITIES.includes(newPriority)) {
    throw new RangeError(`newPriority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  for (const task of taskList) {
    if (task.id === taskId) {
      task.priority = newPriority;
      return true;
    }
  }
  return false;
}

/**
 * Extracting the display-relevant details of a task using destructuring.
 * FIX: replaced four manual property reads with object destructuring.
 * @param {Task} task
 * @returns {{title: string, description: string, priority: number, completed: boolean}}
 */
export function getTaskDetails(task) {
  if (!task || typeof task !== 'object') {
    throw new TypeError('getTaskDetails expects a task object');
  }
  // ES6 destructuring:
  const { title, description, priority, completed } = task;
  return { title, description, priority, completed };
}

/**
 * Merging any number of task lists into one using the spread operator and
 * rest parameters.
 * FIX: replaced manual index-based loops with a rest parameter + spread.
 * @param {...Array<Task>} taskLists
 * @returns {Array<Task>}
 */
export function mergeTasks(...taskLists) {
  // using Rest parameter (taskLists) + Spread operator:
  return taskLists.reduce((merged, list) => [...merged, ...list], []);
}

/**
 * Recursively counting how many tasks in a list are completed.
 * FIX: added a base case and a null/undefined guard - the original
 * function recursed forever because it never checked `index` against
 * `tasks.length`.
 * @param {Array<Task>} tasks
 * @param {number} [index=0]
 * @returns {number}
 */
export function countCompletedTasks(tasks, index = 0) {
  if (!Array.isArray(tasks)) {
    throw new TypeError('countCompletedTasks expects an array');
  }

  // Base case: reached the end of the array.
  if (index >= tasks.length) {
    return 0;
  }

  const task = tasks[index];
  if (!task) {
    return countCompletedTasks(tasks, index + 1);
  }

  const increment = task.completed ? 1 : 0;
  return increment + countCompletedTasks(tasks, index + 1);
}

/**
 * Calculating the average priority of all tasks in a list.
 * FIX: added an empty-array check (was dividing by zero) and rounds the
 * result instead of returning a raw float. Implemented with reduce().
 * @param {Array<Task>} taskList
 * @returns {number}
 */
export function calculateAveragePriority(taskList) {
  if (!Array.isArray(taskList)) {
    throw new TypeError('calculateAveragePriority expects an array');
  }
  if (taskList.length === 0) {
    return 0;
  }

  const total = taskList.reduce((sum, task) => sum + task.priority, 0);
  return Math.round((total / taskList.length) * 100) / 100;
}

/**
 * Returning tasks whose priority is greater than minPriority.
 * FIX: replaced a manual for-loop with Array.prototype.filter.
 * @param {Array<Task>} taskList
 * @param {number} minPriority
 * @returns {Array<Task>}
 */
export function getHighPriorityTasks(taskList, minPriority) {
  if (!Array.isArray(taskList)) {
    throw new TypeError('getHighPriorityTasks expects taskList to be an array');
  }
  if (typeof minPriority !== 'number') {
    throw new TypeError('minPriority must be a number');
  }
  return taskList.filter((task) => task.priority > minPriority);
}

/**
 * Higher-order function: returns a comparator function for Array.sort,
 * configured for either ascending or descending priority order.
 * @param {boolean} [ascending=true]
 * @returns {(a: Task, b: Task) => number}
 */
export function createPriorityComparator(ascending = true) {
  return (taskA, taskB) => (ascending ? taskA.priority - taskB.priority : taskB.priority - taskA.priority);
}

/**
 * TaskManager: a plain object, as required.
 * Demonstrating map/filter/reduce/find/some/every alongside
 * the class-based Task model above.
 */
export const TaskManager = {
  tasks: [],

  /** Total number of tasks currently managed. */
  getTotalTasks() {
    return this.tasks.length;
  },

  // FIX: added a functional-style add method (was missing).
  addTask(title, description, priority) {
    const newTask = addTask(this.tasks, title, description, priority);
    return newTask;
  },

  // FIX: added methods that use map/filter/reduce/find/some/every.
  getCompletedTasks() {
    return this.tasks.filter((task) => task.completed);
  },

  getTaskTitles() {
    return this.tasks.map((task) => task.title);
  },

  getTotalPriorityScore() {
    return this.tasks.reduce((sum, task) => sum + task.priority, 0);
  },

  findById(taskId) {
    return this.tasks.find((task) => task.id === taskId);
  },

  hasHighPriorityTasks() {
    return this.tasks.some((task) => task.priority >= 4);
  },

  areAllTasksCompleted() {
    return this.tasks.length > 0 && this.tasks.every((task) => task.completed);
  },

  getStatistics() {
    return {
      total: this.tasks.length,
      completed: this.getCompletedTasks().length,
      averagePriority: calculateAveragePriority(this.tasks),
    };
  },
};
