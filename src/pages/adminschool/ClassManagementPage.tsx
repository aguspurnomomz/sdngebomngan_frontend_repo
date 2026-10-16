import { useState, useEffect, useCallback } from 'react'
import { Button } from '../../components/ui/button'
import {
  Plus,
  Trash2,
  CheckCircle,
  X,
  Loader2,
  Layers,
  Users,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import axios from 'axios'


interface ClassItem {
  id: string
  school_name: string
  name: string
  level: string
  class_type: string
  academic_year_id: string
  academic_year_name: string
  semester: string
  created_at: string
}

interface SubClass {
  id: string
  name: string
  code: string
  capacity: number
  notes: string
  homeroom_teacher_id: string | null
  homeroom_teacher_name: string
  is_active: boolean
  created_at: string
}

interface SubClassWithClass {
  id: string
  name: string
  code: string
  capacity: number
  notes: string
  homeroom_teacher_id: string | null
  homeroom_teacher_name: string
  is_active: boolean
  created_at: string
  class_group_id: string
  class_group_name: string
  class_group_level: string
  class_group_type: string
  academic_year_id: string
  academic_year_name: string
  semester: string
}

interface AcademicYear {
  id: string
  name: string
  semester: string
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
}

interface SchoolProfile {
  id: string
  school_name: string
  npsn: string
  jenjang?: string
  is_active: boolean
}

type Jenjang = 'SD' | 'SMP' | 'SMA' | 'SMK'
type TabType = 'classes' | 'sub-classes' | 'students'


const CLASS_OPTIONS: Record<string, string[]> = {
  SD: ['KELAS 1', 'KELAS 2', 'KELAS 3', 'KELAS 4', 'KELAS 5', 'KELAS 6'],
  SMP: ['KELAS 7', 'KELAS 8', 'KELAS 9'],
  SMA: ['KELAS 10', 'KELAS 11', 'KELAS 12'],
  SMK: ['KELAS 10', 'KELAS 11', 'KELAS 12'],
}

const CLASS_TYPE_OPTIONS = ['Umum', 'Inklusi']

const getDefaultClassName = (jenjang: Jenjang): string => {
  switch (jenjang) {
    case 'SD': return 'KELAS 1'
    case 'SMP': return 'KELAS 7'
    default: return 'KELAS 10'
  }
}

const getDefaultLevel = (jenjang: Jenjang): string => {
  switch (jenjang) {
    case 'SD': return '1'
    case 'SMP': return '7'
    default: return '10'
  }
}


export default function ClassManagementPage() {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [schoolJenjang, setSchoolJenjang] = useState<Jenjang>("SMA")
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('classes')
  const [schoolInactive, setSchoolInactive] = useState(false)
  const [name, setName] = useState('')
  const [isCustomName, setIsCustomName] = useState(false)
  const [level, setLevel] = useState('7')
  const [classType, setClassType] = useState('Umum')
  const [isCustomType, setIsCustomType] = useState(false)
  const [academicYearId, setAcademicYearId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isSubClassModalOpen, setIsSubClassModalOpen] = useState(false)
  const [selectedClassForSub, setSelectedClassForSub] = useState<ClassItem | null>(null)
  const [subClasses, setSubClasses] = useState<SubClass[]>([])
  const [subClassLoading, setSubClassLoading] = useState(false)
  const [subClassError, setSubClassError] = useState('')
  const [subClassName, setSubClassName] = useState('')
  const [subClassCapacity, setSubClassCapacity] = useState(0)
  const [subClassNotes, setSubClassNotes] = useState('')
  const [subClassSubmitting, setSubClassSubmitting] = useState(false)
  const [allSubClasses, setAllSubClasses] = useState<SubClassWithClass[]>([])
  const [allSubClassesLoading, setAllSubClassesLoading] = useState(false)
  const API_URL = import.meta.env.VITE_API_URL as string

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setErrorMessage('')
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  const showError = (msg: string) => {
    setErrorMessage(msg)
    setSuccessMessage('')
    setTimeout(() => setErrorMessage(''), 5000)
  }

  const extractErrorMessage = (err: any): string => {
    return err?.response?.data?.error || err?.message || 'Terjadi kesalahan.'
  }

  const isSchoolInactiveError = (err: any): boolean => {
    const status = err?.response?.status
    const message = extractErrorMessage(err).toLowerCase()
    return status === 403 && message.includes('dinonaktifkan')
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')
    setSchoolInactive(false)

    try {
      const token = await getAuthToken()
      if (!token) {
        showError('Sesi login tidak ditemukan. Silakan login ulang.')
        return
      }

      const headers = { Authorization: `Bearer ${token}` }

      const [classRes, yearRes, profileRes] = await Promise.allSettled([
        axios.get(`${API_URL}/api/school-admin/classes`, { headers }),
        axios.get(`${API_URL}/api/school-admin/academic-years`, { headers }),
        axios.get(`${API_URL}/api/school-admin/profile`, { headers }),
      ])

  
      if (classRes.status === 'fulfilled') {
        setClasses(classRes.value.data?.classes ?? [])
      } else {
        const err: any = classRes.reason
        console.error('[Classes] Gagal fetch:', extractErrorMessage(err))

        if (isSchoolInactiveError(err)) {
          setSchoolInactive(true)
        } else {
          showError(extractErrorMessage(err))
        }
        setClasses([])
      }

      // Tahun akademik
      if (yearRes.status === 'fulfilled') {
        const raw = yearRes.value.data?.academic_years
        const parsed: AcademicYear[] = Array.isArray(raw) ? raw : []
        setAcademicYears(parsed)
      } else {
        console.error('[Academic Years] Gagal fetch:', extractErrorMessage(yearRes.reason))
        setAcademicYears([])
        if (!isSchoolInactiveError(yearRes.reason)) {
          showError('Gagal memuat data tahun akademik.')
        }
      }

      // Profil sekolah
      let jenjang: Jenjang = 'SD'
      if (profileRes.status === 'fulfilled') {
        const school: SchoolProfile | undefined = profileRes.value.data?.school
        jenjang = (school?.jenjang as Jenjang) || 'SD'
      } else {
        console.error('[Profile] Gagal fetch:', extractErrorMessage(profileRes.reason))
      }

      setSchoolJenjang(jenjang)
      setName(getDefaultClassName(jenjang))
      setLevel(getDefaultLevel(jenjang))
    } catch (error: any) {
      console.error('[fetchData] Unexpected error:', error)
      showError('Terjadi kesalahan saat memuat data.')
    } finally {
      setLoading(false)
    }
  }, [API_URL])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (activeTab === 'sub-classes') {
      fetchAllSubClasses()
    }
  }, [activeTab])

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!academicYearId) {
      showError('Silakan pilih Tahun Akademik terlebih dahulu.')
      return
    }
    if (!name.trim()) {
      showError('Nama kelas tidak boleh kosong.')
      return
    }
    if (!level.trim()) {
      showError('Tingkatan level tidak boleh kosong.')
      return
    }

    setSubmitting(true)
    try {
      const token = await getAuthToken()
      if (!token) {
        showError('Sesi login tidak ditemukan.')
        return
      }

      await axios.post(
        `${API_URL}/api/school-admin/classes`,
        {
          name: name.trim(),
          level: level.trim(),
          class_type: classType,
          academic_year_id: academicYearId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      showSuccess('Data kelas berhasil ditambahkan!')
      setIsModalOpen(false)
      await fetchData()
    } catch (error: any) {
      if (isSchoolInactiveError(error)) {
        setSchoolInactive(true)
        setIsModalOpen(false)
      } else {
        showError('Gagal menambah kelas: ' + extractErrorMessage(error))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClass = async (id: string) => {
    if (
      !confirm(
        'Apakah Anda yakin ingin menghapus kelas ini? Semua sub kelas di dalamnya juga akan ikut terhapus.'
      )
    )
      return

    try {
      const token = await getAuthToken()
      if (!token) {
        showError('Sesi login tidak ditemukan.')
        return
      }

      await axios.delete(`${API_URL}/api/school-admin/classes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      showSuccess('Kelas berhasil dihapus!')
      await fetchData()
      if (activeTab === 'sub-classes') {
        await fetchAllSubClasses()
      }
    } catch (error: any) {
      if (isSchoolInactiveError(error)) {
        setSchoolInactive(true)
      } else {
        showError('Gagal menghapus kelas: ' + extractErrorMessage(error))
      }
    }
  }

  const handleOpenClassModal = () => {
    setAcademicYearId('')
    setName(getDefaultClassName(schoolJenjang))
    setLevel(getDefaultLevel(schoolJenjang))
    setClassType('Umum')
    setIsCustomName(false)
    setIsCustomType(false)
    setIsModalOpen(true)
  }

  const fetchSubClasses = async (classGroupId: string) => {
    setSubClassLoading(true)
    setSubClassError('')
    try {
      const token = await getAuthToken()
      if (!token) {
        setSubClassError('Sesi login tidak ditemukan.')
        return
      }

      const res = await axios.get(
        `${API_URL}/api/school-admin/classes/${classGroupId}/sub-classes`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSubClasses(res.data?.sub_classes ?? [])
    } catch (error: any) {
      console.error('[SubClass] Gagal fetch:', error)
      setSubClasses([])
      if (isSchoolInactiveError(error)) {
        setSchoolInactive(true)
        setIsSubClassModalOpen(false)
      } else {
        setSubClassError(extractErrorMessage(error) || 'Gagal memuat daftar sub kelas.')
      }
    } finally {
      setSubClassLoading(false)
    }
  }

  const fetchAllSubClasses = async () => {
    setAllSubClassesLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) {
        showError('Sesi login tidak ditemukan.')
        return
      }

      const res = await axios.get(
        `${API_URL}/api/school-admin/sub-classes`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setAllSubClasses(res.data?.sub_classes ?? [])
    } catch (error: any) {
      console.error('[All SubClasses] Gagal fetch:', error)
      setAllSubClasses([])
      if (isSchoolInactiveError(error)) {
        setSchoolInactive(true)
      }
    } finally {
      setAllSubClassesLoading(false)
    }
  }

  const handleOpenSubClassModal = async (cls: ClassItem) => {
    setSelectedClassForSub(cls)
    setSubClassName('')
    setSubClassCapacity(0)
    setSubClassNotes('')
    setSubClassError('')
    setIsSubClassModalOpen(true)
    await fetchSubClasses(cls.id)
  }

  const handleCreateSubClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClassForSub) return
    if (!subClassName.trim()) {
      setSubClassError('Nama sub kelas tidak boleh kosong.')
      return
    }

    setSubClassSubmitting(true)
    setSubClassError('')

    try {
      const token = await getAuthToken()
      if (!token) {
        setSubClassError('Sesi login tidak ditemukan.')
        return
      }

      await axios.post(
        `${API_URL}/api/school-admin/sub-classes`,
        {
          class_group_id: selectedClassForSub.id,
          name: subClassName.trim(),
          capacity: Number(subClassCapacity) || 0,
          notes: subClassNotes.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setSubClassName('')
      setSubClassCapacity(0)
      setSubClassNotes('')
      await fetchSubClasses(selectedClassForSub.id)
      showSuccess('Sub kelas berhasil ditambahkan!')
    } catch (error: any) {
      if (isSchoolInactiveError(error)) {
        setSchoolInactive(true)
        setIsSubClassModalOpen(false)
      } else {
        setSubClassError('Gagal menambah sub kelas: ' + extractErrorMessage(error))
      }
    } finally {
      setSubClassSubmitting(false)
    }
  }

  const handleDeleteSubClass = async (subId: string) => {
    if (!confirm('Yakin ingin menghapus sub kelas ini?')) return

    try {
      const token = await getAuthToken()
      if (!token) return

      await axios.delete(
        `${API_URL}/api/school-admin/sub-classes/${subId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (selectedClassForSub) {
        await fetchSubClasses(selectedClassForSub.id)
      }
      if (activeTab === 'sub-classes') {
        await fetchAllSubClasses()
      }

      showSuccess('Sub kelas berhasil dihapus!')
    } catch (error: any) {
      if (isSchoolInactiveError(error)) {
        setSchoolInactive(true)
        setIsSubClassModalOpen(false)
      } else {
        showError('Gagal menghapus sub kelas: ' + extractErrorMessage(error))
      }
    }
  }

  const renderClassOptions = () => {
    const options = CLASS_OPTIONS[schoolJenjang] ?? CLASS_OPTIONS.SMP
    return options.map((opt) => (
      <option key={opt} value={opt}>{opt}</option>
    ))
  }

  if (schoolInactive) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-tp-text">
            Kelola Kelas ({schoolJenjang})
          </h1>
          <p className="text-xs text-tp-muted">
            Manajemen kelas dan struktur rombongan belajar berdasarkan jenjang.
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-red-100">
            <AlertCircle size={28} className="text-red-600" />
          </div>
          <h3 className="text-base font-bold text-red-900 mb-2">
            Sekolah Anda Sedang Dinonaktifkan
          </h3>
          <p className="text-xs text-red-700 mb-1 max-w-md mx-auto">
            Akses ke fitur Kelola Kelas untuk sementara waktu ditutup.
          </p>
          <p className="text-xs text-red-700 max-w-md mx-auto">
            Silakan hubungi administrator untuk informasi lebih lanjut.
          </p>
        </div>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-tp-text">
          Kelola Kelas ({schoolJenjang})
        </h1>
        <p className="text-xs text-tp-muted">
          Manajemen kelas dan struktur rombongan belajar berdasarkan jenjang.
        </p>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 flex items-center gap-3">
          <CheckCircle size={20} className="text-tp-green shrink-0" />
          <span className="text-xs font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 flex items-center gap-3">
          <X size={20} className="text-red-500 shrink-0" />
          <span className="text-xs font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Main Card */}
      <div className="rounded-2xl border border-tp-border bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-tp-border">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('classes')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                activeTab === 'classes'
                  ? 'bg-tp-green text-white'
                  : 'border border-tp-border text-tp-muted hover:bg-gray-50'
              }`}
            >
              Daftar Kelas
            </button>
            <button
              onClick={() => setActiveTab('sub-classes')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                activeTab === 'sub-classes'
                  ? 'bg-tp-green text-white'
                  : 'border border-tp-border text-tp-muted hover:bg-gray-50'
              }`}
            >
              Daftar Sub Kelas
            </button>
          </div>
          {activeTab === 'classes' && (
            <Button
              onClick={handleOpenClassModal}
              className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover"
            >
              <Plus size={16} />
              Tambah Kelas
            </Button>
          )}
          {activeTab === 'sub-classes' && (
            <Button
              onClick={fetchAllSubClasses}
              variant="outline"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
            >
              <Loader2
                size={14}
                className={allSubClassesLoading ? 'animate-spin' : ''}
              />
              Muat Ulang
            </Button>
          )}
        </div>

        {activeTab === 'classes' && (
          <>
            {loading ? (
              <p className="text-center text-xs text-tp-muted py-8">Memuat daftar kelas...</p>
            ) : classes.length === 0 ? (
              <div className="text-center py-12 text-tp-muted text-xs">
                Belum ada data kelas yang terdaftar. Silakan buat master kelas baru.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-tp-border bg-gray-50 text-xs text-tp-muted uppercase tracking-wider">
                      <th className="py-3 px-4">No</th>
                      <th className="py-3 px-4">Nama Sekolah</th>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4">Tipe Kelas</th>
                      <th className="py-3 px-4">Tahun Akademik</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tp-border">
                    {classes.map((cls, index) => (
                      <tr key={cls.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-tp-muted">{index + 1}</td>
                        <td className="py-3 px-4 font-medium text-tp-text">{cls.school_name}</td>
                        <td className="py-3 px-4 font-semibold text-tp-text">{cls.name}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                            {cls.class_type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {cls.academic_year_name} - Semester {cls.semester}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenSubClassModal(cls)}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Kelola Sub Kelas"
                            >
                              <Layers size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClass(cls.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Kelas"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Daftar Sub Kelas */}
        {activeTab === 'sub-classes' && (
          <>
            {allSubClassesLoading ? (
              <p className="text-center text-xs text-tp-muted py-8">
                Memuat daftar sub kelas...
              </p>
            ) : allSubClasses.length === 0 ? (
              <div className="text-center py-12 text-tp-muted text-xs">
                <Layers size={32} className="mx-auto text-tp-muted mb-3 opacity-50" />
                <p className="font-semibold text-tp-text mb-1">Belum Ada Sub Kelas</p>
                <p>
                  Buka tab <strong>Daftar Kelas</strong>, lalu klik ikon{' '}
                  <Layers size={12} className="inline" /> di kolom Aksi untuk mengelola sub kelas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-tp-border bg-gray-50 text-xs text-tp-muted uppercase tracking-wider">
                      <th className="py-3 px-4">No</th>
                      <th className="py-3 px-4">Sub Kelas</th>
                      <th className="py-3 px-4">Master Kelas</th>
                      <th className="py-3 px-4">Tipe</th>
                      <th className="py-3 px-4">Tahun Akademik</th>
                      <th className="py-3 px-4">Kapasitas</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tp-border">
                    {allSubClasses.map((sub, index) => (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-tp-muted">{index + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-tp-text">
                              {sub.name}
                            </span>
                            {!sub.is_active && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded">
                                Nonaktif
                              </span>
                            )}
                          </div>
                          {sub.notes && (
                            <p className="text-[10px] text-tp-muted italic mt-0.5">
                              "{sub.notes}"
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-tp-text">
                            {sub.class_group_name}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                            {sub.class_group_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-tp-muted">
                          {sub.academic_year_name} - Semester {sub.semester}
                        </td>
                        <td className="py-3 px-4">
                          {sub.capacity > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs">
                              <Users size={12} className="text-tp-muted" />
                              {sub.capacity}
                            </span>
                          ) : (
                            <span className="text-xs text-tp-muted">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => handleDeleteSubClass(sub.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Sub Kelas"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Daftar Murid */}
        {activeTab === 'students' && (
          <div className="text-center py-12 text-tp-muted text-xs">
            <Users size={32} className="mx-auto text-tp-muted mb-3 opacity-50" />
            <p className="font-semibold text-tp-text mb-1">Fitur Daftar Murid</p>
            <p>Belum diimplementasikan. Silakan cek kembali nanti.</p>
          </div>
        )}
      </div>

      {/* Tambah Kelas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-tp-border pb-3">
              <h3 className="text-sm font-bold text-tp-text">
                Tambah Data Kelas ({schoolJenjang})
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-tp-muted hover:text-tp-text"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              {/* Tahun Akademik */}
              <div>
                <label className="block text-xs font-semibold text-tp-muted mb-1">
                  Tahun Akademik *
                </label>
                <select
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white"
                  required
                  disabled={loading}
                >
                  <option value="">
                    {loading
                      ? 'Memuat tahun akademik...'
                      : academicYears.length === 0
                      ? '-- Belum ada tahun akademik --'
                      : 'Pilih Tahun Akademik'}
                  </option>
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name} - Semester {ay.semester} {ay.is_active ? '(Aktif)' : ''}
                    </option>
                  ))}
                </select>
                {academicYears.length === 0 && !loading && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    Belum ada tahun akademik. Silakan tambahkan terlebih dahulu di menu Tahun Akademik.
                  </p>
                )}
              </div>

              {/* Field Lainnya */}
              {academicYearId && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-tp-muted">
                        Pilih atau Ketik Kelas *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !isCustomName
                          setIsCustomName(next)
                          setName(next ? '' : getDefaultClassName(schoolJenjang))
                        }}
                        className="text-[10px] text-tp-green font-medium hover:underline"
                      >
                        {isCustomName ? 'Gunakan Pilihan Default' : '+ Ketik Manual'}
                      </button>
                    </div>

                    {isCustomName ? (
                      <input
                        type="text"
                        value={name}
                        placeholder="Contoh: KELAS KHUSUS"
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                        required
                      />
                    ) : (
                      <select
                        value={name}
                        onChange={(e) => {
                          const val = e.target.value
                          setName(val)
                          const match = val.match(/\d+/)
                          if (match) setLevel(match[0])
                        }}
                        className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white"
                        required
                      >
                        {renderClassOptions()}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-tp-muted mb-1">
                      Tingkatan Level *
                    </label>
                    <input
                      type="text"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      placeholder="Contoh: 7"
                      className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-tp-muted">
                        Tipe Kelas *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !isCustomType
                          setIsCustomType(next)
                          setClassType(next ? '' : 'Umum')
                        }}
                        className="text-[10px] text-tp-green font-medium hover:underline"
                      >
                        {isCustomType ? 'Gunakan Pilihan Default' : '+ Ketik Manual'}
                      </button>
                    </div>

                    {isCustomType ? (
                      <input
                        type="text"
                        value={classType}
                        placeholder="Contoh: Kelas Internasional"
                        onChange={(e) => setClassType(e.target.value)}
                        className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green"
                        required
                      />
                    ) : (
                      <select
                        value={classType}
                        onChange={(e) => setClassType(e.target.value)}
                        className="w-full rounded-xl border border-tp-border px-3.5 py-2.5 text-sm outline-none focus:border-tp-green bg-white"
                        required
                      >
                        {CLASS_TYPE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-tp-border bg-white px-4 py-2.5 text-xs font-semibold text-tp-muted hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !academicYearId}
                  className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2.5 text-xs font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {submitting ? 'Menyimpan...' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kelola Sub Kelas */}
      {isSubClassModalOpen && selectedClassForSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-tp-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-tp-text flex items-center gap-2">
                  <Layers size={16} className="text-tp-green" />
                  Kelola Sub Kelas
                </h3>
                <p className="text-[11px] text-tp-muted mt-0.5">
                  {selectedClassForSub.name} • {selectedClassForSub.class_type} • Semester {selectedClassForSub.semester}
                </p>
              </div>
              <button
                onClick={() => setIsSubClassModalOpen(false)}
                className="text-tp-muted hover:text-tp-text"
              >
                <X size={18} />
              </button>
            </div>

            {/* Inline error */}
            {subClassError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-center gap-2">
                <X size={14} className="text-red-500 shrink-0" />
                <span className="text-[11px] text-red-800 font-medium">{subClassError}</span>
              </div>
            )}

            {/* Form Tambah Sub Kelas */}
            <form
              onSubmit={handleCreateSubClass}
              className="space-y-3 p-4 bg-gray-50 rounded-xl border border-tp-border"
            >
              <h4 className="text-xs font-bold text-tp-text">
                Tambah Sub Kelas Baru
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-semibold text-tp-muted mb-1">
                    Nama Sub Kelas *
                  </label>
                  <input
                    type="text"
                    value={subClassName}
                    onChange={(e) => setSubClassName(e.target.value)}
                    placeholder="Contoh: 7 IPA 1, 7A, IPA Unggulan"
                    className="w-full rounded-xl border border-tp-border px-3 py-2 text-sm outline-none focus:border-tp-green bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-tp-muted mb-1">
                    Kapasitas
                  </label>
                  <input
                    type="number"
                    value={subClassCapacity}
                    onChange={(e) => setSubClassCapacity(Number(e.target.value))}
                    min={0}
                    placeholder="0"
                    className="w-full rounded-xl border border-tp-border px-3 py-2 text-sm outline-none focus:border-tp-green bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-tp-muted mb-1">
                  Catatan (opsional)
                </label>
                <input
                  type="text"
                  value={subClassNotes}
                  onChange={(e) => setSubClassNotes(e.target.value)}
                  placeholder="Contoh: Kelas unggulan bidang MIPA"
                  className="w-full rounded-xl border border-tp-border px-3 py-2 text-sm outline-none focus:border-tp-green bg-white"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={subClassSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-tp-green px-4 py-2 text-xs font-semibold text-white hover:bg-tp-green-hover disabled:opacity-50"
                >
                  {subClassSubmitting ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Plus size={12} />
                  )}
                  {subClassSubmitting ? 'Menyimpan...' : 'Tambah Sub Kelas'}
                </button>
              </div>
            </form>

            {/* List Sub Kelas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-tp-text">
                  Daftar Sub Kelas ({subClasses.length})
                </h4>
                <button
                  type="button"
                  onClick={() => selectedClassForSub && fetchSubClasses(selectedClassForSub.id)}
                  className="text-[10px] text-tp-green font-medium hover:underline"
                >
                  Muat Ulang
                </button>
              </div>

              {subClassLoading ? (
                <div className="text-center py-8 text-tp-muted text-xs">
                  Memuat sub kelas...
                </div>
              ) : subClasses.length === 0 ? (
                <div className="text-center py-8 text-tp-muted text-xs bg-gray-50 rounded-xl">
                  Belum ada sub kelas. Silakan tambahkan di atas.
                </div>
              ) : (
                <div className="space-y-2">
                  {subClasses.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 border border-tp-border rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-tp-text truncate">
                            {sub.name}
                          </span>
                          {sub.code && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {sub.code}
                            </span>
                          )}
                          {!sub.is_active && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-tp-muted flex-wrap">
                          {sub.capacity > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Users size={10} />
                              Kapasitas: {sub.capacity}
                            </span>
                          )}
                          {sub.homeroom_teacher_name && (
                            <span>Wali: {sub.homeroom_teacher_name}</span>
                          )}
                          {sub.notes && (
                            <span className="italic truncate">"{sub.notes}"</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSubClass(sub.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                        title="Hapus Sub Kelas"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}