import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getSetting, setSetting, clearAllReports, clearAllSettings, ReportType } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Languages, FileText, Clock } from 'lucide-react';

export default function Settings() {
  const [defaultReportType, setDefaultReportType] = useState<ReportType>('general');
  const [language, setLanguage] = useState('en-US');
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      const savedReportType = await getSetting<ReportType>('defaultReportType');
      const savedLanguage = await getSetting<string>('language');
      const savedTimestamps = await getSetting<boolean>('showTimestamps');
      
      if (savedReportType) setDefaultReportType(savedReportType);
      if (savedLanguage) setLanguage(savedLanguage);
      if (savedTimestamps !== undefined) setShowTimestamps(savedTimestamps);
    };
    
    loadSettings();
  }, []);

  const handleReportTypeChange = async (value: ReportType) => {
    setDefaultReportType(value);
    await setSetting('defaultReportType', value);
    toast({ title: 'Settings saved' });
  };

  const handleLanguageChange = async (value: string) => {
    setLanguage(value);
    await setSetting('language', value);
    toast({ title: 'Settings saved' });
  };

  const handleTimestampsChange = async (value: boolean) => {
    setShowTimestamps(value);
    await setSetting('showTimestamps', value);
    toast({ title: 'Settings saved' });
  };

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      await clearAllReports();
      await clearAllSettings();
      toast({
        title: 'All data cleared',
        description: 'Your reports and settings have been deleted.',
      });
      // Reset to defaults
      setDefaultReportType('general');
      setLanguage('en-US');
      setShowTimestamps(true);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Clear failed',
        description: 'Failed to clear data.',
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-2xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Configure your transcription preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Report Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Report Configuration</CardTitle>
                  <CardDescription>Default settings for report generation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="reportType">Default Report Type</Label>
                <Select value={defaultReportType} onValueChange={handleReportTypeChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Clinical Note</SelectItem>
                    <SelectItem value="soap">SOAP Notes</SelectItem>
                    <SelectItem value="diagnostic">Diagnostic Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Speech Recognition Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Languages className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Speech Recognition</CardTitle>
                  <CardDescription>Language and recognition options</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="language">Recognition Language</Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="es-ES">Spanish</SelectItem>
                    <SelectItem value="fr-FR">French</SelectItem>
                    <SelectItem value="de-DE">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Display</CardTitle>
                  <CardDescription>Visual preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="timestamps">Show Timestamps</Label>
                  <p className="text-sm text-muted-foreground">
                    Display timestamps on reports
                  </p>
                </div>
                <Switch
                  id="timestamps"
                  checked={showTimestamps}
                  onCheckedChange={handleTimestampsChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    Clear All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your saved reports and settings. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearAllData}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isClearing ? 'Clearing...' : 'Delete Everything'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
