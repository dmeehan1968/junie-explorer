Feature: Reload Button
  As a user
  I want to reload the page with a button
  So that I can refresh the data displayed on the page

  Background:
    Given the application has access to the JetBrains cache directory
    And the user has a web browser

  Scenario: Reload button visibility
    When the user visits the homepage
    Then the user should see a "Reload" button in the top right of the page

  Scenario: Reload button alignment
    When the user visits the homepage
    Then the button should be right-aligned on the same row as the page title

  Scenario: Reload button with long page titles
    When the user visits a page with a long title
    Then the page title should wrap without affecting the reload button position

  Scenario: Reload button click prevention
    When the user clicks the "Reload" button
    Then the button should be disabled to prevent multiple clicks

  Scenario: Reload button loading indicator
    When the user clicks the "Reload" button
    Then the button should display a spinner to indicate loading

  Scenario: Page data refresh
    When the user clicks the "Reload" button
    Then the page should reload with fresh data

  Scenario: Reload button visual appearance
    When the user visits the homepage
    Then the "Reload" button should have a clear, clickable appearance

  Scenario: Reload button disabled state
    When the "Reload" button is disabled
    Then the button should visually indicate its disabled state

  Scenario: Reload button loading state
    When the "Reload" button is in loading state
    Then the button should display a spinner
