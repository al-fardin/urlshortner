package storage

import "sync"

type MemoryStore struct {
	mu    sync.RWMutex
	links map[string]string
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		links: make(map[string]string),
	}
}

func (s *MemoryStore) Save(code, longURL string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.links[code]; exists {
		return false
	}

	s.links[code] = longURL
	return true
}

func (s *MemoryStore) Get(code string) (string, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	longURL, exists := s.links[code]
	return longURL, exists
}
