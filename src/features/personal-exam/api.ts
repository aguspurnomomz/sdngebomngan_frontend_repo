import axios from 'axios'
import type {
  //PersonalExam,
  CreatePersonalExamPayload,
  UpdatePersonalExamPayload,
  ExamCostPreview,
  ListPersonalExamsResponse,
  DetailPersonalExamResponse,
  //PersonalStudent,
  CreatePersonalStudentPayload,
  UpdatePersonalStudentPayload,
  ListPersonalStudentsResponse,
  DetailPersonalStudentResponse,
  ParticipantsListResponse,
  AssignParticipantsPayload,
  QRSheetResponse,
  // Public
  PublicExamPreview,
  StartExamResponse,
  SubmitExamPayload,
  SubmitExamResponse,
  // Token
  TokenBalance,
  TokenTransaction,
  TokenPricingItem,
} from './types'

const API_URL = import.meta.env.VITE_API_URL

// Helper: create axios instance dengan auth header
function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}


export const personalStudentApi = {
  list: async (token: string, params?: { search?: string; active_only?: boolean }) => {
    const res = await axios.get<ListPersonalStudentsResponse>(
      `${API_URL}/api/teacher/personal-students`,
      {
        headers: authHeaders(token),
        params: {
          search: params?.search,
          active_only: params?.active_only !== false ? 'true' : 'false',
        },
      },
    )
    return res.data
  },

  get: async (token: string, id: string) => {
    const res = await axios.get<DetailPersonalStudentResponse>(
      `${API_URL}/api/teacher/personal-students/${id}`,
      { headers: authHeaders(token) },
    )
    return res.data
  },

  create: async (token: string, payload: CreatePersonalStudentPayload) => {
    const res = await axios.post<{ message: string; id: string }>(
      `${API_URL}/api/teacher/personal-students`,
      payload,
      { headers: authHeaders(token) },
    )
    return res.data
  },

  update: async (token: string, id: string, payload: UpdatePersonalStudentPayload) => {
    const res = await axios.put<{ message: string }>(
      `${API_URL}/api/teacher/personal-students/${id}`,
      payload,
      { headers: authHeaders(token) },
    )
    return res.data
  },

  delete: async (token: string, id: string) => {
    const res = await axios.delete<{ message: string }>(
      `${API_URL}/api/teacher/personal-students/${id}`,
      { headers: authHeaders(token) },
    )
    return res.data
  },
}

export const personalExamApi = {
  list: async (
    token: string,
    params?: { status?: string; subject?: string; search?: string; exam_type?: string },
  ) => {
    const res = await axios.get<ListPersonalExamsResponse>(
      `${API_URL}/api/teacher/personal-exams`,
      { headers: authHeaders(token), params },
    )
    return res.data
  },

  get: async (token: string, id: string) => {
    const res = await axios.get<DetailPersonalExamResponse>(
      `${API_URL}/api/teacher/personal-exams/${id}`,
      { headers: authHeaders(token) },
    )
    return res.data
  },

  create: async (token: string, payload: CreatePersonalExamPayload) => {
    const res = await axios.post<{ message: string; id: string }>(
      `${API_URL}/api/teacher/personal-exams`,
      payload,
      { headers: authHeaders(token) },
    )
    return res.data
  },

  update: async (token: string, id: string, payload: UpdatePersonalExamPayload) => {
    const res = await axios.put<{ message: string }>(
      `${API_URL}/api/teacher/personal-exams/${id}`,
      payload,
      { headers: authHeaders(token) },
    )
    return res.data
  },

  calculateCost: async (token: string, id: string) => {
    const res = await axios.post<ExamCostPreview>(
      `${API_URL}/api/teacher/personal-exams/${id}/calculate-cost`,
      {},
      { headers: authHeaders(token) },
    )
    return res.data
  },

  publish: async (token: string, id: string) => {
    const res = await axios.patch<{
      message: string
      exam_id: string
      charged: number
      new_balance: number
      breakdown: any
    }>(
      `${API_URL}/api/teacher/personal-exams/${id}/publish`,
      {},
      { headers: authHeaders(token) },
    )
    return res.data
  },

  archive: async (token: string, id: string) => {
    const res = await axios.patch<{ message: string }>(
      `${API_URL}/api/teacher/personal-exams/${id}/archive`,
      {},
      { headers: authHeaders(token) },
    )
    return res.data
  },

  delete: async (token: string, id: string) => {
    const res = await axios.delete<{ message: string }>(
      `${API_URL}/api/teacher/personal-exams/${id}`,
      { headers: authHeaders(token) },
    )
    return res.data
  },
}

