Feature: IDE Projects Page
  As a user
  I want to view projects for a specific JetBrains IDE
  So that I can explore the projects available for that IDE

  Background:
    Given the application has access to the JetBrains cache directory
    And the user has a web browser

  Scenario: Navigating from homepage to IDE projects page
    Given there are JetBrains IDE directories in the cache
    When the user clicks on an IDE directory link on the homepage
    Then the user should be taken to a page for that specific IDE
    And the user should see a page titled "[IDE Name] Projects"
    And the user should see a list of projects available for that IDE

  Scenario: Viewing IDE projects page with projects
    Given there are projects for a specific JetBrains IDE
    When the user visits the projects page for that IDE
    Then the user should see a list of all projects for that IDE
    And each project should display its name

  Scenario: Viewing IDE projects page with no projects
    Given there are no projects for a specific JetBrains IDE
    When the user visits the projects page for that IDE
    Then the user should see a message indicating no projects were found

  Scenario: Navigating back to homepage
    Given the user is on an IDE projects page
    When the user clicks on a "Back to Home" link
    Then the user should be taken back to the homepage