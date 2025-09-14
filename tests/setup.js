// Jest setup file for DOM testing
// jest is available globally, no need to import

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock;

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock window.confirm for deletion tests
global.confirm = jest.fn(() => true);

// Mock Date.now for consistent ID generation in tests
const mockDateNow = jest.fn(() => 1234567890000);
global.Date.now = mockDateNow;

// Mock Math.random for consistent ID generation in tests
const mockMathRandom = jest.fn(() => 0.123456789);
global.Math.random = mockMathRandom;

// Setup DOM elements that the HabitTracker expects
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
  
  // Setup basic DOM structure
  document.body.innerHTML = `
    <div class="container">
      <input type="text" id="habitInput" placeholder="Enter a new habit...">
      <button id="addHabitBtn">Add Habit</button>
      <div id="habitsList" class="habits-list"></div>
      <div id="emptyState" class="empty-state"></div>
      <div id="totalHabits">0</div>
      <div id="completedToday">0</div>
      <div id="currentStreak">0</div>
      <div id="completionRate">0%</div>
      <div id="currentDate"></div>
      
      <!-- Edit Modal -->
      <div id="editModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <button class="close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <input type="text" id="editHabitInput" placeholder="Habit name...">
          </div>
          <div class="modal-footer">
            <button id="cancelEdit">Cancel</button>
            <button id="saveEdit">Save</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Habit Template -->
    <template id="habitTemplate">
      <div class="habit-item" data-habit-id="">
        <div class="habit-content">
          <div class="habit-checkbox">
            <input type="checkbox" class="habit-check">
            <span class="checkmark"></span>
          </div>
          <div class="habit-info">
            <span class="habit-name"></span>
            <div class="habit-streak">
              <span class="streak-count">0</span> day streak
            </div>
          </div>
        </div>
        <div class="habit-actions">
          <button class="btn-icon edit-habit">Edit</button>
          <button class="btn-icon delete-habit">Delete</button>
        </div>
      </div>
    </template>
  `;
});

afterEach(() => {
  // Clean up DOM after each test
  document.body.innerHTML = '';
});
