// Working tests for HabitTracker - Core functionality without DOM dependencies
const HabitTracker = require('../src/HabitTracker');

describe('HabitTracker - Core Functionality', () => {
  let habitTracker;

  // Mock localStorage
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };

  // Mock global functions
  const mockConfirm = jest.fn();

  beforeAll(() => {
    global.localStorage = mockLocalStorage;
    global.confirm = mockConfirm;
    
    // Mock document methods to prevent DOM errors
    global.document = {
      getElementById: jest.fn(() => null),
      querySelector: jest.fn(() => null),
      createElement: jest.fn(() => ({
        className: '',
        innerHTML: '',
        classList: { add: jest.fn(), remove: jest.fn() },
        addEventListener: jest.fn(),
        querySelector: jest.fn(() => null),
        appendChild: jest.fn(),
        remove: jest.fn(),
        style: {}
      })),
      body: {
        appendChild: jest.fn()
      }
    };
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockConfirm.mockReturnValue(true);
    
    // Create a new instance
    habitTracker = new HabitTracker();
  });

  describe('Initialization', () => {
    test('should initialize with empty habits when localStorage is empty', () => {
      expect(habitTracker.habits).toEqual([]);
      expect(habitTracker.currentEditingId).toBeNull();
    });

    test('should load existing habits from localStorage', () => {
      const existingHabits = [
        { id: '1', name: 'Test Habit', completions: [], streak: 0 }
      ];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingHabits));
      
      const newTracker = new HabitTracker();
      expect(newTracker.habits).toEqual(existingHabits);
    });
  });

  describe('Local Storage Operations', () => {
    test('loadHabits returns empty array when localStorage is null', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const result = habitTracker.loadHabits();
      expect(result).toEqual([]);
    });

    test('loadHabits parses JSON data from localStorage', () => {
      const testData = [{ id: '123', name: 'Test' }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));
      
      const result = habitTracker.loadHabits();
      expect(result).toEqual(testData);
    });

    test('saveHabits stores habits to localStorage', () => {
      habitTracker.habits = [{ id: '123', name: 'Test Habit' }];
      habitTracker.saveHabits();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'habitTracker',
        JSON.stringify(habitTracker.habits)
      );
    });
  });

  describe('ID Generation', () => {
    test('generateUniqueId creates unique identifiers', () => {
      const id1 = habitTracker.generateUniqueId();
      const id2 = habitTracker.generateUniqueId();
      
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(10);
    });
  });

  describe('Habit Management', () => {
    test('addHabit creates habit with correct structure', () => {
      const originalSaveHabits = habitTracker.saveHabits;
      const originalRender = habitTracker.render;
      habitTracker.saveHabits = jest.fn();
      habitTracker.render = jest.fn();
      
      habitTracker.addHabit('Morning Exercise');
      
      expect(habitTracker.habits).toHaveLength(1);
      
      const habit = habitTracker.habits[0];
      expect(habit).toMatchObject({
        name: 'Morning Exercise',
        completions: [],
        streak: 0,
        isDemo: false
      });
      expect(habit.id).toBeDefined();
      expect(habit.createdAt).toBeDefined();
      expect(habitTracker.saveHabits).toHaveBeenCalled();
      expect(habitTracker.render).toHaveBeenCalled();
      
      // Restore original methods
      habitTracker.saveHabits = originalSaveHabits;
      habitTracker.render = originalRender;
    });

    test('addHabit ignores empty or whitespace-only names', () => {
      habitTracker.addHabit('');
      habitTracker.addHabit('   ');
      habitTracker.addHabit('\t\n');
      
      expect(habitTracker.habits).toHaveLength(0);
    });

    test('addHabit trims whitespace from habit names', () => {
      habitTracker.saveHabits = jest.fn();
      habitTracker.render = jest.fn();
      
      habitTracker.addHabit('  Morning Jog  ');
      
      expect(habitTracker.habits[0].name).toBe('Morning Jog');
    });

    test('editHabit updates existing habit name', () => {
      habitTracker.saveHabits = jest.fn();
      habitTracker.render = jest.fn();
      
      // Add a habit first
      habitTracker.addHabit('Original Name');
      const habitId = habitTracker.habits[0].id;
      
      // Edit the habit
      habitTracker.editHabit(habitId, 'Updated Name');
      
      expect(habitTracker.habits[0].name).toBe('Updated Name');
      expect(habitTracker.saveHabits).toHaveBeenCalled();
      expect(habitTracker.render).toHaveBeenCalled();
    });

    test('editHabit ignores empty names', () => {
      habitTracker.saveHabits = jest.fn();
      habitTracker.render = jest.fn();
      
      habitTracker.addHabit('Original Name');
      const habitId = habitTracker.habits[0].id;
      const originalName = habitTracker.habits[0].name;
      
      habitTracker.editHabit(habitId, '');
      habitTracker.editHabit(habitId, '   ');
      
      expect(habitTracker.habits[0].name).toBe(originalName);
    });

    test('deleteHabit removes habit when confirmed', () => {
      habitTracker.saveHabits = jest.fn();
      habitTracker.render = jest.fn();
      mockConfirm.mockReturnValue(true);
      
      habitTracker.addHabit('Test Habit');
      const habitId = habitTracker.habits[0].id;
      
      habitTracker.deleteHabit(habitId);
      
      expect(habitTracker.habits).toHaveLength(0);
      expect(mockConfirm).toHaveBeenCalled();
    });

    test('deleteHabit keeps habit when not confirmed', () => {
      habitTracker.saveHabits = jest.fn();
      habitTracker.render = jest.fn();
      mockConfirm.mockReturnValue(false);
      
      habitTracker.addHabit('Test Habit');
      const habitId = habitTracker.habits[0].id;
      
      habitTracker.deleteHabit(habitId);
      
      expect(habitTracker.habits).toHaveLength(1);
      expect(mockConfirm).toHaveBeenCalled();
    });
  });

  describe('Date Utilities', () => {
    test('getTodayString returns date in YYYY-MM-DD format', () => {
      const today = habitTracker.getTodayString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Verify it's actually today's date
      const expectedDate = new Date().toISOString().split('T')[0];
      expect(today).toBe(expectedDate);
    });

    test('isCompletedToday checks if habit is completed today', () => {
      const todayString = habitTracker.getTodayString();
      
      const completedHabit = {
        completions: [todayString, '2023-01-01']
      };
      
      const notCompletedHabit = {
        completions: ['2023-01-01', '2023-01-02']
      };
      
      expect(habitTracker.isCompletedToday(completedHabit)).toBe(true);
      expect(habitTracker.isCompletedToday(notCompletedHabit)).toBe(false);
    });
  });

  describe('Habit Tracking', () => {
    test('toggleHabit adds completion for today', () => {
      habitTracker.saveHabits = jest.fn();
      habitTracker.render = jest.fn();
      habitTracker.updateStreak = jest.fn();
      
      habitTracker.addHabit('Test Habit');
      const habitId = habitTracker.habits[0].id;
      const todayString = habitTracker.getTodayString();
      
      habitTracker.toggleHabit(habitId);
      
      expect(habitTracker.habits[0].completions).toContain(todayString);
      expect(habitTracker.updateStreak).toHaveBeenCalled();
      expect(habitTracker.saveHabits).toHaveBeenCalled();
      expect(habitTracker.render).toHaveBeenCalled();
    });

    test('toggleHabit removes completion if already completed today', () => {
      habitTracker.saveHabits = jest.fn();
      habitTracker.render = jest.fn();
      habitTracker.updateStreak = jest.fn();
      
      habitTracker.addHabit('Test Habit');
      const habitId = habitTracker.habits[0].id;
      const todayString = habitTracker.getTodayString();
      
      // Add completion first
      habitTracker.toggleHabit(habitId);
      expect(habitTracker.habits[0].completions).toContain(todayString);
      
      // Remove completion
      habitTracker.toggleHabit(habitId);
      expect(habitTracker.habits[0].completions).not.toContain(todayString);
    });

    test('toggleHabit handles invalid habit ID gracefully', () => {
      const originalLength = habitTracker.habits.length;
      
      habitTracker.toggleHabit('invalid-id');
      
      // Should not crash or modify anything
      expect(habitTracker.habits).toHaveLength(originalLength);
    });
  });

  describe('Streak Calculation', () => {
    test('updateStreak sets streak to 0 for habits with no completions', () => {
      const habit = { completions: [], streak: 5 };
      
      habitTracker.updateStreak(habit);
      
      expect(habit.streak).toBe(0);
    });

    test('updateStreak calculates consecutive day streaks correctly', () => {
      const habit = { completions: [], streak: 0 };
      
      // Create a 3-day streak ending today
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dayBefore = new Date(today);
      dayBefore.setDate(dayBefore.getDate() - 2);
      
      habit.completions = [
        today.toISOString().split('T')[0],
        yesterday.toISOString().split('T')[0],
        dayBefore.toISOString().split('T')[0]
      ];
      
      habitTracker.updateStreak(habit);
      
      expect(habit.streak).toBe(3);
    });

    test('updateStreak resets streak when there are gaps', () => {
      const habit = { completions: [], streak: 0 };
      
      // Today and 3 days ago (with a gap)
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      habit.completions = [
        today.toISOString().split('T')[0],
        threeDaysAgo.toISOString().split('T')[0]
      ];
      
      habitTracker.updateStreak(habit);
      
      expect(habit.streak).toBe(1); // Only today counts
    });
  });

  describe('Statistics', () => {
    test('getStats returns correct statistics', () => {
      habitTracker.addHabit('Habit 1');
      habitTracker.addHabit('Habit 2');
      habitTracker.addHabit('Habit 3');
      
      // Complete two habits today
      const todayString = habitTracker.getTodayString();
      habitTracker.habits[0].completions.push(todayString);
      habitTracker.habits[0].streak = 1;
      habitTracker.habits[1].completions.push(todayString);
      habitTracker.habits[1].streak = 2;
      
      const stats = habitTracker.getStats();
      
      expect(stats.totalHabits).toBe(3);
      expect(stats.completedToday).toBe(2);
      expect(stats.currentStreak).toBe(2); // Max streak
      expect(stats.completionRate).toMatch(/^\d+%$/);
    });

    test('getStats handles empty habits array', () => {
      const stats = habitTracker.getStats();
      
      expect(stats.totalHabits).toBe(0);
      expect(stats.completedToday).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.completionRate).toBe('0%');
    });
  });

  describe('Demo Habits', () => {
    test('addDemoHabits adds 4 demo habits', () => {
      habitTracker.saveHabits = jest.fn();
      habitTracker.render = jest.fn();
      habitTracker.showDemoNotification = jest.fn();
      
      habitTracker.addDemoHabits();
      
      expect(habitTracker.habits).toHaveLength(4);
      
      // All habits should be marked as demo
      habitTracker.habits.forEach(habit => {
        expect(habit.isDemo).toBe(true);
        expect(habit.name).toContain('Demo');
      });
      
      expect(habitTracker.showDemoNotification).toHaveBeenCalled();
    });
  });

  describe('Modal State Management', () => {
    test('modal methods handle missing DOM elements gracefully', () => {
      // These should not throw errors even without DOM elements
      expect(() => {
        habitTracker.openEditModal('some-id');
        habitTracker.closeEditModal();
        habitTracker.saveEdit();
      }).not.toThrow();
    });
  });
});

