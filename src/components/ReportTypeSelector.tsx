import { ReportType } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ClipboardList, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportTypeSelectorProps {
  selectedType: ReportType;
  onSelect: (type: ReportType) => void;
}

const reportTypes: { type: ReportType; title: string; description: string; icon: typeof FileText }[] = [
  {
    type: 'general',
    title: 'General Clinical Note',
    description: 'Standard medical transcription with key findings and notes',
    icon: FileText,
  },
  {
    type: 'soap',
    title: 'SOAP Notes',
    description: 'Subjective, Objective, Assessment, Plan format',
    icon: ClipboardList,
  },
  {
    type: 'diagnostic',
    title: 'Diagnostic Report',
    description: 'Focused diagnostic findings and conclusions',
    icon: Stethoscope,
  },
];

export function ReportTypeSelector({ selectedType, onSelect }: ReportTypeSelectorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {reportTypes.map((report) => (
        <Card
          key={report.type}
          className={cn(
            'cursor-pointer transition-all hover:border-primary/50 hover:shadow-md',
            selectedType === report.type && 'border-primary ring-2 ring-primary/20'
          )}
          onClick={() => onSelect(report.type)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'rounded-lg p-2',
                  selectedType === report.type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                <report.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">{report.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>{report.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
