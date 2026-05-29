export type JobStatus = "active" | "paused";
export type EmploymentType = "full_time" | "part_time" | "contract" | "internship";
export type Seniority = "junior" | "mid" | "senior";

export type Job = {
  id: number;
  companyUserId: number;
  title: string;
  description: string;
  location: string | null;
  employmentType: EmploymentType;
  seniority: Seniority;
  salaryMin: number | null;
  salaryMax: number | null;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
};

export type JobWithCompany = Job & { companyName: string | null };

export type CreateJobInput = Pick<
  Job,
  "title" | "description" | "location" | "employmentType" | "seniority" | "salaryMin" | "salaryMax"
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

