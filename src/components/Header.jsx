import { useEffect, useState } from 'react'
import { Menu, X, User, Settings, Sun, Moon } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'
import { useAuth } from '../state/AuthContext.jsx'
import { useLanguage, useLanguageControls } from '../state/LanguageContext.jsx'
import { useTheme } from '../state/ThemeContext.jsx'
import { COMMON } from '../i18n/common.js'

// Sélecteur de langue (drapeaux FR/EN) : la langue est détectée
// automatiquement à la première visite, mais reste modifiable manuellement
// ici — le choix est alors mémorisé (localStorage) pour les prochaines fois.
function LanguageSwitcher({ className = '' }) {
  const { lang, setLang } = useLanguageControls()
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <button
        type="button"
        onClick={() => setLang('fr')}
        aria-label="Français"
        aria-pressed={lang === 'fr'}
        className={`text-base leading-none rounded-full p-1 transition ${
          lang === 'fr' ? 'ring-2 ring-fresh-300' : 'opacity-40 hover:opacity-80'
        }`}
      >
        🇫🇷
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-label="English"
        aria-pressed={lang === 'en'}
        className={`text-base leading-none rounded-full p-1 transition ${
          lang === 'en' ? 'ring-2 ring-fresh-300' : 'opacity-40 hover:opacity-80'
        }`}
      >
        🇬🇧
      </button>
    </div>
  )
}

// Bouton bascule clair/sombre : préférence détectée automatiquement au
// premier chargement (prefers-color-scheme), mémorisée ensuite si modifiée
// manuellement (voir ThemeContext.jsx).
function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const lang = useLanguage()
  const label =
    theme === 'dark'
      ? lang === 'fr' ? 'Passer au thème clair' : 'Switch to light theme'
      : lang === 'fr' ? 'Passer au thème sombre' : 'Switch to dark theme'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`p-1.5 rounded-full text-neutral-500 hover:text-fresh-700 dark:text-neutral-400 dark:hover:text-fresh-400 transition ${className}`}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

// Menu de navigation principal du site : liens visibles en desktop,
// menu déroulant hamburger en mobile. Reste basé sur le routeur d'état
// existant (goTo / state.view), sans dépendance de routing externe.
export default function Header() {
  const { state, goTo, resetSession } = useApp()
  const { user, localAvatar } = useAuth()
  const lang = useLanguage()
  const c = COMMON[lang]
  const NAV_LINKS = [
    { view: 'home', label: c.nav.home },
    { view: 'recipesBrowse', label: c.nav.recipes },
    { view: 'favorites', label: c.nav.favorites },
    { view: 'history', label: c.nav.history },
    { view: 'stats', label: c.nav.stats },
    { view: 'about', label: c.nav.about },
    { view: 'faq', label: c.nav.faq },
  ]
  const [menuOpen, setMenuOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const avatarUrl = localAvatar || user?.photoURL
  useEffect(() => setAvatarError(false), [avatarUrl])

  const navigate = (view) => {
    if (view === 'home') resetSession()
    goTo(view)
    setMenuOpen(false)
  }

  const initial = (user?.displayName || user?.email || '?').trim().charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-100/80 dark:border-neutral-800/80 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <button
          className="flex items-center gap-2.5 font-extrabold text-lg text-neutral-900 dark:text-neutral-50 shrink-0 group"
          onClick={() => navigate('home')}
        >
          <img
            src="https://i.ibb.co/zW91Yz1J/d65636ed-a1f8-4b6d-9a6e-3137c924b593.png"
            alt="FrigoMind"
            className="w-8 h-8 rounded-xl object-cover shadow-card ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105 group-hover:rotate-3"
          />
          <span>Frigo<span className="text-gradient-fresh">Mind</span></span>
        </button>

        {/* Navigation desktop : toujours sur une seule ligne — défile
            horizontalement plutôt que de passer à la ligne si l'écran est
            trop étroit pour tout afficher. */}
        <nav className="hidden sm:flex items-center flex-nowrap overflow-x-auto no-scrollbar gap-1 bg-neutral-50/70 dark:bg-neutral-800/60 rounded-full p-1 border border-neutral-100 dark:border-neutral-800 min-w-0">
          {NAV_LINKS.map((link) => (
            <button
              key={link.view}
              onClick={() => navigate(link.view)}
              className={`text-sm font-medium px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 transition-all duration-150 ${
                state.view === link.view
                  ? 'bg-white dark:bg-neutral-900 text-fresh-700 dark:text-fresh-400 shadow-card'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-white/70 dark:hover:bg-neutral-900/70'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Compte / connexion (desktop) */}
        <div className="hidden sm:flex items-center gap-3 ml-2 shrink-0">
          <ThemeToggle />
          <LanguageSwitcher />
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('settings')}
                className="w-8 h-8 rounded-full bg-fresh-100 text-fresh-700 font-semibold flex items-center justify-center text-sm hover:bg-fresh-200 transition overflow-hidden"
                title={user.displayName || user.email}
              >
                {avatarUrl && !avatarError ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  initial
                )}
              </button>
              <button
                onClick={() => navigate('settings')}
                className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-fresh-700 dark:hover:text-fresh-400 transition"
                title={c.nav.settings}
                aria-label={c.nav.settings}
              >
                <Settings size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('login')}
              className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-fresh-700 dark:hover:text-fresh-400 transition px-3 py-1.5"
            >
              <User size={16} />
              {c.nav.login}
            </button>
          )}
        </div>

        {/* Bouton hamburger mobile */}
        <button
          className="sm:hidden p-2 -mr-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-50"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? (lang === 'fr' ? 'Fermer le menu' : 'Close menu') : (lang === 'fr' ? 'Ouvrir le menu' : 'Open menu')}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Panneau déroulant mobile */}
      {menuOpen && (
        <nav className="sm:hidden border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 animate-fadeIn">
          <div className="max-w-3xl mx-auto px-4 py-2 flex flex-col">
            {NAV_LINKS.map((link) => (
              <button
                key={link.view}
                onClick={() => navigate(link.view)}
                className={`text-left text-sm font-medium px-2 py-2.5 rounded-lg transition ${
                  state.view === link.view
                    ? 'bg-fresh-50 dark:bg-fresh-900/30 text-fresh-700 dark:text-fresh-400'
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="border-t border-neutral-100 dark:border-neutral-800 mt-2 pt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-neutral-400 dark:text-neutral-500 px-2">{lang === 'fr' ? 'Thème & langue' : 'Theme & language'}</span>
              <div className="flex items-center gap-1.5">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
            </div>
            <div className="border-t border-neutral-100 dark:border-neutral-800 mt-2 pt-2">
              {user ? (
                <button
                  onClick={() => navigate('settings')}
                  className="text-left w-full text-sm font-medium px-2 py-2.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                >
                  {c.nav.settings} ({user.displayName || user.email})
                </button>
              ) : (
                <button
                  onClick={() => navigate('login')}
                  className="text-left w-full text-sm font-medium px-2 py-2.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                >
                  {c.nav.login}
                </button>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
