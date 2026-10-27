import {
  Activity,
  BarChart3,
  ChartNoAxesCombined,
  Database,
  Layers3,
  ShieldCheck,
} from 'lucide-react'

// Supported workspace views.
export type WorkspaceView =
  | 'overview'
  | 'strategies'
  | 'market-data'
  | 'backtests'

type Props = {
  activeView: WorkspaceView
  onNavigate: (view: WorkspaceView) => void
}

const navigation = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'strategies', label: 'Strategies', icon: ChartNoAxesCombined },
  { id: 'market-data', label: 'Market Data', icon: Database },
  { id: 'backtests', label: 'Backtests', icon: Layers3 },
] as const

// Navigation is controlled by the application shell.
export function Sidebar({ activeView, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Activity size={25} />
        <div>
          <strong>ATLAS</strong>
          <span>QUANT TERMINAL</span>
        </div>
      </div>

      <div className="nav-label">WORKSPACE</div>

      <nav className="navigation" aria-label="Workspace">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={
              `nav-item ${activeView === id ? 'active' : ''}`
            }
            aria-current={activeView === id ? 'page' : undefined}
            onClick={() => onNavigate(id)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <ShieldCheck size={16} />
        <span>Research environment</span>
      </div>
    </aside>
  )
}
