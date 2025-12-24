# Script Injection Test

Does the script validly run?

<script>
console.log('Antigravity: Inline script executed!');
document.body.style.border = '5px solid red';
</script>

1. If you see a **RED BORDER** around the page, scripts are enabled.
2. If NOT, scripts are disabled.

Note: VS Code disables `<script>` tags in Markdown by default for security.
Our extension injects a script via `markdown.previewScripts` setting, which *should* work if trust is enabled.
