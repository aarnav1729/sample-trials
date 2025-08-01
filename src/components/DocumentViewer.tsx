import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentViewerProps {
  documents?: string[];
  title?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  documents = [], 
  title = "Documents" 
}) => {
  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            No documents available
          </div>
        </CardContent>
      </Card>
    );
  }

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getFileIcon = (filename: string) => {
    const ext = getFileExtension(filename);
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'png':
      case 'jpg':
      case 'jpeg':
        return '🖼️';
      default:
        return '📁';
    }
  };

  const getBadgeVariant = (filename: string) => {
    const ext = getFileExtension(filename);
    switch (ext) {
      case 'pdf':
        return 'destructive';
      case 'doc':
      case 'docx':
        return 'default';
      case 'xls':
      case 'xlsx':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>{title}</span>
          <Badge variant="outline">{documents.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getFileIcon(doc)}</span>
                <div>
                  <div className="font-medium text-sm">{doc}</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={getBadgeVariant(doc)} className="text-xs">
                      {getFileExtension(doc).toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};