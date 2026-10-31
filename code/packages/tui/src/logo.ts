// Block wordmark. Three rows, one column of space between letters.
// `_` is a space over the letter's shadow, `^` a cap over the shadow, `~` a shadow
// cap with no foreground, and `,` a shadow quadrant. See component/logo.tsx.
export const logo = {
  word: [
    "█▀▀█ █▀▀█ █▀▀█ █▀▀█",
    "█▀▀▄ █▀▀_ █▀▀_ █▀▀_",
    "▀__▀ ▀▀▀▀ ▀▀▀▀ ▀___",
  ],
}

export const go = {
  left: ["    ", "█▀▀▀", "█_^█", "▀▀▀▀"],
  right: ["    ", "█▀▀█", "█__█", "▀▀▀▀"],
}
