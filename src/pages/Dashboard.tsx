import React, { useState, useEffect } from 'react';
import { MaterialRequest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { storageUtils } from '@/utils/storage';
import { Layout } from '@/components/Layout';
import { RequestModal } from '@/components/RequestModal';
import { CMKReviewModal } from '@/components/CMKReviewModal';
import { PPCModal } from '@/components/PPCModal';
import { ProcurementModal } from '@/components/ProcurementModal';
import { EvaluationModal } from '@/components/EvaluationModal';
import { FinalCMKModal } from '@/components/FinalCMKModal';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view' | 'cmk' | 'ppc' | 'procurement' | 'evaluation' | 'final_cmk' | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    const allRequests = storageUtils.getRequests();
    setRequests(allRequests);
  };

  const handleCreate = () => {
    setSelectedRequest(null);
    setModalType('create');
  };

  const handleView = (request: MaterialRequest) => {
    setSelectedRequest(request);
    
    // Determine appropriate modal based on user role and request status
    if (currentUser?.role === 'cmk' && request.status === 'pending_cmk') {
      setModalType('cmk');
    } else if (currentUser?.role === 'cmk' && request.status === 'pending_final_cmk') {
      setModalType('final_cmk');
    } else if (currentUser?.role === 'ppc' && request.status === 'pending_ppc') {
      setModalType('ppc');
    } else if (currentUser?.role === 'procurement' && 
               (request.status === 'pending_procurement' || request.status === 'ordered')) {
      setModalType('procurement');
    } else if (currentUser?.role === 'evaluation' && 
               (request.status === 'delivered' || request.status === 'pending_evaluation')) {
      setModalType('evaluation');
    } else {
      setModalType('view');
    }
  };

  const handleEdit = (request: MaterialRequest) => {
    setSelectedRequest(request);
    setModalType('edit');
  };

  const handleModalClose = () => {
    setSelectedRequest(null);
    setModalType(null);
  };

  const getPendingCount = () => {
    if (!currentUser) return 0;
    
    switch (currentUser.role) {
      case 'cmk':
        return requests.filter(r => r.status === 'pending_cmk' || r.status === 'pending_final_cmk').length;
      case 'ppc':
        return requests.filter(r => r.status === 'pending_ppc').length;
      case 'procurement':
        return requests.filter(r => r.status === 'pending_procurement' || r.status === 'ordered').length;
      case 'evaluation':
        return requests.filter(r => r.status === 'delivered' || r.status === 'pending_evaluation').length;
      default:
        return 0;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Material Trial Requests</h1>
            <p className="text-muted-foreground">
              Total: {requests.length} | Pending for you: {getPendingCount()}
            </p>
          </div>
          {currentUser?.role === 'requestor' && (
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Request
            </Button>
          )}
        </div>

        {/* Enhanced Data Table */}
        <DataTable 
          requests={requests}
          currentUser={currentUser}
          onView={handleView}
          onEdit={currentUser?.role === 'requestor' ? handleEdit : undefined}
        />

        {/* Modals */}
        <RequestModal
          request={selectedRequest}
          isOpen={modalType === 'create' || modalType === 'edit' || modalType === 'view'}
          onClose={handleModalClose}
          onUpdate={loadRequests}
          mode={modalType === 'create' ? 'create' : modalType === 'edit' ? 'edit' : 'view'}
        />

        <CMKReviewModal
          request={selectedRequest}
          isOpen={modalType === 'cmk'}
          onClose={handleModalClose}
          onUpdate={loadRequests}
        />

        <PPCModal
          request={selectedRequest}
          isOpen={modalType === 'ppc'}
          onClose={handleModalClose}
          onUpdate={loadRequests}
        />

        <ProcurementModal
          request={selectedRequest}
          isOpen={modalType === 'procurement'}
          onClose={handleModalClose}
          onUpdate={loadRequests}
        />

        <EvaluationModal
          request={selectedRequest}
          isOpen={modalType === 'evaluation'}
          onClose={handleModalClose}
          onUpdate={loadRequests}
        />

        <FinalCMKModal
          request={selectedRequest}
          isOpen={modalType === 'final_cmk'}
          onClose={handleModalClose}
          onUpdate={loadRequests}
        />
      </div>
    </Layout>
  );
};