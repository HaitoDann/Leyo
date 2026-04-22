package shell

import "strings"

// Liste de toutes les commandes connues de Leyo
var knownCommands = []string{
	// Unix
	"ls", "rm", "cp", "mv", "cat", "clear", "pwd", "mkdir", "touch", "cd",
	// Windows
	"dir", "del", "copy", "move", "type", "cls", "echo", "find", "help",
	// Git
	"git", "git add", "git commit", "git push", "git pull", "git status",
	"git clone", "git checkout", "git branch", "git log", "git diff",
	// Go
	"go build", "go run", "go mod", "go test", "go get",
	// Leyo
	"history", "exit",
}

// Calcule la distance de Levenshtein entre deux strings
func levenshtein(a, b string) int {
	la, lb := len(a), len(b)
	dp := make([][]int, la+1)
	for i := range dp {
		dp[i] = make([]int, lb+1)
	}
	for i := 0; i <= la; i++ { dp[i][0] = i }
	for j := 0; j <= lb; j++ { dp[0][j] = j }

	for i := 1; i <= la; i++ {
		for j := 1; j <= lb; j++ {
			cost := 1
			if a[i-1] == b[j-1] {
				cost = 0
			}
			dp[i][j] = min3(
				dp[i-1][j]+1,
				dp[i][j-1]+1,
				dp[i-1][j-1]+cost,
			)
		}
	}
	return dp[la][lb]
}

func min3(a, b, c int) int {
	if a < b {
		if a < c { return a }
		return c
	}
	if b < c { return b }
	return c
}

// Trouve la commande la plus proche
func FindClosest(input string, history []string) (string, bool) {
	input = strings.ToLower(strings.TrimSpace(input))
	firstWord := strings.Fields(input)[0]

	// Fusionne commandes connues + historique
	candidates := append(knownCommands, history...)

	bestMatch := ""
	bestDist := 99

	for _, cmd := range candidates {
		cmd = strings.ToLower(strings.Fields(cmd)[0])
		dist := levenshtein(firstWord, cmd)
		if dist < bestDist {
			bestDist = dist
			bestMatch = cmd
		}
	}

	// Seuil : on ne suggère que si la distance est raisonnable
	if bestDist <= 2 && bestMatch != firstWord {
		return bestMatch, true
	}
	return "", false
}