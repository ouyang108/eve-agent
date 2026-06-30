---
description: Use this skill when the user asks to inspect, maintain, repair, verify, or summarize a local codebase.
---

# Codebase Maintenance Procedure

1. Start with inspect_project.
2. Read package scripts, README, and config files only when they exist.
3. Build a task list:
   - project scan
   - issue search
   - low-risk fixes
   - verification
   - report
4. Use search_text for TODO, FIXME, console.log, debugger, empty catch, and obvious secrets.
5. Classify every potential edit by risk.
6. Use write_workspace_file only for approved low-risk edits.
7. Run the narrowest verification command after edits.
8. Save verified project facts using remember_fact.
9. Save a Markdown report using save_report.