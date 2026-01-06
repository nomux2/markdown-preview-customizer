
$themes = @(
    # Design System (Sans) - Font: var(--font-main)
    @{ Name = "Trust"; Slug = "trust"; Main = "#1A365D"; Accent = "#3182CE"; Bg = "#FFFFFF"; Text = "#2D3748"; Font = "var(--font-main)" },
    @{ Name = "Modern V2"; Slug = "modern-v2"; Main = "#3B82F6"; Accent = "#10B981"; Bg = "#1F2937"; Text = "#F9FAFB"; Font = "var(--font-main)" },
    @{ Name = "Simple"; Slug = "simple"; Main = "#4B5563"; Accent = "#9CA3AF"; Bg = "#FFFFFF"; Text = "#111827"; Font = "var(--font-main)" },
    @{ Name = "Nordic"; Slug = "nordic"; Main = "#4C566A"; Accent = "#88C0D0"; Bg = "#ECEFF4"; Text = "#2E3440"; Font = "var(--font-main)" },
    @{ Name = "Fresh"; Slug = "fresh"; Main = "#059669"; Accent = "#34D399"; Bg = "#F0FDF4"; Text = "#064E3B"; Font = "var(--font-main)" },
    @{ Name = "Warm"; Slug = "warm"; Main = "#D97706"; Accent = "#F59E0B"; Bg = "#FFFBEB"; Text = "#78350F"; Font = "var(--font-main)" },
    @{ Name = "Minimal"; Slug = "minimal"; Main = "#000000"; Accent = "#666666"; Bg = "#FFFFFF"; Text = "#000000"; Font = "var(--font-main)" },
    @{ Name = "Professional"; Slug = "professional"; Main = "#1E3A8A"; Accent = "#60A5FA"; Bg = "#F8FAFC"; Text = "#0F172A"; Font = "var(--font-main)" },

    # Design System (Serif)
    @{ Name = "Elegant"; Slug = "elegant"; Main = "#881337"; Accent = "#F43F5E"; Bg = "#FFF1F2"; Text = "#4C0519"; Font = "var(--font-serif)" },
    @{ Name = "Classic"; Slug = "classic"; Main = "#4338CA"; Accent = "#818CF8"; Bg = "#F5F3FF"; Text = "#312E81"; Font = "var(--font-serif)" },

    # Business
    @{ Name = "Corporate"; Slug = "corporate"; Main = "#1E40AF"; Accent = "#3B82F6"; Bg = "#FFFFFF"; Text = "#1E3A8A"; Font = "var(--font-main)" },
    @{ Name = "Report"; Slug = "report"; Main = "#374151"; Accent = "#6B7280"; Bg = "#FFFFFF"; Text = "#111827"; Font = "var(--font-serif)" },
    @{ Name = "Minutes"; Slug = "minutes"; Main = "#047857"; Accent = "#10B981"; Bg = "#ECFDF5"; Text = "#064E3B"; Font = "var(--font-main)" },
    @{ Name = "Proposal"; Slug = "proposal"; Main = "#BE185D"; Accent = "#EC4899"; Bg = "#FFF1F2"; Text = "#831843"; Font = "var(--font-main)" },
    @{ Name = "Contract"; Slug = "contract"; Main = "#111827"; Accent = "#374151"; Bg = "#FFFFFF"; Text = "#000000"; Font = "var(--font-serif)" },
    @{ Name = "Invoice"; Slug = "invoice"; Main = "#4B5563"; Accent = "#9CA3AF"; Bg = "#FFFFFF"; Text = "#1F2937"; Font = "var(--font-main)" },
    @{ Name = "Manual"; Slug = "manual"; Main = "#0369A1"; Accent = "#0EA5E9"; Bg = "#F0F9FF"; Text = "#0C4A6E"; Font = "var(--font-main)" },
    @{ Name = "Specification"; Slug = "specification"; Main = "#333333"; Accent = "#555555"; Bg = "#FFFFFF"; Text = "#000000"; Font = "var(--font-main)" },
    @{ Name = "Executive"; Slug = "executive"; Main = "#78350F"; Accent = "#B45309"; Bg = "#FFFBEB"; Text = "#451A03"; Font = "var(--font-serif)" },
    @{ Name = "Financial"; Slug = "financial"; Main = "#134E4A"; Accent = "#2DD4BF"; Bg = "#F0FDFA"; Text = "#042F2E"; Font = "var(--font-main)" },

    # Presentation
    @{ Name = "Presentation"; Slug = "presentation"; Main = "#2563EB"; Accent = "#60A5FA"; Bg = "#EFF6FF"; Text = "#1E3A8A"; Font = "var(--font-main)" },
    @{ Name = "Whiteboard"; Slug = "whiteboard"; Main = "#1d4ed8"; Accent = "#ef4444"; Bg = "#ffffff"; Text = "#1e293b"; Font = "var(--font-hand)" },
    @{ Name = "Impact"; Slug = "impact"; Main = "#DC2626"; Accent = "#F87171"; Bg = "#111827"; Text = "#FFFFFF"; Font = "var(--font-main)" },
    @{ Name = "Keynote"; Slug = "keynote"; Main = "#A855F7"; Accent = "#D8B4FE"; Bg = "#1F2937"; Text = "#F3F4F6"; Font = "var(--font-main)" },
    @{ Name = "Pitch"; Slug = "pitch"; Main = "#EC4899"; Accent = "#F472B6"; Bg = "#111827"; Text = "#FFFFFF"; Font = "var(--font-main)" },
    @{ Name = "Conference"; Slug = "conference"; Main = "#0F172A"; Accent = "#334155"; Bg = "#F1F5F9"; Text = "#020617"; Font = "var(--font-main)" },
    @{ Name = "Workshop"; Slug = "workshop"; Main = "#EA580C"; Accent = "#FB923C"; Bg = "#FFF7ED"; Text = "#7C2D12"; Font = "var(--font-hand)" },
    @{ Name = "Seminar"; Slug = "seminar"; Main = "#059669"; Accent = "#34D399"; Bg = "#064E3B"; Text = "#ECFDF5"; Font = "var(--font-main)" },
    @{ Name = "Training"; Slug = "training"; Main = "#4F46E5"; Accent = "#818CF8"; Bg = "#EEF2FF"; Text = "#312E81"; Font = "var(--font-main)" },
    @{ Name = "Demo"; Slug = "demo"; Main = "#10B981"; Accent = "#34D399"; Bg = "#0F172A"; Text = "#A7F3D0"; Font = "'Courier New', monospace" },
    
    # Special Request
    @{ Name = "Pop"; Slug = "pop"; Main = "#F472B6"; Accent = "#FBBF24"; Bg = "#FFFBEB"; Text = "#4B5563"; Font = "var(--font-pop)" }
)

