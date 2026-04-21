package ui

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/HaitoDann/Leyo/utils"
	"github.com/charmbracelet/lipgloss"
)

type FileEntry struct {
	Name  string
	IsDir bool
	Ext   string
}

// Icône + couleur selon le type de fichier
func fileIcon(entry FileEntry) string {
	if entry.IsDir {
		return utils.StylePromptUser.Render("▶ ")
	}
	switch entry.Ext {
	case ".go":
		return lipgloss.NewStyle().Foreground(lipgloss.Color("#00ADD8")).Render("◆ ")
	case ".exe":
		return lipgloss.NewStyle().Foreground(lipgloss.Color("#2ECC71")).Render("⚙ ")
	case ".md":
		return lipgloss.NewStyle().Foreground(lipgloss.Color("#F1C40F")).Render("■ ")
	case ".txt":
		return lipgloss.NewStyle().Foreground(lipgloss.Color("#AAAAAA")).Render("≡ ")
	case ".yml", ".yaml":
		return lipgloss.NewStyle().Foreground(lipgloss.Color("#FF4B5C")).Render("◈ ")
	case ".json":
		return lipgloss.NewStyle().Foreground(lipgloss.Color("#FF9800")).Render("◈ ")
	default:
		return utils.StyleMuted.Render("· ")
	}
}

// Lit le dossier courant
func LoadDirectory() []FileEntry {
	entries, err := os.ReadDir(".")
	if err != nil {
		return []FileEntry{}
	}

	var files []FileEntry
	// D'abord les dossiers
	for _, e := range entries {
		if e.IsDir() {
			files = append(files, FileEntry{
				Name:  e.Name(),
				IsDir: true,
			})
		}
	}
	// Puis les fichiers
	for _, e := range entries {
		if !e.IsDir() {
			files = append(files, FileEntry{
				Name:  e.Name(),
				IsDir: false,
				Ext:   filepath.Ext(e.Name()),
			})
		}
	}
	return files
}

// Rendu de la sidebar
func RenderSidebar(files []FileEntry, width int) string {
	style := lipgloss.NewStyle().
		Width(width).
		BorderRight(true).
		BorderStyle(lipgloss.NormalBorder()).
		BorderForeground(lipgloss.Color(utils.ColorViolet)).
		PaddingLeft(1)

	title := utils.StylePromptArrow.Render("📂 Fichiers") + "\n"
	separator := utils.StyleMuted.Render(strings.Repeat("─", width-2)) + "\n"

	var sb strings.Builder
	sb.WriteString(title)
	sb.WriteString(separator)

	maxItems := 20
	for i, f := range files {
		if i >= maxItems {
			sb.WriteString(utils.StyleMuted.Render("  ..."))
			break
		}
		icon := fileIcon(f)
		name := f.Name
		// Tronque si trop long
		if len(name) > width-5 {
			name = name[:width-8] + "..."
		}
		if f.IsDir {
			sb.WriteString(icon + utils.StylePromptPath.Render(name) + "\n")
		} else {
			sb.WriteString(icon + name + "\n")
		}
	}

	return style.Render(sb.String())
}