package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"quicklink/handlers"
	"quicklink/storage"
)

func main() {
	store := storage.NewMemoryStore()
	urlHandler := handlers.NewURLHandler(store)

	mux := http.NewServeMux()
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	mux.HandleFunc("/api/shorten", urlHandler.Shorten)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.ServeFile(w, r, "static/index.html")
			return
		}

		urlHandler.Redirect(w, r)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	address := ":" + port
	fmt.Println("QuickLink running at http://localhost:" + port)

	if err := http.ListenAndServe(address, mux); err != nil {
		log.Fatal(err)
	}
}
