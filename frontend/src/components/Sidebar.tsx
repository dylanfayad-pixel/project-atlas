import {
  Activity,
  ChartNoAxesCombined,
  Database,
  LayoutDashboard,
  Search,
  ShieldCheck,
} from 'lucide-react'

// Research-only navigation; no trade simulation views.
export type WorkspaceView =
  | 'market-overview'
  | 'data-workspace'
  | 'technical-indicators'
  | 'market-explorer'
  | 'risk-intelligence'

type Props = {
  activeView: WorkspaceView
  onNavigate: (view: WorkspaceView) => void
}

const navigation = [
  {
    id: 'market-overview',
    label: 'Market Overview',
    icon: LayoutDashboard,
  },
  {
    id: 'data-workspace',
    label: 'Data Workspace',
    icon: Database,
  },
  {
    id: 'technical-indicators',
    label: 'Technical Indicators',
    icon: ChartNoAxesCombined,
  },
  {
    id: 'market-explorer',
    label: 'Market Explorer',
    icon: Search,
  },
  {
    id: 'risk-intelligence',
    label: 'Risk Intelligence',
    icon: ShieldCheck,
  },
] as const

// Navigation is controlled by the application shell.
export function Sidebar({ activeView, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Activity size={25} />
        <div>
          <strong>ATLAS</strong>
          <span>INTELLIGENCE</span>
        </div>
      </div>

      <div className="nav-label">RESEARCH WORKSPACE</div>

      <nav className="navigation" aria-label="Workspace">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={
              `nav-item ${activeView === id ? 'active' : ''}`
            }
            aria-current={
              activeView === id ? 'page' : undefined
            }
            onClick={() => onNavigate(id)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <ShieldCheck size={16} />
        <span>Historical market research</span>
      </div>
    </aside>
  )
}
