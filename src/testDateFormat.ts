import { Issue } from './matterhorn.js';

// Create a test issue with a date
const testIssue: Issue = {
  id: {
    id: 'test-uuid'
  },
  name: 'Test Issue',
  created: new Date().toISOString(),
  state: 'Done',
  tasks: []
};

// Test the date formatting
console.log('Date with toLocaleDateString():');
console.log(new Date(testIssue.created).toLocaleDateString());

console.log('\nDate with toLocaleString():');
console.log(new Date(testIssue.created).toLocaleString());

console.log('\nThe updated format now includes both date and time formatted according to the user\'s locale.');
