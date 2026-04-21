package utils

import "github.com/charmbracelet/lipgloss"

// Palette extraite du logo Leyo
const (
    ColorCyan    = "#00BFFF"
    ColorBlue    = "#6A35FF"
    ColorViolet  = "#7B2FFF"
    ColorMagenta = "#FF00FF"
    ColorSuccess = "#2ECC71"
    ColorError   = "#FF4B5C"
    ColorWarning = "#F1C40F"
    ColorMuted   = "#555555"
)

// Styles réutilisables
var (
    StylePromptUser = lipgloss.NewStyle().
                Foreground(lipgloss.Color(ColorCyan)).
                Bold(true)

    StylePromptPath = lipgloss.NewStyle().
                Foreground(lipgloss.Color(ColorViolet))

    StylePromptArrow = lipgloss.NewStyle().
                Foreground(lipgloss.Color(ColorMagenta)).
                Bold(true)

    StyleSuccess = lipgloss.NewStyle().
                Foreground(lipgloss.Color(ColorSuccess))

    StyleError = lipgloss.NewStyle().
                Foreground(lipgloss.Color(ColorError))

    StyleMuted = lipgloss.NewStyle().
                Foreground(lipgloss.Color(ColorMuted))

    StyleBorder = lipgloss.NewStyle().
                Border(lipgloss.RoundedBorder()).
                BorderForeground(lipgloss.Color(ColorViolet))
)