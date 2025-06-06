import { Issue } from './matterhorn.js';

// Create a test issue with a date
const testIssue: Issue = {
  id: 'test-uuid',
  name: 'Test Issue',
  created: new Date(),
  state: 'Done',
  tasks: []
};

// Test the date formatting
console.log('Date with toLocaleDateString():');
console.log(testIssue.created.toLocaleDateString());

console.log('\nDate with toLocaleString():');
console.log(testIssue.created.toLocaleString());

console.log('\nThe updated format now includes both date and time formatted according to the user\'s locale.');