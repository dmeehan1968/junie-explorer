import { beforeEach, describe, expect, it } from "bun:test"
import { testServer } from "../../test.setup.js"
import { ProjectTableDSL } from "./projectTable.dsl.js"

describe("projectTable", () => {

  let projectTable: ProjectTableDSL

  beforeEach(async () => {
    const { testPage, testServerAddress } = await testServer()
    projectTable = new ProjectTableDSL(testPage, testServerAddress)
    await projectTable.navigateTo()
  })

  it('should exist', async () => {
    const { jetBrainsTestInstance } = await testServer()
    expect(projectTable.exists).resolves.toBe(true)
    expect(projectTable.rowCount).resolves.toEqual((await jetBrainsTestInstance.projects).size)
  })

  it('should find matching projects', async () => {
    await projectTable.search('test')
    expect(projectTable.visibleRowCount).resolves.toEqual(1)
  })

  it('should allow selection', async () => {
    await projectTable.selectRow(1)
    expect(projectTable.selectedRowCount).resolves.toEqual(1)
  })

})
