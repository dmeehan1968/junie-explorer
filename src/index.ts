import { createServer } from "./createServer.js"

const { app, port, jetBrainsInstance } = await createServer()
const server = app.listen(port, () => {
  const address = server.address()
  if (address === null || typeof address === 'string') {
    throw new Error(`Server failed to start on port ${port} - ${address}`)
  }

  console.log(
      `Server is running on http://localhost:${address.port}`
  )

  // if (jetBrainsInstance.isMemoryReportEnabled()) {
  //   setInterval(() => jetBrainsInstance.memoryReport(), 5_000)
  // }
})
