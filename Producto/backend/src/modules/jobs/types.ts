export type JobStatus = "active" | "paused" | "closed";
export type EmploymentType = "full_time" | "part_time" | "contract" | "internship";
export type Seniority = "junior" | "mid" | "senior";

export type Job = {
  id: number;
  companyUserId: number;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  location: string | null;
  employmentType: EmploymentType;
  seniority: Seniority;
  salaryMin: number | null;
  salaryMax: number | null;
  applicationDeadline: string | null;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
};

export type JobWithCompany = Job & { companyName: string | null };

export type CreateJobInput = Pick<
  Job,
  | "title"
  | "description"
  | "requirements"
  | "benefits"
  | "location"
  | "employmentType"
  | "seniority"
  | "salaryMin"
  | "salaryMax"
  | "applicationDeadline"
>;

export type UpdateJobInput = Partial<CreateJobInput> & Partial<Pick<Job, "status">>;

export type JobApplicationStatus = "submitted" | "withdrawn" | "rejected" | "accepted";

export type JobApplication = {
  id: number;
  jobId: number;
  talentUserId: number;
  coverLetter: string | null;
  status: JobApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type JobApplicationWithTalent = JobApplication & {
  jobTitle: string;
  talentEmail: string;
  fullName: string | null;
  location: string | null;
  headline: string | null;
  careerInterests: string[] | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  cvTitles: string[];
};

export type CompanyConversation = {
  id: number;
  applicationId: number;
  companyUserId: number;
  talentUserId: number;
  jobTitle: string;
  candidateName: string | null;
  candidateEmail: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConversationMessage = {
  id: number;
  conversationId: number;
  senderUserId: number;
  body: string;
  attachmentName: string | null;
  attachmentUrl: string | null;
  scheduledInterviewAt: string | null;
  createdAt: string;
  updatedAt: string;
};
