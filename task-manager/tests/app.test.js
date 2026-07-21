//This file is for the comprehensive Jest test suite for the Task manager application.
//
// Summary of Fixes over the starter test file:
// - Added proper imports from the src modules (they were entirely missing).
// - Added a beforeEach to reset the task list between tests.
// - Added coverage for getInfo, toggleCompletion, SubTask inheritance,
//   array operations, recursion, destructuring/spread, and error handling
//   — none of which were tested before.

import {
  Task,
  SubTask,
  addTask,
  findTaskByTitle,
  updateTaskPriority,
  getTaskDetails,
  mergeTasks,
  countCompletedTasks,
  calculateAveragePriority,
  getHighPriorityTasks,
  createPriorityComparator,
  TaskManager,
} from '../src/app.js';

import { generateRandomId, formatTaskName, isHighPriority, tasksToJSON, tasksFromJSON } from '../src/utils.js';

describe('Task class', () => {
  test('creates a task with the expected properties', () => {
    const task = new Task('Test Task', 'Description', 3);
    expect(task.title).toBe('Test Task');
    expect(task.description).toBe('Description');
    expect(task.priority).toBe(3);
    expect(task.completed).toBe(false);
    expect(typeof task.id).toBe('number');
  });

  test('getInfo returns a formatted string via template literal', () => {
    const task = new Task('Write tests', 'Cover the app', 4);
    expect(task.getInfo()).toBe('Task: Write tests - Priority: 4 - Completed: false');
  });

  test('toggleCompletion flips the completed flag', () => {
    const task = new Task('Toggle me', '', 2);
    expect(task.completed).toBe(false);
    expect(task.toggleCompletion()).toBe(true);
    expect(task.completed).toBe(true);
    task.toggleCompletion();
    expect(task.completed).toBe(false);
  });

  test('throws a TypeError when constructed with an invalid title', () => {
    expect(() => new Task('', 'desc', 1)).toThrow(TypeError);
  });
});

describe('SubTask inheritance', () => {
  test('SubTask instance is also a Task and calls super() correctly', () => {
    const parent = new Task('Parent Task', 'Parent description', 3);
    const sub = new SubTask('Child Task', 'Child description', 2, parent);

    expect(sub instanceof Task).toBe(true);
    expect(sub.title).toBe('Child Task');
    expect(sub.parentTask).toBe(parent);
    expect(sub.getInfo()).toContain('Subtask of: Parent Task');
  });

  test('throws when parentTask is not a Task instance', () => {
    expect(() => new SubTask('Child', 'desc', 1, {})).toThrow(TypeError);
  });
});

describe('Task list functions', () => {
  let taskList;

  // Resetting state before every test so tests don't leak into each other.
  beforeEach(() => {
    taskList = [];
    addTask(taskList, 'Buy milk', 'From the store', 2);
    addTask(taskList, 'Write report', 'Quarterly report', 5);
    addTask(taskList, 'Clean desk', '', 1);
  });

  test('addTask adds a new task to the list', () => {
    const task = addTask(taskList, 'New Task', 'Test', 2);
    expect(task).toBeDefined();
    expect(taskList).toContain(task);
    expect(taskList.length).toBe(4);
  });

  test('findTaskByTitle finds an existing task', () => {
    const found = findTaskByTitle(taskList, 'Buy milk');
    expect(found).toBeDefined();
    expect(found.title).toBe('Buy milk');
  });

  test('findTaskByTitle returns undefined for a missing task (edge case)', () => {
    const found = findTaskByTitle(taskList, 'Does not exist');
    expect(found).toBeUndefined();
  });

  test('updateTaskPriority updates an existing task', () => {
    const [firstTask] = taskList;
    const result = updateTaskPriority(taskList, firstTask.id, 4);
    expect(result).toBe(true);
    expect(firstTask.priority).toBe(4);
  });

  test('updateTaskPriority returns false for an unknown id (edge case)', () => {
    const result = updateTaskPriority(taskList, -1, 4);
    expect(result).toBe(false);
  });

  test('updateTaskPriority rejects an out-of-range priority', () => {
    const [firstTask] = taskList;
    expect(() => updateTaskPriority(taskList, firstTask.id, 99)).toThrow(RangeError);
  });

  test('calculateAveragePriority computes the correct average', () => {
    // priorities: 2, 5, 1 -> average 2.67
    expect(calculateAveragePriority(taskList)).toBeCloseTo(2.67, 2);
  });

  test('calculateAveragePriority handles an empty array (edge case)', () => {
    expect(calculateAveragePriority([])).toBe(0);
  });

  test('getHighPriorityTasks filters using Array.filter', () => {
    const highPriority = getHighPriorityTasks(taskList, 2);
    expect(highPriority.length).toBe(1);
    expect(highPriority[0].title).toBe('Write report');
  });

  test('createPriorityComparator sorts tasks ascending and descending', () => {
    const ascending = [...taskList].sort(createPriorityComparator(true));
    const descending = [...taskList].sort(createPriorityComparator(false));
    expect(ascending[0].priority).toBe(1);
    expect(descending[0].priority).toBe(5);
  });
});

