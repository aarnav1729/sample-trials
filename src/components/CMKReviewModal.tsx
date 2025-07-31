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

interface CMKReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: MaterialRequest;
  onSave: () => void;
}

export const CMKReviewModal: React.FC<CMKReviewModalProps> = ({ 
  isOpen, 
  onClose, 
  request, 
  onSave 
}) => {
  const { user } = useAuth();
  const [decision, setDecision] = useState<'trial' | 'pilot' | 'rejected'>('trial');
  const [plant, setPlant] = useState('');
  const [quantityRevised, setQuantityRevised] = useState(request.quantity || '');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    if (decision === 'rejected' && !reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    if ((decision === 'trial' || decision === 'pilot') && !plant) {
      toast({
        title: "Plant Required",
        description: "Please select a plant for the trial/pilot.",
        variant: "destructive",
      });
      return;
    }

    const updatedRequest: Partial<MaterialRequest> = {
      status: decision === 'rejected' ? 'rejected' : 'pending_ppc',
      cmkDecision: {
        decision,
        reason: decision === 'rejected' ? reason : undefined,
        plant: decision !== 'rejected' ? plant : undefined,
        quantityRevised: quantityRevised !== request.quantity ? quantityRevised : undefined,
        approvedBy: user.id,
        approvedAt: new Date().toISOString()
      },
      plant: decision !== 'rejected' ? plant : undefined,
      quantity: quantityRevised
    };

    storageUtils.updateRequest(request.id, updatedRequest);
    
    storageUtils.addAuditEntry(request.id, {
      action: `CMK ${decision === 'rejected' ? 'Rejected' : 'Approved'} Request`,
      userId: user.id,
      timestamp: new Date().toISOString(),
      details: `Request ${decision === 'rejected' ? 'rejected' : `approved for ${decision}`} by ${user.name}${decision !== 'rejected' ? ` at plant ${plant}` : ''}${reason ? `. Reason: ${reason}` : ''}`
    });

    toast({
      title: `Request ${decision === 'rejected' ? 'Rejected' : 'Approved'}`,
      description: `Material trial request has been ${decision === 'rejected' ? 'rejected' : `approved for ${decision}`}.`,
    });

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
            CMK Review - Material Trial Request
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
              <div><strong>Trial at Plant:</strong> {request.trialAtPlant ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <strong>Material Details:</strong>
              <p className="mt-1 text-muted-foreground">{request.materialDetails}</p>
            </div>
            
            {request.bisRequired && (
              <div className="border-l-4 border-primary pl-4">
                <strong>BIS Required:</strong> Yes
                <div className="text-sm text-muted-foreground">
                  Cost: ₹{request.bisCost} | Borne by: {request.bisCostBorneBy}
                </div>
              </div>
            )}
            
            {request.iecRequired && (
              <div className="border-l-4 border-primary pl-4">
                <strong>IEC Required:</strong> Yes
                <div className="text-sm text-muted-foreground">
                  Cost: ₹{request.iecCost} | Borne by: {request.iecCostBorneBy}
                </div>
              </div>
            )}
          </div>

          {/* CMK Decision Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="decision">Decision *</Label>
              <Select value={decision} onValueChange={(value: 'trial' | 'pilot' | 'rejected') => setDecision(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Approve for Trial Run</SelectItem>
                  <SelectItem value="pilot">Approve for Pilot Run</SelectItem>
                  <SelectItem value="rejected">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {decision !== 'rejected' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="plant">Plant *</Label>
                  <Select value={plant} onValueChange={setPlant}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P2">P2</SelectItem>
                      <SelectItem value="P4">P4</SelectItem>
                      <SelectItem value="P5">P5</SelectItem>
                      <SelectItem value="P6">P6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantityRevised">Quantity (Revise if needed)</Label>
                  <Input
                    id="quantityRevised"
                    value={quantityRevised}
                    onChange={(e) => setQuantityRevised(e.target.value)}
                    placeholder="e.g., 1 pallet"
                  />
                  {quantityRevised !== request.quantity && (
                    <p className="text-sm text-muted-foreground">
                      Original quantity: {request.quantity || 'Not specified'}
                    </p>
                  )}
                </div>
              </>
            )}

            {decision === 'rejected' && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Rejection *</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide reason for rejection"
                  required
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit"
                variant={decision === 'rejected' ? 'destructive' : 'default'}
              >
                {decision === 'rejected' ? 'Reject Request' : `Approve for ${decision === 'trial' ? 'Trial' : 'Pilot'}`}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};