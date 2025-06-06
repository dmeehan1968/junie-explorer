Feature: Project Issues
  As a user
  I want to view issues for a specific project
  So that I can explore the issues available for that project

  Background:
    Given the application has access to the JetBrains cache directory
    And the user has a web browser

  Scenario: Viewing project issues
    Given there are projects for a specific JetBrains IDE
    When the user clicks on a project name
    Then the user should be redirected to a project issues page
    And the user should see a page titled with the project name
    And the user should see a list of all issues for that project
    And each issue should display its name and creation date

  Scenario: Viewing project issues with no issues
    Given there is a project with no issues
    When the user clicks on the project name
    Then the user should be redirected to a project issues page
    And the user should see a page titled with the project name
    And the user should see a message indicating no issues were found

  Scenario: Navigating back to projects list
    Given the user is on a project issues page
    When the user clicks on the IDE name link in the breadcrumb navigation
    Then the user should be redirected to the IDE projects page

  Scenario: Responsive design on different devices
    Given there are issues for a specific project
    When the user visits the project issues page on a mobile device
    Then the page should adjust its layout to fit the smaller screen
    And all issues should still be visible and accessible
