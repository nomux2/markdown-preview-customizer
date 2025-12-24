# Debug Links (Updated)

Please test the following links to diagnose the issue:

1. **[Toggle Side Bar](command:workbench.action.toggleSidebarVisibility)** (Standard VS Code Command)
   - If this works: The Command system is working, but custom commands are blocked.
   - If this FAILS: All `command:` links are blocked (likely Workspace Trust or Preview Policy).

2. **[Export to HTML](command:antigravity.exportToHtml)** (Extension Command)

Please check if you see a permission popup ("Do you want to allow...") when clicking these.
