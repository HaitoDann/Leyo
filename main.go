package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/HaitoDann/leyo/shell"
)

func main() {
	scanner := bufio.NewScanner(os.Stdin)
	fmt.Println("Leyo Shell — tapez 'exit' pour quitter")

	for {
		fmt.Print("\n[leyo] > ")
		if !scanner.Scan() {
			break
		}
		input := strings.TrimSpace(scanner.Text())
		if input == "exit" {
			break
		}
		if input == "" {
			continue
		}
		shell.Run(input)
	}
}