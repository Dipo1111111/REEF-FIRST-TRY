export * as SessionSystemPrompt from "./system-prompt.js"

import PROMPT from "./runner/prompt/system.txt"

export function make(tools: string[], workspace?: string) {
  return render(PROMPT, tools, workspace)
}

export function render(prompt: string, tools: string[], workspace?: string) {
  const instructions: string[] = []
  if (workspace) {
    instructions.push(
      `- The working directory is \`${workspace}\`. Relative paths resolve there. Do not search outside it for project files.`,
    )
  }
  if (tools.includes("read")) {
    instructions.push(
      "- Read a file in one call when it is under 2,000 lines. Do not page through a small file in slices.",
      "- Batch at most two file reads in one `execute` call. Three or more overflows the return cap and forces a re-read.",
    )
  }
  if (tools.includes("execute")) {
    instructions.push(
      "- Batch mechanical work: many reads, greps, or edits of different files belong in one `execute` script. Search inside the script, then call the tools it found.",
      "- Do not batch exploratory or visual work. When the next step depends on what you just saw, make one change, look at the result, then decide. Small iterations beat one large blind edit.",
      "- Do not write helper scripts to disk and run them; put the code in the script body. Verify a result once, then report it.",
    )
  }
  if (tools.includes("shell")) {
    instructions.push(
      "- Prefer dedicated tools over shell commands; fall back to the shell when a tool cannot do what you need.",
      "- Do not chain shell commands with separators like `echo \"====\";` or `printf '---'`; the output becomes noisy in a way that makes the user's side of the conversation worse.",
    )
  }
  if (tools.includes("write")) {
    instructions.push(
      "- Use the write tool to create files or completely replace their content. Prefer using the edit tool for targeted changes.",
    )
  }
  if (tools.includes("edit")) {
    instructions.push(
      "- Use the edit tool for targeted changes to existing text files. It replaces the exact text in `oldString` with `newString`, and the values must differ. By default, `oldString` must occur exactly once. If it occurs multiple times, include more surrounding context to make it unique or set `replaceAll` to true to replace every occurrence.",
    )
  }
  if (tools.includes("time")) {
    instructions.push(
      "- Call the time tool before any answer about duration or how long work will take. You cannot feel elapsed time, so measure it. Estimate in edits and minutes, never in days unless the work genuinely cannot finish in one session, and then say how many sessions.",
    )
  }
  return prompt.replace("${OPENCODE_TOOL_GUIDANCE}", instructions.join("\n"))
}
