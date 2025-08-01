import React, { useState, useMemo } from 'react';
import { MaterialRequest } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Edit2, ArrowUpDown } from 'lucide-react';

interface DataTableProps {
  requests: MaterialRequest[];
  currentUser: any;
  onView: (request: MaterialRequest) => void;
  onEdit?: (request: MaterialRequest) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
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
      case 'evaluation':
        return request.status === 'pending_evaluation';
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

  const RequestTable = ({ data }: { data: MaterialRequest[] }) => (
    <div className="space-y-4">
      {data.map((request) => (
        <Card key={request.id} className={`transition-all duration-200 ${
          isPendingForUser(request, currentUser?.role) ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950' : ''
        }`}>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Request ID</div>
                <div className="font-mono text-sm">{request.id}</div>
                <div className="text-xs text-muted-foreground">Date</div>
                <div className="text-sm">{new Date(request.dateReceived).toLocaleDateString()}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Material</div>
                <div className="font-medium">{request.materialCategory}</div>
                <div className="text-sm text-muted-foreground line-clamp-2">{request.materialDetails}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Supplier</div>
                <div className="text-sm">{request.supplierName}</div>
                <div className="text-xs text-muted-foreground">Status</div>
                <Badge variant={getStatusBadgeVariant(request.status)}>
                  {request.status.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Plant</div>
                  <div className="text-sm">{request.plant || 'Not assigned'}</div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => onView(request)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {currentUser?.role === 'requestor' && onEdit && (
                    <Button size="sm" variant="outline" onClick={() => onEdit(request)}>
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
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
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">
            All Requests ({filteredAndSortedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending for Me ({pendingRequests.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <RequestTable data={filteredAndSortedRequests} />
        </TabsContent>
        
        <TabsContent value="pending" className="mt-6">
          <RequestTable data={pendingRequests} />
        </TabsContent>
      </Tabs>
    </div>
  );
};