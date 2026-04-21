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
	fmt.Println("║  history | exit          ║")
	fmt.Println("╚══════════════════════════╝")

	history := shell.LoadHistory()
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

		if input == "history" {
			for i, cmd := range history {
				fmt.Printf("  %d  %s\n", i+1, cmd)
			}
			continue
		}

		shell.SaveToHistory(input)
		history = shell.LoadHistory()
		shell.Run(input)
	}
}