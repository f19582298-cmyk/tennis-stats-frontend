import { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ---------- IOC (3-буквенный код) -> ISO2 -> флаг-эмодзи ----------
const IOC_TO_ISO2 = {
  ESP: 'ES', ITA: 'IT', USA: 'US', GBR: 'GB', FRA: 'FR', GER: 'DE', SRB: 'RS', SUI: 'CH',
  RUS: 'RU', AUS: 'AU', CAN: 'CA', JPN: 'JP', CHN: 'CN', ARG: 'AR', BRA: 'BR', POL: 'PL',
  CZE: 'CZ', AUT: 'AT', BEL: 'BE', NED: 'NL', POR: 'PT', GRE: 'GR', CRO: 'HR', UKR: 'UA',
  BLR: 'BY', KAZ: 'KZ', IND: 'IN', KOR: 'KR', NOR: 'NO', SWE: 'SE', FIN: 'FI', DEN: 'DK',
  HUN: 'HU', ROU: 'RO', BUL: 'BG', SVK: 'SK', SLO: 'SI', LTU: 'LT', LAT: 'LV', EST: 'EE',
  GEO: 'GE', ARM: 'AM', AZE: 'AZ', ISR: 'IL', TUR: 'TR', EGY: 'EG', RSA: 'ZA', MAR: 'MA',
  TUN: 'TN', CHI: 'CL', COL: 'CO', PER: 'PE', ECU: 'EC', URU: 'UY', PAR: 'PY', VEN: 'VE',
  MEX: 'MX', DOM: 'DO', PUR: 'PR', BAH: 'BS', JAM: 'JM', TPE: 'TW', HKG: 'HK', THA: 'TH',
  INA: 'ID', MAS: 'MY', PHI: 'PH', VIE: 'VN', SGP: 'SG', NZL: 'NZ', IRL: 'IE', ISL: 'IS',
  LUX: 'LU', MON: 'MC', AND: 'AD', SMR: 'SM', MLT: 'MT', CYP: 'CY', ALB: 'AL', MKD: 'MK',
  BIH: 'BA', MNE: 'ME', UAE: 'AE', QAT: 'QA', KSA: 'SA',
};

function countryFlag(acr) {
  if (!acr) return null;
  const iso2 = IOC_TO_ISO2[acr.toUpperCase()];
  if (!iso2) return null;
  const codePoints = [...iso2.toUpperCase()].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...codePoints);
}

function CountryLabel({ acr }) {
  const flag = countryFlag(acr);
  return (
    <span className="cl-country">
      {flag && <span className="cl-flag">{flag}</span>}
      {acr || '—'}
    </span>
  );
}

function WLBadge({ outcome }) {
  return <span className={`cl-wl-badge ${outcome === 'W' ? 'win' : 'loss'}`}>{outcome === 'W' ? 'В' : 'П'}</span>;
}

function RankBadge({ rank }) {
  return <span className={`cl-rank-badge ${rank ? '' : 'empty'}`}>{rank ? `#${rank}` : '—'}</span>;
}

function StatRow({ label, value }) {
  return (
    <div className="cl-stat-row">
      <span className="cl-stat-label">{label}</span>
      <span className="cl-stat-value">{value ?? '—'}</span>
    </div>
  );
}

function surfaceLabel(court) {
  if (!court) return null;
  const c = court.toLowerCase();
  if (c.includes('clay')) return 'Грунт';
  if (c.includes('grass')) return 'Трава';
  return 'Хардкорт';
}

