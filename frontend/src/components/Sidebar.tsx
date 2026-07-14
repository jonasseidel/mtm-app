import './Sidebar.css';

interface SidebarProps {
  active: 'landing' | 'chat';
  onHowItWorks: () => void;
  onNewChat: () => void;
}

function Sidebar({ active, onHowItWorks, onNewChat }: SidebarProps) {
  return (
    <aside className="mtm-sidebar">
      <div className="mtm-brand">
        <span className="mark">MTM</span>
        <span className="sub">Marsh Digital Twin</span>
      </div>

      <nav className="mtm-nav">
        <button
          className={'mtm-nav-item' + (active === 'landing' ? ' active' : '')}
          onClick={onHowItWorks}
        >
          <i className="bi bi-info-circle" />
          So funktioniert's
        </button>
        <button className="mtm-nav-item" onClick={onNewChat}>
          <i className="bi bi-plus-circle" />
          Neuer Chat
        </button>
      </nav>

      <div className="mtm-sidebar-foot">
        Sensordaten + ein Sprachmodell, ein Moor, mit dem man wirklich reden kann.
      </div>
    </aside>
  );
}

export default Sidebar;
