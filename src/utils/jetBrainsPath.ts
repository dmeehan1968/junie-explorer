// Get username from environment variable
const username = process.env.USER
const jetBrainsPath = `/Users/${username}/Library/Caches/JetBrains`

// Export the path for use in other modules
export { jetBrainsPath }
