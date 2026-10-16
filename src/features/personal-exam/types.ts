export type PersonalStudent = {
  id: string
  owner_user_id: string
  full_name: string
  student_number: string
  nisn: string
  email: string
  notes: string
  is_active: boolean
  created_at: string
  updated_at: string
  total_exams_taken?: number
}

export type CreatePersonalStudentPayload = {
  full_name: string
  student_number?: string
  nisn?: string
  email?: string
  notes?: string
}

export type UpdatePersonalStudentPayload = {
  full_name?: string
  student_number?: string
  nisn?: string
  email?: string
  notes?: string
  is_active?: boolean
}


export type ExamQuestion = {
  id: string
  type: 'multiple_choice' | 'essay'
  order: number
  question_text: string
  options?: string[] | null
  correct_answer?: string
  answer_key?: string
  rubric?: any
  explanation?: string
  cognitive_level?: string
  score: number
  min_words?: number
  image_url?: string
}

export type PersonalExam = {
  id: string
  title: string
  description: string
  subject: string
  exam_type: string          // regular | uts | uas | remedial | tryout | quiz
  grade_level: string
  phase: string
  duration_minutes: number
  total_questions: number
  total_score: number
  passing_score: number
  status: 'draft' | 'published' | 'archived'
  is_active: boolean
  created_at: string
  updated_at: string
  published_at: string | null
  participant_count?: number
  questions?: ExamQuestion[]
  scoring_config?: any
}

export type CreatePersonalExamPayload = {
  title: string
  description?: string
  subject: string
  exam_type?: string
  grade_level?: string
  phase?: string
  duration_minutes: number
  passing_score?: number
  scoring_config?: any
  questions: ExamQuestion[]
}

export type UpdatePersonalExamPayload = CreatePersonalExamPayload


export type ExamCostPreview = {
  exam_id: string
  status: string
  total_questions: number
  teacher_type: 'b2c' | 'b2b' | 'hybrid'
  base_cost: number
  manual_extra_cost: number
  total_cost: number
  current_balance: number
  sufficient: boolean
  breakdown: {
    teacher_type: string
    total_questions: number
    base_publish_cost: number
    manual_extra_multiplier: number
    manual_extra_cost_per_25: number
    manual_extra_total: number
    grand_total: number
  }
}


export type ExamParticipant = {
  id: string
  personal_student_id: string
  full_name: string
  student_number: string
  nisn: string
  email: string
  access_code: string | null
  assigned_at: string
  expires_at: string | null
  exam_url?: string | null           
  submission_status?: 'not_started' | 'in_progress' | 'submitted' | 'graded' | 'graded_with_pending' | null   
  submission_id?: string | null
  percentage?: number | null        
  is_passed?: boolean | null
}

export type ParticipantsListResponse = {
  total: number
  with_code: number
  without_code: number
  submitted: number
  participants: ExamParticipant[]
}

export type AssignParticipantsPayload = {
  personal_student_ids: string[]
  expires_at?: string
}


export type QRSheetEntry = {
  full_name: string
  student_number: string
  nisn: string
  access_code: string
  exam_url: string
}

export type QRSheetResponse = {
  exam: {
    id: string
    title: string
    subject: string
    total_questions: number
    duration_minutes: number
    exam_date: string
  }
  total: number
  entries: QRSheetEntry[]
}


export type TokenBalance = {
  current_balance: number
  total_credit: number
  total_debit: number
  total_transactions: number
  last_transaction_at: string | null
}

export type TokenTransaction = {
  id: string
  amount: number
  balance_after: number
  action: string
  reference_type: string | null
  reference_id: string | null
  metadata: any
  created_at: string
}

export type TokenPricingItem = {
  feature_key: string
  display_name: string
  description: string
  token_cost: number
  applies_to_teacher_type: string
}


export type PublicExamPreview = {
  valid: boolean
  participant_id: string
  exam_id: string
  exam_title: string
  exam_subject: string
  exam_description: string
  duration_minutes: number
  total_questions: number
  passing_score: number
  student_name: string
  student_number: string
  has_submitted: boolean
}

export type StartExamResponse = {
  resumed: boolean
  session_token: string
  exam_id: string
  exam_title: string
  student_name: string
  duration_minutes: number
  passing_score: number
  started_at?: string
  expires_at: string
  questions: ExamQuestion[]
}

export type SubmitExamPayload = {
  session_token: string
  answers: Record<string, string>
  tab_switch_count?: number
  time_spent_seconds?: number
}

export type SubmitExamResponse = {
  submission_id: string
  total_score: number
  max_score: number
  percentage: number
  is_passed: boolean
  has_pending_essay?: boolean
  message: string
}


export type ListPersonalExamsResponse = {
  total: number
  exams: PersonalExam[]
}

export type DetailPersonalExamResponse = {
  exam: PersonalExam
}

export type ListPersonalStudentsResponse = {
  total: number
  students: PersonalStudent[]
}

export type DetailPersonalStudentResponse = {
  student: PersonalStudent
}