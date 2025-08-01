import React, { useState } from 'react';
import { MaterialRequest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { storageUtils } from '@/utils/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DocumentViewer } from './DocumentViewer';
import { AuditTrail } from './AuditTrail';
import { CheckCircle, XCircle, FileText, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FinalCMKModalProps {
  request: MaterialRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const FinalCMKModal: React.FC<FinalCMKModalProps> = ({
  request,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [comments, setComments] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!request) return null;

  const handleSubmit = async () => {
    if (!user) return;

    if (decision === 'rejected' && !reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const finalReview = {
        decision,
        reason: decision === 'rejected' ? reason : undefined,
        comments: comments.trim() || undefined,
        reviewedBy: user.id,
        reviewedAt: new Date().toISOString()
      };

      const updates: Partial<MaterialRequest> = {
        finalCmkReview: finalReview,
        status: decision === 'approved' ? 'completed' : 'rejected'
      };

      const updatedRequest = storageUtils.updateRequest(request.id, updates);

      if (updatedRequest) {
        // Add audit entry
        storageUtils.addAuditEntry(request.id, {
          action: `Final CMK ${decision === 'approved' ? 'Approval' : 'Rejection'}`,
          userId: user.id,
          timestamp: new Date().toISOString(),
          details: decision === 'approved' 
            ? `Request finally approved by CMK${comments ? ` with comments: ${comments}` : ''}`
            : `Request rejected by CMK. Reason: ${reason}`
        });

        toast({
          title: "Success",
          description: `Request ${decision === 'approved' ? 'approved' : 'rejected'} successfully`,
        });

        onUpdate();
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDecision('approved');
    setComments('');
    setReason('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Final CMK Review - {request.id}</span>
            <Badge variant="outline">{request.status.replace(/_/g, ' ').toUpperCase()}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Material</div>
              <div className="text-sm">{request.materialCategory}</div>
              <div className="text-xs text-muted-foreground mt-1">{request.materialDetails}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Supplier</div>
              <div className="text-sm">{request.supplierName}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Plant</div>
              <div className="text-sm">{request.plant || 'Not assigned'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Quantity</div>
              <div className="text-sm">{request.quantity || 'Not specified'}</div>
            </div>
          </div>

          {/* Evaluation Report */}
          {request.evaluationData?.report && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Evaluation Report</h3>
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Evaluation Completed
                  </span>
                </div>
                <div className="text-sm text-green-700 dark:text-green-300 mb-2">
                  Completed on: {request.evaluationData.completionDate ? 
                    new Date(request.evaluationData.completionDate).toLocaleDateString() : 'N/A'}
                </div>
                <div className="text-sm whitespace-pre-wrap">
                  {request.evaluationData.report}
                </div>
              </div>
            </div>
          )}

          {/* Document Viewer for evaluation documents */}
          <DocumentViewer 
            documents={request.storesData?.documents} 
            title="Evaluation Documents"
          />

          {/* Decision Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Final Decision</h3>
            
            <RadioGroup value={decision} onValueChange={(value) => setDecision(value as 'approved' | 'rejected')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approved" id="approved" />
                <Label htmlFor="approved" className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Approve Request</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rejected" id="rejected" />
                <Label htmlFor="rejected" className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>Reject Request</span>
                </Label>
              </div>
            </RadioGroup>

            {decision === 'rejected' && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Rejection *</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a detailed reason for rejection..."
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="comments">Additional Comments</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Any additional comments or feedback..."
                rows={3}
              />
            </div>
          </div>

          {/* Activity History */}
          <AuditTrail auditTrail={request.auditTrail} />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              variant={decision === 'approved' ? 'default' : 'destructive'}
            >
              {isSubmitting ? (
                <Clock className="h-4 w-4 mr-2 animate-spin" />
              ) : decision === 'approved' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {isSubmitting 
                ? 'Submitting...' 
                : decision === 'approved' 
                  ? 'Approve Request' 
                  : 'Reject Request'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};