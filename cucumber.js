export default {
  import: [
    'features/support/**/*.ts',
    'features/step_definitions/**/*.ts'
  ],
  loader: ['ts-node/esm'],
  format: [
    'progress-bar',
    'summary',
    'html:reports/cucumber-report.html',
  ],
  formatOptions: {
    snippetInterface: 'async-await'
  }
};
