# QuickLink — Go URL Shortener

A small URL shortener built with the Go standard library and a V6-style organic frontend.

## Project structure

```text
quicklink-v6-simple/
├── main.go
├── handlers/
│   └── url.go
├── storage/
│   └── memory.go
├── static/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── go.mod
└── README.md
```

## Run

```bash
go run .
```

Open `http://localhost:8080`.

To use another port:

**CMD**
```cmd
set PORT=5000
go run .
```

**PowerShell**
```powershell
$env:PORT="5000"
go run .
```

## API

### Create short URL

`POST /api/shorten`

```json
{
  "longUrl": "https://example.com/long/path",
  "alias": "my-link"
}
```

### Redirect

Open `GET /my-link` and the server returns a 302 redirect to the saved destination.

## Note

Links are stored in memory, so restarting the Go server clears them.
