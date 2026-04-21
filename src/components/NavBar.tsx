import type { AppPage, NavigationItem } from '../types/navigation'

type NavBarProps = {
  currentPage: AppPage
  items: NavigationItem[]
  onNavigate: (page: AppPage) => void
}

function NavBar({ currentPage, items, onNavigate }: NavBarProps) {
  return (
    <nav className="nav-bar" aria-label="Main navigation">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={
            currentPage === item.id ? 'nav-bar__item is-active' : 'nav-bar__item'
          }
          onClick={() => onNavigate(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}

export default NavBar
