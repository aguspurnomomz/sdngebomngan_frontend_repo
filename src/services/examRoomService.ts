import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
})

export interface ExamRoom {
  id: string
  room_name: string
  location_note: string
  capacity: number
  is_active: boolean
  created_at: string
}

export interface StudentItem {
  id: string
  full_name: string
  nisn: string
  student_number: string
  sub_class_name: string
  class_name: string
}

export interface AssignedStudent {
  assignment_id: string
  student_id: string
  full_name: string
  nisn: string
  seat_number: string
  room_id: string
  room_name: string
}

// ============ MASTER RUANGAN ============
export const listExamRooms = async (token: string) => {
  const res = await axios.get(`${API_URL}/api/school-admin/exam-rooms`, authHeaders(token))
  return res.data.rooms as ExamRoom[]
}

export const createExamRoom = async (
  token: string,
  data: { room_name: string; location_note: string; capacity: number }
) => {
  const res = await axios.post(`${API_URL}/api/school-admin/exam-rooms`, data, authHeaders(token))
  return res.data
}

export const updateExamRoom = async (
  token: string,
  id: string,
  data: Partial<{ room_name: string; location_note: string; capacity: number; is_active: boolean }>
) => {
  const res = await axios.put(`${API_URL}/api/school-admin/exam-rooms/${id}`, data, authHeaders(token))
  return res.data
}

export const deleteExamRoom = async (token: string, id: string) => {
  const res = await axios.delete(`${API_URL}/api/school-admin/exam-rooms/${id}`, authHeaders(token))
  return res.data
}

// ============ PLOTTING ============
export const getStudentsPlacement = async (token: string, scheduleId: string) => {
  const res = await axios.get(
    `${API_URL}/api/school-admin/exam-schedules/${scheduleId}/students-placement`,
    authHeaders(token)
  )
  return res.data as { unassigned_students: StudentItem[]; assigned_students: AssignedStudent[] }
}

export const assignStudentsToRoom = async (
  token: string,
  scheduleId: string,
  roomId: string,
  studentIds: string[]
) => {
  const res = await axios.post(
    `${API_URL}/api/school-admin/exam-schedules/${scheduleId}/assign-room`,
    { room_id: roomId, student_ids: studentIds },
    authHeaders(token)
  )
  return res.data
}

export const autoAssignRooms = async (token: string, scheduleId: string) => {
  const res = await axios.post(
    `${API_URL}/api/school-admin/exam-schedules/${scheduleId}/auto-assign-rooms`,
    {},
    authHeaders(token)
  )
  return res.data
}

export const removeStudentFromRoom = async (
  token: string,
  scheduleId: string,
  roomId: string,
  studentId: string
) => {
  const res = await axios.delete(
    `${API_URL}/api/school-admin/exam-schedules/${scheduleId}/rooms/${roomId}/students/${studentId}`,
    authHeaders(token)
  )
  return res.data
}

// ============ KARTU UJIAN ============
export const getExamCards = async (token: string, scheduleId: string, roomId?: string) => {
  const params = roomId ? { room_id: roomId } : {}
  const res = await axios.get(
    `${API_URL}/api/school-admin/exam-schedules/${scheduleId}/cards`,
    { ...authHeaders(token), params }
  )
  return res.data
}