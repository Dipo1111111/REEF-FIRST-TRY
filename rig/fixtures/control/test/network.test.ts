import { expect, test } from "bun:test"

test("fetches a host that does not resolve", async () => {
  const response = await fetch("https://reef-rig.invalid/status")
  expect(await response.text()).toBe("ok")
})
