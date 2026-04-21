package main

import (
    "fmt"
    "os"

    "github.com/HaitoDann/Leyo/ui"
    tea "github.com/charmbracelet/bubbletea"
)

func main() {
    // Titre de la fenêtre Windows
    fmt.Print("\033]0;⬡ Leyo Shell\007")

    p := tea.NewProgram(
        ui.InitModel(),
        tea.WithAltScreen(),
    )

    if _, err := p.Run(); err != nil {
        fmt.Println("Erreur:", err)
        os.Exit(1)
    }
}