Feature: Reload Button
  As a user
  I want to reload the page with a button
  So that I can refresh the data displayed on the page

  Background:
    Given the application has access to the JetBrains cache directory
    And the user has a web browser

  Scenario: Reload button placement
    When the user visits the homepage
    Then the user should see a "Reload" button in the top right of the page
    And the button should be right-aligned on the same row as the page title
    And if the page title is long, it should wrap without affecting the reload button position

  Scenario: Reload button functionality
    When the user clicks the "Reload" button
    Then the button should be disabled to prevent multiple clicks
    And the button should display a spinner to indicate loading
    And the page should reload with fresh data

  Scenario: Reload button appearance
    When the user visits the homepage
    Then the "Reload" button should have a clear, clickable appearance
    And the button should visually indicate when it is disabled
    And the button should display a spinner when loading