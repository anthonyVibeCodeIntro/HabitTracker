// Final working tests for HabitTracker with proper isolation
const HabitTracker = require('../src/HabitTracker');

describe('HabitTracker - Final Working Tests', () => {
  let habitTracker;
  let mockLocalStorage;

  beforeAll(() => {
    // Mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    global.localStorage = mockLocalStorage;
    
    // Mock confirm
    global.confirm = jest.fn(() => true);
  });

  beforeEach(() => {
    // Clear all mocks and reset localStorage
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Create a fresh instance for each test
    habitTracker = new HabitTracker();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with empty habits when localStorage is empty', () => {
      expect(habitTracker.habits).toEqual([]);
      expect(habitTracker.currentEditingId).toBeNull();
    });

    test('should load habits from localStorage when available', () => {
      const mockHabits = [
        {
          id: '123',
          name: 'Test Habit',
          createdAt: '2023-01-01T00:00:00.000Z',
          completions: [],
          streak: 0,
          isDemo: false
        }
      ];
      
      // Create a separate mock for this test
      const testMockStorage = {
        getItem: jest.fn(() => JSON.stringify(mockHabits)),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      };
      global.localStorage = testMockStorage;
      
      const tracker = new HabitTracker();
      expect(tracker.habits).toEqual(mockHabits);
      
      // Restore original mock
      global.localStorage = mockLocalStorage;
    });
  });

  describe('Local Storage Methods', () => {
    test('loadHabits should return empty array when no data in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const habits = habitTracker.loadHabits();
      expect(habits).toEqual([]);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('habitTracker');
    });

    test('loadHabits should parse and return stored habits', () => {
      const mockHabits = [{ id: '123', name: 'Test', completions: [], streak: 0 }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockHabits));
      
      const habits = habitTracker.loadHabits();
      expect(habits).toHaveLength(1);
      expect(habits[0].name).toBe('Test');
      expect(habits[0].completions).toEqual([]);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('habitTracker');
    });

    test('saveHabits should store habits to localStorage', () => {
      habitTracker.habits = [{ id: '123', name: 'Test Habit' }];
      habitTracker.saveHabits();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'habitTracker',
        JSON.stringify(habitTracker.habits)
      );
    });
  });

  describe('Habit Management', () => {
    test('addHabit should add a new habit with correct properties', () => {
      const habitName = 'Morning Exercise';
      const initialLength = habitTracker.habits.length;
      
      habitTracker.addHabit(habitName);
      
      expect(habitTracker.habits).toHaveLength(initialLength + 1);
      const newHabit = habitTracker.habits[habitTracker.habits.length - 1];
      expect(newHabit).toMatchObject({
        name: habitName,
        completions: [],
        streak: 0,
        isDemo: false
      });
      expect(newHabit.id).toBeDefined();
      expect(newHabit.createdAt).toBeDefined();
    });

    test('addHabit should not add habit with empty name', () => {
      const initialLength = habitTracker.habits.length;
      
      habitTracker.addHabit('');
      habitTracker.addHabit('   ');
      
      expect(habitTracker.habits).toHaveLength(initialLength);
    });

    test('addHabit should trim whitespace from habit name', () => {
      const initialLength = habitTracker.habits.length;
      
      habitTracker.addHabit('  Test Habit  ');
      
      expect(habitTracker.habits).toHaveLength(initialLength + 1);
      expect(habitTracker.habits[habitTracker.habits.length - 1].name).toBe('Test Habit');
    });

    test('generateUniqueId should return unique IDs', () => {
      const id1 = habitTracker.generateUniqueId();
      const id2 = habitTracker.generateUniqueId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    test('deleteHabit should remove habit when confirmed', () => {
      habitTracker.addHabit('Test Habit');
      const initialLength = habitTracker.habits.length;
      const habitId = habitTracker.habits[habitTracker.habits.length - 1].id;
      
      global.confirm.mockReturnValue(true);
      habitTracker.deleteHabit(habitId);
      
      expect(habitTracker.habits).toHaveLength(initialLength - 1);
      expect(global.confirm).toHaveBeenCalled();
    });

    test('deleteHabit should not remove habit when not confirmed', () => {
      habitTracker.addHabit('Test Habit');
      const initialLength = habitTracker.habits.length;
      const habitId = habitTracker.habits[habitTracker.habits.length - 1].id;
      
      global.confirm.mockReturnValue(false);
      habitTracker.deleteHabit(habitId);
      
      expect(habitTracker.habits).toHaveLength(initialLength);
      expect(global.confirm).toHaveBeenCalled();
    });

    test('editHabit should update habit name', () => {
      habitTracker.addHabit('Old Name');
      const habitId = habitTracker.habits[habitTracker.habits.length - 1].id;
      
      habitTracker.editHabit(habitId, 'New Name');
      
      const updatedHabit = habitTracker.habits.find(h => h.id === habitId);
      expect(updatedHabit.name).toBe('New Name');
    });

    test('editHabit should not update with empty name', () => {
      habitTracker.addHabit('Original Name');
      const habitId = habitTracker.habits[habitTracker.habits.length - 1].id;
      
      habitTracker.editHabit(habitId, '');
      habitTracker.editHabit(habitId, '   ');
      
      const habit = habitTracker.habits.find(h => h.id === habitId);
      expect(habit.name).toBe('Original Name');
    });
  });

  describe('Habit Tracking', () => {
    test('toggleHabit should add completion for today', () => {
      habitTracker.addHabit('Test Habit');
      const habitId = habitTracker.habits[habitTracker.habits.length - 1].id;
      const today = habitTracker.getTodayString();
      
      habitTracker.toggleHabit(habitId);
      
      const habit = habitTracker.habits.find(h => h.id === habitId);
      expect(habit.completions).toContain(today);
    });

    test('toggleHabit should remove completion when already completed today', () => {
      habitTracker.addHabit('Test Habit');
      const habitId = habitTracker.habits[habitTracker.habits.length - 1].id;
      const today = habitTracker.getTodayString();
      
      // Add completion first
      habitTracker.toggleHabit(habitId);
      const habit = habitTracker.habits.find(h => h.id === habitId);
      expect(habit.completions).toContain(today);
      
      // Remove completion
      habitTracker.toggleHabit(habitId);
      expect(habit.completions).not.toContain(today);
    });

    test('isCompletedToday should return correct status', () => {
      habitTracker.addHabit('Test Habit');
      const habit = habitTracker.habits[habitTracker.habits.length - 1];
      
      expect(habitTracker.isCompletedToday(habit)).toBe(false);
      
      habitTracker.toggleHabit(habit.id);
      expect(habitTracker.isCompletedToday(habit)).toBe(true);
    });

    test('getTodayString should return date in YYYY-MM-DD format', () => {
      const today = habitTracker.getTodayString();
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      
      expect(today).toMatch(dateRegex);
    });
  });

  describe('Streak Calculation', () => {
    test('updateStreak should set streak to 0 for habit with no completions', () => {
      const habit = {
        completions: [],
        streak: 5 // Should be reset to 0
      };
      
      habitTracker.updateStreak(habit);
      expect(habit.streak).toBe(0);
    });

    test('updateStreak should calculate correct streak for consecutive days', () => {
      const habit = {
        completions: [],
        streak: 0
      };
      
      // Mock dates for testing - today and yesterday
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

    test('updateStreak should reset streak when there is a gap', () => {
      const habit = {
        completions: [],
        streak: 0
      };
      
      // Mock dates - today and 3 days ago (gap)
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
    test('getStats should return correct statistics', () => {
      // Start fresh
      const initialHabitsCount = habitTracker.habits.length;
      
      // Add some test habits
      habitTracker.addHabit('Habit 1');
      habitTracker.addHabit('Habit 2');
      habitTracker.addHabit('Habit 3');
      
      // Complete one habit today
      const lastHabitId = habitTracker.habits[habitTracker.habits.length - 1].id;
      habitTracker.toggleHabit(lastHabitId);
      
      const stats = habitTracker.getStats();
      
      expect(stats.totalHabits).toBe(initialHabitsCount + 3);
      expect(stats.completedToday).toBe(1);
      expect(stats.currentStreak).toBe(1);
      expect(typeof stats.completionRate).toBe('string');
      expect(stats.completionRate).toMatch(/^\d+%$/);
    });

    test('getStats should handle empty habits array', () => {
      // Create a completely fresh instance
      const freshTracker = new HabitTracker();
      const stats = freshTracker.getStats();
      
      expect(stats.totalHabits).toBe(0);
      expect(stats.completedToday).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.completionRate).toBe('0%');
    });
  });

  describe('Demo Habits', () => {
    test('addDemoHabits should add 4 demo habits', () => {
      const initialLength = habitTracker.habits.length;
      
      habitTracker.addDemoHabits();
      
      expect(habitTracker.habits).toHaveLength(initialLength + 4);
      
      // Check the last 4 habits are demo habits
      const lastFourHabits = habitTracker.habits.slice(-4);
      expect(lastFourHabits.every(habit => habit.isDemo)).toBe(true);
      expect(lastFourHabits.every(habit => habit.name.includes('Demo'))).toBe(true);
    });
  });

  describe('Modal Methods', () => {
    test('openEditModal should set currentEditingId and show modal', () => {
      habitTracker.addHabit('Test Habit');
      const habitId = habitTracker.habits[habitTracker.habits.length - 1].id;
      
      habitTracker.openEditModal(habitId);
      
      expect(habitTracker.currentEditingId).toBe(habitId);
      const modal = document.getElementById('editModal');
      const input = document.getElementById('editHabitInput');
      expect(modal.classList.contains('show')).toBe(true);
      expect(input.value).toBe('Test Habit');
    });

    test('closeEditModal should clear currentEditingId and hide modal', () => {
      habitTracker.addHabit('Test Habit');
      const habitId = habitTracker.habits[habitTracker.habits.length - 1].id;
      
      // First open the modal
      habitTracker.openEditModal(habitId);
      expect(habitTracker.currentEditingId).toBe(habitId);
      
      // Then close it
      habitTracker.closeEditModal();
      
      expect(habitTracker.currentEditingId).toBeNull();
      const modal = document.getElementById('editModal');
      expect(modal.classList.contains('show')).toBe(false);
    });

    test('saveEdit should update habit name and close modal', () => {
      habitTracker.addHabit('Original Name');
      const habitId = habitTracker.habits[habitTracker.habits.length - 1].id;
      
      habitTracker.currentEditingId = habitId;
      const input = document.getElementById('editHabitInput');
      input.value = 'Updated Name';
      
      habitTracker.saveEdit();
      
      const updatedHabit = habitTracker.habits.find(h => h.id === habitId);
      expect(updatedHabit.name).toBe('Updated Name');
      expect(habitTracker.currentEditingId).toBeNull();
    });
  });

  describe('Rendering Methods', () => {
    test('updateEmptyState should show empty state when no habits', () => {
      // Create a fresh tracker with no habits
      const freshTracker = new HabitTracker();
      freshTracker.updateEmptyState();
      
      const emptyState = document.getElementById('emptyState');
      const habitsList = document.getElementById('habitsList');
      expect(emptyState.style.display).toBe('block');
      expect(habitsList.style.display).toBe('none');
    });

    test('updateEmptyState should hide empty state when habits exist', () => {
      habitTracker.addHabit('Test Habit');
      habitTracker.updateEmptyState();
      
      const emptyState = document.getElementById('emptyState');
      const habitsList = document.getElementById('habitsList');
      expect(emptyState.style.display).toBe('none');
      expect(habitsList.style.display).toBe('flex');
    });

    test('renderStats should update DOM with correct values', () => {
      // Create a fresh instance and add one habit
      const freshTracker = new HabitTracker();
      freshTracker.addHabit('Test Habit');
      freshTracker.toggleHabit(freshTracker.habits[0].id);
      
      freshTracker.renderStats();
      
      expect(document.getElementById('totalHabits').textContent).toBe('1');
      expect(document.getElementById('completedToday').textContent).toBe('1');
      expect(document.getElementById('currentStreak').textContent).toBe('1');
      expect(document.getElementById('completionRate').textContent).toMatch(/^\d+%$/);
    });

    test('updateCurrentDate should set current date in correct format', () => {
      habitTracker.updateCurrentDate();
      
      const dateDisplay = document.getElementById('currentDate').textContent;
      expect(dateDisplay).toBeTruthy();
      expect(dateDisplay.length).toBeGreaterThan(0);
    });
  });
});

