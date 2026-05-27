const { app, BrowserWindow, dialog } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const express = require('express')

let mainWindow = null
let backendProcess = null
const isDev = !app.isPackaged

const FRONTEND_DIR = isDev
  ? path.join(__dirname, '..', 'frontend', 'dist')
  : path.join(__dirname, '..', 'frontend', 'dist')

function findBackendDir() {
  const candidates = [
    path.join(__dirname, '..', 'backend'),
    path.join(process.resourcesPath || '', 'backend'),
  ]
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'app', 'main.py'))) return dir
  }
  return null
}

async function startBackend() {
  const backendDir = findBackendDir()
  if (!backendDir) {
    console.error('Backend directory not found')
    return
  }

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
  backendProcess = spawn(pythonCmd, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
    cwd: backendDir,
    env: { ...process.env },
    stdio: 'pipe',
  })

  backendProcess.stderr.on('data', (data) => console.log(`[backend] ${data}`))
  backendProcess.on('error', (err) => console.error('Backend error:', err))

  // Wait for backend to be ready
  for (let i = 0; i < 30; i++) {
    try {
      await fetch('http://127.0.0.1:8000/api/health')
      console.log('Backend ready')
      return
    } catch {
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  console.error('Backend failed to start within 30s')
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Personal Learning Hub',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Use local express server to serve frontend + proxy API
  const server = express()
  server.use(express.static(FRONTEND_DIR))
  mainWindow.loadURL('http://127.0.0.1:0').catch(() => {})

  // Instead, load directly from dist
  if (fs.existsSync(path.join(FRONTEND_DIR, 'index.html'))) {
    mainWindow.loadFile(path.join(FRONTEND_DIR, 'index.html'))
  } else {
    mainWindow.loadURL('http://localhost:5173') // dev mode
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  await startBackend()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill()
    backendProcess = null
  }
})
