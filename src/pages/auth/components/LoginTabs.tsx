type Tab = {
  id: string
  label: string
}

type Props = {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
}

export default function LoginTabs({ tabs, activeTab, onChange }: Props) {
  return (
    <div className="mb-5 flex gap-1 rounded-2xl bg-tp-bg p-1">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
              isActive
                ? 'bg-tp-green text-white shadow-sm'
                : 'text-tp-muted hover:text-tp-text'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}