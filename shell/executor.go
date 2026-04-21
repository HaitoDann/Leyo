package shell

import (
	"fmt"
	"os/exec"
)

func Run(input string) {
	command := Parse(input)

	cmd := exec.Command("cmd", "/C", command)
	output, err := cmd.CombinedOutput()

	if err != nil {
		fmt.Printf("\033[31m✗ Erreur : %s\033[0m\n", err.Error())
	}
	if len(output) > 0 {
		fmt.Print(string(output))
	}
}