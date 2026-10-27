import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'


export type ExportEntry = {
  day_of_week: number
  period_start: number
  period_end: number
  subject_name: string
  teacher_name: string
  room: string
}

export type ExportTimeSlot = {
  period_number: number
  start_time: string
  end_time: string
  is_break: boolean
  is_override?: boolean
}

type ExportExcelParams = {
  entries: ExportEntry[]
  defaultTimeSlots: ExportTimeSlot[]
  timeSlotsByDay: Record<string, ExportTimeSlot[]>
  days: { id: number; label: string }[]
  periods: number[]
  className: string
  semester: string
  academicYear: string
}

export async function exportTimetableToExcel({
  entries,
  defaultTimeSlots,
  timeSlotsByDay,
  days,
  periods,
  className,
  semester,
  academicYear,
}: ExportExcelParams) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Jadwal Pelajaran')

  // Judul
  ws.mergeCells('A1', `${String.fromCharCode(65 + days.length)}1`)
  const titleCell = ws.getCell('A1')
  titleCell.value = `JADWAL PELAJARAN - ${className}`
  titleCell.font = { size: 14, bold: true }
  titleCell.alignment = { horizontal: 'center' }

  ws.mergeCells('A2', `${String.fromCharCode(65 + days.length)}2`)
  const subCell = ws.getCell('A2')
  subCell.value = `Tahun Pelajaran ${academicYear} - Semester ${semester}`
  subCell.alignment = { horizontal: 'center' }

  // Header row
  const headerRow = ws.getRow(4)
  headerRow.getCell(1).value = 'Jam'
  headerRow.getCell(1).font = { bold: true }
  headerRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  headerRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' },
  }

  days.forEach((d, i) => {
    const cell = headerRow.getCell(i + 2)
    cell.value = d.label
    cell.font = { bold: true }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' },
    }
  })

  // Column widths
  ws.getColumn(1).width = 18
  days.forEach((_, i) => {
    ws.getColumn(i + 2).width = 22
  })

  // Helper: cari entry untuk cell
  const findEntry = (day: number, period: number) =>
    entries.find(
      (e) =>
        e.day_of_week === day &&
        e.period_start <= period &&
        e.period_end >= period
    )

  // Helper: ambil jam untuk day & period
  const getTime = (day: number, period: number) => {
    const daySlots = timeSlotsByDay[String(day)] || []
    const slot = daySlots.find((s) => s.period_number === period)
    if (slot) return slot
    return defaultTimeSlots.find((s) => s.period_number === period)
  }

  // Isi baris
  periods.forEach((period, rowIdx) => {
    const row = ws.getRow(5 + rowIdx)

    // Kolom pertama: jam default (dari hari pertama sebagai acuan umum)
    const defaultSlot = defaultTimeSlots.find(
      (s) => s.period_number === period
    )
    const timeText = defaultSlot
      ? `JP ${period} (${defaultSlot.start_time}-${defaultSlot.end_time})`
      : `JP ${period}`
    row.getCell(1).value = timeText
    row.getCell(1).font = { bold: true }
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF9FAFB' },
    }

    days.forEach((d, dayIdx) => {
      const cell = row.getCell(dayIdx + 2)
      const entry = findEntry(d.id, period)
      const timeInfo = getTime(d.id, period)

      if (entry && entry.period_start === period) {
        // Start dari entry (bisa span)
        const lines = [
          entry.subject_name || '-',
          entry.teacher_name ? `Guru: ${entry.teacher_name}` : '',
          entry.room ? `Ruang: ${entry.room}` : '',
        ].filter(Boolean)

        cell.value = lines.join('\n')
        cell.alignment = { wrapText: true, vertical: 'middle' }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD1FAE5' }, // hijau muda
        }
        cell.font = { bold: true, size: 10 }

        // Merge jika span > 1
        if (entry.period_end > entry.period_start) {
          const rowSpan = entry.period_end - entry.period_start + 1
          const colLetter = String.fromCharCode(66 + dayIdx) // B, C, D...
          ws.mergeCells(
            `${colLetter}${5 + rowIdx}`,
            `${colLetter}${5 + rowIdx + rowSpan - 1}`
          )
        }
      } else if (entry) {
        // Bukan start dari entry yang span → sudah di-merge, skip
        return
      } else {
        // Kosong / break
        if (timeInfo?.is_break) {
          cell.value = 'ISTIRAHAT'
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          cell.font = { italic: true, color: { argb: 'FFB45309' } }
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF3C7' },
          }
        } else {
          cell.value = ''
        }
      }

      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })
  })

  // Border untuk header & kolom jam
  for (let r = 4; r <= 4 + periods.length; r++) {
    for (let c = 1; c <= 1 + days.length; c++) {
      const cell = ws.getCell(r, c)
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    }
  }

  // Generate file
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, `Jadwal-${className}-${semester}.xlsx`)
}


export async function exportTimetableToPDF(
  elementId: string,
  filename: string
) {
  const element = document.getElementById(elementId)
  if (!element) {
    alert('Tabel tidak ditemukan untuk di-export')
    return
  }

  const canvas = await html2canvas(element, {
    scale: 2, // kualitas lebih tinggi
    useCORS: true,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
  })

  const imgData = canvas.toDataURL('image/png')

  // Tentukan orientasi berdasarkan lebar tabel
  const isLandscape = canvas.width > canvas.height
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()

  const imgWidth = pdfWidth - 20 // margin 10mm kiri-kanan
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  // Jika terlalu tinggi, bagi ke beberapa halaman
  let heightLeft = imgHeight
  let position = 10

  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
  heightLeft -= pdfHeight - 20

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
    heightLeft -= pdfHeight - 20
  }

  pdf.save(filename)
}