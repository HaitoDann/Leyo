package shell

import (
    "os/exec"
    "strings"
)

// Run affiche directement (conservé pour compatibilité)
func Run(input string) {
    result, errMsg := RunWithOutput(input)
    if errMsg != "" {
        println("❌ " + errMsg)
    }
    if result != "" {
        println(result)
    }
}

// RunWithOutput retourne l'output comme string
func RunWithOutput(input string) (string, string) {
    command := Parse(input)
    cmd := exec.Command("cmd", "/C", command)
    output, err := cmd.CombinedOutput()

    result := strings.TrimSpace(string(output))

    if err != nil && result == "" {
        return "", err.Error()
    }
    return result, ""
}