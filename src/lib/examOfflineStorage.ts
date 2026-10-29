const KEY_PREFIX = 'tp_exam_'

export type ExamSnapshot = {
  session_token: string
  schedule_id: string
  exam_id: string
  student_id: string
  student_name: string
  student_nisn: string
  exam_title: string
  exam_subject: string
  image_url?: string   
  duration_minutes: number
  passing_score: number
  total_score: number
  started_at: string            
  expires_at: string           
  server_time: string        
  remaining_seconds: number  
  questions: ExamQuestion[]
  saved_at: string
}

export type ExamQuestion = {
  id: string
  type: 'multiple_choice' | 'essay'
  order: number
  question_text: string
  options?: Record<string, string> | null
  score: number
  min_words?: number
  cognitive_level?: string
  image_url?: string
  // Note: correct_answer & answer_key TIDAK dikirim ke client untuk keamanan
}

export type AnswerMap = Record<string, string>

export type SubmitQueueItem = {
  session_token: string
  answers: AnswerMap
  tab_switch_count: number
  time_spent_seconds: number
  queued_at: string
}


export function saveSnapshot(snapshot: ExamSnapshot): void {
  try {
    localStorage.setItem(
      `${KEY_PREFIX}snapshot_${snapshot.schedule_id}`,
      JSON.stringify(snapshot)
    )
  } catch (e) {
    console.error('Gagal simpan snapshot:', e)
  }
}

export function loadSnapshot(scheduleId: string): ExamSnapshot | null {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}snapshot_${scheduleId}`)
    if (!raw) return null
    return JSON.parse(raw) as ExamSnapshot
  } catch {
    return null
  }
}

export function clearSnapshot(scheduleId: string): void {
  try {
    localStorage.removeItem(`${KEY_PREFIX}snapshot_${scheduleId}`)
  } catch {
    // ignore
  }
}


export function saveAnswers(scheduleId: string, answers: AnswerMap): void {
  try {
    localStorage.setItem(
      `${KEY_PREFIX}answers_${scheduleId}`,
      JSON.stringify(answers)
    )
  } catch (e) {
    console.error('Gagal simpan jawaban:', e)
  }
}

export function loadAnswers(scheduleId: string): AnswerMap {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}answers_${scheduleId}`)
    if (!raw) return {}
    return JSON.parse(raw) as AnswerMap
  } catch {
    return {}
  }
}

export function clearAnswers(scheduleId: string): void {
  try {
    localStorage.removeItem(`${KEY_PREFIX}answers_${scheduleId}`)
  } catch {
    // ignore
  }
}


export function saveTabSwitchCount(scheduleId: string, count: number): void {
  try {
    localStorage.setItem(`${KEY_PREFIX}tabsw_${scheduleId}`, String(count))
  } catch {
    // ignore
  }
}

export function loadTabSwitchCount(scheduleId: string): number {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}tabsw_${scheduleId}`)
    return raw ? parseInt(raw, 10) : 0
  } catch {
    return 0
  }
}


export function queueSubmit(item: SubmitQueueItem): void {
  try {
    const queue = loadSubmitQueue()
    queue.push(item)
    localStorage.setItem(`${KEY_PREFIX}submit_queue`, JSON.stringify(queue))
  } catch (e) {
    console.error('Gagal queue submit:', e)
  }
}

export function loadSubmitQueue(): SubmitQueueItem[] {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}submit_queue`)
    return raw ? (JSON.parse(raw) as SubmitQueueItem[]) : []
  } catch {
    return []
  }
}

export function removeFromQueue(sessionToken: string): void {
  try {
    const queue = loadSubmitQueue().filter((q) => q.session_token !== sessionToken)
    localStorage.setItem(`${KEY_PREFIX}submit_queue`, JSON.stringify(queue))
  } catch {
    // ignore
  }
}



export function clearAllForSchedule(scheduleId: string): void {
  clearSnapshot(scheduleId)
  clearAnswers(scheduleId)
  try {
    localStorage.removeItem(`${KEY_PREFIX}tabsw_${scheduleId}`)
  } catch {
    // ignore
  }
}