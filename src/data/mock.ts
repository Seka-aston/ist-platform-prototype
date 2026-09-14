export interface Department {
  id: string;
  name: string;
  totalStaff: number;
  presentStaff: number;
  totalStudents: number;
  presentStudents: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: "teacher" | "substitute";
  department: string;
  subjects: string[];
  email: string;
  avatar?: string;
}

export interface Student {
  id: string;
  name: string;
  className: string;
  department: string;
  guardianName: string;
  avatar?: string;
}

export interface AbsenceRequest {
  id: string;
  type: "student" | "teacher";
  requesterId: string;
  requesterName: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "denied";
  createdAt: string;
  className?: string;
  department?: string;
  coverageNeeded?: boolean;
  substituteId?: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: "student" | "teacher" | "principal" | "system";
  content: string;
  timestamp: string;
  relatedTo?: string;
}

export interface SubstituteOption {
  id: string;
  name: string;
  subjects: string[];
  availableHours: string;
  rating: number;
  avatar?: string;
}

// --- Departments ---
export const departments: Department[] = [
  { id: "d1", name: "Languages", totalStaff: 12, presentStaff: 10, totalStudents: 185, presentStudents: 174 },
  { id: "d2", name: "Mathematics", totalStaff: 9, presentStaff: 9, totalStudents: 160, presentStudents: 152 },
  { id: "d3", name: "Natural Sciences", totalStaff: 11, presentStaff: 9, totalStudents: 142, presentStudents: 138 },
  { id: "d4", name: "Social Sciences", totalStaff: 8, presentStaff: 7, totalStudents: 128, presentStudents: 120 },
  { id: "d5", name: "Arts & Music", totalStaff: 6, presentStaff: 6, totalStudents: 95, presentStudents: 91 },
  { id: "d6", name: "Physical Education", totalStaff: 5, presentStaff: 4, totalStudents: 110, presentStudents: 105 },
];

// --- Staff ---
export const staff: StaffMember[] = [
  { id: "t1", name: "Anna Lindqvist", role: "teacher", department: "d1", subjects: ["Swedish", "English"], email: "anna.lindqvist@skolan.se", avatar: "/avatars/avatar-2.svg" },
  { id: "t2", name: "Erik Johansson", role: "teacher", department: "d2", subjects: ["Mathematics"], email: "erik.johansson@skolan.se", avatar: "/avatars/avatar-5.svg" },
  { id: "t3", name: "Maria Bergström", role: "teacher", department: "d3", subjects: ["Biology", "Chemistry"], email: "maria.bergstrom@skolan.se", avatar: "/avatars/avatar-4.svg" },
  { id: "t4", name: "Lars Nilsson", role: "teacher", department: "d4", subjects: ["History", "Social Studies"], email: "lars.nilsson@skolan.se", avatar: "/avatars/avatar-6.svg" },
  { id: "t5", name: "Sofia Eriksson", role: "teacher", department: "d1", subjects: ["French", "Spanish"], email: "sofia.eriksson@skolan.se", avatar: "/avatars/avatar-7.svg" },
  { id: "t6", name: "Henrik Svensson", role: "teacher", department: "d3", subjects: ["Physics", "Mathematics"], email: "henrik.svensson@skolan.se", avatar: "/avatars/avatar-8.svg" },
  { id: "t7", name: "Karin Olsson", role: "teacher", department: "d5", subjects: ["Music", "Drama"], email: "karin.olsson@skolan.se", avatar: "/avatars/avatar-4.svg" },
  { id: "t8", name: "Jonas Pettersson", role: "teacher", department: "d6", subjects: ["Physical Education"], email: "jonas.pettersson@skolan.se", avatar: "/avatars/avatar-6.svg" },
  { id: "t9", name: "Eva Andersson", role: "teacher", department: "d2", subjects: ["Mathematics", "Physics"], email: "eva.andersson@skolan.se", avatar: "/avatars/avatar-7.svg" },
  { id: "t10", name: "Oscar Holm", role: "teacher", department: "d4", subjects: ["Geography", "Civics"], email: "oscar.holm@skolan.se", avatar: "/avatars/avatar-5.svg" },
  { id: "s1", name: "Petra Gustafsson", role: "substitute", department: "d1", subjects: ["Swedish", "English", "French"], email: "petra.gustafsson@vikarie.se", avatar: "/avatars/avatar-7.svg" },
  { id: "s2", name: "Daniel Forsberg", role: "substitute", department: "d2", subjects: ["Mathematics", "Physics"], email: "daniel.forsberg@vikarie.se", avatar: "/avatars/avatar-8.svg" },
  { id: "s3", name: "Lisa Wallin", role: "substitute", department: "d3", subjects: ["Biology", "Chemistry"], email: "lisa.wallin@vikarie.se", avatar: "/avatars/avatar-4.svg" },
  { id: "s4", name: "Marcus Ek", role: "substitute", department: "d6", subjects: ["Physical Education", "Health"], email: "marcus.ek@vikarie.se", avatar: "/avatars/avatar-5.svg" },
];

