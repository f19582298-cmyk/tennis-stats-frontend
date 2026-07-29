import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronRight, ArrowLeft, Swords, Trophy } from 'lucide-react';

// Адрес бэкенда из прошлого шага (server.js). Поменяй на свой при деплое.
const API_BASE = 'https://tennis-stats-backend.onrender.com';

// ---------- design tokens ----------
const C = {
  bg: '#F6F4EE',
  panel: '#FFFFFF',
  ink: '#1B211F',
  inkSoft: '#5B6360',
  line: '#DEDACB',
  hard: '#0F5C7C',
  hardBg: '#E4EFF3',
  clay: '#A85C2E',
  clayBg: '#F3E7DB',
  grass: '#3D6B37',
  grassBg: '#E5EDE1',
  win: '#2F6B45',
  winBg: '#E3EFE4',
  loss: '#9C3B34',
  lossBg: '#F5E4E2',
};

const surfaceColor = (s) => ({ hard: C.hard, clay: C.clay, grass: C.grass }[s] || C.inkSoft);
const surfaceBg = (s) => ({ hard: C.hardBg, clay: C.clayBg, grass: C.grassBg }[s] || C.line);
const surfaceLabel = (s) => ({ hard: 'Хард', clay: 'Грунт', grass: 'Трава' }[s] || s);

const fontDisplay = "'Oswald', sans-serif";
const fontBody = "'Inter', sans-serif";
const fontMono = "'IBM Plex Mono', monospace";

