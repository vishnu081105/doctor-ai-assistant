import { Report, ReportType } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Trash2, FileText, ClipboardList, Stethoscope, Volume2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface ReportCardProps {
  report: Report;
  onDelete: (id: string) => void;
  onDownload: (report: Report) => void;
}

const typeConfig: Record<ReportType, { label: string; icon: typeof FileText; color: string }> = {
  general: { label: 'General', icon: FileText, color: 'bg-primary/10 text-primary' },
  soap: { label: 'SOAP', icon: ClipboardList, color: 'bg-success/10 text-success' },
  diagnostic: { label: 'Diagnostic', icon: Stethoscope, color: 'bg-accent/10 text-accent' },
};

export function ReportCard({ report, onDelete, onDownload }: ReportCardProps) {
  const config = typeConfig[report.reportType];
  const Icon = config.icon;
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="group transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('rounded-lg p-2', config.color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {format(new Date(report.createdAt), 'MMM d, yyyy')}
                {report.audioUrl && (
                  <span title="Recording available">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {format(new Date(report.createdAt), 'h:mm a')} • {formatDuration(report.duration)} • {report.wordCount} words
                {report.patientId && ` • Patient: ${report.patientId}`}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className={config.color}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
          {report.reportContent.substring(0, 200)}...
        </p>
        <div className="flex gap-2">
          <Link to={`/report/${report.id}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              View
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onDownload(report)}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(report.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
