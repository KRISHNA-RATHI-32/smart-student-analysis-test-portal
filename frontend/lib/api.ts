import type {
  User,
  Test,
  Question,
  Result,
  SubmitPayload,
  LeaderboardEntry,
  TopicAnalysis,
  SpeedAccuracy,
  ProgressPoint,
  Submission,
  PaginatedResponse,
} from "./types"

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }))
    throw new Error(error.message || `HTTP ${res.status}`)
  }

  return res.json()
}

// Auth
export const authApi = {
  login: async (data: { email: string; password: string }) => {
    return request<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  register: async (data: {
    fullName: string
    email: string
    username: string
    password: string
    role: string
  }) => {
    return request<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  me: async () => {
    return request<{ user: User }>("/auth/me")
  },

  logout: async () => {
    return request("/auth/logout", { method: "POST" })
  },
}

// Tests
export const testsApi = {
  getAll: async () => {
    return request<Test[]>("/tests")
  },

  getQuestions: async (testId: string) => {
    return request<Question[]>(`/tests/${testId}/questions`)
  },

  create: async (data: FormData) => {
    const res = await fetch(`${BASE_URL}/tests/create-test`, {
      method: "POST",
      credentials: "include",
      body: data,
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Failed to create test" }))
      throw new Error(error.message || "Failed to create test")
    }
    return res.json() as Promise<Test>
  },

  addQuestion: async (testId: string, sectionName: string, data: FormData) => {
    const res = await fetch(
      `${BASE_URL}/tests/add-question/${testId}/${sectionName}`,
      {
        method: "POST",
        credentials: "include",
        body: data,
      }
    )
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Failed to add question" }))
      throw new Error(error.message || "Failed to add question")
    }
    return res.json()
  },
}

// Results
export const resultsApi = {
  submit: async (testId: string, data: SubmitPayload) => {
    return request<Result>(`/results/submit/${testId}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  myResults: async () => {
    return request<Result[]>("/results/my-results")
  },

  leaderboard: async (testId: string, page = 1, limit = 10) => {
    return request<PaginatedResponse<LeaderboardEntry>>(
      `/results/leaderboard/${testId}?page=${page}&limit=${limit}`
    )
  },

  topicAnalysis: async () => {
    return request<TopicAnalysis[]>("/results/topics-wise-analysis")
  },

  speedAccuracy: async () => {
    return request<SpeedAccuracy[]>("/results/speed-vs-accuracy")
  },

  progressGraph: async () => {
    return request<ProgressPoint[]>("/results/progress-graph")
  },

  teacherSubmissions: async (testId: string, page = 1, limit = 10) => {
    return request<PaginatedResponse<Submission>>(
      `/results/teacher/submissions/${testId}?page=${page}&limit=${limit}`
    )
  },
}
