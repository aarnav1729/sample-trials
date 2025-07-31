import React, { useState } from 'react';
import { MaterialRequest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { storageUtils } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface PPCModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: MaterialRequest;
  onSave: () => void;
}

export const PPCModal: React.FC<PPCModalProps> = ({ 
  isOpen, 
  onClose, 
  request, 
  onSave 
}) => {
  const { user } = useAuth();
  const [prNumber, setPrNumber] = useState(request.ppcData?.prNumber || '');
  const [materialCode, setMaterialCode] = useState(request.ppcData?.materialCode || '');
  const [description, setDescription] = useState(request.ppcData?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    if (!prNumber.trim() || !materialCode.trim() || !description.trim()) {
      toast({
        title: "All Fields Required",
        description: "Please fill in all PPC fields.",
        variant: "destructive",
      });
      return;
    }

    const updatedRequest: Partial<MaterialRequest> = {
      status: 'pending_procurement',
      ppcData: {
        prNumber: prNumber.trim(),
        materialCode: materialCode.trim(),
        description: description.trim(),
        enteredBy: user.id,
        enteredAt: new Date().toISOString()
      }
    };

    storageUtils.updateRequest(request.id, updatedRequest);
    
    storageUtils.addAuditEntry(request.id, {
      action: 'PPC Data Added',
      userId: user.id,
      timestamp: new Date().toISOString(),
      details: `PR Number: ${prNumber}, Material Code: ${materialCode} added by ${user.name}`
    });

    toast({
      title: "PPC Data Added",
      description: "PR number and material code have been recorded successfully.",
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
            PPC - Material Trial Request
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
            <div>
              <strong>Material Details:</strong>
              <p className="mt-1 text-muted-foreground">{request.materialDetails}</p>
            </div>
            
            {request.cmkDecision && (
              <div className="border-l-4 border-green-500 pl-4">
                <strong>CMK Decision:</strong> Approved for {request.cmkDecision.decision}
                <div className="text-sm text-muted-foreground">
                  Approved on: {new Date(request.cmkDecision.approvedAt).toLocaleDateString()}
                  {request.cmkDecision.quantityRevised && (
                    <div>Quantity revised to: {request.cmkDecision.quantityRevised}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PPC Data Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-lg">PPC Data Entry</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prNumber">PR Number *</Label>
                <Input
                  id="prNumber"
                  value={prNumber}
                  onChange={(e) => setPrNumber(e.target.value)}
                  placeholder="Enter PR number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="materialCode">Material Code *</Label>
                <Input
                  id="materialCode"
                  value={materialCode}
                  onChange={(e) => setMaterialCode(e.target.value)}
                  placeholder="Enter material code"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter detailed description"
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Submit PPC Data
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};