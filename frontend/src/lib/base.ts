const isElectron = typeof window !== 'undefined' && window.location.protocol === 'file:'

export const API_BASE = isElectron ? 'http://127.0.0.1:8000/api' : '/api'
