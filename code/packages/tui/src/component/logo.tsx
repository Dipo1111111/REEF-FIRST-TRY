import type { RGBA } from "@opentui/core"
import { TextAttributes } from "@opentui/core"
import { For, Show } from "solid-js"
import { useTerminalDimensions } from "@opentui/solid"
import { useTheme } from "../context/theme"

// Pixel lettering for the masthead: square strokes, two columns per stroke,
// one cell of tracking. Five rows tall so it reads as a mark, not a headline.
const GLYPHS: Record<string, string[]> = {
  R: ["█████", "█   █", "████ ", "█  █ ", "█   █"],
  E: ["█████", "█    ", "████ ", "█    ", "█████"],
  F: ["█████", "█    ", "████ ", "█    ", "█    "],
}
const SCALE = 2
const WORD = "REEF"

function raster(word: string) {
  // Each cell carries its letter index so the word reads as a left-to-right gradient.
  const grid = Array.from({ length: 5 }, () => [] as number[])
  word.split("").forEach((letter, index) => {
    const glyph = GLYPHS[letter]
    for (let row = 0; row < 5; row++) {
      for (const cell of glyph[row]) for (let step = 0; step < SCALE; step++) grid[row].push(cell === "█" ? index + 1 : 0)
      grid[row].push(0, 0)
    }
  })
  return grid
}

export function Logo() {
  const theme = useTheme()
  const dimensions = useTerminalDimensions()

  const lines = () =>
    raster(WORD).map((row) => {
      const runs: { text: string; color?: RGBA }[] = []
      for (const cell of row) {
        const step = (300 + (cell - 1) * 100) as 300 | 400 | 500 | 600
        const color = cell ? theme.hue.accent[step] : undefined
        const char = cell ? "█" : " "
        const last = runs[runs.length - 1]
        if (last && last.color === color) last.text += char
        else runs.push({ text: char, color })
      }
      return runs
    })

  return (
    <Show
      when={dimensions().width >= 64}
      fallback={
        <text fg={theme.hue.accent[400]} attributes={TextAttributes.BOLD} selectable={false}>
          Reef
        </text>
      }
    >
      <box flexDirection="column">
        <For each={lines()}>
          {(row) => (
            <text selectable={false}>
              <For each={row}>{(run) => <span style={{ fg: run.color }}>{run.text}</span>}</For>
            </text>
          )}
        </For>
      </box>
    </Show>
  )
}
