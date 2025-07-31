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
import { Upload } from 'lucide-react';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: MaterialRequest;
  onSave: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({ 
  isOpen, 
  onClose, 
  request, 
  onSave 
}) => {
  const { user } = useAuth();
  const [action, setAction] = useState<'receive' | 'report'>('receive');
  const [received, setReceived] = useState(request.evaluationData?.received || false);
  const [completionDate, setCompletionDate] = useState(request.evaluationData?.completionDate || '');
  const [report, setReport] = useState(request.evaluationData?.report || '');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file to a server
      // For this demo, we'll just store the filename
      setReport(`${file.name} (uploaded on ${new Date().toLocaleDateString()})`);
      toast({
        title: "File Uploaded",
        description: `Report file "${file.name}" has been uploaded.`,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    let updatedRequest: Partial<MaterialRequest> = {};

    if (action === 'receive') {
      if (!received) {
        toast({
          title: "Material Receipt Required",
          description: "Please confirm material receipt.",
          variant: "destructive",
        });
        return;
      }

      if (!completionDate) {
        toast({
          title: "Completion Date Required",
          description: "Please provide tentative evaluation completion date.",
          variant: "destructive",
        });
        return;
      }

      updatedRequest = {
        status: 'pending_evaluation',
        evaluationData: {
          received: true,
          completionDate,
          report: request.evaluationData?.report || '',
          updatedBy: user.id,
          updatedAt: new Date().toISOString()
        }
      };

      storageUtils.addAuditEntry(request.id, {
        action: 'Material Received for Evaluation',
        userId: user.id,
        timestamp: new Date().toISOString(),
        details: `Material received by evaluation team, completion expected: ${completionDate} by ${user.name}`
      });

      toast({
        title: "Material Received",
        description: "Material has been marked as received for evaluation.",
      });
    } else {
      if (!report.trim()) {
        toast({
          title: "Report Required",
          description: "Please upload or enter the evaluation report.",
          variant: "destructive",
        });
        return;
      }

      updatedRequest = {
        status: 'completed',
        evaluationData: {
          ...request.evaluationData,
          received: true,
          report,
          updatedBy: user.id,
          updatedAt: new Date().toISOString()
        }
      };

      storageUtils.addAuditEntry(request.id, {
        action: 'Evaluation Report Submitted',
        userId: user.id,
        timestamp: new Date().toISOString(),
        details: `Evaluation report submitted by ${user.name}`
      });

      toast({
        title: "Evaluation Complete",
        description: "Evaluation report has been submitted successfully.",
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
            Evaluation Team - Material Trial Request
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
            
            {request.procurementData?.deliveredAt && (
              <div className="border-l-4 border-green-500 pl-4">
                <strong>Delivery Status:</strong>
                <div className="text-sm text-muted-foreground">
                  Delivered to factory on: {new Date(request.procurementData.deliveredAt).toLocaleDateString()}
                </div>
              </div>
            )}

            {request.evaluationData && (
              <div className="border-l-4 border-purple-500 pl-4">
                <strong>Evaluation Status:</strong>
                <div className="text-sm text-muted-foreground">
                  Received: {request.evaluationData.received ? 'Yes' : 'No'}<br/>
                  {request.evaluationData.completionDate && `Expected Completion: ${new Date(request.evaluationData.completionDate).toLocaleDateString()}`}<br/>
                  {request.evaluationData.report && `Report: ${request.evaluationData.report}`}
                </div>
              </div>
            )}
          </div>

          {/* Evaluation Actions */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select value={action} onValueChange={(value: 'receive' | 'report') => setAction(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {request.status === 'delivered' && (
                    <SelectItem value="receive">Mark as Received</SelectItem>
                  )}
                  {request.status === 'pending_evaluation' && (
                    <SelectItem value="report">Submit Evaluation Report</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {action === 'receive' && (
              <>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="received"
                    checked={received}
                    onChange={(e) => setReceived(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="received">Confirm material received</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completionDate">Tentative Evaluation Completion Date *</Label>
                  <Input
                    id="completionDate"
                    type="date"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {action === 'report' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reportFile">Upload Evaluation Report</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="reportFile"
                      type="file"
                      accept=".pdf,.docx,.xlsx"
                      onChange={handleFileUpload}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                    />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Accepted formats: PDF, DOCX, XLSX
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportText">Or enter report details</Label>
                  <Textarea
                    id="reportText"
                    value={report}
                    onChange={(e) => setReport(e.target.value)}
                    placeholder="Enter evaluation report details"
                    rows={6}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {action === 'receive' ? 'Mark as Received' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};