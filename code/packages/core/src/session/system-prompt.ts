export * as SessionSystemPrompt from "./system-prompt.js"

import PROMPT from "./runner/prompt/system.txt"

export function make(tools: string[], workspace?: string, workspaceMap?: string) {
  return render(PROMPT, tools, workspace, workspaceMap)
}

export function render(prompt: string, tools: string[], workspace?: string, workspaceMap?: string) {
  const instructions: string[] = []
  if (workspace) {
    instructions.push(
      `- The working directory is \`${workspace}\`. Relative paths resolve there. Do not search outside it for project files.`,
    )
  }
  if (workspaceMap) {
    instructions.push(
      "",
      "# Workspace map",
      "This map was generated once for this session. Trust it for the layout; do not spend requests listing directories it already shows.",
      workspaceMap,
    )
  }
  if (tools.includes("read")) {
    instructions.push(
      "- Read a file in one call when it is under 2,000 lines. Do not page through a small file in slices.",
    )
  }
  if (tools.includes("execute")) {
    instructions.push(
      "- Every `execute` program costs one model request, and a model request is the most expensive thing you do. Put the whole related batch of work in one program. A program that makes one call is the worst way to work.",
      "- Inside one program, run independent calls concurrently with `Promise.allSettled`. Searches, reads, and edits that do not depend on each other belong in the same program.",
      "- Return the smallest answer the job needs: ids, paths, counts, or the lines that matched. Raw output stays inside the program. When a call returns more than you need, the harness saves the full text to a file and tells you the path; read or grep that file instead of asking again.",
      "- Do not batch exploratory or visual work. When the next step depends on what you just saw, make one change, look at the result, then decide.",
      "- Do not write helper scripts to disk and run them; put the code in the script body. Verify a result once, then report it.",
    )
  }
  if (tools.includes("shell")) {
    instructions.push(
      "- Prefer dedicated tools over shell commands; fall back to the shell when a tool cannot do what you need.",
      "- Do not chain shell commands with separators like `echo \"====\";` or `printf '---'`; the output becomes noisy in a way that makes the user's side of the conversation worse.",
      "- A command that takes more than a few seconds should run in the background so you can keep working. You are notified when it finishes.",
      "- Use short timeouts and let a slow command fail fast. Opt into a longer timeout only when you know the command needs it.",
      "- Do not run the same command twice. Each tool result tells you how long the call took; read the saved output file when you need more of it.",
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
