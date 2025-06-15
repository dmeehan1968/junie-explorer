export default {
  import: [
    'features/support/**/*.ts',
    'features/step_definitions/**/*.ts'
  ],
  loader: ['ts-node/esm'],
  format: [
    'progress-bar',
    'html:reports/cucumber-report.html',
    'json:reports/cucumber-report.json'
  ],
  formatOptions: {
    snippetInterface: 'async-await'
  }
};
