// API service layer — uses httpOnly cookies set by the backend for auth
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// ─── Core request helper (JSON) ───
async function request<T>(endpoint: string, options: {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number>;//this is a type of object that can have//**  string or number as values like a map. params contains query parameters for the URL, like ?page=1&limit=10. */Loop runs:

// k = "page", v = 1 → set("page", "1")
// k = "limit", v = 10 → set("limit", "10")
} = {}): Promise<T> {
  const { method = "GET", body, headers = {}, params } = options;
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
  const searchParams = new URLSearchParams();//👉 This is a built-in helper to build URLs like:

// ?page=1&limit=10
    for (const [k, v] of Object.entries(params)) {
      searchParams.set(k, String(v));
    }
    url += `?${searchParams.toString()}`;
  }
  const config: RequestInit = {//requestInit is a type of object that is used to configure the request
    method,
    credentials: "include",//send/recieve httpOnly cookies
    headers: {
      "Content-Type": "application/json",
      ...headers,
    }
  }
  if (body) config.body = JSON.stringify(body);
  const res = await fetch(url, config);//in this we are trying to fetch the data from the backend 
  //the below we are only considering the case when the user token is expired if access token expired then it will be regenerated using refresh token but it the refresh token is expired then it will not be genereated and the user will be logged out
  if (res.status === 401) {
    // Try refreshing token via cookie
    const refreshed = await refreshToken();
    if (refreshed) return request<T>(endpoint, options);
    // Don't hard-redirect here — let AuthContext & ProtectedRoute handle it
    localStorage.removeItem("user");
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();//this contains the response from the backend 
}

