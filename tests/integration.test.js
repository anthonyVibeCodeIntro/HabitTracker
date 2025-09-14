// Integration tests for HabitTracker
const HabitTracker = require('../src/HabitTracker');

describe('HabitTracker Integration Tests', () => {
  let habitTracker;

  beforeEach(() => {
    habitTracker = new HabitTracker();
  });

  describe('Full Workflow Tests', () => {
    test('should handle complete habit lifecycle', () => {
      // Add habit
      habitTracker.addHabit('Morning Jog');
      expect(habitTracker.habits).toHaveLength(1);
      
      const habit = habitTracker.habits[0];
      const habitId = habit.id;
      
      // Check initial state
      expect(habit.streak).toBe(0);
      expect(habit.completions).toHaveLength(0);
      expect(habitTracker.isCompletedToday(habit)).toBe(false);
      
      // Complete habit
      habitTracker.toggleHabit(habitId);
      expect(habitTracker.isCompletedToday(habit)).toBe(true);
      expect(habit.streak).toBe(1);
      
      // Edit habit name
      habitTracker.editHabit(habitId, 'Evening Jog');
      expect(habit.name).toBe('Evening Jog');
      
      // Verify stats
      const stats = habitTracker.getStats();
      expect(stats.totalHabits).toBe(1);
      expect(stats.completedToday).toBe(1);
      expect(stats.currentStreak).toBe(1);
      
      // Delete habit
      global.confirm.mockReturnValue(true);
      habitTracker.deleteHabit(habitId);
      expect(habitTracker.habits).toHaveLength(0);
    });

    test('should handle multiple habits with different completion states', () => {
      // Add multiple habits
      habitTracker.addHabit('Habit 1');
      habitTracker.addHabit('Habit 2');
      habitTracker.addHabit('Habit 3');
      
      expect(habitTracker.habits).toHaveLength(3);
      
      // Complete some habits
      habitTracker.toggleHabit(habitTracker.habits[0].id);
      habitTracker.toggleHabit(habitTracker.habits[2].id);
      
      // Verify stats
      const stats = habitTracker.getStats();
      expect(stats.totalHabits).toBe(3);
      expect(stats.completedToday).toBe(2);
      expect(stats.currentStreak).toBe(1); // Max streak among all habits
      
      // Verify individual completion states
      expect(habitTracker.isCompletedToday(habitTracker.habits[0])).toBe(true);
      expect(habitTracker.isCompletedToday(habitTracker.habits[1])).toBe(false);
      expect(habitTracker.isCompletedToday(habitTracker.habits[2])).toBe(true);
    });

    test('should persist data through save/load cycle', () => {
      // Add and complete habits
      habitTracker.addHabit('Persistent Habit');
      habitTracker.toggleHabit(habitTracker.habits[0].id);
      
      // Verify data was saved
      expect(localStorage.setItem).toHaveBeenCalled();
      
      // Simulate loading from localStorage
      const savedData = JSON.stringify(habitTracker.habits);
      localStorage.getItem.mockReturnValue(savedData);
      
      // Create new instance and verify data persistence
      const newTracker = new HabitTracker();
      expect(newTracker.habits).toHaveLength(1);
      expect(newTracker.habits[0].name).toBe('Persistent Habit');
      expect(newTracker.isCompletedToday(newTracker.habits[0])).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid habit IDs gracefully', () => {
      habitTracker.addHabit('Test Habit');
      
      // Try to toggle non-existent habit
      const originalLength = habitTracker.habits.length;
      habitTracker.toggleHabit('invalid-id');
      
      // Should not crash or modify existing habits
      expect(habitTracker.habits).toHaveLength(originalLength);
      expect(habitTracker.habits[0].completions).toHaveLength(0);
    });

    test('should handle corrupted localStorage data', () => {
      // Mock corrupted JSON data
      localStorage.getItem.mockReturnValue('invalid-json-data');
      
      // Should not crash and fallback to empty array
      expect(() => {
        const tracker = new HabitTracker();
        expect(tracker.habits).toEqual([]);
      }).not.toThrow();
    });

    test('should handle extreme input values', () => {
      // Very long habit name
      const longName = 'a'.repeat(1000);
      habitTracker.addHabit(longName);
      expect(habitTracker.habits[0].name).toBe(longName);
      
      // Special characters
      const specialName = '🏃‍♂️ Special chars: @#$%^&*()';
      habitTracker.addHabit(specialName);
      expect(habitTracker.habits[1].name).toBe(specialName);
      
      // Unicode characters
      const unicodeName = 'Häbit with ünicöde';
      habitTracker.addHabit(unicodeName);
      expect(habitTracker.habits[2].name).toBe(unicodeName);
    });

    test('should handle rapid successive operations', () => {
      // Add multiple habits rapidly
      for (let i = 0; i < 10; i++) {
        habitTracker.addHabit(`Habit ${i}`);
      }
      expect(habitTracker.habits).toHaveLength(10);
      
      // Toggle all habits rapidly
      habitTracker.habits.forEach(habit => {
        habitTracker.toggleHabit(habit.id);
      });
      
      // Verify all are completed
      const completedCount = habitTracker.habits.filter(habit => 
        habitTracker.isCompletedToday(habit)
      ).length;
      expect(completedCount).toBe(10);
      
      // Verify stats are correct
      const stats = habitTracker.getStats();
      expect(stats.totalHabits).toBe(10);
      expect(stats.completedToday).toBe(10);
    });
  });

  describe('Date and Time Handling', () => {
    test('should handle date boundaries correctly', () => {
      const habit = {
        completions: [],
        streak: 0
      };
      
      // Test with dates at different times of day
      const earlyMorning = new Date();
      earlyMorning.setHours(1, 0, 0, 0);
      
      const lateMidnight = new Date();
      lateMidnight.setHours(23, 59, 59, 999);
      
      const sameDay = earlyMorning.toISOString().split('T')[0];
      
      habit.completions = [sameDay];
      habitTracker.updateStreak(habit);
      
      expect(habit.streak).toBe(1);
    });

    test('should calculate streak correctly across multiple days', () => {
      const habit = {
        completions: [],
        streak: 0
      };
      
      // Create a 5-day streak
      const completions = [];
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        completions.push(date.toISOString().split('T')[0]);
      }
      
      habit.completions = completions;
      habitTracker.updateStreak(habit);
      
      expect(habit.streak).toBe(5);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large number of habits efficiently', () => {
      const startTime = Date.now();
      
      // Add 100 habits
      for (let i = 0; i < 100; i++) {
        habitTracker.addHabit(`Habit ${i}`);
      }
      
      // Complete all habits
      habitTracker.habits.forEach(habit => {
        habitTracker.toggleHabit(habit.id);
      });
      
      // Calculate stats
      const stats = habitTracker.getStats();
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Should complete within reasonable time (less than 1 second)
      expect(executionTime).toBeLessThan(1000);
      expect(stats.totalHabits).toBe(100);
      expect(stats.completedToday).toBe(100);
    });

    test('should handle large completion history efficiently', () => {
      habitTracker.addHabit('Long History Habit');
      const habit = habitTracker.habits[0];
      
      // Add 365 days of completion history
      const completions = [];
      for (let i = 0; i < 365; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        completions.push(date.toISOString().split('T')[0]);
      }
      
      habit.completions = completions;
      
      const startTime = Date.now();
      habitTracker.updateStreak(habit);
      const endTime = Date.now();
      
      // Should complete streak calculation quickly
      expect(endTime - startTime).toBeLessThan(100);
      expect(habit.streak).toBe(365);
    });
  });
});
