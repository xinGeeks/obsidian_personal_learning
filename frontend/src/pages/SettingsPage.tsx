import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Settings {
  vault_path: string
  deepseek_api_key: string
  deepseek_api_key_display: string
  deepseek_base_url: string
  deepseek_model: string
  max_content_length: number
  domain_weights: Record<string, number>
  default_domain_weight: number
  search_interval: number
}

import { API_BASE } from '../lib/base'

async function fetchSettings(): Promise<Settings> {
  const res = await fetch(`${API_BASE}/settings`)
  if (!res.ok) throw new Error(res.statusText)
  return res.json()
}

async function saveSettings(updates: Record<string, unknown>): Promise<Settings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || res.statusText)
  return res.json()
}

export function SettingsPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [domainStr, setDomainStr] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const s = await fetchSettings()
        setSettings(s)
        setDomainStr(
          Object.entries(s.domain_weights)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n')
        )
      } catch (e: unknown) { setError((e as Error).message) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setError('')
    setMsg('')

    // Parse domain weights from textarea
    const dw: Record<string, number> = {}
    for (const line of domainStr.split('\n')) {
      const [domain, weightStr] = line.split(':')
      if (domain?.trim() && weightStr?.trim()) {
        const w = parseFloat(weightStr.trim())
        if (!isNaN(w)) dw[domain.trim()] = w
      }
    }

    try {
      const result = await saveSettings({
        ...settings,
        domain_weights: dw,
      })
      setSettings(result)
      setDomainStr(
        Object.entries(result.domain_weights)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n')
      )
      setMsg('设置已保存')
      setTimeout(() => setMsg(''), 3000)
    } catch (e: unknown) {
      setError((e as Error).message)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-5 py-3 shrink-0 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-600">← 仪表盘</button>
        <h1 className="text-base font-semibold text-gray-900">设置</h1>
        <div className="flex-1" />
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
          {saving ? '保存中...' : '保存'}
        </button>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 overflow-y-auto space-y-6">
        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        {msg && <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{msg}</div>}

        {/* Vault */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Obsidian Vault</h2>
          <label className="block text-xs text-gray-500 mb-1">Vault 路径</label>
          <input type="text" value={settings.vault_path}
            onChange={e => setSettings({ ...settings, vault_path: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-purple-300 outline-none" />
          <p className="text-xs text-gray-400 mt-1">修改后需重启服务生效</p>
        </section>

        {/* Deepseek */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">AI 配置</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">API Key</label>
              <input type="password" value={settings.deepseek_api_key}
                onChange={e => setSettings({ ...settings, deepseek_api_key: e.target.value })}
                placeholder={settings.deepseek_api_key_display || "sk-..."}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-purple-300 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Base URL</label>
              <input type="text" value={settings.deepseek_base_url}
                onChange={e => setSettings({ ...settings, deepseek_base_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-purple-300 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">模型</label>
              <input type="text" value={settings.deepseek_model}
                onChange={e => setSettings({ ...settings, deepseek_model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-purple-300 outline-none" />
            </div>
          </div>
        </section>

        {/* Search */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">外部资料搜索</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">搜索间隔（秒）</label>
              <input type="number" min={0} max={30} value={settings.search_interval}
                onChange={e => setSettings({ ...settings, search_interval: parseFloat(e.target.value) || 0 })}
                className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-purple-300 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">域名权重（域名: 权重，每行一个）</label>
              <textarea value={domainStr} onChange={e => setDomainStr(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:border-purple-300 outline-none resize-none" />
              <p className="text-xs text-gray-400 mt-1">格式: domain.com: 0.5，权重 0-1，越大越优先</p>
            </div>
          </div>
        </section>

        {/* Other */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">其他</h2>
          <div>
            <label className="block text-xs text-gray-500 mb-1">最大内容长度（字符）</label>
            <input type="number" value={settings.max_content_length}
              onChange={e => setSettings({ ...settings, max_content_length: parseInt(e.target.value) || 0 })}
              className="w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-purple-300 outline-none" />
          </div>
        </section>
      </main>
    </div>
  )
}
