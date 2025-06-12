import { JetBrains } from "./jetbrains.js"

const jb = new JetBrains()
// console.log(JSON.stringify(jb, null, 2))
console.log(jb.metrics)
const memory = process.memoryUsage()
console.log(`rss: ${Math.round(memory.rss / 1024 / 1024)}MB, heapTotal: ${Math.round(memory.heapTotal / 1024 / 1024)}MB, heapUsed: ${Math.round(memory.heapUsed / 1024 / 1024)}MB`)