// --- Students ---
export const students: Student[] = [
  { id: "st1", name: "Alma Wikström", className: "8A", department: "d1", guardianName: "Fredrik Wikström", avatar: "/avatars/avatar-3.svg" },
  { id: "st2", name: "Noah Bergman", className: "8A", department: "d1", guardianName: "Camilla Bergman", avatar: "/avatars/avatar-6.svg" },
  { id: "st3", name: "Ella Sandberg", className: "9B", department: "d2", guardianName: "Johan Sandberg", avatar: "/avatars/avatar-7.svg" },
  { id: "st4", name: "William Larsson", className: "7C", department: "d3", guardianName: "Helena Larsson", avatar: "/avatars/avatar-8.svg" },
  { id: "st5", name: "Maja Ström", className: "9A", department: "d4", guardianName: "Anders Ström", avatar: "/avatars/avatar-4.svg" },
  { id: "st6", name: "Liam Dahlin", className: "8B", department: "d2", guardianName: "Maria Dahlin", avatar: "/avatars/avatar-5.svg" },
  { id: "st7", name: "Saga Blom", className: "7A", department: "d5", guardianName: "Eva Blom", avatar: "/avatars/avatar-3.svg" },
  { id: "st8", name: "Oliver Ek", className: "9B", department: "d6", guardianName: "Per Ek", avatar: "/avatars/avatar-8.svg" },
];

// --- Absence Requests ---
export const absenceRequests: AbsenceRequest[] = [
  {
    id: "ar1", type: "student", requesterId: "st1", requesterName: "Alma Wikström",
    reason: "Family trip abroad", startDate: "2026-09-15", endDate: "2026-09-19",
    status: "pending", createdAt: "2026-09-08T09:15:00", className: "8A", department: "Languages",
  },
  {
    id: "ar2", type: "student", requesterId: "st3", requesterName: "Ella Sandberg",
    reason: "Dental appointment", startDate: "2026-09-10", endDate: "2026-09-10",
    status: "approved", createdAt: "2026-09-07T14:22:00", className: "9B", department: "Mathematics",
  },
  {
    id: "ar3", type: "student", requesterId: "st5", requesterName: "Maja Ström",
    reason: "Feeling unwell", startDate: "2026-09-09", endDate: "2026-09-09",
    status: "pending", createdAt: "2026-09-09T07:45:00", className: "9A", department: "Social Sciences",
  },
  {
    id: "ar4", type: "teacher", requesterId: "t3", requesterName: "Maria Bergström",
    reason: "Professional development conference", startDate: "2026-09-12", endDate: "2026-09-13",
    status: "approved", createdAt: "2026-09-05T10:00:00", department: "Natural Sciences",
    coverageNeeded: true, substituteId: "s3",
  },
  {
    id: "ar5", type: "teacher", requesterId: "t1", requesterName: "Anna Lindqvist",
    reason: "Personal leave — family matter", startDate: "2026-09-15", endDate: "2026-09-17",
    status: "pending", createdAt: "2026-09-08T16:30:00", department: "Languages",
    coverageNeeded: true,
  },
  {
    id: "ar6", type: "teacher", requesterId: "t8", requesterName: "Jonas Pettersson",
    reason: "Sick leave", startDate: "2026-09-09", endDate: "2026-09-11",
    status: "approved", createdAt: "2026-09-08T22:10:00", department: "Physical Education",
    coverageNeeded: true, substituteId: "s4",
  },
  {
    id: "ar7", type: "student", requesterId: "st6", requesterName: "Liam Dahlin",
    reason: "Sports competition", startDate: "2026-09-11", endDate: "2026-09-11",
    status: "denied", createdAt: "2026-09-06T11:00:00", className: "8B", department: "Mathematics",
  },
];

