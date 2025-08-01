export interface User {
  id: string;
  username: string;
  password: string;
  role: 'requestor' | 'cmk' | 'ppc' | 'procurement' | 'evaluation' | 'admin';
  name: string;
}

export interface MaterialRequest {
  id: string;
  dateReceived: string;
  materialCategory: string;
  materialDetails: string;
  supplierName: string;
  quantity?: string;
  trialAtPlant: boolean;
  purpose: string;
  bisRequired: boolean;
  bisCost?: number;
  bisCurrency?: 'USD' | 'INR' | 'YUAN';
  bisCostBorneBy?: string;
  bisSplitSupplier?: number;
  bisSplitPremier?: number;
  iecRequired: boolean;
  iecCost?: number;
  iecCurrency?: 'USD' | 'INR' | 'YUAN';
  iecCostBorneBy?: string;
  iecSplitSupplier?: number;
  iecSplitPremier?: number;
  status: 'pending_cmk' | 'approved_trial' | 'approved_pilot' | 'rejected' | 'pending_ppc' | 'pending_procurement' | 'ordered' | 'delivered' | 'pending_evaluation' | 'pending_final_cmk' | 'completed';
  requestorId: string;
  plant?: string;
  cmkDecision?: {
    decision: 'trial' | 'pilot' | 'rejected';
    reason?: string;
    plant?: string;
    quantityRevised?: string;
    approvedBy: string;
    approvedAt: string;
  };
  ppcData?: {
    prNumber: string;
    materialCode: string;
    description: string;
    enteredBy: string;
    enteredAt: string;
  };
  procurementData?: {
    orderType?: 'air' | 'sea';
    estimatedDelivery?: string;
    remarks?: string;
    deliveredAt?: string;
    updatedBy: string;
    updatedAt: string;
  };
  storesData?: {
    receivedBy?: string;
    documents?: string[];
    updatedBy: string;
    updatedAt: string;
  };
  evaluationData?: {
    received: boolean;
    completionDate?: string;
    report?: string;
    updatedBy: string;
    updatedAt: string;
  };
  finalCmkReview?: {
    decision: 'approved' | 'rejected';
    reason?: string;
    comments?: string;
    reviewedBy: string;
    reviewedAt: string;
  };
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  action: string;
  userId: string;
  timestamp: string;
  details: string;
}

export interface AppSettings {
  materialCategories: string[];
  purposes: string[];
}