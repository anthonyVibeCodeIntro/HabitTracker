// Load HabitTracker class from separate module for better testability
// In a real application, you might use a module bundler like Webpack or just include the script directly

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new HabitTracker();
    
    // Add demo data if no habits exist
    const stored = localStorage.getItem('habitTracker');
    if (!stored || JSON.parse(stored).length === 0) {
        app.addDemoHabits();
    }
});
