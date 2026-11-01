import { RendererControlState, type CliRenderer } from "@opentui/core"

type TitleRenderer = Pick<CliRenderer, "isDestroyed" | "controlState" | "setTerminalTitle">

const RESET = "\x1b[0m\x1b[?25h\x1b[?1049l"

// OpenTUI rejects terminal control from suspend() until resume() completes, e.g. while $EDITOR runs.
export function setTerminalTitle(renderer: TitleRenderer, title: string) {
  if (renderer.isDestroyed || renderer.controlState === RendererControlState.EXPLICIT_SUSPENDED) return
  renderer.setTerminalTitle(title)
}

/**
 * Put the terminal back in a usable state. Destroy restores most of it, but a teardown that
 * fails part way leaves escape bytes that a cooked-mode shell then prints as text.
 */
export function resetTerminal() {
  if (!process.stdout.isTTY) return
  try {
    process.stdout.write(RESET)
  } catch {
    // The stream is already gone; nothing left to restore.
  }
}

export function destroyRenderer(renderer: TitleRenderer & Pick<CliRenderer, "destroy">) {
  if (renderer.isDestroyed) return
  setTerminalTitle(renderer, "")
  try {
    renderer.destroy()
  } finally {
    resetTerminal()
  }
}

/**
 * Destroy and wait for the final flush, but never wait forever: a renderer that refuses to die
 * keeps painting frames over a shell that already left raw mode, which is the escape spam we
 * saw. When `force` is set and the renderer is still alive after a second attempt, end the
 * process rather than return to a corrupted prompt. Handoff runs reuse the process, so they
 * pass `force: false`.
 */
export async function shutdownRenderer(
  renderer: TitleRenderer & Pick<CliRenderer, "destroy"> & Pick<CliRenderer, "closed">,
  force: boolean,
) {
  destroyRenderer(renderer)
  await Promise.race([renderer.closed.catch(() => {}), new Promise((resolve) => setTimeout(resolve, 2_000))])
  if (!renderer.isDestroyed) {
    destroyRenderer(renderer)
    await Promise.race([renderer.closed.catch(() => {}), new Promise((resolve) => setTimeout(resolve, 500))])
  }
  resetTerminal()
  if (force && !renderer.isDestroyed) process.exit(0)
}
