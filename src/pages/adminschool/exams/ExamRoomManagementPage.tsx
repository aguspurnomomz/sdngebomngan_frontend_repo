import { useEffect, useState } from 'react'
import { useAccessToken } from '../../../features/hooks/useAccessToken' 
import {
  listExamRooms,
  createExamRoom,
  updateExamRoom,
  deleteExamRoom,
} from '../../../services/examRoomService'

import type { ExamRoom } from '../../../services/examRoomService'

export default function ExamRoomManagementPage() {
  const { token } = useAccessToken() 
  
  const [rooms, setRooms] = useState<ExamRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<ExamRoom | null>(null)

  const [form, setForm] = useState({ room_name: '', location_note: '', capacity: 30 })

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const data = await listExamRooms(token)
      setRooms(data)
    } catch (e: any) {
      alert(e.response?.data?.error || 'Gagal memuat ruangan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchRooms()
  }, [token])

  const openCreate = () => {
    setEditingRoom(null)
    setForm({ room_name: '', location_note: '', capacity: 30 })
    setShowModal(true)
  }

  const openEdit = (room: ExamRoom) => {
    setEditingRoom(room)
    setForm({ room_name: room.room_name, location_note: room.location_note, capacity: room.capacity })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingRoom) {
        await updateExamRoom(token, editingRoom.id, form)
      } else {
        await createExamRoom(token, form)
      }
      setShowModal(false)
      fetchRooms()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menyimpan ruangan')
    }
  }

  const handleDelete = async (room: ExamRoom) => {
    if (!confirm(`Hapus ruangan "${room.room_name}"?`)) return
    try {
      await deleteExamRoom(token, room.id)
      fetchRooms()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menghapus ruangan')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tp-text">Manajemen Ruangan Ujian</h1>
          <p className="text-sm text-tp-muted">Kelola daftar ruangan yang bisa digunakan untuk ujian sekolah.</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-xl bg-tp-green px-4 py-2 text-sm font-semibold text-white hover:bg-tp-green-hover"
        >
          + Tambah Ruangan
        </button>
      </div>

      {loading ? (
        <div className="text-center text-tp-muted">Memuat...</div>
      ) : rooms.length === 0 ? (
        <div className="rounded-2xl border border-tp-border bg-white p-8 text-center text-tp-muted">
          Belum ada ruangan. Klik "Tambah Ruangan" untuk membuat.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="rounded-2xl border border-tp-border bg-white p-5 shadow-sm"
            >
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-bold text-tp-text">{room.room_name}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    room.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {room.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              {room.location_note && (
                <p className="text-xs text-tp-muted">📍 {room.location_note}</p>
              )}
              <p className="mt-1 text-xs text-tp-muted">
                Kapasitas: <strong>{room.capacity}</strong> siswa
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openEdit(room)}
                  className="flex-1 rounded-lg border border-tp-border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(room)}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="mb-4 text-lg font-bold">
              {editingRoom ? 'Edit Ruangan' : 'Tambah Ruangan Baru'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-tp-text">
                  Nama Ruangan *
                </label>
                <input
                  required
                  value={form.room_name}
                  onChange={(e) => setForm({ ...form, room_name: e.target.value })}
                  placeholder="cth: Lab Komputer 1"
                  className="w-full rounded-lg border border-tp-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-tp-text">
                  Lokasi (opsional)
                </label>
                <input
                  value={form.location_note}
                  onChange={(e) => setForm({ ...form, location_note: e.target.value })}
                  placeholder="cth: Lantai 2 Gedung B"
                  className="w-full rounded-lg border border-tp-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-tp-text">
                  Kapasitas Siswa *
                </label>
                <input
                  required
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-tp-border px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-tp-border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-lg bg-tp-green px-4 py-2 text-sm font-semibold text-white hover:bg-tp-green-hover"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}