// ---------- API-клиент ----------
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Бэкенд вернул ${res.status} на ${path}`);
  return res.json();
}

function useApi(path, deps, { skip = false } = {}) {
  const [state, setState] = useState({ data: null, loading: !skip, error: null });

  useEffect(() => {
    if (skip || !path) return;
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    apiGet(path)
      .then((data) => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch((error) => { if (!cancelled) setState({ data: null, loading: false, error }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

// ---------- shared bits ----------
function Baseline() {
  return (
    <div style={{ height: 6, margin: '4px 0 16px' }}>
      <div style={{ height: 2, background: C.ink, opacity: 0.85 }} />
      <div style={{ height: 1, background: C.ink, opacity: 0.35, marginTop: 2 }} />
    </div>
  );
}

function SurfaceChip({ surface }) {
  return (
    <span style={{
      fontFamily: fontBody, fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: 0.4, padding: '3px 8px', borderRadius: 4,
      background: surfaceBg(surface), color: surfaceColor(surface),
    }}>
      {surfaceLabel(surface)}
    </span>
  );
}

function Avatar({ name, size = 44 }) {
  const initials = (name || '??').split(' ').map((w) => w[0]).join('').slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: C.hardBg, color: C.hard,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: fontDisplay, fontSize: size * 0.36, letterSpacing: 0.5, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function TopBar({ onBack, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      {onBack && (
        <button onClick={onBack} style={{
          border: `1px solid ${C.line}`, background: C.panel, borderRadius: 6,
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }} aria-label="Назад">
          <ArrowLeft size={16} color={C.ink} />
        </button>
      )}
      <span style={{ fontFamily: fontDisplay, fontSize: 20, letterSpacing: 0.5, color: C.ink, textTransform: 'uppercase' }}>
        {title}
      </span>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
      <p style={{ margin: 0, fontFamily: fontBody, fontSize: 11, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontFamily: fontMono, fontSize: 20, fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{value ?? '—'}</p>
    </div>
  );
}

function StatusBlock({ loading, error, loadingText = 'Загружаю данные...' }) {
  if (loading) return <p style={{ fontFamily: fontBody, fontSize: 13, color: C.inkSoft, padding: '16px 4px' }}>{loadingText}</p>;
  if (error) {
    return (
      <p style={{ fontFamily: fontBody, fontSize: 13, color: C.loss, padding: '16px 4px' }}>
        Не получилось загрузить данные с бэкенда ({error.message}). Проверь, что server.js запущен на {API_BASE}.
      </p>
    );
  }
  return null;
}

function MatchRow({ m, onOpenTournament }) {
  return (
    <button
      onClick={() => m.tournamentId && onOpenTournament(m.tournamentId, m.tournament)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
        padding: '12px 4px', borderBottom: `1px dashed ${C.line}`, background: 'none', border: 'none',
        borderBottomStyle: 'dashed', cursor: m.tournamentId ? 'pointer' : 'default', textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontFamily: fontBody, fontSize: 14, fontWeight: 600, color: C.ink }}>vs {m.opponent || '—'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: fontBody, fontSize: 12, color: C.inkSoft }}>{m.tournament || '—'} · {m.round || '—'}</span>
          <SurfaceChip surface={m.surface} />
        </div>
      </div>
      <span style={{
        fontFamily: fontMono, fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 4,
        background: m.result === 'W' ? C.winBg : m.result === 'L' ? C.lossBg : C.line,
        color: m.result === 'W' ? C.win : m.result === 'L' ? C.loss : C.inkSoft,
        fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
      }}>
        {m.result ? `${m.result} ` : ''}{m.score || '—'}
      </span>
    </button>
  );
}

// ---------- screens ----------
function SearchScreen({ onSelectPlayer }) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [tour, setTour] = useState('atp');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error } = useApi(
    debouncedQ ? `/api/players/search?q=${encodeURIComponent(debouncedQ)}&tour=${tour}` : null,
    [debouncedQ, tour],
    { skip: !debouncedQ }
  );

  return (
    <div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ fontFamily: fontDisplay, fontSize: 28, letterSpacing: 1, color: C.ink, textTransform: 'uppercase' }}>
          Court<span style={{ color: C.hard }}>Line</span>
        </span>
      </div>
      <Baseline />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
        <Search size={16} color={C.inkSoft} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Синнер, Алькарас..."
          style={{ border: 'none', outline: 'none', flex: 1, fontFamily: fontBody, fontSize: 14, background: 'transparent', color: C.ink }}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['atp', 'ATP'], ['wta', 'WTA']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTour(val)}
            style={{
              fontFamily: fontBody, fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6,
              border: `1px solid ${tour === val ? C.hard : C.line}`,
              background: tour === val ? C.hardBg : C.panel, color: tour === val ? C.hard : C.inkSoft, cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {!debouncedQ && (
        <p style={{ fontFamily: fontBody, fontSize: 13, color: C.inkSoft, padding: '4px' }}>
          Начни вводить имя игрока — поиск идёт напрямую в Tennis API.
        </p>
      )}

      {debouncedQ && (
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: '4px 12px' }}>
          <StatusBlock loading={loading} error={error} loadingText="Ищу игрока..." />
          {data && data.length === 0 && (
            <p style={{ fontFamily: fontBody, fontSize: 13, color: C.inkSoft, padding: '16px 0', textAlign: 'center' }}>Ничего не найдено</p>
          )}
          {data && data.map((p, i) => (
            <button
              key={p.id}
              onClick={() => onSelectPlayer(tour, p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 0',
                borderBottom: i < data.length - 1 ? `1px solid ${C.line}` : 'none',
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontFamily: fontMono, fontSize: 13, color: C.inkSoft, width: 24 }}>{p.rank ?? '—'}</span>
              <Avatar name={p.name} size={36} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontFamily: fontBody, fontSize: 14, fontWeight: 600, color: C.ink }}>{p.name}</p>
                <p style={{ margin: 0, fontFamily: fontBody, fontSize: 12, color: C.inkSoft }}>{p.country}</p>
              </div>
              <ChevronRight size={16} color={C.inkSoft} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PickOpponentScreen({ tour, baseId, baseName, onBack, onPicked }) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error } = useApi(
    debouncedQ ? `/api/players/search?q=${encodeURIComponent(debouncedQ)}&tour=${tour}` : null,
    [debouncedQ, tour],
    { skip: !debouncedQ }
  );

  return (
    <div>
      <TopBar onBack={onBack} title="Выбери соперника" />
      <p style={{ fontFamily: fontBody, fontSize: 13, color: C.inkSoft, marginBottom: 12 }}>
        Сравниваем с <b style={{ fontWeight: 600 }}>{baseName}</b>
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
        <Search size={16} color={C.inkSoft} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Имя соперника..."
          style={{ border: 'none', outline: 'none', flex: 1, fontFamily: fontBody, fontSize: 14, background: 'transparent', color: C.ink }}
        />
      </div>
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: '4px 12px' }}>
        <StatusBlock loading={loading} error={error} loadingText="Ищу..." />
        {data && data.filter((p) => p.id !== baseId).map((p, i, arr) => (
          <button
            key={p.id}
            onClick={() => onPicked(p.id, p.name)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 0',
              borderBottom: i < arr.length - 1 ? `1px solid ${C.line}` : 'none',
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <Avatar name={p.name} size={36} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontFamily: fontBody, fontSize: 14, fontWeight: 600, color: C.ink }}>{p.name}</p>
              <p style={{ margin: 0, fontFamily: fontBody, fontSize: 12, color: C.inkSoft }}>{p.country}</p>
            </div>
            <ChevronRight size={16} color={C.inkSoft} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileScreen({ tour, playerId, onBack, onOpenTournament, onOpenPickOpponent }) {
  const [tab, setTab] = useState('matches');
  const profile = useApi(`/api/players/${tour}/${playerId}`, [tour, playerId]);
  const matches = useApi(`/api/players/${tour}/${playerId}/matches?limit=10`, [tour, playerId]);

  // группируем те же матчи по турниру для вкладки "Турниры" — отдельного эндпоинта под список
  // турниров игрока провайдер не даёт, поэтому агрегируем из уже загруженных матчей
  const tournaments = useMemo(() => {
    if (!matches.data) return [];
    const byId = new Map();
    for (const m of matches.data) {
      if (!m.tournamentId) continue;
      if (!byId.has(m.tournamentId)) {
        byId.set(m.tournamentId, { tournamentId: m.tournamentId, name: m.tournament, surface: m.surface, bestRound: m.round });
      }
    }
    return Array.from(byId.values());
  }, [matches.data]);

  return (
    <div>
      <TopBar onBack={onBack} title="Профиль игрока" />
      <StatusBlock loading={profile.loading} error={profile.error} />

      {profile.data && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <Avatar name={profile.data.name} size={56} />
            <div>
              <p style={{ margin: 0, fontFamily: fontDisplay, fontSize: 20, color: C.ink, textTransform: 'uppercase', letterSpacing: 0.3 }}>{profile.data.name}</p>
              <p style={{ margin: '2px 0 0', fontFamily: fontBody, fontSize: 13, color: C.inkSoft }}>{profile.data.country} · {tour.toUpperCase()} rank {profile.data.rank ?? '—'}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8, marginBottom: 16 }}>
            <StatCard label="Рейтинг" value={profile.data.rank} />
            <StatCard label="Титулы" value={profile.data.titles} />
            <StatCard label="Про с" value={profile.data.turnedPro} />
          </div>

          <button
            onClick={() => onOpenPickOpponent(profile.data.name)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginBottom: 16,
              padding: '9px', borderRadius: 8, border: `1px solid ${C.line}`, background: C.panel,
              fontFamily: fontBody, fontSize: 13, fontWeight: 600, color: C.ink, cursor: 'pointer',
            }}
          >
            <Swords size={15} color={C.hard} /> Сравнить с соперником
          </button>
        </>
      )}

      <div style={{ display: 'flex', gap: 4, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: 3, marginBottom: 12 }}>
        {[['matches', 'Матчи'], ['tournaments', 'Турниры']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '7px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontFamily: fontBody, fontSize: 13, fontWeight: 600,
              background: tab === key ? C.hardBg : 'transparent', color: tab === key ? C.hard : C.inkSoft,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: '0 12px' }}>
        <StatusBlock loading={matches.loading} error={matches.error} loadingText="Загружаю матчи..." />
        {tab === 'matches' && matches.data && matches.data.map((m) => (
          <MatchRow key={m.id} m={m} onOpenTournament={(id) => onOpenTournament(id, tour, playerId)} />
        ))}
        {tab === 'tournaments' && tournaments.map((t) => (
          <button
            key={t.tournamentId}
            onClick={() => onOpenTournament(t.tournamentId, tour, playerId)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
              padding: '12px 4px', borderBottom: `1px solid ${C.line}`, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div>
              <p style={{ margin: 0, fontFamily: fontBody, fontSize: 14, fontWeight: 600, color: C.ink }}>{t.name}</p>
              <SurfaceChip surface={t.surface} />
            </div>
            <span style={{ fontFamily: fontBody, fontSize: 12, color: C.inkSoft }}>{t.bestRound}</span>
          </button>
        ))}
        {matches.data && matches.data.length === 0 && (
          <p style={{ fontFamily: fontBody, fontSize: 13, color: C.inkSoft, padding: '16px 0', textAlign: 'center' }}>Нет данных за период</p>
        )}
      </div>
    </div>
  );
}

function H2HScreen({ tour, aId, bId, aName, bName, onBack }) {
  const { data, loading, error } = useApi(`/api/h2h?tour=${tour}&player1=${aId}&player2=${bId}`, [tour, aId, bId]);

  return (
    <div>
      <TopBar onBack={onBack} title="Личные встречи" />
      <StatusBlock loading={loading} error={error} loadingText="Считаю личные встречи..." />

      {data && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <Avatar name={aName} size={48} />
              <p style={{ margin: '6px 0 0', fontFamily: fontBody, fontSize: 13, fontWeight: 600, color: C.ink }}>{aName?.split(' ').pop()}</p>
            </div>
            <div style={{ textAlign: 'center', padding: '0 12px' }}>
              <p style={{ margin: 0, fontFamily: fontMono, fontSize: 26, fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>
                {data.total.p1} – {data.total.p2}
              </p>
              <p style={{ margin: 0, fontFamily: fontBody, fontSize: 11, color: C.inkSoft, textTransform: 'uppercase' }}>Всего встреч</p>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <Avatar name={bName} size={48} />
              <p style={{ margin: '6px 0 0', fontFamily: fontBody, fontSize: 13, fontWeight: 600, color: C.ink }}>{bName?.split(' ').pop()}</p>
            </div>
          </div>

          {(data.total.p1 + data.total.p2) > 0 && (
            <div style={{ display: 'flex', height: 6, borderRadius: 4, overflow: 'hidden', marginBottom: 18 }}>
              <div style={{ width: `${Math.round((data.total.p1 / (data.total.p1 + data.total.p2)) * 100)}%`, background: C.hard }} />
              <div style={{ width: `${Math.round((data.total.p2 / (data.total.p1 + data.total.p2)) * 100)}%`, background: C.clay }} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8, marginBottom: 20 }}>
            {['hard', 'clay', 'grass'].map((s) => (
              <div key={s} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: 8, textAlign: 'center' }}>
                <SurfaceChip surface={s} />
                <p style={{ margin: '6px 0 0', fontFamily: fontMono, fontSize: 15, fontWeight: 700, color: C.ink }}>
                  {data.bySurface[s].p1} – {data.bySurface[s].p2}
                </p>
              </div>
            ))}
          </div>

          <p style={{ margin: '0 0 8px', fontFamily: fontBody, fontSize: 12, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4 }}>Последние встречи</p>
          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: '0 12px' }}>
            {data.recentMatches.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < data.recentMatches.length - 1 ? `1px solid ${C.line}` : 'none' }}>
                <span style={{ fontFamily: fontBody, fontSize: 13, color: C.ink }}>{r.tournament} · {r.round}</span>
                <span style={{
                  fontFamily: fontBody, fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 4,
                  background: r.winnerId === aId ? C.hardBg : C.clayBg, color: r.winnerId === aId ? C.hard : C.clay,
                }}>
                  {r.winnerId === aId ? aName?.split(' ').pop() : bName?.split(' ').pop()}
                </span>
              </div>
            ))}
            {data.recentMatches.length === 0 && (
              <p style={{ fontFamily: fontBody, fontSize: 13, color: C.inkSoft, padding: '16px 0', textAlign: 'center' }}>Личных встреч не найдено</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TournamentScreen({ tour, playerId, tournamentId, tournamentName, onBack }) {
  const { data, loading, error } = useApi(`/api/players/${tour}/${playerId}/tournaments/${tournamentId}`, [tour, playerId, tournamentId]);

  return (
    <div>
      <TopBar onBack={onBack} title="Карточка турнира" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Trophy size={18} color={C.hard} />
        <span style={{ fontFamily: fontDisplay, fontSize: 19, color: C.ink, textTransform: 'uppercase', letterSpacing: 0.3 }}>{tournamentName || 'Турнир'}</span>
      </div>

      <p style={{ margin: '0 0 8px', fontFamily: fontBody, fontSize: 12, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4 }}>Путь по турниру</p>
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: '0 12px' }}>
        <StatusBlock loading={loading} error={error} loadingText="Загружаю сетку..." />
        {data && data.map((r, i) => (
          <div key={r.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: i < data.length - 1 ? `1px solid ${C.line}` : 'none' }}>
            <div>
              <p style={{ margin: 0, fontFamily: fontBody, fontSize: 13, fontWeight: 600, color: C.ink }}>{r.round || '—'}</p>
              <p style={{ margin: '1px 0 0', fontFamily: fontBody, fontSize: 12, color: C.inkSoft }}>vs {r.opponent || '—'}</p>
            </div>
            <span style={{
              fontFamily: fontMono, fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 4,
              background: r.result === 'W' ? C.winBg : r.result === 'L' ? C.lossBg : C.line,
              color: r.result === 'W' ? C.win : r.result === 'L' ? C.loss : C.inkSoft,
            }}>
              {r.result ? `${r.result} ` : ''}{r.score || '—'}
            </span>
          </div>
        ))}
        {data && data.length === 0 && (
          <p style={{ fontFamily: fontBody, fontSize: 13, color: C.inkSoft, padding: '16px 0', textAlign: 'center' }}>Матчи по этому турниру не найдены</p>
        )}
      </div>
    </div>
  );
}

// ---------- app shell ----------
export default function TennisStatsPrototype() {
  const [nav, setNav] = useState({ screen: 'search' });

  return (
    <div style={{ background: C.bg, minHeight: 500, padding: '24px 16px', fontFamily: fontBody }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@600;700&display=swap');
      `}</style>
      <div style={{ maxWidth: 380, margin: '0 auto' }}>
        {nav.screen === 'search' && (
          <SearchScreen
            onSelectPlayer={(tour, id) => setNav({ screen: 'profile', tour, playerId: id })}
          />
        )}

        {nav.screen === 'profile' && (
          <ProfileScreen
            tour={nav.tour}
            playerId={nav.playerId}
            onBack={() => setNav({ screen: 'search' })}
            onOpenTournament={(tournamentId, tour, playerId) =>
              setNav({ screen: 'tournament', tour, playerId, tournamentId, prev: nav })
            }
            onOpenPickOpponent={(baseName) =>
              setNav({ screen: 'pick-opponent', tour: nav.tour, baseId: nav.playerId, baseName, prev: nav })
            }
          />
        )}

        {nav.screen === 'pick-opponent' && (
          <PickOpponentScreen
            tour={nav.tour}
            baseId={nav.baseId}
            baseName={nav.baseName}
            onBack={() => setNav(nav.prev)}
            onPicked={(oppId, oppName) =>
              setNav({ screen: 'h2h', tour: nav.tour, aId: nav.baseId, bId: oppId, aName: nav.baseName, bName: oppName, prev: nav.prev })
            }
          />
        )}

        {nav.screen === 'h2h' && (
          <H2HScreen
            tour={nav.tour}
            aId={nav.aId}
            bId={nav.bId}
            aName={nav.aName}
            bName={nav.bName}
            onBack={() => setNav(nav.prev || { screen: 'search' })}
          />
        )}

        {nav.screen === 'tournament' && (
          <TournamentScreen
            tour={nav.tour}
            playerId={nav.playerId}
            tournamentId={nav.tournamentId}
            tournamentName={nav.tournamentName}
            onBack={() => setNav(nav.prev || { screen: 'search' })}
          />
        )}
      </div>
    </div>
  );
}

export default TennisStatsPrototype;
