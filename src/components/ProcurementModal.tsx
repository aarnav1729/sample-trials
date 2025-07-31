import React, { useState } from 'react';
import { MaterialRequest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { storageUtils } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface ProcurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: MaterialRequest;
  onSave: () => void;
}

export const ProcurementModal: React.FC<ProcurementModalProps> = ({ 
  isOpen, 
  onClose, 
  request, 
  onSave 
}) => {
  const { user } = useAuth();
  const [action, setAction] = useState<'order' | 'deliver'>('order');
  const [orderType, setOrderType] = useState(request.procurementData?.orderType || '');
  const [estimatedDelivery, setEstimatedDelivery] = useState(request.procurementData?.estimatedDelivery || '');
  const [remarks, setRemarks] = useState(request.procurementData?.remarks || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    let updatedRequest: Partial<MaterialRequest> = {};

    if (action === 'order') {
      if (!orderType || !estimatedDelivery) {
        toast({
          title: "Required Fields Missing",
          description: "Please select order type and estimated delivery date.",
          variant: "destructive",
        });
        return;
      }

      updatedRequest = {
        status: 'ordered',
        procurementData: {
          orderType: orderType as 'air' | 'sea',
          estimatedDelivery,
          remarks,
          updatedBy: user.id,
          updatedAt: new Date().toISOString()
        }
      };

      storageUtils.addAuditEntry(request.id, {
        action: 'Material Ordered',
        userId: user.id,
        timestamp: new Date().toISOString(),
        details: `Order placed via ${orderType}, estimated delivery: ${estimatedDelivery} by ${user.name}`
      });

      toast({
        title: "Order Placed",
        description: "Material order has been placed successfully.",
      });
    } else {
      updatedRequest = {
        status: 'delivered',
        procurementData: {
          ...request.procurementData,
          deliveredAt: new Date().toISOString(),
          updatedBy: user.id,
          updatedAt: new Date().toISOString()
        }
      };

      storageUtils.addAuditEntry(request.id, {
        action: 'Material Delivered',
        userId: user.id,
        timestamp: new Date().toISOString(),
        details: `Material delivered to factory by ${user.name}`
      });

      toast({
        title: "Material Delivered",
        description: "Material has been marked as delivered to factory.",
      });
    }

    storageUtils.updateRequest(request.id, updatedRequest);
    onSave();
    onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Procurement - Material Trial Request
            {getStatusBadge(request.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Details */}
          <div className="bg-muted p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Request Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Date Received:</strong> {new Date(request.dateReceived).toLocaleDateString()}</div>
              <div><strong>Material Category:</strong> {request.materialCategory}</div>
              <div><strong>Supplier:</strong> {request.supplierName}</div>
              <div><strong>Quantity:</strong> {request.quantity || 'Not specified'}</div>
              <div><strong>Purpose:</strong> {request.purpose}</div>
              <div><strong>Plant:</strong> {request.plant || 'Not specified'}</div>
            </div>
            
            {request.ppcData && (
              <div className="border-l-4 border-blue-500 pl-4">
                <strong>PPC Data:</strong>
                <div className="text-sm text-muted-foreground">
                  PR Number: {request.ppcData.prNumber}<br/>
                  Material Code: {request.ppcData.materialCode}<br/>
                  Description: {request.ppcData.description}
                </div>
              </div>
            )}

            {request.procurementData && (
              <div className="border-l-4 border-orange-500 pl-4">
                <strong>Procurement Status:</strong>
                <div className="text-sm text-muted-foreground">
                  {request.procurementData.orderType && `Order Type: ${request.procurementData.orderType}`}<br/>
                  {request.procurementData.estimatedDelivery && `Estimated Delivery: ${new Date(request.procurementData.estimatedDelivery).toLocaleDateString()}`}<br/>
                  {request.procurementData.deliveredAt && `Delivered: ${new Date(request.procurementData.deliveredAt).toLocaleDateString()}`}<br/>
                  {request.procurementData.remarks && `Remarks: ${request.procurementData.remarks}`}
                </div>
              </div>
            )}
          </div>

          {/* Procurement Actions */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select value={action} onValueChange={(value: 'order' | 'deliver') => setAction(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {request.status === 'pending_procurement' && (
                    <SelectItem value="order">Place Order</SelectItem>
                  )}
                  {request.status === 'ordered' && (
                    <SelectItem value="deliver">Mark as Delivered</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {action === 'order' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="orderType">Order Type *</Label>
                  <Select value={orderType} onValueChange={setOrderType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select order type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="air">Air</SelectItem>
                      <SelectItem value="sea">Sea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDelivery">Estimated Delivery Date *</Label>
                  <Input
                    id="estimatedDelivery"
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter any remarks or notes"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {action === 'order' ? 'Place Order' : 'Mark as Delivered'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};