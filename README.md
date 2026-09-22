# QuickLink — Simple Go URL Shortener

A small URL shortener made with Go's standard library and a plain HTML/CSS/JS frontend.

## Folder structure

```text
quicklink-v6-simple/
├── main.go              # Server + routes
├── handlers/
│   └── url.go           # Shorten API + redirect logic
├── storage/
│   └── memory.go        # In-memory map storage
├── static/
│   ├── index.html       # Frontend structure
│   ├── style.css        # V6-inspired UI
│   └── script.js        # Frontend API call + copy button
├── go.mod
└── README.md
```

## Run

```bash
go run .
```

Optional custom port:

```bash
PORT=5000 go run .
```

Open:

```text
http://localhost:8080
```

## API

### Create short URL

```http
POST /api/shorten
Content-Type: application/json
```

Example body:

```json
{
  "longUrl": "https://example.com/very/long/path",
  "alias": "my-link"
}
```

Example response:

```json
{
  "shortUrl": "http://localhost:8080/my-link",
  "code": "my-link"
}
```

### Redirect

```http
GET /my-link
```

The server finds `my-link` in memory and redirects to the original URL.

## Easy explanation

1. `script.js` sends JSON to `POST /api/shorten`.
2. `handlers/url.go` validates the URL and creates/uses a short code.
3. `storage/memory.go` stores `code -> original URL` in a Go map.
4. Visiting `/{code}` calls the redirect handler.
5. The handler reads the original URL and sends an HTTP redirect.

> Data is stored only in memory, so links reset when the server restarts. This keeps the project intentionally simple.