describe('Array operations', () => {
  test('mergeTasks combines multiple lists using rest params + spread', () => {
    const listA = [];
    const listB = [];
    addTask(listA, 'A1', '', 1);
    addTask(listB, 'B1', '', 2);
    addTask(listB, 'B2', '', 3);

    const merged = mergeTasks(listA, listB);
    expect(merged.length).toBe(3);
    expect(merged.map((t) => t.title)).toEqual(['A1', 'B1', 'B2']);
  });

  test('mergeTasks handles being called with no lists (edge case)', () => {
    expect(mergeTasks()).toEqual([]);
  });

  test('getTaskDetails destructures a task into a plain object', () => {
    const task = new Task('Destructure me', 'desc', 3);
    const details = getTaskDetails(task);
    expect(details).toEqual({
      title: 'Destructure me',
      description: 'desc',
      priority: 3,
      completed: false,
    });
  });
});

describe('Recursive function: countCompletedTasks', () => {
  test('counts completed tasks correctly with a proper base case', () => {
    const list = [];
    addTask(list, 'One', '', 1);
    addTask(list, 'Two', '', 2);
    addTask(list, 'Three', '', 3);
    list[0].toggleCompletion();
    list[2].toggleCompletion();

    expect(countCompletedTasks(list)).toBe(2);
  });

  test('returns 0 for an empty array without infinite recursion (edge case)', () => {
    expect(countCompletedTasks([])).toBe(0);
  });
});

describe('Error handling', () => {
  test('addTask throws a descriptive error for an invalid title', () => {
    expect(() => addTask([], '', 'desc', 1)).toThrow('Failed to add task');
  });

  test('addTask throws a TypeError when taskList is not an array', () => {
    expect(() => addTask(null, 'Title', 'desc', 1)).toThrow(TypeError);
  });
});

describe('TaskManager object', () => {
  beforeEach(() => {
    TaskManager.tasks = [];
    TaskManager.addTask('Task A', '', 5);
    TaskManager.addTask('Task B', '', 1);
    TaskManager.tasks[0].toggleCompletion();
  });

  test('getTotalTasks reflects the current tasks array', () => {
    expect(TaskManager.getTotalTasks()).toBe(2);
  });

  test('getCompletedTasks uses Array.filter correctly', () => {
    expect(TaskManager.getCompletedTasks().length).toBe(1);
  });

  test('hasHighPriorityTasks uses Array.some correctly', () => {
    expect(TaskManager.hasHighPriorityTasks()).toBe(true);
  });

  test('areAllTasksCompleted uses Array.every correctly', () => {
    expect(TaskManager.areAllTasksCompleted()).toBe(false);
  });

  test('getStatistics returns aggregated data via destructuring-friendly object', () => {
    const stats = TaskManager.getStatistics();
    expect(stats.total).toBe(2);
    expect(stats.completed).toBe(1);
  });
});

describe('Utility functions', () => {
  test('generateRandomId returns a unique integer each call', () => {
    const id1 = generateRandomId();
    const id2 = generateRandomId();
    expect(Number.isInteger(id1)).toBe(true);
    expect(id1).not.toBe(id2);
  });

  test('formatTaskName trims and capitalises words', () => {
    expect(formatTaskName('  buy   MILK  ')).toBe('Buy Milk');
  });

  test('isHighPriority returns a real boolean using strict equality', () => {
    expect(isHighPriority({ priority: 'high' })).toBe(true);
    expect(isHighPriority({ priority: 'low' })).toBe(false);
  });

  test('tasksToJSON / tasksFromJSON round-trip correctly', () => {
    const tasks = [{ title: 'A', priority: 1 }];
    const json = tasksToJSON(tasks);
    expect(typeof json).toBe('string');
    expect(tasksFromJSON(json)).toEqual(tasks);
  });

  test('tasksFromJSON throws a meaningful error on invalid JSON (edge case)', () => {
    expect(() => tasksFromJSON('{not valid json')).toThrow('Invalid JSON');
  });
});
