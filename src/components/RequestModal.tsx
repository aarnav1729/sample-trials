import React, { useState, useEffect } from 'react';
import { MaterialRequest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { storageUtils } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Calendar, CalendarDays } from 'lucide-react';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: MaterialRequest;
  mode: 'create' | 'edit' | 'view';
  onSave: () => void;
}

export const RequestModal: React.FC<RequestModalProps> = ({ 
  isOpen, 
  onClose, 
  request, 
  mode, 
  onSave 
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<MaterialRequest>>({});
  const [customCategory, setCustomCategory] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');
  const [settings, setSettings] = useState(storageUtils.getSettings());

  useEffect(() => {
    if (request && mode !== 'create') {
      setFormData(request);
    } else {
      setFormData({
        dateReceived: new Date().toISOString().split('T')[0],
        trialAtPlant: false,
        bisRequired: false,
        iecRequired: false,
      });
    }
    setSettings(storageUtils.getSettings());
  }, [request, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const requestData: MaterialRequest = {
      id: request?.id || storageUtils.generateId(),
      dateReceived: formData.dateReceived || '',
      materialCategory: formData.materialCategory || '',
      materialDetails: formData.materialDetails || '',
      supplierName: formData.supplierName || '',
      quantity: formData.quantity,
      trialAtPlant: formData.trialAtPlant || false,
      purpose: formData.purpose || '',
      bisRequired: formData.bisRequired || false,
      bisCost: formData.bisCost,
      bisCostBorneBy: formData.bisCostBorneBy,
      bisSplitSupplier: formData.bisSplitSupplier,
      bisSplitPremier: formData.bisSplitPremier,
      iecRequired: formData.iecRequired || false,
      iecCost: formData.iecCost,
      iecCostBorneBy: formData.iecCostBorneBy,
      iecSplitSupplier: formData.iecSplitSupplier,
      iecSplitPremier: formData.iecSplitPremier,
      status: request?.status || 'pending_cmk',
      requestorId: user.id,
      auditTrail: request?.auditTrail || [],
      ...request
    };

    // Handle custom category
    if (formData.materialCategory === 'Other' && customCategory) {
      requestData.materialCategory = customCategory;
      storageUtils.addToDropdown('materialCategories', customCategory);
    }

    // Handle custom purpose
    if (formData.purpose === 'Other' && customPurpose) {
      requestData.purpose = customPurpose;
      storageUtils.addToDropdown('purposes', customPurpose);
    }

    storageUtils.saveRequest(requestData);
    
    const action = mode === 'create' ? 'Created' : 'Updated';
    storageUtils.addAuditEntry(requestData.id, {
      action: `Request ${action}`,
      userId: user.id,
      timestamp: new Date().toISOString(),
      details: `Material request ${action.toLowerCase()} by ${user.name}`
    });

    toast({
      title: `Request ${action}`,
      description: `Material trial request has been ${action.toLowerCase()} successfully.`,
    });

    onSave();
    onClose();
  };

  const isReadOnly = mode === 'view' || (mode === 'edit' && user?.role !== 'requestor');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Material Trial Request' : 
             mode === 'edit' ? 'Edit Material Trial Request' : 
             'View Material Trial Request'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateReceived">Date Received / Inputted *</Label>
              <Input
                id="dateReceived"
                type="date"
                value={formData.dateReceived || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, dateReceived: e.target.value }))}
                required
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="materialCategory">Material Category *</Label>
              <Select 
                value={formData.materialCategory || ''} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, materialCategory: value }))}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {settings.materialCategories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {formData.materialCategory === 'Other' && !isReadOnly && (
                <Input
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="materialDetails">Material Details (including Model No.) *</Label>
            <Textarea
              id="materialDetails"
              value={formData.materialDetails || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, materialDetails: e.target.value }))}
              placeholder="Enter detailed material description including model number"
              required
              disabled={isReadOnly}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplierName">Supplier Name *</Label>
              <Input
                id="supplierName"
                value={formData.supplierName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                placeholder="Enter supplier name"
                required
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (Optional)</Label>
              <Input
                id="quantity"
                value={formData.quantity || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="e.g., 1 pallet"
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose *</Label>
            <Select 
              value={formData.purpose || ''} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, purpose: value }))}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                {settings.purposes.map((purpose) => (
                  <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                ))}
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {formData.purpose === 'Other' && !isReadOnly && (
              <Input
                placeholder="Enter custom purpose"
                value={customPurpose}
                onChange={(e) => setCustomPurpose(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="trialAtPlant"
              checked={formData.trialAtPlant || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trialAtPlant: !!checked }))}
              disabled={isReadOnly}
            />
            <Label htmlFor="trialAtPlant">Trial to be Conducted @ Plant</Label>
          </div>

          {/* BIS Requirements */}
          <div className="space-y-4 border p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="bisRequired"
                checked={formData.bisRequired || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, bisRequired: !!checked }))}
                disabled={isReadOnly}
              />
              <Label htmlFor="bisRequired">BIS Required</Label>
            </div>

            {formData.bisRequired && (
              <div className="space-y-4 ml-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bisCost">BIS Cost</Label>
                    <Input
                      id="bisCost"
                      type="number"
                      value={formData.bisCost || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, bisCost: parseFloat(e.target.value) }))}
                      placeholder="Enter BIS cost"
                      disabled={isReadOnly}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bisCurrency">Currency</Label>
                    <Select 
                      value={formData.bisCurrency || ''} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, bisCurrency: value as 'USD' | 'INR' | 'YUAN' }))}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="YUAN">YUAN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bisCostBorneBy">Cost Borne By</Label>
                    <Select 
                      value={formData.bisCostBorneBy || ''} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, bisCostBorneBy: value }))}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select who bears cost" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Premier">Premier</SelectItem>
                        <SelectItem value="Supplier">Supplier</SelectItem>
                        <SelectItem value="Split">Split</SelectItem>
                        <SelectItem value="Against Order">Against Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.bisCostBorneBy === 'Split' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bisSplitSupplier">Amount Paid by Supplier</Label>
                      <Input
                        id="bisSplitSupplier"
                        type="number"
                        value={formData.bisSplitSupplier || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, bisSplitSupplier: parseFloat(e.target.value) }))}
                        placeholder="Supplier amount"
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bisSplitPremier">Amount Paid by Premier</Label>
                      <Input
                        id="bisSplitPremier"
                        type="number"
                        value={formData.bisSplitPremier || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, bisSplitPremier: parseFloat(e.target.value) }))}
                        placeholder="Premier amount"
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* IEC Requirements */}
          <div className="space-y-4 border p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="iecRequired"
                checked={formData.iecRequired || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, iecRequired: !!checked }))}
                disabled={isReadOnly}
              />
              <Label htmlFor="iecRequired">IEC Required</Label>
            </div>

            {formData.iecRequired && (
              <div className="space-y-4 ml-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="iecCost">IEC Cost</Label>
                    <Input
                      id="iecCost"
                      type="number"
                      value={formData.iecCost || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, iecCost: parseFloat(e.target.value) }))}
                      placeholder="Enter IEC cost"
                      disabled={isReadOnly}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="iecCurrency">Currency</Label>
                    <Select 
                      value={formData.iecCurrency || ''} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, iecCurrency: value as 'USD' | 'INR' | 'YUAN' }))}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="YUAN">YUAN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="iecCostBorneBy">Cost Borne By</Label>
                    <Select 
                      value={formData.iecCostBorneBy || ''} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, iecCostBorneBy: value }))}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select who bears cost" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Premier">Premier</SelectItem>
                        <SelectItem value="Supplier">Supplier</SelectItem>
                        <SelectItem value="Split">Split</SelectItem>
                        <SelectItem value="Against Order">Against Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.iecCostBorneBy === 'Split' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="iecSplitSupplier">Amount Paid by Supplier</Label>
                      <Input
                        id="iecSplitSupplier"
                        type="number"
                        value={formData.iecSplitSupplier || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, iecSplitSupplier: parseFloat(e.target.value) }))}
                        placeholder="Supplier amount"
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="iecSplitPremier">Amount Paid by Premier</Label>
                      <Input
                        id="iecSplitPremier"
                        type="number"
                        value={formData.iecSplitPremier || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, iecSplitPremier: parseFloat(e.target.value) }))}
                        placeholder="Premier amount"
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {mode !== 'view' && (
              <Button type="submit">
                {mode === 'create' ? 'Create Request' : 'Update Request'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};