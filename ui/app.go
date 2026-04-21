package ui

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/HaitoDann/Leyo/shell"
	"github.com/HaitoDann/Leyo/utils"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type tickMsg time.Time

type Model struct {
	input        textinput.Model
	history      []string
	historyIndex int
	output       []string
	animStep     int
	animDone     bool
	files        []FileEntry
	termWidth    int
	termHeight   int
}

func tick() tea.Cmd {
	return tea.Tick(120*time.Millisecond, func(t time.Time) tea.Msg {
		return tickMsg(t)
	})
}

func InitModel() Model {
	ti := textinput.New()
	ti.Focus()
	ti.CharLimit = 256
	ti.Width = 60

	history := shell.LoadHistory()
	return Model{
		input:        ti,
		history:      history,
		historyIndex: len(history),
		animStep:     0,
		animDone:     false,
		files:        LoadDirectory(),
		termWidth:    120,
		termHeight:   30,
	}
}

func (m Model) Init() tea.Cmd {
	return tea.Batch(textinput.Blink, tick())
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd

	switch msg := msg.(type) {

	case tea.WindowSizeMsg:
		m.termWidth = msg.Width
		m.termHeight = msg.Height
		m.input.Width = msg.Width - 36

	case tickMsg:
		if !m.animDone {
			m.animStep++
			if m.animStep >= 6 {
				m.animDone = true
				return m, nil
			}
			return m, tick()
		}

	case tea.KeyMsg:
		if !m.animDone {
			m.animDone = true
			return m, nil
		}

		switch msg.Type {

		case tea.KeyCtrlC:
			return m, tea.Quit

		case tea.KeyEnter:
			input := strings.TrimSpace(m.input.Value())
			m.input.SetValue("")

			if input == "exit" {
				return m, tea.Quit
			}
			if input == "" {
				return m, nil
			}

			if input == "history" {
				for i, cmd := range m.history {
					m.output = append(m.output, utils.StyleMuted.Render(
						fmt.Sprintf("  %d  %s", i+1, cmd),
					))
				}
				return m, nil
			}

			// Prompt dans l'output
			m.output = append(m.output, renderPrompt()+" "+utils.StyleMuted.Render(input))

			// Gestion du cd pour rafraîchir la sidebar
			trimmed := strings.TrimSpace(input)
			if strings.HasPrefix(trimmed, "cd ") {
				dir := strings.TrimPrefix(trimmed, "cd ")
				os.Chdir(dir)
				m.files = LoadDirectory()
				m.output = append(m.output, utils.StyleSuccess.Render("✅ "+getCurrentPath()))
				return m, nil
			}

			shell.SaveToHistory(input)
			m.history = shell.LoadHistory()
			m.historyIndex = len(m.history)

			result, errMsg := shell.RunWithOutput(input)
			if errMsg != "" {
				m.output = append(m.output, utils.StyleError.Render("❌ "+errMsg))
			}
			if result != "" {
				m.output = append(m.output, result)
			}

			// Rafraîchit la sidebar après chaque commande
			m.files = LoadDirectory()

		case tea.KeyUp:
			if m.historyIndex > 0 {
				m.historyIndex--
				m.input.SetValue(m.history[m.historyIndex])
			}

		case tea.KeyDown:
			if m.historyIndex < len(m.history)-1 {
				m.historyIndex++
				m.input.SetValue(m.history[m.historyIndex])
			} else {
				m.historyIndex = len(m.history)
				m.input.SetValue("")
			}
		}
	}

	m.input, cmd = m.input.Update(msg)
	return m, cmd
}

func (m Model) View() string {
	if !m.animDone {
		return renderIntro(m.animStep)
	}

	sidebarWidth := 24
	mainWidth := m.termWidth - sidebarWidth - 2

	// Sidebar
	sidebar := RenderSidebar(m.files, sidebarWidth)

	// Zone principale
	var mainSb strings.Builder

	// Titre
	title := utils.StyleBorder.Render(utils.StylePromptUser.Render("⬡ LEYO SHELL"))
	mainSb.WriteString(title + "\n\n")

	// Output (dernières lignes)
	maxLines := m.termHeight - 8
	start := 0
	if len(m.output) > maxLines {
		start = len(m.output) - maxLines
	}
	for _, line := range m.output[start:] {
		mainSb.WriteString(line + "\n")
	}

	// Prompt actif
	mainSb.WriteString("\n" + renderPrompt() + " " + m.input.View())

	mainPane := lipgloss.NewStyle().
		Width(mainWidth).
		PaddingLeft(2).
		Render(mainSb.String())

	// Assemblage horizontal
	return lipgloss.JoinHorizontal(lipgloss.Top, sidebar, mainPane)
}

func renderPrompt() string {
	user := utils.StylePromptUser.Render("[HaitoDann]")
	path := utils.StylePromptPath.Render(getCurrentPath())
	arrow := utils.StylePromptArrow.Render(" >")
	return user + " " + path + arrow
}

func getCurrentPath() string {
	dir, err := os.Getwd()
	if err != nil {
		return `C:\`
	}
	parts := strings.Split(filepath.ToSlash(dir), "/")
	if len(parts) > 3 {
		parts = append([]string{"..."}, parts[len(parts)-2:]...)
	}
	return filepath.FromSlash(strings.Join(parts, "/"))
}

func renderIntro(step int) string {
	frames := []string{
		"",
		utils.StyleMuted.Render("L"),
		utils.StylePromptPath.Render("Le"),
		utils.StylePromptPath.Render("Ley"),
		utils.StylePromptUser.Render("Leyo"),
		utils.StylePromptArrow.Render("Leyo Shell ✦"),
	}
	if step >= len(frames) {
		step = len(frames) - 1
	}
	return "\n\n   " + frames[step] + "\n"
}