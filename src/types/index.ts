export type Role = 'public' | 'lga_admin' | 'state_admin';

export type PillarId = 'education' | 'health' | 'vocational' | 'agriculture';

export interface PillarInfo {
  id: PillarId;
  name: string;
  tagline: string;
  description: string;
  iconName: string;
  color: string;
  subCategories: string[];
}

export type SenatorialDistrict = 
  | 'Uyo (Akwa Ibom North-East)'
  | 'Ikot Ekpene (Akwa Ibom North-West)'
  | 'Eket (Akwa Ibom South)';

export interface LGA {
  id: string; // slug e.g. 'uyo', 'eket'
  name: string;
  headquarters: string;
  senatorialDistrict: SenatorialDistrict;
  populationEstimate: number;
  centerCoordinates: {
    lat: number;
    lng: number;
  };
  svgData: {
    x: number;
    y: number;
    w: number;
    h: number;
    labelX?: number;
    labelY?: number;
    path?: string;
  };
}

export type ActivityStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED_DRAFT';

export type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface ProjectMilestone {
  id: string;
  phaseNumber: number;
  title: string;
  description?: string;
  targetDate: string;
  completionPercentage: number; // 0 - 100
  status: MilestoneStatus;
  completedDate?: string;
  keyDeliverable?: string;
}

export interface VerificationMedia {
  id: string;
  type: 'photo' | 'document' | 'video';
  url: string;
  caption: string;
  fileName: string;
  fileSize: string;
  exifVerified?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  uploadTimestamp: string;
}

export interface HCDActivity {
  id: string;
  lgaId: string; // Tenant isolation key
  lgaName: string;
  title: string;
  pillar: PillarId;
  subCategory: string;
  community: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  beneficiariesTotal: number;
  beneficiariesMale: number;
  beneficiariesFemale: number;
  youthBeneficiaries: number;
  budgetNgn: number;
  startDate: string;
  completionDate: string;
  leadOfficer: string;
  officerContact: string;
  status: ActivityStatus;
  milestones?: ProjectMilestone[];
  overallProgress?: number; // 0 - 100%
  mediaAssets: VerificationMedia[];
  attendanceRegistryUrl?: string;
  attendanceSheetFileName?: string;
  submissionNotes?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  isOfflineCreated?: boolean;
  syncStatus?: 'synced' | 'pending_sync';
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  assignedLgaId?: string; // Set when role === 'lga_admin'
  assignedLgaName?: string;
  department?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  activityId?: string;
  activityTitle?: string;
  lgaId?: string;
  performedBy: string;
  role: Role;
  action: 'CREATED_DRAFT' | 'SUBMITTED' | 'APPROVED_PUBLISHED' | 'REJECTED' | 'MODIFIED' | 'CROSS_TENANT_VIOLATION_BLOCKED';
  notes?: string;
}
