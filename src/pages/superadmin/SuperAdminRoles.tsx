import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus, Pencil, Trash2, X, Loader2, CheckCircle,
  ShieldCheck, RefreshCw, Power, Lock
} from 'lucide-react'

interface RoleItem {
  id: string
  code: string
  label: string
  description: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface Permission {
  id: string
  code: string
  label: string
  module: string
  description: string
}

export default function SuperAdminRoles() {
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null)
  const [formCode, setFormCode] = useState('')
  const [formLabel, setFormLabel] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formSortOrder, setFormSortOrder] = useState<number>(0)
  const [formIsActive, setFormIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedRoleForPerm, setSelectedRoleForPerm] = useState<RoleItem | null>(null)
  const [rolePermissionIDs, setRolePermissionIDs] = useState<string[]>([])
  const [initialPermIDs, setInitialPermIDs] = useState<string[]>([])
  const [isPermModalOpen, setIsPermModalOpen] = useState(false)
  const [loadingPerm, setLoadingPerm] = useState(false)
  const [savingPerm, setSavingPerm] = useState(false)
  const [permError, setPermError] = useState('')

  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showSuccess = useCallback((m: string) => {
    if (successTimer.current) clearTimeout(successTimer.current)
    setSuccessMsg(m)
    successTimer.current = setTimeout(() => setSuccessMsg(''), 4000)
  }, [])

  const showError = useCallback((m: string) => {
    if (errorTimer.current) clearTimeout(errorTimer.current)
    setErrorMsg(m)
    errorTimer.current = setTimeout(() => setErrorMsg(''), 5000)
  }, [])

  useEffect(() => () => {
    if (successTimer.current) clearTimeout(successTimer.current)
    if (errorTimer.current) clearTimeout(errorTimer.current)
  }, [])

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const token = localStorage.getItem('superadmin_token')
      const headers = { Authorization: `Bearer ${token}` }

      const [rolesRes, permsRes] = await Promise.all([
        api.get('/api/superadmin/school-roles?include_inactive=true', { headers }),
        api.get('/api/superadmin/permissions', { headers })
      ])

      setRoles(rolesRes.data?.roles ?? [])
      setPermissions(permsRes.data?.permissions ?? [])
    } catch (err: any) {
      console.error(err)
      setErrorMsg('Gagal memuat daftar peran.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRoles() }, [fetchRoles])

  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc, p) => {
      if (!acc[p.module]) acc[p.module] = []
      acc[p.module].push(p)
      return acc
    }, {} as Record<string, Permission[]>)
  }, [permissions])

  const openAddModal = () => {
    setEditingRole(null)
    setFormCode('')
    setFormLabel('')
    setFormDescription('')
    setFormSortOrder(roles.length + 1)
    setFormIsActive(true)
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (r: RoleItem) => {
    setEditingRole(r)
    setFormCode(r.code)
    setFormLabel(r.label)
    setFormDescription(r.description)
    setFormSortOrder(r.sort_order)
    setFormIsActive(r.is_active)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formLabel.trim()) {
      setFormError('Nama peran wajib diisi.')
      return
    }
    if (!editingRole && !formCode.trim()) {
      setFormError('Kode peran wajib diisi.')
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('superadmin_token')
      const headers = { Authorization: `Bearer ${token}` }

      if (editingRole) {
        await api.put(`/api/superadmin/school-roles/${editingRole.id}`, {
          label: formLabel.trim(),
          description: formDescription.trim(),
          sort_order: formSortOrder,
          is_active: formIsActive,
        }, { headers })
        showSuccess('Peran berhasil diperbarui.')
      } else {
        await api.post('/api/superadmin/school-roles', {
          code: formCode.trim(),
          label: formLabel.trim(),
          description: formDescription.trim(),
          sort_order: formSortOrder,
          is_active: formIsActive,
        }, { headers })
        showSuccess('Peran berhasil ditambahkan.')
      }

      setIsModalOpen(false)
      await fetchRoles()
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Terjadi kesalahan.'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (r: RoleItem) => {
    try {
      const token = localStorage.getItem('superadmin_token')
      await api.put(`/api/superadmin/school-roles/${r.id}`, {
        is_active: !r.is_active,
      }, { headers: { Authorization: `Bearer ${token}` } })
      showSuccess(`Peran "${r.label}" ${r.is_active ? 'dinonaktifkan' : 'diaktifkan'}.`)
      await fetchRoles()
    } catch (err: any) {
      showError(err.response?.data?.error || 'Gagal mengubah status peran.')
    }
  }

  const handleDelete = async (r: RoleItem) => {
    if (!confirm(`Yakin ingin menghapus peran "${r.label}"?\n\nPeran yang masih dipakai tidak bisa dihapus — nonaktifkan saja.`)) {
      return
    }
    try {
      const token = localStorage.getItem('superadmin_token')
      await api.delete(`/api/superadmin/school-roles/${r.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      showSuccess('Peran berhasil dihapus.')
      await fetchRoles()
    } catch (err: any) {
      showError(err.response?.data?.error || 'Gagal menghapus peran.')
    }
  }

  const handleOpenPermModal = async (r: RoleItem) => {
    setRolePermissionIDs([])
    setInitialPermIDs([])
    setPermError('')
    setSelectedRoleForPerm(r)
    setLoadingPerm(true)
    setIsPermModalOpen(true)

    try {
      const token = localStorage.getItem('superadmin_token')
      const res = await api.get(`/api/superadmin/school-roles/${r.id}/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const ids: string[] = res.data.permission_ids || []
      setRolePermissionIDs(ids)
      setInitialPermIDs(ids)
    } catch (err: any) {
      setIsPermModalOpen(false)
      setSelectedRoleForPerm(null)
      showError(err.response?.data?.error || 'Gagal memuat permission role.')
    } finally {
      setLoadingPerm(false)
    }
  }

  const handleTogglePerm = (pid: string) => {
    setRolePermissionIDs((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    )
  }

  const handleSavePermissions = async () => {
    if (!selectedRoleForPerm) return
    setSavingPerm(true)
    setPermError('')
    try {
      const token = localStorage.getItem('superadmin_token')
      await api.put(
        `/api/superadmin/school-roles/${selectedRoleForPerm.id}/permissions`,
        { permission_ids: rolePermissionIDs },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setInitialPermIDs(rolePermissionIDs)
      showSuccess('Permission berhasil disimpan.')
      setIsPermModalOpen(false)
      setSelectedRoleForPerm(null)
    } catch (err: any) {
      setPermError(err.response?.data?.error || 'Gagal menyimpan permission')
    } finally {
      setSavingPerm(false)
    }
  }

  const isPermDirty = useMemo(() => {
    if (rolePermissionIDs.length !== initialPermIDs.length) return true
    const set = new Set(initialPermIDs)
    return rolePermissionIDs.some((id) => !set.has(id))
  }, [rolePermissionIDs, initialPermIDs])

  const closePermModal = useCallback(() => {
    if (savingPerm || loadingPerm) return
    if (isPermDirty && !window.confirm('Perubahan permission belum disimpan. Yakin tutup?')) return
    setIsPermModalOpen(false)
    setSelectedRoleForPerm(null)
  }, [savingPerm, loadingPerm, isPermDirty])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (isPermModalOpen) closePermModal()
      else if (isModalOpen && !submitting) setIsModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPermModalOpen, isModalOpen, submitting, closePermModal])

  const activeCount = roles.filter((r) => r.is_active).length

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-tp-text sm:text-[28px]">
            Peran di Sekolah
          </h1>
          <p className="text-sm text-tp-muted">
            Kelola daftar peran yang bisa dipilih saat menambahkan guru di sekolah.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={fetchRoles}
            className="rounded-xl border-tp-border bg-white gap-2 text-xs"
          >
            <RefreshCw size={14} /> Muat Ulang
          </Button>
          <Button
            type="button"
            onClick={openAddModal}
            className="rounded-xl bg-tp-green text-white gap-2 text-xs hover:bg-tp-green-hover"
          >
            <Plus size={14} /> Tambah Peran
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2 text-emerald-900">
          <CheckCircle size={16} className="shrink-0" />
          <span className="text-xs font-semibold">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-center gap-2 text-red-900">
          <X size={16} className="shrink-0" />
          <span className="text-xs font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-tp-border bg-white p-4">
          <p className="text-[10px] uppercase tracking-wider text-tp-muted font-semibold">Total Peran</p>
          <p className="text-2xl font-bold text-tp-text mt-1">{roles.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">Aktif</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Nonaktif</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{roles.length - activeCount}</p>
        </div>
      </div>

      {/* TABEL */}
      <div className="overflow-hidden rounded-2xl border border-tp-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-tp-border bg-gray-50 text-xs font-semibold uppercase tracking-wider text-tp-muted">
              <tr>
                <th className="px-6 py-4 w-12">#</th>
                <th className="px-6 py-4">Nama Peran</th>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Deskripsi</th>
                <th className="px-6 py-4 text-center">Urutan</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-tp-muted">
                    Memuat daftar peran...
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-tp-muted">
                    Belum ada peran. Klik "Tambah Peran".
                  </td>
                </tr>
              ) : (
                roles.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 text-tp-muted text-xs">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-tp-green shrink-0" />
                        <span className="font-semibold text-tp-text">{r.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 rounded px-2 py-1 font-mono text-tp-muted">
                        {r.code}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-xs text-tp-muted max-w-[280px]">
                      {r.description || <span className="italic text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-mono">
                      {r.sort_order}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {r.is_active ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenPermModal(r)}
                          className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition"
                          title="Atur Hak Akses"
                        >
                          <Lock size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(r)}
                          className={`p-2 rounded-lg transition ${
                            r.is_active
                              ? 'text-amber-500 hover:bg-amber-50'
                              : 'text-emerald-500 hover:bg-emerald-50'
                          }`}
                          title={r.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          <Power size={14} />
                        </button>
                        <button
                          onClick={() => openEditModal(r)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDIT / TAMBAH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-tp-border pb-3">
              <h3 className="text-sm font-bold text-tp-text flex items-center gap-2">
                {editingRole ? <Pencil size={16} className="text-blue-500" /> : <Plus size={16} className="text-tp-green" />}
                {editingRole ? 'Edit Peran' : 'Tambah Peran Baru'}
              </h3>
              <button
                onClick={() => !submitting && setIsModalOpen(false)}
                className="text-tp-muted hover:text-tp-text disabled:opacity-50"
                disabled={submitting}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2">
                <X size={14} className="text-red-500 shrink-0 mt-0.5" />
                <span className="text-[11px] text-red-800 font-medium">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Nama Peran *
                </label>
                <Input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="Contoh: Wali Kelas"
                  className="rounded-xl"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Kode {editingRole ? '(tidak dapat diubah)' : '*'}
                </label>
                <Input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="contoh: homeroom_teacher"
                  className="rounded-xl font-mono"
                  disabled={!!editingRole}
                  required={!editingRole}
                />
                <p className="text-[10px] text-tp-muted mt-1">
                  Kode unik untuk internal sistem (huruf kecil, tanpa spasi).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">Deskripsi</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Penjelasan singkat tentang peran ini..."
                  rows={3}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-tp-muted mb-1">Urutan</label>
                  <Input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    min={0}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-tp-muted mb-1">Status</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormIsActive(true)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                        formIsActive
                          ? 'border-tp-green bg-tp-green text-white'
                          : 'border-tp-border bg-white text-tp-muted'
                      }`}
                    >
                      Aktif
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormIsActive(false)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                        !formIsActive
                          ? 'border-gray-400 bg-gray-500 text-white'
                          : 'border-tp-border bg-white text-tp-muted'
                      }`}
                    >
                      Nonaktif
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="rounded-xl bg-white"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-tp-green text-white gap-2 hover:bg-tp-green-hover"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ATUR PERMISSION */}
      {isPermModalOpen && selectedRoleForPerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closePermModal}
          />

          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-tp-border">
              <div>
                <h3 className="text-lg font-bold text-tp-text flex items-center gap-2">
                  <Lock size={18} className="text-purple-500" />
                  Atur Akses: {selectedRoleForPerm.label}
                </h3>
                <p className="text-xs text-tp-muted">Centang menu/aksi yang diizinkan untuk peran ini.</p>
              </div>
              <button
                onClick={closePermModal}
                className="text-tp-muted hover:text-tp-text disabled:opacity-50"
                disabled={savingPerm || loadingPerm}
              >
                <X size={20} />
              </button>
            </div>

            {permError && (
              <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {permError}
              </div>
            )}

            <div className="p-6 overflow-y-auto space-y-6 min-h-[140px]">
              {loadingPerm ? (
                <div className="flex items-center justify-center gap-2 text-sm text-tp-muted py-8">
                  <Loader2 size={16} className="animate-spin" />
                  Memuat permission...
                </div>
              ) : Object.keys(groupedPermissions).length === 0 ? (
                <p className="text-center text-sm text-tp-muted">Belum ada data permission di database.</p>
              ) : (
                Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                  <div key={moduleName} className="space-y-3">
                    <h4 className="font-semibold text-sm text-tp-green uppercase tracking-wider border-b border-tp-border pb-1">
                      {moduleName}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {perms.map((p) => (
                        <label
                          key={p.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-tp-border hover:bg-tp-bg cursor-pointer transition"
                        >
                          <input
                            type="checkbox"
                            checked={rolePermissionIDs.includes(p.id)}
                            onChange={() => handleTogglePerm(p.id)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-tp-green focus:ring-tp-green"
                          />
                          <div>
                            <div className="text-sm font-medium text-tp-text">{p.label}</div>
                            <div className="text-[11px] text-tp-muted font-mono">{p.code}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-tp-border flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <Button
                variant="outline"
                onClick={closePermModal}
                disabled={savingPerm || loadingPerm}
              >
                Batal
              </Button>
              <Button
                onClick={handleSavePermissions}
                disabled={savingPerm || loadingPerm}
                className="bg-tp-green text-white"
              >
                {savingPerm ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}