// ─── Multipart request helper (for file uploads) ───
async function requestMultipart<T>(endpoint: string, formData: FormData, method = "POST"): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const config: RequestInit = {
    method,
    credentials: "include",
    body: formData,
    // Do NOT set Content-Type — browser sets it with boundary automatically
  };

  const res = await fetch(url, config);

  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) return requestMultipart<T>(endpoint, formData, method);
    // Don't hard-redirect here — let AuthContext & ProtectedRoute handle it
    localStorage.removeItem("user");//at local storage the data is stored in the form of key value pairs so we are removing the user by giving the key
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}
// ─── Token refresh via cookie ───
async function refreshToken(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/users/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════
// AUTH APIs — /api/v1/users
// ═══════════════════════════════════════════════
export const authApi = {
  register: (data: { fullName: string; email: string; username: string; password: string }) =>
    request<{ statusCode: number; data: { email: string }; message: string }>(
      "/users/register", { method: "POST", body: data }
    ),

  verifyOtp: (data: { email: string; otp: string }) =>
    request<{
      statusCode: number;
      data: { user: UserPayload };
      message: string;
    }>("/users/verify-otp", { method: "POST", body: data }),

  resendOtp: (data: { email: string }) =>
    request<{ statusCode: number; data: { email: string }; message: string }>(
      "/users/resend-otp", { method: "POST", body: data }
    ),

  login: (data: { email: string; password: string }) =>
    request<{
      statusCode: number;
      data: { user: UserPayload };
      message: string;
    }>("/users/login", { method: "POST", body: data }),

  logout: () =>
    request<{ statusCode: number; data: object; message: string }>(
      "/users/logout", { method: "POST" }
    ),

  getCurrentUser: () =>
    request<{ statusCode: number; data: UserPayload; message: string }>(
      "/users/me"
    ),
  forgotPassword: (data: { email: string }) =>
    request<{ statusCode: number; data: { email: string }; message: string }>(
      "/users/forgot-password", { method: "POST", body: data }
    ),
  verifyForgotPasswordOtp: (data: { email: string; otp: string }) =>
    request<{ statusCode: number; data: { email: string }; message: string }>(
      "/users/verify-forgot-password-otp", { method: "POST", body: data }
    ),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    request<{ statusCode: number; data: { email: string }; message: string }>(
      "/users/reset-password", { method: "POST", body: data }
    ),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    request<{ statusCode: number; data: object; message: string }>(
      "/users/change-password", { method: "POST", body: data }
    ),
    updateProfile: (data: { fullName?: string; phone?: string; avatar?: File }) => {
    const formData = new FormData();
    if (data.fullName) formData.append("fullName", data.fullName);
    if (data.phone) formData.append("phone", data.phone);
    if (data.avatar) formData.append("avatar", data.avatar);
    
    return requestMultipart<{ statusCode: number; data: UserPayload; message: string }>( 
      "/users/update-profile", formData, "PATCH"
    ); 
  },
};

// ═══════════════════════════════════════════════
// ADMIN APIs — /api/v1/admin
// ═══════════════════════════════════════════════
export const adminApi = {
  getAllUsers: () =>
    request<{ statusCode: number; data: UserPayload[]; message: string }>(
      "/admin/users"
    ),

  addTeacher: (data: { fullName: string; email: string; username: string; password: string }) =>
    request<{ statusCode: number; data: UserPayload; message: string }>(
      "/admin/add-teacher", { method: "POST", body: data }
    ),

  deleteUser: (userId: string) =>
    request<{ statusCode: number; data: object; message: string }>(
      `/admin/users/${userId}`, { method: "DELETE" }
    ),
};

// ═══════════════════════════════════════════════
// TEST APIs — /api/v1/tests
// ═══════════════════════════════════════════════
export const testApi = {
  // Create test with thumbnail (multipart/form-data)
  createTest: (data: {
    title: string;
    description?: string;
    duration: number;
    totalMarks: number;
    category?: string;
    thumbnail: File;
  }) => {
    const formData = new FormData();
    formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    formData.append("duration", String(data.duration));
    formData.append("totalMarks", String(data.totalMarks));
    if (data.category) formData.append("category", data.category);
    formData.append("thumbnail", data.thumbnail);
    return requestMultipart<{ statusCode: number; data: TestPayload; message: string }>(
      "/tests/create-test", formData
    );
  },

  // Add question to section (creates section if it doesn't exist)
  addQuestionToSection: (testId: string, sectionName: string, data: {
    questionText: string;
    questionType: "mcq" | "multi-select" | "one-word";
    options?: string[];
    correctAnswer: string | string[];
    marks?: number;
    negativeMarks?: number;
    topic?: string;
    difficulty?: "easy" | "medium" | "hard";
    questionImage?: File;
  }) => {
    const formData = new FormData();
    formData.append("questionText", data.questionText);
    formData.append("questionType", data.questionType);
    if (data.options) formData.append("options", JSON.stringify(data.options));
    formData.append("correctAnswer",
      Array.isArray(data.correctAnswer)
        ? JSON.stringify(data.correctAnswer)
        : data.correctAnswer
    );
    if (data.marks !== undefined) formData.append("marks", String(data.marks));
    if (data.negativeMarks !== undefined) formData.append("negativeMarks", String(data.negativeMarks));
    if (data.topic) formData.append("topic", data.topic);
    if (data.difficulty) formData.append("difficulty", data.difficulty);
    if (data.questionImage) formData.append("qustionImage", data.questionImage); // backend typo: "qustionImage"
    return requestMultipart<{ statusCode: number; data: any; message: string }>(
      `/tests/add-question/${testId}/${encodeURIComponent(sectionName)}`, formData
    );
  },

  getAllTests: () =>
    request<{ statusCode: number; data: TestPayload[]; message: string }>(
      "/tests/"
    ),

  getTestById: (testId: string) =>
    request<{ statusCode: number; data: TestPayload; message: string }>(
      `/tests/${testId}`
    ),

  getTestQuestions: (testId: string) =>
    request<{ statusCode: number; data: TestQuestionsPayload; message: string }>(
      `/tests/${testId}/questions`
    ),
};

// ═══════════════════════════════════════════════
// RESULT APIs — /api/v1/results
// ═══════════════════════════════════════════════
export const resultApi = {
  // Start a test attempt
  startTest: (testId: string) =>
    request<{ statusCode: number; data: AttemptPayload; message: string }>(
      `/results/start/${testId}`, { method: "POST" }
    ),

  // Submit test answers
  submitTest: (testId: string, data: {
    answers: Array<{
      questionId: string;
      options: string | string[];
      timeSpent: number;
    }>;
    timeTaken: number;
  }) =>
    request<{
      statusCode: number;
      data: {
        result: any;
        summary: {
          totalQuestions: number;
          correct: number;
          incorrect: number;
          accuracy: string;
        };
      };
      message: string;
    }>(`/results/submit/${testId}`, { method: "POST", body: data }),

  // Check attempt status for a test
  getAttemptStatus: (testId: string) =>
    request<{
      statusCode: number;
      data: {
        status: "not-started" | "started" | "completed";
        startTime?: string;
        timeTaken?: number;
        score?: number;
      };
      message: string;
    }>(`/results/attempt-status/${testId}`),

  // Student's own results
  getMyResults: () =>
    request<{
      statusCode: number;
      data: Array<{
        _id: string;
        score: number;
        totalMarks: number;
        timeTaken: number;
        createdAt: string;
        testTitle: string;
        accuracy: number;
      }>;
      message: string;
    }>("/results/my-results"),

  // Student's rank in a test
  getMyRank: (testId: string) =>
    request<{
      statusCode: number;
      data: { rank: number | null; totalStudents: number };
      message: string;
    }>(`/results/my-rank/${testId}`),

  // Leaderboard for a test (paginated)
  getLeaderboard: (testId: string, page = 1, limit = 10) =>
    request<{
      statusCode: number;
      data: {
        docs: Array<{
          rank: number;
          score: number;
          timeTaken: number;
          totalMarks: number;
          studentName: string;
          accuracy: number;
        }>;
        totalDocs: number;
        totalPages: number;
        page: number;
        limit: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
      message: string;
    }>(`/results/leaderboard/${testId}`, { params: { page, limit } }),

  // Topic-wise analysis
  getTopicAnalysis: () =>
    request<{
      statusCode: number;
      data: Array<{
        topic: string;
        accuracy: number;
        avgTime: number;
        status: "Weak" | "Medium" | "Strong";
      }>;
      message: string;
    }>("/results/topics-wise-analysis"),

  // Speed vs accuracy analysis
  getSpeedVsAccuracy: () =>
    request<{
      statusCode: number;
      data: Array<{
        topic: string;
        avgTime: number;
        accuracy: number;
        performance: string;
      }>;
      message: string;
    }>("/results/speed-vs-accuracy"),

  // Progress graph data
  getProgressGraph: () =>
    request<{
      statusCode: number;
      data: Array<{
        createdAt: string;
        testTitle: string;
        accuracy: number;
      }>;
      message: string;
    }>("/results/progress-graph"),

  // Overall accuracy
  getOverallAccuracy: () =>
    request<{
      statusCode: number;
      data: {
        totalScore: number;
        totalMarks: number;
        overallAccuracy: number;
      };
      message: string;
      // Note: there's no dedicated route for this — we compute from my-results on frontend
    }>("/results/my-results"),

  // Teacher: get paginated submissions for a test
  getTestSubmissions: (testId: string, page = 1, limit = 10) =>
    request<{
      statusCode: number;
      data: {
        docs: Array<{
          _id: string;
          studentName: string;
          score: number;
          totalMarks: number;
          timeTaken: number;
          submittedAt: string;
          accuracy: number;
        }>;
        totalDocs: number;
        totalPages: number;
        page: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
      message: string;
    }>(`/results/teacher/submissions/${testId}`, { params: { page, limit } }),
};

// ═══════════════════════════════════════════════
// TYPE DEFINITIONS
// ══════════════════════════════════════s═════════
export interface UserPayload {
  _id: string;
  fullName: string;
  email: string;
  username: string;
  role: "admin" | "teacher" | "student";
  isVerified: boolean;
  batch?: string;
  createdAt?: string;
}

export interface TestPayload {
  _id: string;
  title: string;
  description?: string;
  teacher?: string;
  duration: number;
  totalMarks: number;
  category?: string;
  thumbnail?: string;
  createdAt?: string;
}

export interface AttemptPayload {
  _id: string;
  student: string;
  test: string;
  status: "started" | "completed";
  startTime: string;
}
export interface TestQuestionsPayload {
  _id: string;
  title: string;
  description?: string;
  teacher?: string;
  duration: number;
  totalMarks: number;
  category?: string;
  batch?: string;
  thumbnail?: string;
  createdAt?: string;
  sections: Array<{
    _id?: string;
    sectionName: string;
    questions: Array<{
      _id: string;
      questionText: string;
      questionImage?: string;
      questionType: "mcq" | "multi-select" | "one-word";
      topic?: string;
      difficulty?: "easy" | "medium" | "hard";
      options: string[];
      correctAnswer: string[];
      marks: number;
      negativeMarks: number;
    }>;
  }>;
}