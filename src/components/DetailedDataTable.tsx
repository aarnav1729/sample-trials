import React, { useState, useMemo } from 'react';
import { MaterialRequest } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, ArrowUpDown } from 'lucide-react';

interface DetailedDataTableProps {
  requests: MaterialRequest[];
  currentUser: any;
  onView: (request: MaterialRequest) => void;
  onEdit?: (request: MaterialRequest) => void;
}

export const DetailedDataTable: React.FC<DetailedDataTableProps> = ({
  requests,
  currentUser,
  onView,
  onEdit
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof MaterialRequest>('dateReceived');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending_cmk': return 'destructive';
      case 'pending_ppc': return 'secondary';
      case 'pending_procurement': return 'secondary';
      case 'ordered': return 'default';
      case 'delivered': return 'default';
      case 'pending_stores': return 'secondary';
      case 'received': return 'default';
      case 'pending_evaluation': return 'secondary';
      case 'pending_final_cmk': return 'destructive';
      case 'completed': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const isPendingForUser = (request: MaterialRequest, userRole: string) => {
    switch (userRole) {
      case 'cmk':
        return request.status === 'pending_cmk' || request.status === 'pending_final_cmk';
      case 'ppc':
        return request.status === 'pending_ppc';
      case 'procurement':
        return request.status === 'pending_procurement';
      case 'stores':
        return request.status === 'delivered';
      case 'evaluation':
        return request.status === 'received' || request.status === 'pending_evaluation';
      default:
        return false;
    }
  };

  const filteredAndSortedRequests = useMemo(() => {
    let filtered = requests.filter(request => {
      const matchesSearch = 
        request.materialCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.materialDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || request.materialCategory === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [requests, searchTerm, sortField, sortDirection, statusFilter, categoryFilter]);

  const pendingRequests = filteredAndSortedRequests.filter(req => 
    isPendingForUser(req, currentUser?.role)
  );

  const allCategories = [...new Set(requests.map(r => r.materialCategory))];
  const allStatuses = [...new Set(requests.map(r => r.status))];

  const handleSort = (field: keyof MaterialRequest) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const RequestTable = ({ data }: { data: MaterialRequest[] }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">
              <Button variant="ghost" onClick={() => handleSort('id')} className="h-auto p-0 font-semibold">
                Request ID <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('dateReceived')} className="h-auto p-0 font-semibold">
                Date <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>Material</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>CMK</TableHead>
            <TableHead>PPC</TableHead>
            <TableHead>Procurement</TableHead>
            <TableHead>Stores</TableHead>
            <TableHead>Evaluation</TableHead>
            <TableHead>Final CMK</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((request) => (
            <TableRow 
              key={request.id} 
              className={isPendingForUser(request, currentUser?.role) ? 'bg-orange-50 dark:bg-orange-950/50' : ''}
            >
              <TableCell className="font-mono text-xs">{request.id}</TableCell>
              <TableCell className="text-sm">{formatDate(request.dateReceived)}</TableCell>
              <TableCell>
                <div className="max-w-[200px]">
                  <div className="font-medium text-sm">{request.materialCategory}</div>
                  <div className="text-xs text-muted-foreground truncate">{request.materialDetails}</div>
                </div>
              </TableCell>
              <TableCell className="text-sm">{request.supplierName}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(request.status)} className="text-xs">
                  {request.status.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-xs">
                {request.cmkDecision ? (
                  <div>
                    <div className="font-medium">{request.cmkDecision.decision.toUpperCase()}</div>
                    <div className="text-muted-foreground">{formatDateTime(request.cmkDecision.approvedAt)}</div>
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell className="text-xs">
                {request.ppcData ? (
                  <div>
                    <div className="font-medium">PR: {request.ppcData.prNumber}</div>
                    <div className="text-muted-foreground">{formatDateTime(request.ppcData.enteredAt)}</div>
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell className="text-xs">
                {request.procurementData ? (
                  <div>
                    <div className="font-medium">
                      {request.procurementData.deliveredAt ? 'Delivered' : 'Ordered'}
                    </div>
                    <div className="text-muted-foreground">
                      {formatDateTime(request.procurementData.deliveredAt || request.procurementData.updatedAt)}
                    </div>
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell className="text-xs">
                {request.storesData ? (
                  <div>
                    <div className="font-medium">By: {request.storesData.receivedBy}</div>
                    <div className="text-muted-foreground">{formatDateTime(request.storesData.updatedAt)}</div>
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell className="text-xs">
                {request.evaluationData ? (
                  <div>
                    <div className="font-medium">
                      {request.evaluationData.report ? 'Completed' : 'Received'}
                    </div>
                    <div className="text-muted-foreground">{formatDateTime(request.evaluationData.updatedAt)}</div>
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell className="text-xs">
                {request.finalCmkReview ? (
                  <div>
                    <div className="font-medium">{request.finalCmkReview.decision.toUpperCase()}</div>
                    <div className="text-muted-foreground">{formatDateTime(request.finalCmkReview.reviewedAt)}</div>
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => onView(request)}>
                  <Eye className="h-3 w-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No requests found matching your filters.
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Input
          placeholder="Search requests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="lg:col-span-2"
        />
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {allStatuses.map(status => (
              <SelectItem key={status} value={status}>
                {status.replace(/_/g, ' ').toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {allCategories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          onClick={() => handleSort('dateReceived')}
          className="flex items-center space-x-2"
        >
          <ArrowUpDown className="h-4 w-4" />
          <span>Sort by Date</span>
        </Button>
      </div>

      {/* Tabs for All vs Pending */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pending for Me ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Requests ({filteredAndSortedRequests.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-6">
          <RequestTable data={pendingRequests} />
        </TabsContent>
        
        <TabsContent value="all" className="mt-6">
          <RequestTable data={filteredAndSortedRequests} />
        </TabsContent>
      </Tabs>
    </div>
  );
};