function PlayerCompareCard({ block }) {
  const p = block.profile;
  return (
    <div className="cl-compare-card">
      <div className="cl-compare-header">
        <div>
          <div className="cl-compare-name">
            {countryFlag(p.country) && <span className="cl-flag">{countryFlag(p.country)}</span>}
            {p.name}
          </div>
          <div className="cl-compare-country">{p.country || '—'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="cl-rank-points-box">
            <div className="box rank">{p.rank ?? '—'}</div>
            <div className="box points">{p.points ?? '—'}</div>
          </div>
          <div className="cl-rank-points-label"><span>ВТА/АТП</span><span>ОЧКИ</span></div>
        </div>
      </div>

      <div className="cl-bio-row">
        <div className="cl-bio-item"><div className="label">ВОЗРАСТ</div><b>{p.age ?? '—'}</b></div>
        <div className="cl-bio-item"><div className="label">РОСТ</div><b>{p.heightCm ?? '—'}</b></div>
        <div className="cl-bio-item"><div className="label">РАБОЧАЯ РУКА</div><b>{p.hand ?? '—'}</b></div>
        <div className="cl-bio-item"><div className="label">ПРОФИ С</div><b>{p.turnedPro ?? '—'}</b></div>
      </div>

      <div className="cl-form-row">
        <span className="cl-form-label">Последние 5 матчей</span>
        <div className="cl-form-badges">
          {block.last5.map((o, i) => <WLBadge key={i} outcome={o} />)}
        </div>
      </div>

      <div>
        <StatRow label="Средн. тотал (по посл. матчам)" value={block.form.avgTotalGames} />
        <StatRow label="Среднее геймов в 1-м сете" value={block.form.avgSet1Games} />
        <StatRow label="Выигран 1-й сет" value={block.form.set1WinPct != null ? `${block.form.set1WinPct}%` : null} />
        <StatRow label="Лучше 3 (2-0)" value={block.form.bestOf3_2_0_Pct != null ? `${block.form.bestOf3_2_0_Pct}%` : null} />
        <StatRow label="Лучше 3 (2-1)" value={block.form.bestOf3_2_1_Pct != null ? `${block.form.bestOf3_2_1_Pct}%` : null} />
      </div>
      <div className="cl-disclaimer">
        Показатели рассчитаны по последним {block.form.sampleSize} сыгранным матчам, не являются официальной статистикой сезона.
      </div>
    </div>
  );
}

function UpcomingList({ tour, playerId, cacheRef }) {
  const [fixtures, setFixtures] = useState(cacheRef.current[playerId] || null);
  const [loading, setLoading] = useState(!cacheRef.current[playerId]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cacheRef.current[playerId]) return;
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const data = await apiGet(`/api/players/${tour}/${playerId}/fixtures?limit=10`);
        if (!cancelled) { cacheRef.current[playerId] = data; setFixtures(data); }
      } catch (e) { if (!cancelled) setError(e.message); } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [tour, playerId, cacheRef]);

  if (loading) return <p className="cl-muted">Загружаем расписание…</p>;
  if (error) return <p className="cl-error-text">Ошибка: {error}</p>;
  if (!fixtures || fixtures.length === 0) return <p className="cl-muted">Нет запланированных матчей.</p>;

  return (
    <>
      {fixtures.map((f) => (
        <div key={f.id} className="cl-match-row">
          <div>
            <div className="cl-match-opponent">
              vs {f.opponent?.name || '—'} {f.opponent?.country ? <CountryLabel acr={f.opponent.country} /> : null}
            </div>
            <div className="cl-match-meta">
              {f.tournament?.name || 'Турнир не указан'} {surfaceLabel(f.tournament?.court) ? `· ${surfaceLabel(f.tournament.court)}` : ''} {f.round ? `· ${f.round}` : ''}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function H2HScreen({ tour, player1, player2, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('recent');
  const upcomingCacheRef = { current: {} }; // простой per-render кэш на время жизни компонента

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const res = await apiGet(`/api/h2h/summary?tour=${tour}&player1=${player1.id}&player2=${player2.id}`);
        if (!cancelled) setData(res);
      } catch (e) { if (!cancelled) setError(e.message); } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [tour, player1, player2]);

  return (
    <div className="cl-app">
      <button onClick={onBack} className="cl-back-btn">← Назад</button>

      {loading && <p className="cl-muted">Загружаем сравнение…</p>}
      {error && <p className="cl-error-text">Ошибка: {error}</p>}
      {!loading && data && !data.available && <p className="cl-muted">{data.message}</p>}

      {!loading && data?.available && (
        <>
          <div className="cl-h2h-summary">ПРЕДЫДУЩИЕ ВСТРЕЧИ</div>
          <div className="cl-h2h-score-row">
            <div className="cl-h2h-score-col">
              <div className="cl-h2h-score-num win">{data.wins?.player1 ?? '—'}</div>
              <div className="cl-h2h-score-label">ПОБЕДЫ</div>
            </div>
            <div className="cl-h2h-score-col">
              <div className="cl-h2h-score-num">{(data.wins?.player1 ?? 0) + (data.wins?.player2 ?? 0)}</div>
              <div className="cl-h2h-score-label">СЫГРАНО</div>
            </div>
            <div className="cl-h2h-score-col">
              <div className="cl-h2h-score-num">{data.wins?.player2 ?? '—'}</div>
              <div className="cl-h2h-score-label">ПОБЕДЫ</div>
            </div>
          </div>

          <PlayerCompareCard block={data.player1} />
          <PlayerCompareCard block={data.player2} />

          <div className="cl-tabs">
            <button className={`cl-tab ${tab === 'recent' ? 'active' : ''}`} onClick={() => setTab('recent')}>Последние матчи</button>
            <button className={`cl-tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>Следующие матчи</button>
          </div>

          {tab === 'recent' && [data.player1, data.player2].map((block, idx) => (
            <div key={idx}>
              <div className="cl-section-title">{block.profile.name}</div>
              {block.recentMatches.map((m) => (
                <div key={m.id} className="cl-match-row">
                  <WLBadge outcome={m.outcome} />
                  <div>
                    <div className="cl-match-opponent">
                      {m.opponent?.name || '—'} {m.opponent?.country ? <CountryLabel acr={m.opponent.country} /> : null}
                    </div>
                    <div className="cl-match-meta">
                      {m.tournament?.name || '—'} {surfaceLabel(m.tournament?.court) ? `· ${surfaceLabel(m.tournament.court)}` : ''} {m.round ? `· ${m.round}` : ''}
                    </div>
                  </div>
                  <div className="cl-match-score">{m.score || '—'}</div>
                </div>
              ))}
            </div>
          ))}

          {tab === 'upcoming' && [data.player1, data.player2].map((block, idx) => (
            <div key={idx}>
              <div className="cl-section-title">{block.profile.name}</div>
              <UpcomingList tour={tour} playerId={block.profile.id} cacheRef={upcomingCacheRef} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function SearchScreen({ tour, setTour, onOpenProfile, compareSelection, onToggleCompare, onStartCompare }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSearch = useCallback(async (q, t) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true); setError(null);
    try { setResults(await apiGet(`/api/players/search?q=${encodeURIComponent(q)}&tour=${t}`)); }
    catch (e) { setError(e.message); setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runSearch(query, tour), 350);
    return () => clearTimeout(timer);
  }, [query, tour, runSearch]);

  return (
    <div className="cl-app">
      <h1 className="cl-title">CourtLine — поиск игрока</h1>

      <div className="cl-search-row">
        <input className="cl-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Например: Sinner" />
        <select className="cl-select" value={tour} onChange={(e) => setTour(e.target.value)}>
          <option value="atp">ATP</option>
          <option value="wta">WTA</option>
        </select>
      </div>

      {compareSelection.length > 0 && (
        <div className="cl-compare-bar">
          <span>Для сравнения выбрано: {compareSelection.map((p) => p.name).join(', ')}</span>
          {compareSelection.length === 2 && (
            <button className="cl-compare-btn" onClick={onStartCompare}>Сравнить</button>
          )}
        </div>
      )}

      {loading && <p className="cl-muted">Ищем…</p>}
      {error && <p className="cl-error-text">Ошибка: {error}</p>}
      {!loading && !error && query.trim() && results.length === 0 && <p className="cl-muted">Ничего не найдено.</p>}

      <ul className={`cl-player-list ${results.length ? 'has-items' : ''}`}>
        {results.map((p) => {
          const isSelected = compareSelection.some((sp) => sp.id === p.id);
          return (
            <li key={p.id} className="cl-player-row">
              <input type="checkbox" checked={isSelected} onChange={() => onToggleCompare(p)} title="Добавить к сравнению" />
              <RankBadge rank={p.rank} />
              <span className="cl-player-name" onClick={() => onOpenProfile(p)}>{p.name}</span>
              <CountryLabel acr={p.country} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProfileScreen({ tour, player, onBack }) {
  const [profile, setProfile] = useState(player);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const [profileData, matchesData] = await Promise.all([
          apiGet(`/api/players/${tour}/${player.id}`),
          apiGet(`/api/players/${tour}/${player.id}/matches?limit=10`),
        ]);
        if (!cancelled) {
          setProfile({ ...player, ...profileData, name: profileData?.name || player.name, rank: profileData?.rank ?? player.rank, country: profileData?.country || player.country });
          setMatches(matchesData);
        }
      } catch (e) { if (!cancelled) setError(e.message); } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [tour, player]);

  return (
    <div className="cl-app">
      <button onClick={onBack} className="cl-back-btn">← Назад к поиску</button>
      <div className="cl-profile-header">
        <RankBadge rank={profile.rank} />
        <h1 className="cl-profile-name">{profile.name}</h1>
        <CountryLabel acr={profile.country} />
      </div>
      {profile.dynamic && <p className="cl-muted" style={{ fontStyle: 'italic' }}>{profile.message}</p>}
      {loading && <p className="cl-muted">Загружаем матчи…</p>}
      {error && <p className="cl-error-text">Ошибка: {error}</p>}
      {!loading && !error && (
        <div>
          {matches.map((m) => (
            <div key={m.id} className="cl-match-row">
              <WLBadge outcome={m.outcome} />
              <div>
                <div className="cl-match-opponent">vs {m.opponent?.name || '—'}</div>
                <div className="cl-match-meta">{m.tournament?.name || '—'} · {m.score || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const [tour, setTour] = useState('atp');
  const [view, setView] = useState('search');
  const [activePlayer, setActivePlayer] = useState(null);
  const [comparePlayers, setComparePlayers] = useState([]);
  const [compareSelection, setCompareSelection] = useState([]);

  const toggleCompare = (player) => {
    setCompareSelection((prev) => {
      const exists = prev.some((p) => p.id === player.id);
      if (exists) return prev.filter((p) => p.id !== player.id);
      if (prev.length >= 2) return [prev[1], player];
      return [...prev, player];
    });
  };

  if (view === 'profile' && activePlayer) {
    return <ProfileScreen tour={tour} player={activePlayer} onBack={() => setView('search')} />;
  }
  if (view === 'compare' && comparePlayers.length === 2) {
    return <H2HScreen tour={tour} player1={comparePlayers[0]} player2={comparePlayers[1]} onBack={() => setView('search')} />;
  }

  return (
    <SearchScreen
      tour={tour}
      setTour={setTour}
      onOpenProfile={(p) => { setActivePlayer(p); setView('profile'); }}
      compareSelection={compareSelection}
      onToggleCompare={toggleCompare}
      onStartCompare={() => { setComparePlayers(compareSelection); setView('compare'); }}
    />
  );
}

export default App;
