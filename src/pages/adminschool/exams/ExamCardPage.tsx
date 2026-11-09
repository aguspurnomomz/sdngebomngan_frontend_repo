import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import QRCode from 'react-qr-code'
import {
  getExamCards,
  listExamRooms,
} from '../../../services/examRoomService'

import type { ExamRoom } from '../../../services/examRoomService'
import { useAccessToken } from '../../../features/hooks/useAccessToken' 

interface CardItem {
  student_id: string
  full_name: string
  nisn: string
  student_number: string
  sub_class_name: string
  class_name: string
  room_name: string
  seat_number: string
}

interface ExamInfo {
  title: string
  subject: string
  date: string
  start_time: string
  end_time: string
}

export default function ExamCardPage() {
  const { scheduleId } = useParams<{ scheduleId: string }>()
  const navigate = useNavigate()
  const { token } = useAccessToken() 

  const [schoolName, setSchoolName] = useState('')
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null)
  const [cards, setCards] = useState<CardItem[]>([])
  const [rooms, setRooms] = useState<ExamRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Format tanggal
  const formattedDate = useMemo(() => {
    if (!examInfo?.date) return ''
    try {
      const d = new Date(examInfo.date)
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return examInfo.date
    }
  }, [examInfo])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [roomData, cardData] = await Promise.all([
        listExamRooms(token),
        getExamCards(token, scheduleId!, selectedRoom || undefined),
      ])
      setRooms(roomData.filter((r) => r.is_active))
      setSchoolName(cardData.school_name)
      setExamInfo(cardData.exam_info)
      setCards(cardData.cards)
    } catch (e: any) {
      alert(e.response?.data?.error || 'Gagal memuat kartu ujian')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token && scheduleId) fetchData()
  }, [token, scheduleId, selectedRoom])

  const handlePrint = () => {
    if (cards.length === 0) {
      alert('Tidak ada kartu untuk dicetak.')
      return
    }
    window.print()
  }

  if (loading) {
    return <div className="p-6 text-center text-tp-muted">Memuat kartu ujian...</div>
  }

  return (
    <div className="min-h-screen bg-tp-bg">
      {/* ============ TOOLBAR (tidak ikut print) ============ */}
      <div className="print:hidden sticky top-0 z-20 border-b border-tp-border bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-tp-text">Kartu Ujian</h1>
            <p className="text-sm text-tp-muted">
              {examInfo?.title} — {cards.length} kartu
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="rounded-lg border border-tp-border bg-white px-3 py-2 text-sm"
            >
              <option value="">Semua Ruangan</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_name}
                </option>
              ))}
            </select>
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border border-tp-border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              ← Kembali
            </button>
            <button
              onClick={handlePrint}
              className="rounded-lg bg-tp-green px-4 py-2 text-sm font-semibold text-white hover:bg-tp-green-hover"
            >
              🖨️ Cetak
            </button>
          </div>
        </div>
      </div>

      {/* ============ AREA KARTU (yang dicetak) ============ */}
      {cards.length === 0 ? (
        <div className="p-12 text-center text-tp-muted">
          Belum ada siswa yang ditempatkan ke ruangan. Lakukan penempatan terlebih dahulu.
        </div>
      ) : (
        <div className="print-container mx-auto max-w-[210mm] p-6 print:p-0">
          <div className="cards-grid">
            {cards.map((card) => (
              <div key={card.student_id} className="exam-card">
                {/* Header */}
                <div className="card-header">
                  <div className="card-logo">🎓</div>
                  <div className="card-header-text">
                    <p className="card-school">{schoolName || 'Nama Sekolah'}</p>
                    <p className="card-title">KARTU PESERTA UJIAN</p>
                  </div>
                </div>

                {/* Info Ujian */}
                <div className="card-exam-info">
                  <p>
                    <span className="label">Ujian</span>
                    <span className="value">{examInfo?.subject}</span>
                  </p>
                  <p>
                    <span className="label">Hari / Tanggal</span>
                    <span className="value">{formattedDate}</span>
                  </p>
                  <p>
                    <span className="label">Waktu</span>
                    <span className="value">
                      {examInfo?.start_time} – {examInfo?.end_time} WIB
                    </span>
                  </p>
                </div>

                {/* Divider */}
                <div className="card-divider" />

                {/* Info Siswa + QR */}
                <div className="card-body">
                  <div className="card-info">
                    <p>
                      <span className="label">Nama</span>
                      <span className="value strong">{card.full_name}</span>
                    </p>
                    <p>
                      <span className="label">NISN</span>
                      <span className="value">{card.nisn || '-'}</span>
                    </p>
                    <p>
                      <span className="label">Kelas</span>
                      <span className="value">
                        {card.class_name} {card.sub_class_name && `• ${card.sub_class_name}`}
                      </span>
                    </p>
                    <p>
                      <span className="label">Ruang</span>
                      <span className="value strong">{card.room_name}</span>
                    </p>
                    <p>
                      <span className="label">No. Kursi</span>
                      <span className="value seat">{card.seat_number || '-'}</span>
                    </p>
                  </div>

                  <div className="card-qr">
                    <QRCode
                      value={JSON.stringify({
                        sid: card.student_id,
                        nisn: card.nisn,
                        sched: scheduleId,
                      })}
                      size={80}
                      level="M"
                    />
                    <p className="qr-label">Scan Verifikasi</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="card-footer">
                  <p>Tunjukkan kartu ini kepada pengawas</p>
                  <p className="footer-small">
                    Kartu ini sah tanpa perlu tanda tangan
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ CSS PRINT & CARD LAYOUT ============ */}
      <style>{`
        /* Grid untuk preview di layar (2 kolom) */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 16px;
        }

        /* Kartu style */
        .exam-card {
          width: 100%;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 14px;
          box-sizing: border-box;
          page-break-inside: avoid;
          break-inside: avoid;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          color: #1f2937;
          display: flex;
          flex-direction: column;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .card-logo {
          font-size: 24px;
          line-height: 1;
        }
        .card-header-text { flex: 1; }
        .card-school {
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: #111827;
        }
        .card-title {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6b7280;
          margin-top: 1px;
        }

        .card-exam-info {
          background: #f9fafb;
          border-radius: 8px;
          padding: 8px 10px;
          margin-bottom: 8px;
        }
        .card-exam-info p {
          display: flex;
          justify-content: space-between;
          margin: 0;
          padding: 1px 0;
        }

        .label {
          color: #6b7280;
          font-size: 10px;
          font-weight: 500;
        }
        .value {
          color: #111827;
          font-size: 10px;
          font-weight: 500;
          text-align: right;
          max-width: 62%;
        }
        .value.strong { font-weight: 700; }
        .value.seat {
          font-family: 'Courier New', monospace;
          font-weight: 700;
          font-size: 12px;
          background: #dcfce7;
          color: #166534;
          padding: 1px 8px;
          border-radius: 4px;
        }

        .card-divider {
          border-top: 1px dashed #d1d5db;
          margin: 4px 0 8px;
        }

        .card-body {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }
        .card-info { flex: 1; }
        .card-info p {
          display: flex;
          flex-direction: column;
          margin: 0 0 4px;
        }
        .card-info .label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 1px;
        }
        .card-info .value {
          text-align: left;
          font-size: 11px;
          max-width: 100%;
        }

        .card-qr {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
        }
        .qr-label {
          font-size: 8px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .card-footer {
          margin-top: 8px;
          padding-top: 6px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }
        .card-footer p {
          margin: 0;
          font-size: 9px;
          color: #6b7280;
          font-style: italic;
        }
        .footer-small {
          font-size: 8px !important;
          margin-top: 1px !important;
        }

        /* ============ PRINT STYLES ============ */
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          body * {
            visibility: hidden;
          }
          .print-container,
          .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }

          .cards-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8mm;
            padding: 0;
          }

          .exam-card {
            border: 1.5px solid #000000;
            border-radius: 8px;
            padding: 8px 10px;
            box-shadow: none;
            height: 70mm;
            font-size: 10px;
          }

          .value.seat {
            background: none !important;
            border: 1px solid #000;
            color: #000 !important;
            padding: 0 4px;
          }

          .card-exam-info {
            background: none !important;
            border: 1px solid #e5e7eb;
          }
        }

        /* Responsive untuk mobile */
        @media (max-width: 768px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}