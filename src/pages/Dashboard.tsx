import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialRequest } from '@/types';
import { storageUtils } from '@/utils/storage';
import { Layout } from '@/components/Layout';
import { RequestModal } from '@/components/RequestModal';
import { CMKReviewModal } from '@/components/CMKReviewModal';
import { PPCModal } from '@/components/PPCModal';
import { ProcurementModal } from '@/components/ProcurementModal';
import { EvaluationModal } from '@/components/EvaluationModal';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Eye, Edit, Filter, Search } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaterialRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showCMKModal, setShowCMKModal] = useState(false);
  const [showPPCModal, setShowPPCModal] = useState(false);
  const [showProcurementModal, setShowProcurementModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const loadRequests = () => {
    const allRequests = storageUtils.getRequests();
    setRequests(allRequests);
  };

  const filterRequests = () => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.materialCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.materialDetails.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending_cmk': { label: 'Pending CMK Review', variant: 'default' as const },
      'approved_trial': { label: 'Approved for Trial', variant: 'default' as const },
      'approved_pilot': { label: 'Approved for Pilot', variant: 'default' as const },
      'rejected': { label: 'Rejected', variant: 'destructive' as const },
      'pending_ppc': { label: 'Pending PPC', variant: 'secondary' as const },
      'pending_procurement': { label: 'Pending Procurement', variant: 'secondary' as const },
      'ordered': { label: 'Ordered', variant: 'secondary' as const },
      'delivered': { label: 'Delivered', variant: 'secondary' as const },
      'pending_evaluation': { label: 'Pending Evaluation', variant: 'secondary' as const },
      'completed': { label: 'Completed', variant: 'default' as const }
    };
    
    const status_info = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'default' as const };
    return <Badge variant={status_info.variant}>{status_info.label}</Badge>;
  };

  const getRelevantRequests = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'requestor':
        return filteredRequests.filter(r => r.requestorId === user.id);
      case 'cmk':
        return filteredRequests.filter(r => r.status === 'pending_cmk');
      case 'ppc':
        return filteredRequests.filter(r => r.status === 'pending_ppc');
      case 'procurement':
        return filteredRequests.filter(r => ['pending_procurement', 'ordered'].includes(r.status));
      case 'evaluation':
        return filteredRequests.filter(r => ['delivered', 'pending_evaluation'].includes(r.status));
      case 'admin':
        return filteredRequests;
      default:
        return [];
    }
  };

  const handleViewRequest = (request: MaterialRequest) => {
    setSelectedRequest(request);
    
    if (user?.role === 'cmk' && request.status === 'pending_cmk') {
      setShowCMKModal(true);
    } else if (user?.role === 'ppc' && request.status === 'pending_ppc') {
      setShowPPCModal(true);
    } else if (user?.role === 'procurement' && ['pending_procurement', 'ordered'].includes(request.status)) {
      setShowProcurementModal(true);
    } else if (user?.role === 'evaluation' && ['delivered', 'pending_evaluation'].includes(request.status)) {
      setShowEvaluationModal(true);
    } else {
      setModalMode('view');
      setShowRequestModal(true);
    }
  };

  const handleEditRequest = (request: MaterialRequest) => {
    if (user?.role === 'requestor') {
      setSelectedRequest(request);
      setModalMode('edit');
      setShowRequestModal(true);
    }
  };

  const handleCreateRequest = () => {
    setSelectedRequest(null);
    setModalMode('create');
    setShowRequestModal(true);
  };

  const getMyRequestsCount = () => {
    if (user?.role === 'requestor') {
      return requests.filter(r => r.requestorId === user.id).length;
    }
    return 0;
  };

  const getPendingActionsCount = () => {
    if (!user) return 0;
    
    switch (user.role) {
      case 'cmk':
        return requests.filter(r => r.status === 'pending_cmk').length;
      case 'ppc':
        return requests.filter(r => r.status === 'pending_ppc').length;
      case 'procurement':
        return requests.filter(r => ['pending_procurement', 'ordered'].includes(r.status)).length;
      case 'evaluation':
        return requests.filter(r => ['delivered', 'pending_evaluation'].includes(r.status)).length;
      default:
        return 0;
    }
  };

  const relevantRequests = getRelevantRequests();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Material Trial Dashboard</h1>
            <p className="text-muted-foreground">
              {user?.role === 'requestor' && 'Submit and track your material trial requests'}
              {user?.role === 'cmk' && 'Review and approve material trial requests'}
              {user?.role === 'ppc' && 'Enter PR numbers and material codes'}
              {user?.role === 'procurement' && 'Manage orders and delivery tracking'}
              {user?.role === 'evaluation' && 'Track material receipt and evaluation'}
              {user?.role === 'admin' && 'Overview of all material trial requests'}
            </p>
          </div>
          {user?.role === 'requestor' && (
            <Button onClick={handleCreateRequest} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create New Request</span>
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requests.length}</div>
            </CardContent>
          </Card>
          
          {user?.role === 'requestor' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">My Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getMyRequestsCount()}</div>
              </CardContent>
            </Card>
          )}
          
          {user?.role !== 'requestor' && user?.role !== 'admin' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getPendingActionsCount()}</div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {requests.filter(r => r.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {requests.filter(r => r.status === 'rejected').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by material, supplier, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_cmk">Pending CMK Review</SelectItem>
              <SelectItem value="pending_ppc">Pending PPC</SelectItem>
              <SelectItem value="pending_procurement">Pending Procurement</SelectItem>
              <SelectItem value="ordered">Ordered</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="pending_evaluation">Pending Evaluation</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {user?.role === 'requestor' && 'My Material Trial Requests'}
              {user?.role === 'cmk' && 'Requests Pending CMK Review'}
              {user?.role === 'ppc' && 'Requests Pending PPC Data Entry'}
              {user?.role === 'procurement' && 'Requests for Procurement'}
              {user?.role === 'evaluation' && 'Requests for Evaluation'}
              {user?.role === 'admin' && 'All Material Trial Requests'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Material Category</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Plant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relevantRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    relevantRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {new Date(request.dateReceived).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{request.materialCategory}</TableCell>
                        <TableCell>{request.supplierName}</TableCell>
                        <TableCell>{request.purpose}</TableCell>
                        <TableCell>{request.plant || '-'}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewRequest(request)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {user?.role === 'requestor' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditRequest(request)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <RequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        request={selectedRequest || undefined}
        mode={modalMode}
        onSave={loadRequests}
      />

      {selectedRequest && (
        <>
          <CMKReviewModal
            isOpen={showCMKModal}
            onClose={() => setShowCMKModal(false)}
            request={selectedRequest}
            onSave={loadRequests}
          />

          <PPCModal
            isOpen={showPPCModal}
            onClose={() => setShowPPCModal(false)}
            request={selectedRequest}
            onSave={loadRequests}
          />

          <ProcurementModal
            isOpen={showProcurementModal}
            onClose={() => setShowProcurementModal(false)}
            request={selectedRequest}
            onSave={loadRequests}
          />

          <EvaluationModal
            isOpen={showEvaluationModal}
            onClose={() => setShowEvaluationModal(false)}
            request={selectedRequest}
            onSave={loadRequests}
          />
        </>
      )}
    </Layout>
  );
};