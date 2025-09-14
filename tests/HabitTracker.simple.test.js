// Simple working test for HabitTracker
const HabitTracker = require('../src/HabitTracker');

// Mock localStorage properly
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock;
global.confirm = jest.fn(() => true);

describe('HabitTracker - Basic Functionality', () => {
  let habitTracker;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Create instance and mock DOM-dependent methods
    habitTracker = new HabitTracker();
    // Override methods that depend on DOM to prevent errors
    habitTracker.render = jest.fn();
    habitTracker.bindEvents = jest.fn();
    habitTracker.updateCurrentDate = jest.fn();
  });

  describe('Constructor', () => {
    test('should initialize with empty habits array', () => {
      expect(habitTracker.habits).toEqual([]);
      expect(habitTracker.currentEditingId).toBeNull();
    });
  });

  describe('Local Storage', () => {
    test('loadHabits should return empty array when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const result = habitTracker.loadHabits();
      expect(result).toEqual([]);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('habitTracker');
    });

    test('loadHabits should parse stored data', () => {
      const mockData = [{ id: '123', name: 'Test Habit' }];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const result = habitTracker.loadHabits();
      expect(result).toEqual(mockData);
    });

    test('saveHabits should store data to localStorage', () => {
      habitTracker.habits = [{ id: '123', name: 'Test' }];
      habitTracker.saveHabits();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'habitTracker',
        JSON.stringify(habitTracker.habits)
      );
    });
  });

  describe('Habit Management', () => {
    test('generateUniqueId should return a string', () => {
      const id = habitTracker.generateUniqueId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    test('addHabit should add habit with correct properties', () => {
      // Mock render to avoid DOM operations
      habitTracker.render = jest.fn();
      habitTracker.saveHabits = jest.fn();
      
      habitTracker.addHabit('Test Habit');
      
      expect(habitTracker.habits).toHaveLength(1);
      expect(habitTracker.habits[0]).toMatchObject({
        name: 'Test Habit',
        completions: [],
        streak: 0,
        isDemo: false
      });
      expect(habitTracker.habits[0].id).toBeDefined();
      expect(habitTracker.habits[0].createdAt).toBeDefined();
    });

    test('addHabit should not add empty habit', () => {
      habitTracker.addHabit('');
      habitTracker.addHabit('   ');
      
      expect(habitTracker.habits).toHaveLength(0);
    });

    test('addHabit should trim whitespace', () => {
      habitTracker.render = jest.fn();
      habitTracker.saveHabits = jest.fn();
      
      habitTracker.addHabit('  Test Habit  ');
      
      expect(habitTracker.habits[0].name).toBe('Test Habit');
    });

    test('editHabit should update habit name', () => {
      habitTracker.render = jest.fn();
      habitTracker.saveHabits = jest.fn();
      
      // Add a habit first
      habitTracker.addHabit('Original Name');
      const habitId = habitTracker.habits[0].id;
      
      habitTracker.editHabit(habitId, 'Updated Name');
      
      expect(habitTracker.habits[0].name).toBe('Updated Name');
    });

    test('deleteHabit should remove habit when confirmed', () => {
      habitTracker.render = jest.fn();
      habitTracker.saveHabits = jest.fn();
      
      habitTracker.addHabit('Test Habit');
      const habitId = habitTracker.habits[0].id;
      
      global.confirm.mockReturnValue(true);
      habitTracker.deleteHabit(habitId);
      
      expect(habitTracker.habits).toHaveLength(0);
    });

    test('deleteHabit should not remove habit when not confirmed', () => {
      habitTracker.render = jest.fn();
      habitTracker.saveHabits = jest.fn();
      
      habitTracker.addHabit('Test Habit');
      const habitId = habitTracker.habits[0].id;
      
      global.confirm.mockReturnValue(false);
      habitTracker.deleteHabit(habitId);
      
      expect(habitTracker.habits).toHaveLength(1);
    });
  });

  describe('Habit Tracking', () => {
    test('getTodayString should return date in YYYY-MM-DD format', () => {
      const today = habitTracker.getTodayString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('isCompletedToday should check completion status', () => {
      const habit = {
        completions: ['2023-01-01', '2023-01-02']
      };
      
      // Mock getTodayString to return a specific date
      habitTracker.getTodayString = jest.fn().mockReturnValue('2023-01-01');
      
      expect(habitTracker.isCompletedToday(habit)).toBe(true);
      
      habitTracker.getTodayString.mockReturnValue('2023-01-03');
      expect(habitTracker.isCompletedToday(habit)).toBe(false);
    });

    test('toggleHabit should add completion', () => {
      habitTracker.render = jest.fn();
      habitTracker.saveHabits = jest.fn();
      habitTracker.updateStreak = jest.fn();
      
      habitTracker.addHabit('Test Habit');
      const habitId = habitTracker.habits[0].id;
      const today = habitTracker.getTodayString();
      
      habitTracker.toggleHabit(habitId);
      
      expect(habitTracker.habits[0].completions).toContain(today);
    });

    test('toggleHabit should remove completion when already completed', () => {
      habitTracker.render = jest.fn();
      habitTracker.saveHabits = jest.fn();
      habitTracker.updateStreak = jest.fn();
      
      habitTracker.addHabit('Test Habit');
      const habitId = habitTracker.habits[0].id;
      const today = habitTracker.getTodayString();
      
      // Add completion first
      habitTracker.toggleHabit(habitId);
      expect(habitTracker.habits[0].completions).toContain(today);
      
      // Remove completion
      habitTracker.toggleHabit(habitId);
      expect(habitTracker.habits[0].completions).not.toContain(today);
    });
  });

  describe('Streak Calculation', () => {
    test('updateStreak should set streak to 0 for no completions', () => {
      const habit = { completions: [], streak: 5 };
      
      habitTracker.updateStreak(habit);
      
      expect(habit.streak).toBe(0);
    });

    test('updateStreak should calculate streak correctly', () => {
      const habit = { completions: [], streak: 0 };
      
      // Create consecutive days
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      habit.completions = [
        today.toISOString().split('T')[0],
        yesterday.toISOString().split('T')[0]
      ];
      
      habitTracker.updateStreak(habit);
      
      expect(habit.streak).toBe(2);
    });
  });

  describe('Statistics', () => {
    test('getStats should return correct statistics', () => {
      habitTracker.addHabit('Habit 1');
      habitTracker.addHabit('Habit 2');
      
      // Complete one habit
      const today = habitTracker.getTodayString();
      habitTracker.habits[0].completions.push(today);
      habitTracker.habits[0].streak = 1;
      
      const stats = habitTracker.getStats();
      
      expect(stats.totalHabits).toBe(2);
      expect(stats.completedToday).toBe(1);
      expect(stats.currentStreak).toBe(1);
      expect(stats.completionRate).toMatch(/^\d+%$/);
    });

    test('getStats should handle empty habits', () => {
      const stats = habitTracker.getStats();
      
      expect(stats.totalHabits).toBe(0);
      expect(stats.completedToday).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.completionRate).toBe('0%');
    });
  });

  describe('Demo Habits', () => {
    test('addDemoHabits should add 4 demo habits', () => {
      habitTracker.render = jest.fn();
      habitTracker.saveHabits = jest.fn();
      habitTracker.showDemoNotification = jest.fn();
      
      habitTracker.addDemoHabits();
      
      expect(habitTracker.habits).toHaveLength(4);
      expect(habitTracker.habits.every(habit => habit.isDemo)).toBe(true);
      expect(habitTracker.habits.every(habit => habit.name.includes('Demo'))).toBe(true);
    });
  });
});