// --- Messages ---
export const messages: Message[] = [
  {
    id: "m1", threadId: "ar1", senderId: "st1", senderName: "Alma Wikström", senderRole: "student",
    content: "Hi, I need to request time off next week. My family is travelling to visit my grandmother in Germany.",
    timestamp: "2026-09-08T09:15:00",
  },
  {
    id: "m2", threadId: "ar1", senderId: "system", senderName: "System", senderRole: "system",
    content: "Absence request submitted: Sep 15–19, 2026. Awaiting teacher review.",
    timestamp: "2026-09-08T09:15:01",
  },
  {
    id: "m3", threadId: "ar5", senderId: "t1", senderName: "Anna Lindqvist", senderRole: "teacher",
    content: "I need to take personal leave next week (Sep 15–17) for a family matter. I've prepared lesson plans for all classes.",
    timestamp: "2026-09-08T16:30:00",
  },
  {
    id: "m4", threadId: "ar5", senderId: "system", senderName: "System", senderRole: "system",
    content: "Teacher absence request submitted. Awaiting principal approval. Substitute coverage required for: Swedish (8A, 9B), English (8A).",
    timestamp: "2026-09-08T16:30:01",
  },
  {
    id: "m5", threadId: "ar4", senderId: "t3", senderName: "Maria Bergström", senderRole: "teacher",
    content: "Attending the Nordic Science Educators Conference in Stockholm, Sep 12–13.",
    timestamp: "2026-09-05T10:00:00",
  },
  {
    id: "m6", threadId: "ar4", senderId: "principal", senderName: "Margareta Håkansson", senderRole: "principal",
    content: "Approved. Lisa Wallin has been assigned as substitute for your Biology and Chemistry classes.",
    timestamp: "2026-09-05T14:20:00",
  },
  {
    id: "m7", threadId: "ar6", senderId: "t8", senderName: "Jonas Pettersson", senderRole: "teacher",
    content: "I'm feeling unwell and won't be able to come in for the rest of the week.",
    timestamp: "2026-09-08T22:10:00",
  },
  {
    id: "m8", threadId: "ar6", senderId: "principal", senderName: "Margareta Håkansson", senderRole: "principal",
    content: "Get well soon, Jonas. Marcus Ek will cover your PE classes through Thursday.",
    timestamp: "2026-09-09T07:00:00",
  },
  {
    id: "m9", threadId: "ar3", senderId: "st5", senderName: "Maja Ström", senderRole: "student",
    content: "I have a headache and stomach ache. My dad says I should stay home today.",
    timestamp: "2026-09-09T07:45:00",
  },
  {
    id: "m10", threadId: "ar2", senderId: "st3", senderName: "Ella Sandberg", senderRole: "student",
    content: "I have a dental appointment on Wednesday morning. I'll be back by lunch.",
    timestamp: "2026-09-07T14:22:00",
  },
  {
    id: "m11", threadId: "ar2", senderId: "t2", senderName: "Erik Johansson", senderRole: "teacher",
    content: "No problem, Ella. Make sure you catch up on the equations we cover in the morning session.",
    timestamp: "2026-09-07T15:05:00",
  },
];

// --- Substitute options for unassigned gaps ---
export const substituteOptions: SubstituteOption[] = [
  { id: "s1", name: "Petra Gustafsson", subjects: ["Swedish", "English", "French"], availableHours: "08:00–16:00", rating: 4.8, avatar: "/avatars/avatar-7.svg" },
  { id: "s2", name: "Daniel Forsberg", subjects: ["Mathematics", "Physics"], availableHours: "09:00–15:00", rating: 4.5, avatar: "/avatars/avatar-8.svg" },
  { id: "s3", name: "Lisa Wallin", subjects: ["Biology", "Chemistry"], availableHours: "08:00–14:00", rating: 4.9, avatar: "/avatars/avatar-4.svg" },
  { id: "s4", name: "Marcus Ek", subjects: ["Physical Education", "Health"], availableHours: "08:00–16:00", rating: 4.6, avatar: "/avatars/avatar-5.svg" },
];

// --- Helper: the current principal ---
export const principal = {
  id: "p1",
  name: "Margareta Håkansson",
  email: "margareta.hakansson@skolan.se",
  school: "Björkbacken School",
  avatar: "/avatars/avatar-1.svg",
};

// --- Avatar lookup by person ID ---
export const avatarMap: Record<string, string> = Object.fromEntries([
  ...staff.map((s) => [s.id, s.avatar ?? ""]),
  ...students.map((s) => [s.id, s.avatar ?? ""]),
  ...substituteOptions.map((s) => [s.id, s.avatar ?? ""]),
  [principal.id, principal.avatar],
]);

// --- Helper: currently logged-in teacher (for teacher view) ---
export const currentTeacher = staff.find((s) => s.id === "t1")!;

// --- Helper: currently logged-in student (for student view) ---
export const currentStudent = students.find((s) => s.id === "st1")!;