$dest = Join-Path $PSScriptRoot "media"

foreach ($theme in $themes) {
    $file = Join-Path $dest "theme-$($theme.Slug).css"
    $content = "/* MPC Theme: $($theme.Name) */
.mpc-theme-$($theme.Slug) {
    --mpc-color-main: $($theme.Main);
    --mpc-color-accent: $($theme.Accent);
    --mpc-color-bg: $($theme.Bg);
    --mpc-color-text: $($theme.Text);
    --vscode-font-family: $($theme.Font);
    --vscode-editor-font-family: $($theme.Font);
}

.mpc-theme-$($theme.Slug) h1, 
.mpc-theme-$($theme.Slug) h2, 
.mpc-theme-$($theme.Slug) h3,
.mpc-theme-$($theme.Slug) h4,
.mpc-theme-$($theme.Slug) h5,
.mpc-theme-$($theme.Slug) h6 {
    color: var(--mpc-color-main);
    font-family: var(--vscode-font-family);
}

.mpc-theme-$($theme.Slug) a {
    color: var(--mpc-color-accent);
}

.mpc-theme-$($theme.Slug) blockquote {
    border-left-color: var(--mpc-color-accent);
    background-color: rgba(0,0,0,0.05);
}

/* Specific overrides for Hand/Pop fonts to ensure they apply */
.mpc-theme-$($theme.Slug) body,
.mpc-theme-$($theme.Slug) p,
.mpc-theme-$($theme.Slug) li,
.mpc-theme-$($theme.Slug) table {
    font-family: var(--vscode-font-family);
}
"
    Set-Content -Path $file -Value $content -Encoding UTF8
    Write-Host "Created $file"
}
