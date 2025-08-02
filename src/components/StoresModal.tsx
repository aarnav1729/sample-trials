import React, { useState } from 'react';
import { MaterialRequest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { storageUtils } from '@/utils/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DocumentViewer } from './DocumentViewer';
import { AuditTrail } from './AuditTrail';
import { Upload, Package, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StoresModalProps {
  request: MaterialRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const StoresModal: React.FC<StoresModalProps> = ({
  request,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [receivedBy, setReceivedBy] = useState(request?.storesData?.receivedBy || '');
  const [documents, setDocuments] = useState<string[]>(request?.storesData?.documents || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!request) return null;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newDocuments = Array.from(files).map(file => 
        `${file.name} (uploaded on ${new Date().toLocaleDateString()})`
      );
      setDocuments(prev => [...prev, ...newDocuments]);
      toast({
        title: "Documents Uploaded",
        description: `${files.length} document(s) uploaded successfully`,
      });
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!receivedBy.trim()) {
      toast({
        title: "Error",
        description: "Please select the person who received the material",
        variant: "destructive"
      });
      return;
    }

    if (documents.length === 0) {
      toast({
        title: "Error", 
        description: "Please upload at least one receiving document",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const updates: Partial<MaterialRequest> = {
        status: 'received',
        storesData: {
          receivedBy,
          documents,
          updatedBy: user.id,
          updatedAt: new Date().toISOString()
        }
      };

      const updatedRequest = storageUtils.updateRequest(request.id, updates);

      if (updatedRequest) {
        // Add audit entry
        storageUtils.addAuditEntry(request.id, {
          action: 'Material Received by Stores',
          userId: user.id,
          timestamp: new Date().toISOString(),
          details: `Material received by stores and handed over to ${receivedBy}. ${documents.length} document(s) uploaded.`
        });

        toast({
          title: "Success",
          description: "Material marked as received successfully",
        });

        onUpdate();
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update material status",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setReceivedBy(request?.storesData?.receivedBy || '');
    setDocuments(request?.storesData?.documents || []);
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
            <Package className="h-5 w-5" />
            <span>Stores Team - {request.id}</span>
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

          {/* Delivery Information */}
          {request.procurementData?.deliveredAt && (
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Delivered to Factory
                </span>
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Delivered on: {new Date(request.procurementData.deliveredAt).toLocaleDateString()}
              </div>
              {request.procurementData.remarks && (
                <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Remarks: {request.procurementData.remarks}
                </div>
              )}
            </div>
          )}

          {/* Material Receipt Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Material Receipt</h3>
            
            <div className="space-y-2">
              <Label htmlFor="receivedBy">Received By *</Label>
              <Select value={receivedBy} onValueChange={setReceivedBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select person who received the material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rahul Mishra">Rahul Mishra</SelectItem>
                  <SelectItem value="Ramu">Ramu</SelectItem>
                  <SelectItem value="Other Technical Staff">Other Technical Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documents">Upload Receiving Documents *</Label>
              <Input
                id="documents"
                type="file"
                multiple
                accept=".pdf,.docx,.xlsx,.jpg,.png"
                onChange={handleFileUpload}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
              />
              <p className="text-sm text-muted-foreground">
                Upload receiving documents (PDF, DOCX, XLSX, JPG, PNG)
              </p>
              
              {documents.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium">Uploaded Documents:</div>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {documents.map((doc, index) => (
                      <li key={index}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Existing Documents */}
          <DocumentViewer 
            documents={request.storesData?.documents} 
            title="Previously Uploaded Documents"
          />

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
            >
              {isSubmitting ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Received
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
