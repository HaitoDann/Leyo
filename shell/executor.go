package shell

import (
	"os/exec"
	"strings"
	"syscall"
)

func Run(input string) {
	result, errMsg := RunWithOutput(input)
	if errMsg != "" {
		println("❌ " + errMsg)
	}
	if result != "" {
		println(result)
	}
}

func RunWithOutput(input string) (string, string) {
	input = ResolveAlias(input)
	command := Parse(input)

	// Essaie d'abord directement (commandes PATH, npm, python, etc.)
	cmd := exec.Command("cmd", "/C", command)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	output, err := cmd.CombinedOutput()
	result := strings.TrimSpace(string(output))

	// Si erreur mais qu'il y a quand même un output → c'est l'output de l'erreur
	if err != nil && result == "" {
		return "", err.Error()
	}
	return result, ""
}