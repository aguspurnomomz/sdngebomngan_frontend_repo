import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccessToken } from '../../../features/hooks/useAccessToken'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import {
  listExamRooms,
  getStudentsPlacement,
  assignStudentsToRoom,
  autoAssignRooms,
  removeStudentFromRoom,
} from '../../../services/examRoomService'

import type {
  ExamRoom,
  StudentItem,
  AssignedStudent,
} from '../../../services/examRoomService'



// ============ DRAGGABLE STUDENT CARD ============
function DraggableStudent({ student }: { student: StudentItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: student.id,
    data: { student },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-lg border border-tp-border bg-white p-3 text-xs shadow-sm transition hover:border-tp-green hover:shadow ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <p className="font-semibold text-tp-text">{student.full_name}</p>
      <p className="text-tp-muted">NISN: {student.nisn || '-'}</p>
      <p className="text-tp-muted">
        {student.class_name} {student.sub_class_name && `• ${student.sub_class_name}`}
      </p>
    </div>
  )
}

// ============ DROPPABLE ROOM ============
function DroppableRoom({
  room,
  assignedStudents,
  onRemove,
}: {
  room: ExamRoom
  assignedStudents: AssignedStudent[]
  onRemove: (studentId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: room.id,
    data: { room },
  })

  const filled = assignedStudents.length
  const isFull = filled >= room.capacity

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-2 bg-white p-4 transition ${
        isOver ? 'border-tp-green bg-green-50' : 'border-tp-border'
      } ${isFull ? 'border-red-300 bg-red-50/30' : ''}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-tp-text">{room.room_name}</h3>
          {room.location_note && <p className="text-xs text-tp-muted">{room.location_note}</p>}
        </div>
        <div
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            isFull
              ? 'bg-red-100 text-red-600'
              : filled === 0
              ? 'bg-gray-100 text-gray-500'
              : 'bg-tp-green/10 text-tp-green'
          }`}
        >
          {filled} / {room.capacity}
        </div>
      </div>

      <div className="min-h-[100px] space-y-2">
        {assignedStudents.length === 0 ? (
          <p className="text-center text-xs italic text-tp-muted">
            Tarik siswa ke sini...
          </p>
        ) : (
          assignedStudents.map((s) => (
            <div
              key={s.assignment_id}
              className="flex items-center justify-between rounded-lg bg-tp-bg/40 px-3 py-2 text-xs"
            >
              <div>
                <span className="mr-2 rounded bg-tp-green/10 px-1.5 py-0.5 font-mono text-[10px] text-tp-green">
                  {s.seat_number || '-'}
                </span>
                <span className="font-semibold text-tp-text">{s.full_name}</span>
                <span className="ml-1 text-tp-muted">({s.nisn})</span>
              </div>
              <button
                onClick={() => onRemove(s.student_id)}
                className="ml-2 rounded text-red-500 hover:bg-red-50 px-1"
                title="Keluarkan"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ============ MAIN PAGE ============
export default function ExamRoomPlacementPage() {
  const { scheduleId } = useParams<{ scheduleId: string }>()
  const navigate = useNavigate()
  const { token } = useAccessToken()

  const [rooms, setRooms] = useState<ExamRoom[]>([])
  const [unassigned, setUnassigned] = useState<StudentItem[]>([])
  const [assigned, setAssigned] = useState<AssignedStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStudent, setActiveStudent] = useState<StudentItem | null>(null)
  const [processing, setProcessing] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [roomsData, placement] = await Promise.all([
        listExamRooms(token),
        getStudentsPlacement(token, scheduleId!),
      ])
      setRooms(roomsData.filter((r) => r.is_active))
      setUnassigned(placement.unassigned_students)
      setAssigned(placement.assigned_students)
    } catch (e: any) {
      alert(e.response?.data?.error || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token && scheduleId) fetchAll()
  }, [token, scheduleId])

  const assignedByRoom = useMemo(() => {
    const map: Record<string, AssignedStudent[]> = {}
    rooms.forEach((r) => (map[r.id] = []))
    assigned.forEach((a) => {
      if (map[a.room_id]) map[a.room_id].push(a)
    })
    return map
  }, [rooms, assigned])

  // ============ DRAG HANDLERS ============
  const handleDragStart = (event: DragStartEvent) => {
    setActiveStudent(event.active.data.current?.student || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveStudent(null)
    const { active, over } = event
    if (!over) return

    const studentId = active.id as string
    const roomId = over.id as string

    // Cari student
    const student = unassigned.find((s) => s.id === studentId)
    if (!student) return

    // Optimistic update
    const room = rooms.find((r) => r.id === roomId)
    if (!room) return

    const currentInRoom = assignedByRoom[roomId] || []
    if (currentInRoom.length >= room.capacity) {
      alert(`Ruangan ${room.room_name} sudah penuh (${room.capacity} siswa).`)
      return
    }

    setProcessing(true)
    try {
      await assignStudentsToRoom(token, scheduleId!, roomId, [studentId])
      await fetchAll()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menempatkan siswa')
    } finally {
      setProcessing(false)
    }
  }

  // ============ AUTO ASSIGN ============
  const handleAutoAssign = async () => {
    if (unassigned.length === 0) {
      alert('Tidak ada siswa yang belum ditempatkan.')
      return
    }
    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0)
    const totalFilled = assigned.length

    if (unassigned.length + totalFilled > totalCapacity) {
      alert(
        `Kapasitas tidak cukup. Total ruangan: ${totalCapacity}, ` +
          `siswa total: ${unassigned.length + totalFilled}`
      )
      return
    }

    if (
      !confirm(
        `Distribusikan ${unassigned.length} siswa ke ${rooms.length} ruangan secara otomatis?`
      )
    )
      return

    setProcessing(true)
    try {
      const res = await autoAssignRooms(token, scheduleId!)
      alert(res.message)
      await fetchAll()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal auto-assign')
    } finally {
      setProcessing(false)
    }
  }

  // ============ REMOVE FROM ROOM ============
  const handleRemoveFromRoom = async (roomId: string, studentId: string) => {
    if (!confirm('Keluarkan siswa ini dari ruangan?')) return
    setProcessing(true)
    try {
      await removeStudentFromRoom(token, scheduleId!, roomId, studentId)
      await fetchAll()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal mengeluarkan siswa')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-tp-muted">Memuat...</div>
  }

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tp-text">Penempatan Ruangan Ujian</h1>
          <p className="text-sm text-tp-muted">
            Tarik siswa ke ruangan atau gunakan tombol auto-assign.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border border-tp-border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            ← Kembali
          </button>
          <button
            onClick={handleAutoAssign}
            disabled={processing}
            className="rounded-xl bg-tp-green px-4 py-2 text-sm font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
          >
            ⚡ Auto Assign
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* KOLOM SISWA BELUM DITEMPATKAN */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-2xl border border-tp-border bg-white p-4">
              <h2 className="mb-3 text-sm font-bold text-tp-text">
                Siswa Belum Ditempatkan
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  {unassigned.length}
                </span>
              </h2>
              <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
                {unassigned.length === 0 ? (
                  <p className="text-center text-xs italic text-tp-muted">
                    Semua siswa sudah ditempatkan ✓
                  </p>
                ) : (
                  unassigned.map((s) => <DraggableStudent key={s.id} student={s} />)
                )}
              </div>
            </div>
          </div>

          {/* KOLOM RUANGAN */}
          <div className="lg:col-span-3">
            {rooms.length === 0 ? (
              <div className="rounded-2xl border border-tp-border bg-white p-8 text-center text-tp-muted">
                Belum ada ruangan aktif. Buat ruangan terlebih dahulu di menu{' '}
                <strong>Ruangan Ujian</strong>.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {rooms.map((room) => (
                  <DroppableRoom
                    key={room.id}
                    room={room}
                    assignedStudents={assignedByRoom[room.id] || []}
                    onRemove={(studentId) => handleRemoveFromRoom(room.id, studentId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeStudent ? (
            <div className="rounded-lg border-2 border-tp-green bg-white p-3 text-xs shadow-lg">
              <p className="font-semibold">{activeStudent.full_name}</p>
              <p className="text-tp-muted">{activeStudent.nisn}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}