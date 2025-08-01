import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuditEntry } from '@/types';
import { Clock, User, Activity } from 'lucide-react';

interface AuditTrailProps {
  auditTrail: AuditEntry[];
  className?: string;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ auditTrail, className }) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const getActionIcon = (action: string) => {
    if (action.toLowerCase().includes('create')) return '📝';
    if (action.toLowerCase().includes('approve')) return '✅';
    if (action.toLowerCase().includes('reject')) return '❌';
    if (action.toLowerCase().includes('update')) return '🔄';
    if (action.toLowerCase().includes('submit')) return '📤';
    if (action.toLowerCase().includes('deliver')) return '🚚';
    return '📋';
  };

  const getActionColor = (action: string) => {
    if (action.toLowerCase().includes('create')) return 'default';
    if (action.toLowerCase().includes('approve')) return 'default';
    if (action.toLowerCase().includes('reject')) return 'destructive';
    if (action.toLowerCase().includes('update')) return 'secondary';
    if (action.toLowerCase().includes('submit')) return 'default';
    return 'outline';
  };

  const calculateTimeDifference = (current: string, previous?: string) => {
    if (!previous) return null;
    
    const currentTime = new Date(current).getTime();
    const previousTime = new Date(previous).getTime();
    const diffMs = currentTime - previousTime;
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMinutes % 60}m`;
    return `${diffMinutes}m`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Activity History</span>
          <Badge variant="outline">{auditTrail.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {auditTrail.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No activity recorded yet
            </div>
          ) : (
            auditTrail
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((entry, index) => {
                const { date, time } = formatTimestamp(entry.timestamp);
                const timeDiff = index < auditTrail.length - 1 
                  ? calculateTimeDifference(entry.timestamp, auditTrail[index + 1]?.timestamp)
                  : null;

                return (
                  <div key={entry.id} className="relative">
                    {/* Timeline line */}
                    {index < auditTrail.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-16 bg-border"></div>
                    )}
                    
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-full flex items-center justify-center text-lg">
                        {getActionIcon(entry.action)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant={getActionColor(entry.action)} className="text-xs">
                              {entry.action}
                            </Badge>
                            {timeDiff && (
                              <span className="text-xs text-muted-foreground">
                                +{timeDiff}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{date} at {time}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-foreground mb-2">
                          {entry.details}
                        </p>
                        
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>User ID: {entry.userId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </CardContent>
    </Card>
  );
};