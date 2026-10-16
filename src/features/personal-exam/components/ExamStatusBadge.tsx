type Props = {
  status: 'draft' | 'published' | 'archived'
}

export function ExamStatusBadge({ status }: Props) {
  const styles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    archived: 'bg-amber-50 text-amber-700 border-amber-200',
  }

  const labels: Record<string, string> = {
    draft: 'Draft',
    published: 'Published',
    archived: 'Archived',
  }

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${styles[status] || styles.draft}`}
    >
      {labels[status] || status}
    </span>
  )
}