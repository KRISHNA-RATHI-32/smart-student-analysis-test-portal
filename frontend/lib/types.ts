export type Role = "student" | "teacher"

export interface User {
  _id: string
  fullName: string
  email: string
  username: string
  role: Role
  avatar?: string
}

export interface Test {
  _id: string
  title: string
  duration: number
  totalMarks: number
  category?: string
  thumbnail?: string
  createdBy?: string
  createdAt?: string
}

export interface Question {
  _id: string
  questionText: string
  questionType: string
  options: string[]
  correctAnswer: string[]
  marks: number
  negativeMarks: number
  topic: string
  image?: string
}

export interface AnswerPayload {
  questionId: string
  selectedOption: string[]
  timeSpent: number
}

export interface SubmitPayload {
  answers: AnswerPayload[]
}

export interface Result {
  _id: string
  testId: string | Test
  studentId?: string | User
  score: number
  accuracy: number
  timeTaken: number
  totalQuestions?: number
  correctAnswers?: number
  wrongAnswers?: number
  createdAt?: string
}

export interface LeaderboardEntry {
  rank: number
  studentName: string
  score: number
  accuracy: number
}

export interface TopicAnalysis {
  topic: string
  accuracy: number
  totalQuestions: number
  correctAnswers: number
}

export interface SpeedAccuracy {
  testName: string
  speed: number
  accuracy: number
}

export interface ProgressPoint {
  date: string
  score: number
  accuracy: number
}

export interface Submission {
  studentName: string
  score: number
  accuracy: number
  timeTaken: number
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiError {
  message: string
  statusCode: number
}
