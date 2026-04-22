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
	command := Parse(input)
	cmd := exec.Command("cmd", "/C", command)

	// ← Masque complètement la fenêtre cmd.exe
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow: true,
	}

	output, err := cmd.CombinedOutput()
	result := strings.TrimSpace(string(output))

	if err != nil && result == "" {
		return "", err.Error()
	}
	return result, ""
}