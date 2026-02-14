import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, Mail, Lock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { setSetting } from '@/lib/db';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Validate doctor name for signup
        if (!doctorName.trim()) {
          toast({
            variant: 'destructive',
            title: 'Name required',
            description: 'Please enter your name.',
          });
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(email, password);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Sign up failed',
            description: error.message,
          });
        } else {
          // Store doctor name temporarily for after login
          localStorage.setItem('pendingDoctorName', doctorName);
          toast({
            title: 'Account created!',
            description: 'Please check your email to confirm your account, then sign in.',
          });
          setIsSignUp(false);
          setDoctorName('');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          console.error('Sign in error:', error);
          let errorMessage = error.message;
          
          // Provide more helpful error messages
          if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please check your email and click the confirmation link before signing in.';
          } else if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          }
          
          toast({
            variant: 'destructive',
            title: 'Sign in failed',
            description: errorMessage,
          });
        } else {
          console.log('Sign in successful, navigating to dashboard');
          // Save pending doctor name if it exists - do this after a short delay to ensure session is established
          const pendingDoctorName = localStorage.getItem('pendingDoctorName');
          if (pendingDoctorName) {
            setTimeout(async () => {
              try {
                await setSetting('doctorName', pendingDoctorName);
                localStorage.removeItem('pendingDoctorName');
                console.log('Doctor name saved successfully');
              } catch (err) {
                console.error('Failed to save doctor name:', err);
                // Don't show error to user, just log it
              }
            }, 1000);
          }
          navigate('/');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative mb-8 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[hsl(217,89%,61%)] shadow-lg shadow-primary/25">
          <Building2 className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">KMCH Hospital</h1>
          <p className="text-sm text-muted-foreground">Voice Recording & Transcription System</p>
        </div>
      </div>

      <Card className="relative w-full max-w-md shadow-2xl border-border/50 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
          <CardDescription className="text-base">
            {isSignUp
              ? 'Start transcribing your medical notes today'
              : 'Sign in to access your medical transcriptions'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="doctorName" className="text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="doctorName"
                    type="text"
                    placeholder="Dr. John Smith"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    required={isSignUp}
                    className="pl-10 h-11"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {!isSignUp && (
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium shadow-lg shadow-primary/25" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => setIsSignUp(false)}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => setIsSignUp(true)}
                >
                  Create one
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}
