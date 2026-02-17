import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import * as Tone from 'tone';
import type { BibleData, Verse } from './types';
import { generateMelody } from './lib/melody';
import { makeSnippet, parseReference } from './lib/bible';

type Mode = 'melody' | 'voice';

type SearchHit = { bookId: string; chapter: number; verse: number; text: string; book: string };

const DEFAULT_ROUTE = '/b/genesis/1';

function Reader({ data }: { data: BibleData }) {
  const params = useParams();
  const navigate = useNavigate();
  const bookId = params.book ?? 'genesis';
  const chapterNo = Number(params.chapter ?? 1);
  const verseNo = params.verse ? Number(params.verse) : undefined;

  const book = data.books.find((b) => b.id === bookId) ?? data.books[0];
  const chapter = book.chapters[chapterNo - 1] ?? book.chapters[0];

  const [mode, setMode] = useState<Mode>('melody');
  const [tempo, setTempo] = useState(1);
  const [key, setKey] = useState('C');
  const [scale, setScale] = useState<'major'|'minor'|'pentatonic'>('major');
  const [lowOctave, setLowOctave] = useState(3);
  const [highOctave, setHighOctave] = useState(5);
  const [volume, setVolume] = useState(0.7);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [activeWord, setActiveWord] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [voiceName, setVoiceName] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const currentVerse: Verse | undefined = verseNo ? chapter.verses[verseNo - 1] : undefined;
  const synthRef = useRef<Tone.Synth | null>(null);
  const stopRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('singtheverse:last', window.location.hash || '#/');
  }, [bookId, chapterNo, verseNo]);

  useEffect(() => {
    const load = () => {
      const avail = window.speechSynthesis.getVoices();
      setVoices(avail);
      if (!voiceName && avail[0]) setVoiceName(avail[0].name);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, [voiceName]);

  const index = useMemo(() => {
    const out: SearchHit[] = [];
    data.books.forEach((b) => b.chapters.forEach((c, ci) => c.verses.forEach((v) => out.push({
      bookId: b.id, chapter: ci + 1, verse: v.n, text: v.t, book: b.name
    }))));
    return out;
  }, [data]);

  const stop = () => {
    stopRef.current = true;
    setPlaying(false);
    setActiveWord(-1);
    Tone.Transport.stop();
    Tone.Transport.cancel();
    synthRef.current?.dispose();
    synthRef.current = null;
    speechSynthesis.cancel();
  };

  const playMelody = async () => {
    if (!currentVerse) return;
    stop();
    stopRef.current = false;
    await Tone.start();
    const synth = new Tone.Synth().toDestination();
    synth.volume.value = Tone.gainToDb(Math.max(0.0001, volume));
    synthRef.current = synth;
    const seq = generateMelody(currentVerse.t, { key, scale, lowOctave, highOctave });
    let t = 0;
    setPlaying(true);
    seq.forEach((step, idx) => {
      Tone.Transport.schedule((time) => {
        if (stopRef.current) return;
        setActiveWord(idx);
        synth.triggerAttackRelease(step.midi, step.duration / tempo, time);
      }, t);
      t += step.duration / tempo;
    });
    Tone.Transport.schedule(() => {
      setPlaying(false);
      setActiveWord(-1);
      if (autoAdvance && verseNo && verseNo < chapter.verses.length) {
        navigate(`/v/${bookId}/${chapterNo}/${verseNo + 1}`);
      }
    }, t + 0.05);
    Tone.Transport.start();
  };

  const playVoice = () => {
    if (!currentVerse) return;
    stop();
    const utter = new SpeechSynthesisUtterance(currentVerse.t);
    utter.rate = 0.95 * tempo;
    utter.pitch = 1.1;
    utter.volume = volume;
    const v = voices.find((x) => x.name === voiceName);
    if (v) utter.voice = v;
    utter.onstart = () => setPlaying(true);
    utter.onend = () => {
      setPlaying(false);
      if (autoAdvance && verseNo && verseNo < chapter.verses.length) navigate(`/v/${bookId}/${chapterNo}/${verseNo + 1}`);
    };
    speechSynthesis.speak(utter);
  };

  const onSearch = (raw: string) => {
    setQuery(raw);
    const ref = parseReference(raw, data);
    if (ref) {
      navigate(`/v/${ref.bookId}/${ref.chapter}/${ref.verse ?? 1}`);
      return;
    }
    if (raw.length < 2) return setHits([]);
    setHits(index.filter((h) => h.text.toLowerCase().includes(raw.toLowerCase())).slice(0, 25));
  };

  const words = currentVerse?.t.split(/\s+/) ?? [];

  return <div className="h-screen grid grid-cols-[18rem_1fr]">
    <aside className="overflow-y-auto border-r border-slate-800 p-3 space-y-2">
      <h1 className="text-xl font-bold">SingTheVerse</h1>
      <input className="w-full rounded bg-slate-900 p-2" placeholder="Search text or John 3:16" value={query} onChange={(e)=>onSearch(e.target.value)} />
      {hits.length > 0 && <div className="max-h-40 overflow-auto text-sm bg-slate-900 rounded p-2 space-y-1">{hits.map((h, i)=><button key={i} className="block text-left w-full hover:text-cyan-300" onClick={()=>navigate(`/v/${h.bookId}/${h.chapter}/${h.verse}`)}>{h.book} {h.chapter}:{h.verse} - {makeSnippet(h.text, query)}</button>)}</div>}
      <div className="text-xs text-emerald-300">Offline ready after first load</div>
      <div className="space-y-1">
        {data.books.map((b)=><Link key={b.id} className={`block px-2 py-1 rounded ${b.id===book.id?'bg-cyan-900':''}`} to={`/b/${b.id}/1`}>{b.name}</Link>)}
      </div>
    </aside>
    <main className="overflow-y-auto p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <select className="bg-slate-900 rounded p-2" value={chapterNo} onChange={(e)=>navigate(`/b/${book.id}/${e.target.value}`)}>{book.chapters.map((_, i)=><option key={i} value={i+1}>Chapter {i+1}</option>)}</select>
      </div>
      <div className="space-y-2" role="list" aria-label="Verse list">
        {chapter.verses.map((v)=><button key={v.n} role="listitem" className={`w-full text-left p-2 rounded ${verseNo===v.n?'bg-slate-800':''}`} onClick={()=>navigate(`/v/${book.id}/${chapterNo}/${v.n}`)}><span className="text-cyan-300 mr-2">{v.n}</span>{v.t}</button>)}
      </div>
      {currentVerse && <section className="sticky bottom-0 bg-slate-900 border border-slate-700 rounded p-3 space-y-2">
        <h2 className="font-semibold">Now Singing - {book.name} {chapterNo}:{verseNo}</h2>
        <p>{words.map((w, i)=><span key={i} className={i===activeWord?'bg-cyan-700':''}>{w} </span>)}</p>
        <div className="flex gap-2 flex-wrap">
          <button aria-label="Play" className="px-3 py-1 bg-cyan-700 rounded" onClick={mode==='melody'?playMelody:playVoice}>Play</button>
          <button aria-label="Pause" className="px-3 py-1 bg-slate-700 rounded" onClick={()=>{Tone.Transport.pause(); speechSynthesis.pause(); setPlaying(false);}}>Pause</button>
          <button aria-label="Stop" className="px-3 py-1 bg-rose-700 rounded" onClick={stop}>Stop</button>
          <label><input type="checkbox" checked={mode==='melody'} onChange={()=>setMode(mode==='melody'?'voice':'melody')} /> Melody Mode</label>
          {mode==='voice' && <select className="bg-slate-800 p-1" value={voiceName} onChange={(e)=>setVoiceName(e.target.value)}>{voices.map((v)=><option key={v.name} value={v.name}>{v.name}</option>)}</select>}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <label>Tempo <input type="range" min="0.5" max="1.8" step="0.1" value={tempo} onChange={(e)=>setTempo(Number(e.target.value))} /></label>
          <label>Key <select className="bg-slate-800" value={key} onChange={(e)=>setKey(e.target.value)}>{['C','D','E','F','G','A','B'].map((k)=><option key={k}>{k}</option>)}</select></label>
          <label>Scale <select className="bg-slate-800" value={scale} onChange={(e)=>setScale(e.target.value as any)}><option>major</option><option>minor</option><option>pentatonic</option></select></label>
          <label>Low octave <input type="number" min="2" max="6" value={lowOctave} onChange={(e)=>setLowOctave(Number(e.target.value))} /></label>
          <label>High octave <input type="number" min="2" max="7" value={highOctave} onChange={(e)=>setHighOctave(Number(e.target.value))} /></label>
          <label>Volume <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e)=>setVolume(Number(e.target.value))} /></label>
          <label><input type="checkbox" checked={autoAdvance} onChange={(e)=>setAutoAdvance(e.target.checked)} /> Auto-advance</label>
          <span>Status: {playing ? 'Playing' : 'Idle'}</span>
        </div>
      </section>}
    </main>
  </div>;
}

export default function App() {
  const [data, setData] = useState<BibleData | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/data/kjv.json').then((r) => r.json()).then(setData);
  }, []);

  useEffect(() => {
    if (location.pathname === '/') {
      const last = localStorage.getItem('singtheverse:last');
      if (last && last.startsWith('#/')) navigate(last.slice(1), { replace: true });
      else navigate(DEFAULT_ROUTE, { replace: true });
    }
  }, [location.pathname, navigate]);

  if (!data) return <div className="p-4">Loading Bible...</div>;

  return <Routes>
    <Route path="/" element={<Reader data={data} />} />
    <Route path="/b/:book/:chapter" element={<Reader data={data} />} />
    <Route path="/v/:book/:chapter/:verse" element={<Reader data={data} />} />
  </Routes>;
}
