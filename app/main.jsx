import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Copy,
  Dribbble,
  ExternalLink,
  Film,
  Flame,
  Grid2X2,
  LayoutList,
  Menu,
  Play,
  Search,
  SlidersHorizontal,
  Users,
  X,
  Zap,
} from "lucide-react";
import "./style.css";

const cx = (...items) => items.filter(Boolean).join(" ");
const duration = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
const dateLabel = (date) =>
  date
    ? new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";
const initial = new URLSearchParams(location.search);
const presets = ["Cade Cunningham", "Stephen Curry", "LeBron James", "Dunks"];

function loadSaved() {
  try {
    const data = JSON.parse(localStorage.getItem("courtside.saved") || "[]");
    return Array.isArray(data)
      ? data.filter(
          (c) => c && typeof c.id === "string" && typeof c.title === "string",
        )
      : [];
  } catch {
    return [];
  }
}
function Court({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 220 170"
      fill="none"
      className={className}
    >
      <path
        d="M10 160V10h200v150H10ZM72 10v58h76V10M88 10v42h44V10"
        stroke="currentColor"
      />
      <circle cx="110" cy="68" r="38" stroke="currentColor" />
      <path
        d="M26 10v42a84 84 0 0 0 168 0V10M10 140h200"
        stroke="currentColor"
      />
      <circle cx="110" cy="145" r="27" stroke="currentColor" />
      <circle cx="110" cy="28" r="5" stroke="currentColor" />
      <path d="M98 22h24" stroke="currentColor" />
    </svg>
  );
}
function Brand({ light = false }) {
  return (
    <span
      className={cx(
        "flex items-center gap-2.5",
        light ? "text-paper" : "text-ink",
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange text-paper">
        <Dribbble size={26} strokeWidth={1.5} />
      </span>
      <span className="font-display text-[31px] leading-none tracking-tight">
        COURTSIDE<span className="align-top text-orange text-lg">®</span>
      </span>
    </span>
  );
}
function ModalShell({ children, onClose, title, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const listener = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const elements = ref.current.querySelectorAll(
        'button,a[href],input,video,[tabindex="0"]',
      );
      const first = elements[0],
        last = elements[elements.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === ref.current)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", listener);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#101c18]/85 p-3 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          "enter relative max-h-[95dvh] w-full overflow-y-auto rounded-xl bg-paper shadow-2xl",
          wide ? "max-w-5xl" : "max-w-xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </section>
    </div>
  );
}
function ClipCard({ clip, index, saved, onSave, onPlay, list }) {
  return (
    <article
      className={cx(
        "group enter min-w-0",
        list && "flex items-center gap-5 border-b border-line py-4",
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
    >
      <div
        className={cx(
          "relative overflow-hidden rounded-md bg-forest",
          list ? "w-40 shrink-0 sm:w-56" : "w-full",
        )}
      >
        <button
          onClick={() => onPlay(clip)}
          className="relative block aspect-video w-full text-left"
          aria-label={`Play ${clip.title}`}
        >
          <img
            src={clip.thumbnail}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
          <span className="absolute left-3 top-3 rounded-sm bg-paper/95 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-ink">
            {clip.kind === "Three-pointers" ? "3-POINTER" : clip.kind}
          </span>
          <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange text-white shadow-lg">
              <Play size={18} fill="currentColor" className="ml-0.5" />
            </span>
          </span>
          <span className="absolute bottom-2.5 right-2.5 rounded-sm bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {duration(clip.duration)}
          </span>
        </button>
      </div>
      <div className={cx("min-w-0 flex-1", !list && "pt-3.5")}>
        <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[.08em] text-muted">
          <span className="truncate">
            {clip.teams.length
              ? clip.teams
                  .map((t) => t.abbr)
                  .filter(Boolean)
                  .slice(0, 2)
                  .join(" / ")
              : "AROUND THE LEAGUE"}
          </span>
          <span className="shrink-0 font-medium normal-case tracking-normal">
            {dateLabel(clip.gameDate)}
          </span>
        </div>
        <div className="flex items-start gap-3">
          <button
            onClick={() => onPlay(clip)}
            className="line-clamp-2 flex-1 text-left text-[15px] font-extrabold leading-[1.5] transition hover:text-orange sm:text-[16px]"
          >
            {clip.title}
          </button>
          <button
            onClick={() => onSave(clip)}
            aria-label={saved ? `Unsave ${clip.title}` : `Save ${clip.title}`}
            aria-pressed={saved}
            className={cx(
              "mt-0.5 shrink-0 p-1 transition hover:text-orange",
              saved ? "text-orange" : "text-muted",
            )}
          >
            <Bookmark
              size={17}
              fill={saved ? "currentColor" : "none"}
              strokeWidth={1.6}
            />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-muted">
          ESPN <span className="px-1.5 text-line">/</span>{" "}
          {clip.players[0]?.name || "NBA basketball"}
        </p>
      </div>
    </article>
  );
}

function App() {
  const [view, setView] = useState(
    ["explore", "saved", "players", "teams"].includes(initial.get("view"))
      ? initial.get("view")
      : "explore",
  );
  const [query, setQuery] = useState(initial.get("q") || "");
  const [debounced, setDebounced] = useState(query);
  const [team, setTeam] = useState(initial.get("team") || "");
  const [kind, setKind] = useState(initial.get("kind") || "");
  const [date, setDate] = useState(initial.get("date") || "");
  const [sort, setSort] = useState(initial.get("sort") || "newest");
  const [clips, setClips] = useState([]);
  const [meta, setMeta] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [spotlight, setSpotlight] = useState(null);
  const [saved, setSaved] = useState(loadSaved);
  const [active, setActive] = useState(null);
  const [about, setAbout] = useState(false);
  const [menu, setMenu] = useState(false);
  const [layout, setLayout] = useState("grid");
  const [toast, setToast] = useState("");
  const [focusSearch, setFocusSearch] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const searchRef = useRef(null);
  const resultRef = useRef(null);
  const requestId = useRef(0);
  const closePlayer = React.useCallback(() => {
    setActive(null);
    const url = new URL(location.href);
    url.searchParams.delete("clip");
    history.replaceState({}, "", url);
  }, []);
  const closeAbout = React.useCallback(() => setAbout(false), []);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 220);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 2600);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    const listener = (e) => {
      if (
        (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key === "k")) &&
        !["INPUT", "TEXTAREA", "SELECT", "VIDEO"].includes(
          document.activeElement?.tagName,
        ) &&
        !active &&
        !about
      ) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [active, about]);
  useEffect(() => {
    fetch("/api/meta")
      .then((res) => {
        if (!res.ok) throw Error();
        return res.json();
      })
      .then(setMeta)
      .catch(() => {});
    fetch("/api/clips?limit=12")
      .then((res) => res.json())
      .then((data) =>
        setSpotlight(
          data.clips?.find((c) => c.duration > 30 && c.players.length) ||
            data.clips?.[0],
        ),
      )
      .catch(() => {});
    const clipId = initial.get("clip");
    if (clipId)
      fetch(`/api/clips/${encodeURIComponent(clipId)}`)
        .then((res) => {
          if (!res.ok) throw Error();
          return res.json();
        })
        .then((c) => {
          setActive(c);
          setVideoError(false);
        })
        .catch(() => setToast("This clip is no longer available."));
  }, []);
  useEffect(() => {
    const url = new URL(location.href);
    for (const [key, value] of Object.entries({
      q: query,
      team,
      kind,
      date,
      sort: sort === "newest" ? "" : sort,
      view: view === "explore" ? "" : view,
    })) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    history.replaceState({}, "", url);
  }, [query, team, kind, date, sort, view]);
  const filters = new URLSearchParams({ q: debounced, team, kind, date, sort });
  useEffect(() => {
    const controller = new AbortController();
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    fetch(
      `/api/clips?${new URLSearchParams({ q: debounced, team, kind, date, sort })}`,
      { signal: controller.signal },
    )
      .then((res) => {
        if (!res.ok) throw Error();
        return res.json();
      })
      .then((data) => {
        if (requestId.current === id) {
          setClips(data.clips);
          setTotal(data.total);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError" && requestId.current === id) {
          setError("The film room couldn’t load. Let’s give it another shot.");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [debounced, team, kind, date, sort, reload]);

  function play(clip) {
    setActive(clip);
    setVideoError(false);
    const url = new URL(location.href);
    url.searchParams.set("clip", clip.id);
    history.replaceState({}, "", url);
  }
  function save(clip) {
    const exists = saved.some((c) => c.id === clip.id);
    const next = exists
      ? saved.filter((c) => c.id !== clip.id)
      : [clip, ...saved];
    try {
      localStorage.setItem("courtside.saved", JSON.stringify(next));
      setSaved(next);
      setToast(
        exists ? "Removed from your film room" : "Saved to your film room",
      );
    } catch {
      setToast(
        "Browser storage is full or disabled. Your clips couldn’t be saved.",
      );
    }
  }
  async function loadMore() {
    const id = requestId.current;
    setMoreLoading(true);
    try {
      const res = await fetch(`/api/clips?${filters}&offset=${clips.length}`);
      if (!res.ok) throw Error();
      const data = await res.json();
      if (requestId.current === id)
        setClips((prev) => [...prev, ...data.clips]);
    } catch {
      setToast("Couldn’t load more clips. Please try again.");
    } finally {
      setMoreLoading(false);
    }
  }
  function go(next) {
    setView(next);
    setMenu(false);
    setQuery("");
    setKind("");
    setTeam("");
    setDate("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function quickSearch(text) {
    setView("explore");
    if (text === "Dunks") {
      setKind("Dunks");
      setQuery("");
    } else {
      setQuery(text);
      setKind("");
    }
    setFocusSearch(false);
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function reset() {
    setQuery("");
    setTeam("");
    setKind("");
    setDate("");
    setSort("newest");
  }
  const hasFilters = query || team || kind || date;
  let displayed =
    view === "saved"
      ? saved.filter(
          (c) =>
            (!query ||
              `${c.title} ${c.description} ${c.players.map((p) => p.name).join(" ")} ${c.teams.map((t) => t.name).join(" ")}`
                .toLowerCase()
                .includes(query.toLowerCase())) &&
            (!kind || c.kind === kind) &&
            (!team || c.teams.some((t) => t.id === team)) &&
            (!date || c.gameDate === date),
        )
      : clips;
  if (view === "saved")
    displayed = [...displayed].sort((a, b) =>
      sort === "shortest"
        ? a.duration - b.duration
        : sort === "oldest"
          ? a.published.localeCompare(b.published)
          : b.published.localeCompare(a.published),
    );
  const shownTotal = view === "saved" ? displayed.length : total;
  const suggestions = query.trim()
    ? (meta?.players || [])
        .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
    : [];
  const activeIndex = displayed.findIndex((c) => c.id === active?.id);
  const nextClip = displayed[activeIndex + 1];
  const previousClip = activeIndex > 0 ? displayed[activeIndex - 1] : null;
  const feature = spotlight;
  const directories = view === "players" || view === "teams";

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded bg-orange px-4 py-3 text-white focus:translate-y-0"
      >
        Skip to content
      </a>
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 flex w-[216px] flex-col bg-forest text-paper transition-transform lg:translate-x-0",
          menu ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
      >
        <button
          className="mx-6 mb-12 mt-8 text-left"
          aria-label="Courtside home"
          onClick={() => go("explore")}
        >
          <Brand light />
        </button>
        <p className="mb-3 px-7 text-[9px] font-bold tracking-[.19em] text-[#92a297]">
          THE FILM ROOM
        </p>
        <nav aria-label="Main navigation" className="space-y-1 px-3">
          {[
            ["explore", "Explore", Grid2X2],
            ["players", "Players", Users],
            ["teams", "Teams", Dribbble],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => go(id)}
              aria-current={view === id ? "page" : undefined}
              className={cx(
                "flex w-full items-center gap-3 rounded-md px-4 py-3 text-[12px] font-semibold transition",
                view === id
                  ? "bg-[#f4f3ec]/10 text-paper"
                  : "text-[#a7b4aa] hover:bg-white/5 hover:text-paper",
              )}
            >
              <Icon size={17} strokeWidth={1.5} />
              {label}
              {view === id && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-orange" />
              )}
            </button>
          ))}
          <div className="mx-4 my-6 border-t border-white/10" />
          <button
            onClick={() => go("saved")}
            aria-current={view === "saved" ? "page" : undefined}
            className={cx(
              "flex w-full items-center gap-3 rounded-md px-4 py-3 text-[12px] font-semibold transition",
              view === "saved"
                ? "bg-white/10 text-paper"
                : "text-[#a7b4aa] hover:bg-white/5 hover:text-paper",
            )}
          >
            <Bookmark size={17} strokeWidth={1.5} />
            Saved clips
            <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px]">
              {saved.length}
            </span>
          </button>
        </nav>
        <div className="relative mx-6 mb-6 mt-auto overflow-hidden border-t border-white/15 pt-7">
          <Court className="mx-auto mb-4 h-32 w-full rotate-180 text-[#657668]/45" />
          <p className="font-display text-[27px] leading-[1.05] text-[#dce1d4]">
            NOTHING BUT
            <br />
            BASKETBALL.
          </p>
          <p className="mt-3 text-[9px] leading-relaxed text-[#8e9f93]">
            For the fans. For the film nerds.
            <br />
            For the love of the game.
          </p>
          <button
            onClick={() => setAbout(true)}
            className="mt-7 flex items-center gap-2 text-[10px] text-[#a7b4aa] hover:text-paper"
          >
            <CircleHelp size={13} />
            About Courtside <ArrowUpRight size={12} />
          </button>
        </div>
      </aside>
      {menu && (
        <button
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
          className="fixed inset-0 z-30 bg-ink/50 lg:hidden"
        />
      )}
      <div className="lg:ml-[216px]">
        <header className="flex h-[77px] items-center justify-between gap-4 border-b border-line px-5 sm:px-9 xl:px-12">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenu(true)}
              aria-label="Open navigation"
              className="p-1 lg:hidden"
            >
              <Menu size={22} />
            </button>
            <span className="font-display text-[25px] lg:hidden">
              COURTSIDE<span className="text-orange">.</span>
            </span>
            <span className="hidden text-[9px] font-bold uppercase tracking-[.2em] text-muted lg:block">
              An all-access pass to the moments that matter
            </span>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden items-center gap-2 text-[10px] text-muted sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6c8865]" />
              {meta?.lastSync
                ? `Updated ${new Date(meta.lastSync).toLocaleDateString() !== new Date().toLocaleDateString() ? new Date(meta.lastSync).toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " : ""}${new Date(meta.lastSync).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
                : "The NBA clip index"}
            </span>
            <button
              onClick={() => go("saved")}
              className="flex items-center gap-2 text-[10px] font-bold"
            >
              <Bookmark size={15} strokeWidth={1.5} />
              <span className="hidden sm:inline">My film room</span>
              <span className="rounded-full bg-[#e8e9df] px-1.5 py-0.5 text-[9px]">
                {saved.length}
              </span>
            </button>
          </div>
        </header>
        <main
          id="main"
          className="mx-auto max-w-[1560px] px-5 pb-8 pt-7 sm:px-9 sm:pt-9 xl:px-12"
        >
          {view === "explore" && (
            <section className="mb-8 grid items-center gap-6 md:grid-cols-[.93fr_1fr] lg:gap-8 xl:gap-12">
              <div className="enter relative py-2">
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="h-px w-6 bg-orange" />
                  <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-orange">
                    Less scrolling. More basketball.
                  </p>
                </div>
                <h1 className="font-display text-[76px] leading-[.88] tracking-[-.025em] text-ink sm:text-[94px] md:text-[90px] xl:text-[112px]">
                  THE GAME.
                  <br />
                  <span className="text-orange">ON REPEAT.</span>
                </h1>
                <p className="mt-5 max-w-[330px] text-[12px] leading-[1.9] text-[#737b72]">
                  The big shots. The filthy handles. The plays you need to see
                  again. Find your moment.
                </p>
                <div className="mt-6 flex items-center gap-3 text-[9px] font-bold tracking-wide">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line">
                    <ArrowDown size={12} />
                  </span>
                  YOUR NEXT REPLAY STARTS HERE
                </div>
              </div>
              {feature ? (
                <button
                  onClick={() => play(feature)}
                  aria-label={`Watch spotlight: ${feature.title}`}
                  className="group enter relative block aspect-[1.45] overflow-hidden rounded-md bg-forest text-left text-paper xl:aspect-[1.65]"
                >
                  <img
                    src={feature.thumbnail}
                    alt=""
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    fetchPriority="high"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#101e18] via-black/5 to-black/20" />
                  <span className="absolute left-5 top-5 flex items-center gap-1.5 rounded-sm bg-paper px-2.5 py-1.5 text-[8px] font-extrabold tracking-[.14em] text-ink">
                    <Flame size={11} className="text-orange" />
                    THE SPOTLIGHT
                  </span>
                  <span className="absolute right-5 top-5 text-[9px] font-semibold text-white/90">
                    {dateLabel(feature.gameDate)}
                  </span>
                  <span className="absolute bottom-5 left-5 right-5">
                    <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.17em] text-[#e4bb9a]">
                      {feature.players[0]?.name || "AROUND THE LEAGUE"}
                    </span>
                    <span className="flex items-end gap-5">
                      <span className="font-display max-w-[85%] text-[29px] uppercase leading-[1.04] sm:text-[33px] xl:text-[39px]">
                        {feature.title}
                      </span>
                      <span className="ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange transition group-hover:bg-paper group-hover:text-orange">
                        <Play
                          size={18}
                          fill="currentColor"
                          className="ml-0.5"
                        />
                      </span>
                    </span>
                    <span className="mt-3 block text-[9px] text-white/65">
                      {duration(feature.duration)}{" "}
                      <span className="px-2">/</span> WATCH THE MOMENT{" "}
                      <ArrowUpRight size={10} className="ml-1 inline" />
                    </span>
                  </span>
                </button>
              ) : (
                <div className="aspect-[1.65] animate-pulse rounded-md bg-line" />
              )}
            </section>
          )}
          {view !== "explore" && (
            <section className="mb-8 border-b border-line pb-8">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[.2em] text-orange">
                YOUR PERSONAL FILM ROOM
              </p>
              <h1 className="font-display text-6xl uppercase leading-none sm:text-8xl">
                {view === "saved" ? (
                  <>
                    THE KEEPERS<span className="text-orange">.</span>
                  </>
                ) : view === "players" ? (
                  <>
                    KNOW YOUR PLAYERS<span className="text-orange">.</span>
                  </>
                ) : (
                  <>
                    PICK YOUR SIDE<span className="text-orange">.</span>
                  </>
                )}
              </h1>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                {view === "saved"
                  ? "The moments worth coming back to. Saved in this browser, no account needed."
                  : view === "players"
                    ? "Find a familiar face. Go straight to their highlights."
                    : "All the teams in the index. One place for every moment."}
              </p>
            </section>
          )}
          <section
            aria-label="Search the film room"
            className="relative z-20 mb-8"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFocusSearch(false);
                resultRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className="relative flex items-center gap-3 rounded-md border border-[#d7dbce] bg-[#fffef9] px-4 py-4 shadow-[0_3px_12px_#202b2604] transition focus-within:border-orange focus-within:ring-2 focus-within:ring-orange/10 sm:gap-4 sm:px-5 sm:py-5"
            >
              <Search
                size={23}
                strokeWidth={1.4}
                className="shrink-0 text-orange"
              />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocusSearch(true)}
                onBlur={() => setTimeout(() => setFocusSearch(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setFocusSearch(false);
                    searchRef.current?.blur();
                  }
                }}
                aria-label={
                  directories
                    ? `Search ${view}`
                    : "Search clips by player, team, or play"
                }
                placeholder={
                  view === "players"
                    ? "Find a player…"
                    : view === "teams"
                      ? "Find your team…"
                      : "A player. A team. That one ridiculous dunk."
                }
                className="w-full min-w-0 bg-transparent text-[12px] font-medium outline-none placeholder:text-[#90978b] sm:text-[14px]"
                autoComplete="off"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="p-1 text-muted hover:text-orange"
                >
                  <X size={17} />
                </button>
              ) : (
                <kbd className="hidden rounded border border-line px-2 py-0.5 text-[11px] text-muted sm:block">
                  /
                </kbd>
              )}
              <button
                type="submit"
                aria-label="Search"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-ink text-paper transition hover:bg-orange"
              >
                <ArrowRight size={16} />
              </button>
            </form>
            {focusSearch && suggestions.length > 0 && !directories && (
              <div className="absolute top-[calc(100%-22px)] z-30 w-full rounded-b-md border border-line bg-[#fffef9] p-2 shadow-xl">
                <p className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-muted">
                  Players in the index
                </p>
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => quickSearch(p.name)}
                    className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-xs hover:bg-paper"
                  >
                    <Users size={14} className="text-orange" />
                    {p.name}
                    <ArrowUpRight size={12} className="ml-auto text-muted" />
                  </button>
                ))}
              </div>
            )}
            {!directories && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-[9px]">
                <span className="font-bold text-muted">JUMP RIGHT IN</span>
                {presets.map((p) => (
                  <button
                    key={p}
                    onClick={() => quickSearch(p)}
                    className="flex items-center gap-1 text-[#6c756a] transition hover:text-orange"
                  >
                    {p}
                    <ArrowUpRight size={10} />
                  </button>
                ))}
              </div>
            )}
          </section>
          {directories ? (
            <section ref={resultRef} className="scroll-mt-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-3xl uppercase">
                  {view === "players"
                    ? "The names. The game."
                    : "From coast to coast."}
                </h2>
                <span className="text-[10px] text-muted">
                  {(meta?.[view] || []).length} indexed {view}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {(meta?.[view] || [])
                  .filter((item) =>
                    `${item.name} ${item.abbr || ""}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  )
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setView("explore");
                        if (view === "teams") {
                          setTeam(item.id);
                          setQuery("");
                        } else setQuery(item.name);
                      }}
                      className="group flex items-center gap-3 rounded-md border border-line bg-[#fffef9] p-3 text-left transition hover:border-orange hover:shadow-md"
                    >
                      <img
                        src={
                          view === "players"
                            ? `https://a.espncdn.com/i/headshots/nba/players/full/${item.id}.png`
                            : `https://a.espncdn.com/i/teamlogos/nba/500/${item.abbr.toLowerCase()}.png`
                        }
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-full bg-paper object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.visibility = "hidden";
                        }}
                      />
                      <span className="text-[11px] font-bold">{item.name}</span>
                      <ArrowUpRight
                        size={13}
                        className="ml-auto shrink-0 text-muted group-hover:text-orange"
                      />
                    </button>
                  ))}
              </div>
              {meta &&
                !(meta[view] || []).some((item) =>
                  `${item.name} ${item.abbr || ""}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                ) && (
                  <Empty
                    title="No match on the roster."
                    text="Try a different name. Only players and teams with indexed clips appear here."
                    onReset={() => setQuery("")}
                  />
                )}
            </section>
          ) : (
            <section ref={resultRef} className="scroll-mt-6">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange" />
                    <p className="text-[8px] font-bold uppercase tracking-[.18em] text-muted">
                      {view === "saved"
                        ? "YOUR COLLECTION"
                        : hasFilters
                          ? "THE SEARCH RESULTS"
                          : "FRESH FROM THE COURT"}
                    </p>
                  </div>
                  <h2 className="font-display text-[33px] uppercase leading-none tracking-tight sm:text-[38px]">
                    {view === "saved"
                      ? "SAVED FOR THE REPLAY."
                      : hasFilters
                        ? "THERE’S YOUR MOMENT."
                        : "FIND YOUR NEXT REPLAY."}
                  </h2>
                </div>
                <p aria-live="polite" className="pb-0.5 text-[10px] text-muted">
                  {loading && view !== "saved" ? (
                    "Searching the film room…"
                  ) : (
                    <>
                      <strong className="font-bold text-ink">
                        {shownTotal.toLocaleString()}
                      </strong>{" "}
                      clips{" "}
                      {hasFilters
                        ? "found"
                        : view === "saved"
                          ? "saved"
                          : "and counting"}
                    </>
                  )}
                </p>
              </div>
              <div
                className="mb-4 flex gap-2 overflow-x-auto pb-2"
                role="group"
                aria-label="Filter by play type"
              >
                {[
                  "",
                  ...(meta?.kinds || [
                    "Highlights",
                    "Dunks",
                    "Three-pointers",
                    "Blocks",
                    "Assists",
                    "Steals",
                    "Layups",
                  ]),
                ].map((k, i) => (
                  <button
                    key={k}
                    onClick={() => setKind(k)}
                    aria-pressed={kind === k}
                    className={cx(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[10px] font-semibold transition",
                      kind === k
                        ? "border-ink bg-ink text-paper"
                        : "border-line bg-transparent text-[#7b8277] hover:border-ink hover:text-ink",
                    )}
                  >
                    {i === 0 ? (
                      <Grid2X2 size={11} />
                    ) : k === "Dunks" ? (
                      <Flame size={12} />
                    ) : k === "Three-pointers" ? (
                      <Zap size={12} />
                    ) : null}
                    {k || "All plays"}
                  </button>
                ))}
              </div>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
                <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                  <SlidersHorizontal size={13} className="text-muted" />
                  <Select
                    label="Team"
                    value={team}
                    onChange={setTeam}
                    options={[
                      ["", "All teams"],
                      ...(meta?.teams || []).map((t) => [t.id, t.name]),
                    ]}
                  />
                  <span className="h-3 w-px bg-line" />
                  <Select
                    label="Game date"
                    value={date}
                    onChange={setDate}
                    options={[
                      ["", "Any date"],
                      ...(meta?.dates || []).map((d) => [d, dateLabel(d)]),
                    ]}
                  />
                  {hasFilters && (
                    <button
                      onClick={reset}
                      className="flex items-center gap-1 text-[9px] font-bold text-orange"
                    >
                      <X size={11} />
                      Clear filters
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <Select
                    label="Sort clips"
                    value={sort}
                    onChange={setSort}
                    options={[
                      ["newest", "Newest first"],
                      ["oldest", "Oldest first"],
                      ["shortest", "Shortest first"],
                    ]}
                  />
                  <div className="flex items-center gap-1 border-l border-line pl-3">
                    <button
                      onClick={() => setLayout("grid")}
                      aria-label="Grid view"
                      aria-pressed={layout === "grid"}
                      className={cx(
                        "rounded p-1.5",
                        layout === "grid"
                          ? "bg-[#e4e6da] text-ink"
                          : "text-muted",
                      )}
                    >
                      <Grid2X2 size={13} />
                    </button>
                    <button
                      onClick={() => setLayout("list")}
                      aria-label="List view"
                      aria-pressed={layout === "list"}
                      className={cx(
                        "rounded p-1.5",
                        layout === "list"
                          ? "bg-[#e4e6da] text-ink"
                          : "text-muted",
                      )}
                    >
                      <LayoutList size={14} />
                    </button>
                  </div>
                </div>
              </div>
              {error && view !== "saved" ? (
                <Empty
                  title="A timeout. Not the end of the game."
                  text={error}
                  onReset={() => setReload((r) => r + 1)}
                  action="Try again"
                />
              ) : loading && view !== "saved" ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-video rounded-md bg-line" />
                      <div className="mt-4 h-3 w-2/3 rounded bg-line" />
                      <div className="mt-3 h-3 w-full rounded bg-line" />
                    </div>
                  ))}
                </div>
              ) : displayed.length ? (
                <div
                  className={
                    layout === "grid"
                      ? "grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3"
                      : "flex flex-col"
                  }
                >
                  {displayed.map((clip, index) => (
                    <ClipCard
                      key={clip.id}
                      clip={clip}
                      index={index}
                      saved={saved.some((c) => c.id === clip.id)}
                      onSave={save}
                      onPlay={play}
                      list={layout === "list"}
                    />
                  ))}
                </div>
              ) : (
                <Empty
                  title={
                    view === "saved" && !hasFilters
                      ? "A film room of your own."
                      : "No plays. Yet."
                  }
                  text={
                    view === "saved" && !hasFilters
                      ? "Hit the bookmark on any clip to keep it here. Your favorite moments, ready for another watch."
                      : "Try a player’s last name, another team, or fewer filters. This index covers recent publisher highlights, not every NBA play."
                  }
                  onReset={
                    view === "saved" && !hasFilters
                      ? () => go("explore")
                      : reset
                  }
                  action={
                    view === "saved" && !hasFilters
                      ? "Discover clips"
                      : "Clear filters"
                  }
                />
              )}
              {!loading &&
                !error &&
                view !== "saved" &&
                clips.length < total && (
                  <div className="mt-10 text-center">
                    <button
                      onClick={loadMore}
                      disabled={moreLoading}
                      className="inline-flex items-center gap-3 rounded border border-ink px-7 py-3 text-[10px] font-bold transition hover:bg-ink hover:text-paper disabled:opacity-50"
                    >
                      {moreLoading
                        ? "Loading the next reel…"
                        : "More moments, please"}
                      <ArrowDown size={13} />
                    </button>
                    <p className="mt-3 text-[9px] text-muted">
                      {clips.length} of {total.toLocaleString()} clips
                    </p>
                  </div>
                )}
            </section>
          )}
          <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-[9px] text-muted">
            <div>
              <p className="font-semibold text-ink">
                Made for the love of the game.{" "}
                <Dribbble size={11} className="ml-1 inline text-orange" />
              </p>
              <p className="mt-2 max-w-lg leading-relaxed">
                Independent fan project. Video & imagery belong to ESPN and
                their respective owners.
                <br />
                Recent publisher highlights, not a complete play-by-play
                archive. Availability may vary by region.
              </p>
            </div>
            <button
              onClick={() => setAbout(true)}
              className="flex items-center gap-1.5 text-[9px] hover:text-orange"
            >
              A little about Courtside
              <ArrowUpRight size={11} />
            </button>
          </footer>
        </main>
      </div>
      {active && (
        <ModalShell onClose={closePlayer} title={active.title} wide>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
              <Film size={14} className="text-orange" />
              NOW IN THE FILM ROOM
            </span>
            <button
              onClick={closePlayer}
              aria-label="Close player"
              className="rounded-full p-1.5 hover:bg-line"
            >
              <X size={20} />
            </button>
          </div>
          <div className="relative bg-black">
            <video
              key={active.id}
              src={active.video}
              poster={active.thumbnail}
              controls
              autoPlay
              playsInline
              preload="metadata"
              onError={() => setVideoError(true)}
              onEnded={() => {
                if (autoplay && nextClip) play(nextClip);
              }}
              className="aspect-video max-h-[58dvh] w-full"
            />
            {videoError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-forest p-6 text-center text-paper">
                <Film size={30} />
                <p className="text-sm">
                  This publisher video couldn’t play here.
                </p>
                <p className="max-w-md text-xs text-white/60">
                  It may have expired or be unavailable in your region. You can
                  try the original publisher.
                </p>
                <a
                  href={active.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded bg-orange px-4 py-2 text-xs"
                >
                  Watch on ESPN
                  <ExternalLink size={13} />
                </a>
              </div>
            )}
          </div>
          <div className="p-5 sm:p-7">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-orange">
              {active.kind} <span className="px-2 text-muted">/</span>
              {dateLabel(active.gameDate)}
              <span className="px-2 text-muted">/</span>
              {duration(active.duration)}
            </p>
            <h2 className="font-display text-3xl uppercase leading-tight sm:text-4xl">
              {active.title}
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              {active.matchup || active.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => save(active)}
                className={cx(
                  "flex items-center gap-2 rounded px-4 py-2.5 text-[10px] font-semibold",
                  saved.some((c) => c.id === active.id)
                    ? "bg-orange text-white"
                    : "bg-ink text-paper",
                )}
              >
                <Bookmark size={14} />
                {saved.some((c) => c.id === active.id)
                  ? "Saved to film room"
                  : "Save clip"}
              </button>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(location.href);
                    setToast("Clip link copied");
                  } catch {
                    setToast("Copy the clip link from your address bar.");
                  }
                }}
                className="flex items-center gap-2 rounded border border-line px-4 py-2.5 text-[10px] font-semibold"
              >
                <Copy size={13} />
                Copy link
              </button>
              <a
                href={active.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto flex items-center gap-1.5 text-[10px] text-muted hover:text-orange"
              >
                Original on ESPN
                <ExternalLink size={12} />
              </a>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <label className="flex items-center gap-2 text-[10px] text-muted">
                <input
                  type="checkbox"
                  checked={autoplay}
                  onChange={(e) => setAutoplay(e.target.checked)}
                  className="accent-orange"
                />
                Play next automatically
              </label>
              <div className="flex gap-2">
                <button
                  disabled={!previousClip}
                  onClick={() => previousClip && play(previousClip)}
                  aria-label="Previous clip"
                  className="rounded border border-line p-2 disabled:opacity-25"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={!nextClip}
                  onClick={() => nextClip && play(nextClip)}
                  aria-label="Next clip"
                  className="flex items-center gap-1 rounded border border-line px-3 py-2 text-[10px] disabled:opacity-25"
                >
                  Next clip
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </ModalShell>
      )}
      {about && (
        <ModalShell onClose={closeAbout} title="About Courtside">
          <div className="p-7 sm:p-10">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                aria-label="Close about"
                onClick={closeAbout}
                className="p-2"
              >
                <X size={20} />
              </button>
            </div>
            <h2 className="font-display mt-8 text-5xl uppercase leading-none">
              FOR THE LOVE
              <br />
              OF THE GAME<span className="text-orange">.</span>
            </h2>
            <div className="mt-5 space-y-4 text-xs leading-[1.9] text-muted">
              <p>
                Courtside is an independent NBA film room by Avyay. A simpler
                way to find a great play, watch it again, and keep it for later.
              </p>
              <p>
                The index brings together recent highlights published by ESPN.
                Search matches clip titles, descriptions, players matched to
                game rosters, teams, and matchups. Play types are inferred from
                titles; not every play is individually tagged.
              </p>
              <p>
                Metadata refreshes every 30 minutes. Videos stream directly from
                the publisher, and may expire or be restricted by region. This
                is not a complete NBA play-by-play or historical archive.
              </p>
              <p>
                Saved clips stay in this browser only. Clearing browser data
                removes them. No account. No Courtside analytics. Just
                basketball.
              </p>
            </div>
            <p className="mt-6 border-t border-line pt-4 text-[9px] text-muted">
              {meta?.total?.toLocaleString() || "—"} indexed clips ·{" "}
              {meta?.dates?.length || "—"} game dates
              {meta?.lastSync && (
                <> · Last refresh {new Date(meta.lastSync).toLocaleString()}</>
              )}
            </p>
          </div>
        </ModalShell>
      )}
      {toast && (
        <div
          role="status"
          className="enter fixed bottom-6 left-1/2 z-[60] flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-lg bg-ink px-5 py-3 text-center text-xs text-paper shadow-xl"
        >
          <Check size={15} className="shrink-0 text-[#c5db9b]" />
          {toast}
        </div>
      )}
    </div>
  );
}
function Select({ label, value, onChange, options }) {
  return (
    <span className="relative inline-flex max-w-[180px] items-center">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-full appearance-none truncate bg-transparent py-1 pr-5 text-[10px] font-semibold outline-orange"
      >
        {options.map(([v, text]) => (
          <option value={v} key={v}>
            {text}
          </option>
        ))}
      </select>
      <ChevronDown
        size={11}
        className="pointer-events-none absolute right-0 text-muted"
      />
    </span>
  );
}
function Empty({ title, text, onReset, action = "Clear filters" }) {
  return (
    <div className="flex flex-col items-center rounded-md border border-dashed border-[#cfd4c4] px-5 py-16 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#e9ebdf] text-orange">
        <Film size={25} strokeWidth={1.3} />
      </span>
      <h3 className="font-display text-3xl uppercase">{title}</h3>
      <p className="mt-3 max-w-md text-xs leading-relaxed text-muted">{text}</p>
      <button
        onClick={onReset}
        className="mt-6 flex items-center gap-2 rounded bg-ink px-5 py-3 text-[10px] font-semibold text-paper hover:bg-orange"
      >
        {action}
        <ArrowRight size={13} />
      </button>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
