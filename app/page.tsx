'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, type IcwaAgent } from '@/lib/supabase'

const REGIONS = [
  'Alaska Region',
  'Eastern Region',
  'Eastern Oklahoma Region',
  'Great Plains Region',
  'Midwest Region',
  'Navajo Region',
  'Northwest Region',
  'Pacific Region',
  'Rocky Mountain Region',
  'Southern Plains Region',
  'Southwest Region',
  'Western Region',
]

export default function Home() {
  const [agents, setAgents] = useState<IcwaAgent[]>([])
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [state, setState] = useState('')
  const [states, setStates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    supabase
      .from('icwa_agents')
      .select('state_full')
      .order('state_full')
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map((r) => r.state_full).filter(Boolean))] as string[]
          setStates(unique.sort())
        }
      })
  }, [])

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('icwa_agents')
      .select('*', { count: 'exact' })
      .order('name')

    if (search.trim()) query = query.ilike('name', `%${search.trim()}%`)
    if (region) query = query.eq('primary_region', region)
    if (state) query = query.eq('state_full', state)

    const { data, count, error } = await query.limit(200)
    if (!error && data) {
      setAgents(data)
      setTotal(count ?? 0)
    }
    setLoading(false)
  }, [search, region, state])

  useEffect(() => {
    const timer = setTimeout(fetchAgents, 300)
    return () => clearTimeout(timer)
  }, [fetchAgents])

  const clearFilters = () => {
    setSearch('')
    setRegion('')
    setState('')
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '6px' }}>
          ICWA Designated Tribal Agent Directory
        </h1>
        <p style={{ color: '#555', fontSize: '0.95rem', marginBottom: '4px' }}>
          Find the designated ICWA agent for any federally recognized tribe. Data sourced from the{' '}
          <a href="https://www.bia.gov/bia/ois/dhs/icwa" target="_blank" rel="noopener noreferrer" style={{ color: '#006064' }}>
            Bureau of Indian Affairs
          </a>
          , updated quarterly.
        </p>
        <p style={{ color: '#888', fontSize: '0.82rem' }}>
          Need an ICWA expert witness?{' '}
          <a href="https://icwaexpert.com" target="_blank" rel="noopener noreferrer" style={{ color: '#006064', fontWeight: 600 }}>
            Visit ICWAExpert.com
          </a>
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by tribe name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1 1 260px',
            padding: '10px 14px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '0.95rem',
            outline: 'none',
          }}
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          style={{
            flex: '0 1 220px',
            padding: '10px 14px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '0.95rem',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          <option value="">All BIA Regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          style={{
            flex: '0 1 180px',
            padding: '10px 14px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '0.95rem',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          <option value="">All States</option>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {(search || region || state) && (
          <button
            onClick={clearFilters}
            style={{
              padding: '10px 16px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              background: '#f5f5f5',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#555',
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div style={{ fontSize: '0.85rem', color: '#777', marginBottom: '14px' }}>
        {loading ? 'Loading...' : `Showing ${agents.length} of ${total} tribes`}
        {total > 200 && !loading && (
          <span style={{ color: '#c0392b', marginLeft: '8px' }}>— refine your search to see more</span>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#aaa' }}>Loading directory...</div>
      ) : agents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#aaa' }}>No tribes found matching your search.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}

      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee', fontSize: '0.8rem', color: '#aaa', textAlign: 'center' }}>
        Data is in the public domain (U.S. Government open data). Updated quarterly from BIA.
        Not legal advice. For expert witness services visit{' '}
        <a href="https://icwaexpert.com" target="_blank" rel="noopener noreferrer" style={{ color: '#006064' }}>
          icwaexpert.com
        </a>
      </div>
    </div>
  )
}

function AgentCard({ agent }: { agent: IcwaAgent }) {
  const address = [
    agent.icwa_street_1,
    agent.icwa_street_2,
    agent.icwa_city && agent.icwa_state
      ? `${agent.icwa_city}, ${agent.icwa_state} ${agent.icwa_zip_code ?? ''}`.trim()
      : agent.icwa_city || agent.icwa_state,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '16px 20px',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a3a2a', margin: 0 }}>{agent.name}</h2>
        <span
          style={{
            fontSize: '0.75rem',
            background: '#e8f5e9',
            color: '#2e7d32',
            padding: '3px 10px',
            borderRadius: '12px',
            whiteSpace: 'nowrap',
            alignSelf: 'flex-start',
          }}
        >
          {agent.primary_region}
        </span>
      </div>

      {agent.icwa_designated_agent && (
        <p style={{ margin: '0 0 6px', fontSize: '0.9rem', color: '#333' }}>
          <strong>{agent.icwa_designated_agent}</strong>
          {agent.icwa_contact_title && (
            <span style={{ color: '#777', fontWeight: 400 }}> — {agent.icwa_contact_title}</span>
          )}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: '#555', marginTop: '6px' }}>
        {agent.icwa_phone_1 && (
          <a href={`tel:${agent.icwa_phone_1.replace(/\D/g, '')}`} style={{ color: '#006064', textDecoration: 'none' }}>
            📞 {agent.icwa_phone_1}
          </a>
        )}
        {agent.icwa_email_1 && (
          <a
            href={`mailto:${agent.icwa_email_1}`}
            onClick={(e) => { e.preventDefault(); window.top!.location.href = `mailto:${agent.icwa_email_1}` }}
            style={{ color: '#006064', textDecoration: 'none', cursor: 'pointer' }}
          >
            ✉ {agent.icwa_email_1}
          </a>
        )}
        {address && <span>📍 {address}</span>}
      </div>
    </div>
  )
}
