package ui

import (
    "fmt"
    "os"
    "path/filepath"
    "strings"
    "time"

    "github.com/HaitoDann/Leyo/shell"
    "github.com/HaitoDann/Leyo/utils"
    tea "github.com/charmbracelet/bubbletea"
    "github.com/charmbracelet/bubbles/textinput"
)

// Messages internes Bubbletea
type tickMsg time.Time
type doneAnimMsg struct{}

// Modèle principal
type Model struct {
    input        textinput.Model
    history      []string
    historyIndex int
    output       []string
    animStep     int
    animDone     bool
}

func tick() tea.Cmd {
    return tea.Tick(120*time.Millisecond, func(t time.Time) tea.Msg {
        return tickMsg(t)
    })
}

// Initialisation
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
    }
}

func (m Model) Init() tea.Cmd {
    return tea.Batch(textinput.Blink, tick())
}

// Mise à jour
func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    var cmd tea.Cmd

    switch msg := msg.(type) {

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

            // Historique
            if input == "history" {
                for i, cmd := range m.history {
                    m.output = append(m.output, utils.StyleMuted.Render(
                        fmt.Sprintf("  %d  %s", i+1, cmd),
                    ))
                }
                return m, nil
            }

            // Prompt affiché dans l'output
            m.output = append(m.output, renderPrompt()+" "+utils.StyleMuted.Render(input))

            // Exécution
            shell.SaveToHistory(input)
            m.history = shell.LoadHistory()
            m.historyIndex = len(m.history)

            result, err := shell.RunWithOutput(input)
            if err != "" {
                m.output = append(m.output, utils.StyleError.Render("❌ "+err))
            }
            if result != "" {
                m.output = append(m.output, result)
            }

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

// Rendu
func (m Model) View() string {
    if !m.animDone {
        return renderIntro(m.animStep)
    }

    var sb strings.Builder

    // Titre
    sb.WriteString(utils.StyleBorder.Render(
        utils.StylePromptUser.Render("⬡ LEYO SHELL"),
    ) + "\n\n")

    // Historique de sortie (dernières 20 lignes)
    start := 0
    if len(m.output) > 20 {
        start = len(m.output) - 20
    }
    for _, line := range m.output[start:] {
        sb.WriteString(line + "\n")
    }

    // Prompt actif
    sb.WriteString("\n" + renderPrompt() + " " + m.input.View())

    return sb.String()
}

// Prompt coloré
func renderPrompt() string {
    user := utils.StylePromptUser.Render("[HaitoDann]")
    path := utils.StylePromptPath.Render(getCurrentPath())
    arrow := utils.StylePromptArrow.Render(" >")
    return user + " " + path + arrow
}

// Chemin courant
func getCurrentPath() string {
    dir, err := os.Getwd()
    if err != nil {
        return "C:\\"
    }
    // Raccourcit le chemin si trop long
    parts := strings.Split(filepath.ToSlash(dir), "/")
    if len(parts) > 3 {
        parts = append([]string{"..."}, parts[len(parts)-2:]...)
    }
    return filepath.FromSlash(strings.Join(parts, "/"))
}

// Animation d'intro sobre
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