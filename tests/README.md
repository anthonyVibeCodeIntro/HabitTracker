# Test Suite Documentation

This directory contains automated tests for the Habit Tracker application.

## Test Structure

### Test Files

- **`setup.js`** - Jest configuration and global test setup
- **`HabitTracker.test.js`** - Unit tests for the main HabitTracker class
- **`integration.test.js`** - Integration tests and edge cases

### Test Categories

#### Unit Tests (`HabitTracker.test.js`)
- Constructor and initialization
- Local storage operations
- Habit management (add, edit, delete)
- Habit tracking and completion
- Streak calculation
- Statistics generation
- Modal operations
- DOM rendering methods

#### Integration Tests (`integration.test.js`)
- Complete workflow testing
- Multi-habit scenarios
- Data persistence testing
- Edge cases and error handling
- Date and time boundary testing
- Performance testing with large datasets

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI/CD (no watch mode)
npm run test:ci
```

### Test Coverage

The test suite aims for high coverage across all critical functionality:

- **Functions**: All public methods of the HabitTracker class
- **Branches**: All conditional logic paths
- **Lines**: All executable code lines
- **Statements**: All JavaScript statements

Coverage reports are generated in the `coverage/` directory and include:
- HTML report (`coverage/lcov-report/index.html`)
- LCOV format for CI/CD integration
- Text summary in console

## Test Environment

### Mocked Dependencies

The test environment mocks several browser APIs and dependencies:

- **localStorage**: Mocked for testing data persistence
- **console methods**: Mocked to reduce test output noise
- **window.confirm**: Mocked for deletion confirmation tests
- **Date.now()** and **Math.random()**: Mocked for consistent ID generation
- **DOM elements**: Created dynamically for each test

### DOM Testing

Tests use JSDOM to simulate browser environment:
- Full HTML structure is created for each test
- Template elements are properly configured
- Event listeners and DOM manipulation are tested
- Modal functionality is fully tested

## Writing New Tests

### Test Structure

Follow this pattern for new tests:

```javascript
describe('Feature Name', () => {
  let habitTracker;

  beforeEach(() => {
    habitTracker = new HabitTracker();
  });

  test('should describe what the test does', () => {
    // Arrange
    const input = 'test data';
    
    // Act
    const result = habitTracker.someMethod(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Best Practices

1. **Descriptive Names**: Test names should clearly describe what is being tested
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
3. **Isolation**: Each test should be independent and not rely on other tests
4. **Edge Cases**: Test boundary conditions, empty inputs, and error scenarios
5. **Mocking**: Mock external dependencies to focus on the code under test

### Test Data

Use consistent test data patterns:
- Habit names: Use descriptive names like "Morning Exercise" or "Test Habit"
- IDs: Let the system generate IDs naturally or use predictable mock values
- Dates: Use relative dates (today, yesterday) rather than fixed dates

## Continuous Integration

Tests are automatically run on:
- Push to main/develop branches
- Pull requests to main/develop branches
- Multiple Node.js versions (18.x, 20.x, 22.x)

The CI pipeline includes:
- Test execution
- Coverage reporting
- Security auditing
- Code syntax validation

## Debugging Tests

### Common Issues

1. **DOM Elements Missing**: Ensure `setup.js` creates all required DOM elements
2. **Async Operations**: Use proper async/await or return promises
3. **Mock Cleanup**: Verify mocks are cleared between tests
4. **Date Dependencies**: Use consistent date mocking for time-dependent tests

### Debug Commands

```bash
# Run specific test file
npm test -- HabitTracker.test.js

# Run tests matching pattern
npm test -- --testNamePattern="streak"

# Run tests with verbose output
npm test -- --verbose

# Debug specific test
npm test -- --testNamePattern="specific test name" --verbose
```

## Performance Considerations

The test suite includes performance tests to ensure:
- Large datasets (100+ habits) are handled efficiently
- Streak calculations are optimized for long histories
- DOM operations don't cause memory leaks
- localStorage operations are fast

These tests help maintain application performance as features are added.

