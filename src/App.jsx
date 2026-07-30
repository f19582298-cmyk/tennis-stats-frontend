import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

// ---------- Хелпер запросов к своему бэкенду ----------
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

function RankBadge({ rank }) {
  return (
    <span style={{
      display: 'inline-block', minWidth: 32, padding: '2px 8px',
      borderRadius: 999, background: rank ? '#1f6feb' : '#555',
      color: '#fff', fontSize: 12, fontWeight: 600, textAlign: 'center',
    }}>
      {rank ? `#${rank}` : '—'}
    </span>
  );
}

function PlayerRow({ player, onSelect }) {
  // Единый контракт от бэкенда: { id, name, rank, country }
  return (
    <li
      onClick={() => onSelect(player)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderBottom: '1px solid #2a2a2a',
        cursor: 'pointer',
      }}
    >
      <RankBadge rank={player.rank} />
      <span style={{ flex: 1, fontWeight: 500 }}>{player.name}</span>
      <span style={{ opacity: 0.7, fontSize: 13 }}>{player.country || '—'}</span>
    </li>
  );
}

function SearchScreen({ tour, setTour, onSelectPlayer }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSearch = useCallback(async (q, t) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet(`/api/players/search?q=${encodeURIComponent(q)}&tour=${t}`);
      setResults(data);
    } catch (e) {
      setError(e.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // debounce
  useEffect(() => {
    const timer = setTimeout(() => runSearch(query, tour), 350);
    return () => clearTimeout(timer);
  }, [query, tour, runSearch]);

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', color: '#eee', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>CourtLine — поиск игрока</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Например: Sinner"
          style={{
            flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #444',
            background: '#1a1a1a', color: '#eee', fontSize: 15,
          }}
        />
        <select
          value={tour}
          onChange={(e) => setTour(e.target.value)}
          style={{ padding: '10px 8px', borderRadius: 8, background: '#1a1a1a', color: '#eee', border: '1px solid #444' }}
        >
          <option value="atp">ATP</option>
          <option value="wta">WTA</option>
        </select>
      </div>

      {loading && <p style={{ opacity: 0.6 }}>Ищем…</p>}
      {error && <p style={{ color: '#ff6b6b' }}>Ошибка: {error}</p>}
      {!loading && !error && query.trim() && results.length === 0 && (
        <p style={{ opacity: 0.6 }}>Ничего не найдено.</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: results.length ? '1px solid #2a2a2a' : 'none' }}>
        {results.map((p) => (
          <PlayerRow key={p.id} player={p} onSelect={onSelectPlayer} />
        ))}
      </ul>
    </div>
  );
}

function ProfileScreen({ tour, player, onBack }) {
  // player уже содержит { id, name, rank, country } из списка поиска —
  // показываем это сразу, не дожидаясь сети, и дополняем расширенным профилем/матчами.
  const [profile, setProfile] = useState(player);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [profileData, matchesData] = await Promise.all([
          apiGet(`/api/players/${tour}/${player.id}`),
          apiGet(`/api/players/${tour}/${player.id}/matches?limit=10`),
        ]);
        if (!cancelled) {
          // Не даём серверному ответу "стереть" имя/ранг, если по какой-то причине
          // расширенный профиль вернул меньше данных, чем у нас уже было из поиска.
          setProfile({
            ...player,
            ...profileData,
            name: profileData?.name || player.name,
            rank: profileData?.rank ?? player.rank,
            country: profileData?.country || player.country,
          });
          setMatches(matchesData);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tour, player]);

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', color: '#eee', fontFamily: 'system-ui, sans-serif' }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: '#1f6feb', cursor: 'pointer', marginBottom: 16, fontSize: 14 }}
      >
        ← Назад к поиску
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <RankBadge rank={profile.rank} />
        <h1 style={{ fontSize: 22, margin: 0 }}>{profile.name}</h1>
        <span style={{ opacity: 0.7 }}>{profile.country || '—'}</span>
      </div>

      {profile.dynamic && (
        <p style={{ opacity: 0.7, fontStyle: 'italic', marginBottom: 16 }}>
          {profile.message || 'Игрок не найден в базе рейтингов — расширенные данные недоступны.'}
        </p>
      )}

      {loading && <p style={{ opacity: 0.6 }}>Загружаем матчи…</p>}
      {error && <p style={{ color: '#ff6b6b' }}>Ошибка: {error}</p>}

      {!loading && !error && (
        <>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Последние матчи</h2>
          {matches.length === 0 ? (
            <p style={{ opacity: 0.6 }}>Нет данных о матчах.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {matches.map((m) => (
                <li key={m.id} style={{ padding: '8px 0', borderBottom: '1px solid #2a2a2a' }}>
                  <div style={{ fontWeight: 500 }}>
                    vs {m.opponent?.name || '—'} {m.opponent?.rank ? `(#${m.opponent.rank})` : ''}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>
                    {m.tournament?.name || 'Турнир не указан'} {m.round ? `· ${m.round}` : ''} · {m.result || '—'}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function App() {
  const [tour, setTour] = useState('atp');
  const [selectedPlayer, setSelectedPlayer] = useState(null); // { id, name, rank, country }

  if (selectedPlayer) {
    return (
      <ProfileScreen
        tour={tour}
        player={selectedPlayer}
        onBack={() => setSelectedPlayer(null)}
      />
    );
  }

  return (
    <SearchScreen
      tour={tour}
      setTour={setTour}
      onSelectPlayer={setSelectedPlayer}
    />
  );
}

export default App;
