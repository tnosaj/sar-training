package config

import (
	"log"
	"os"
)

type Config struct {
	Port     string
	DBPath   string
	LogLevel string
	Secret   string
}

func Load() Config {
	p := os.Getenv("PORT")
	if p == "" {
		p = "8080"
	}
	db := os.Getenv("DB_PATH")
	if db == "" {
		db = "./dogtracker.db"
	}
	lglvl := os.Getenv("LOG_LEVEL")
	if lglvl == "" {
		lglvl = "warn"
	}
	secret := os.Getenv("AUTH_SECRET")
	if secret == "" {
		log.Fatal("AUTH_SECRET is required")
	}
	return Config{Port: p, DBPath: db, LogLevel: lglvl, Secret: secret}
}