export const examParticipantApi = {
  list: async (token: string, examId: string) => {
    const res = await axios.get<ParticipantsListResponse>(
      `${API_URL}/api/teacher/personal-exams/${examId}/participants`,
      { headers: authHeaders(token) },
    )
    return res.data
  },

  assign: async (token: string, examId: string, payload: AssignParticipantsPayload) => {
    const res = await axios.post<{ message: string; assigned: number; skipped: number }>(
      `${API_URL}/api/teacher/personal-exams/${examId}/participants`,
      payload,
      { headers: authHeaders(token) },
    )
    return res.data
  },

  remove: async (token: string, examId: string, participantId: string) => {
    const res = await axios.delete<{ message: string }>(
      `${API_URL}/api/teacher/personal-exams/${examId}/participants/${participantId}`,
      { headers: authHeaders(token) },
    )
    return res.data
  },

  generateCodes: async (
    token: string,
    examId: string,
    payload?: { participant_ids?: string[] },
  ) => {
    const res = await axios.post<{ message: string; generated: number; total?: number }>(
      `${API_URL}/api/teacher/personal-exams/${examId}/generate-access-codes`,
      payload || {},
      { headers: authHeaders(token) },
    )
    return res.data
  },

  regenerateCode: async (token: string, examId: string, participantId: string) => {
    const res = await axios.post<{
      message: string
      access_code: string
      exam_url: string
    }>(
      `${API_URL}/api/teacher/personal-exams/${examId}/participants/${participantId}/regenerate-code`,
      {},
      { headers: authHeaders(token) },
    )
    return res.data
  },

  qrSheet: async (token: string, examId: string) => {
    const res = await axios.get<QRSheetResponse>(
      `${API_URL}/api/teacher/personal-exams/${examId}/qr-sheet`,
      { headers: authHeaders(token) },
    )
    return res.data
  },
}


export const tokenApi = {
  balance: async (token: string) => {
    const res = await axios.get<TokenBalance>(
      `${API_URL}/api/teacher/token-balance`,
      { headers: authHeaders(token) },
    )
    return res.data
  },

  transactions: async (
    token: string,
    params?: { limit?: number; offset?: number; action?: string },
  ) => {
    const res = await axios.get<{
      total: number
      limit: number
      offset: number
      has_more: boolean
      transactions: TokenTransaction[]
    }>(`${API_URL}/api/teacher/token-transactions`, {
      headers: authHeaders(token),
      params,
    })
    return res.data
  },

  pricing: async (token: string) => {
    const res = await axios.get<{
      teacher_type: string
      total: number
      pricing: TokenPricingItem[]
    }>(`${API_URL}/api/teacher/token-pricing`, { headers: authHeaders(token) })
    return res.data
  },
}


export const aiApi = {
  generateCost: async (token: string, numberOfQ: number) => {
    const res = await axios.get<{
      number_of_q: number
      batches: number
      cost_per_batch: number
      total_cost: number
      current_balance: number
      sufficient: boolean
      teacher_type: string
    }>(`${API_URL}/api/teacher/ai/generate-cost`, {
      headers: authHeaders(token),
      params: { number_of_q: numberOfQ },
    })
    return res.data
  },

  generate: async (
    token: string,
    payload: {
      topic: string
      question_type: string
      number_of_q: number
      cognitive_level?: string
    },
  ) => {
    const res = await axios.post<{
      request_id: string
      questions: any[]
      charged: number
      charged_tx_id?: string
      new_balance: number
      batches: number
      cost_per_batch: number
    }>(`${API_URL}/api/teacher/ai/generate-questions`, payload, {
      headers: authHeaders(token),
    })
    return res.data
  },
}


export const publicExamApi = {
  getByCode: async (code: string) => {
    const res = await axios.get<PublicExamPreview>(
      `${API_URL}/api/public/personal-exam/access/${code}`,
    )
    return res.data
  },

  start: async (accessCode: string) => {
    const res = await axios.post<StartExamResponse>(
      `${API_URL}/api/public/personal-exam/start`,
      { access_code: accessCode },
    )
    return res.data
  },

  submit: async (payload: SubmitExamPayload) => {
    const res = await axios.post<SubmitExamResponse>(
      `${API_URL}/api/public/personal-exam/submit`,
      payload,
    )
    return res.data
  },

  result: async (sessionToken: string) => {
    const res = await axios.get<SubmitExamResponse>(
      `${API_URL}/api/public/personal-exam/result/${sessionToken}`,
    )
    return res.data
  },
}