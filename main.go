package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/HaitoDann/Leyo/shell"
)

func main() {
	fmt.Println("╔══════════════════════════╗")
	fmt.Println("║     Leyo Shell v0.2      ║")
	fmt.Println("║  ↑↓ historique | exit    ║")
	fmt.Println("╚══════════════════════════╝")

	// Charge l'historique au démarrage
	history := shell.LoadHistory()
	historyIndex := len(history) // Pointeur sur la position actuelle

	scanner := bufio.NewScanner(os.Stdin)

	for {
		fmt.Print("\n[leyo] > ")

		if !scanner.Scan() {
			break
		}

		input := strings.TrimSpace(scanner.Text())

		if input == "exit" {
			fmt.Println("À bientôt 👋")
			break
		}

		if input == "" {
			continue
		}

		// Commande spéciale : afficher l'historique
		if input == "history" {
			for i, cmd := range history {
				fmt.Printf("  %d  %s\n", i+1, cmd)
			}
			continue
		}

		// Sauvegarde dans l'historique
		shell.SaveToHistory(input)
		history = shell.LoadHistory()
		historyIndex = len(history)

		// Exécute la commande
		shell.Run(input)
	}
}