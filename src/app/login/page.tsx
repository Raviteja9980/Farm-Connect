
"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/types';
import { Phone, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

function LoginPageContent() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [isSignupFlow, setIsSignupFlow] = useState(false);

  useEffect(() => {
    const action = searchParams.get('action');
    setIsSignupFlow(action === 'signup');
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // This effect handles redirection AFTER AuthContext confirms authentication
      // and user object is populated.
      if (isSignupFlow) {
        if (user.role) { // User tried to sign up but is already fully registered
          toast({ title: "Already Registered", description: "You are already registered. Logging you in.", duration: 3000 });
          router.push(user.role === 'farmer' ? '/dashboard' : '/');
        } else { // New user or incomplete profile, authenticated via OTP, proceed to signup page
          toast({ title: "Phone Verified", description: "Please complete your profile to sign up.", duration: 3000 });
          router.push('/signup');
        }
      } else { // This is a login flow
        // In a pure login flow, user.role should already be set due to the check in handleSendOtp.
        // If for some reason it's not (e.g. direct navigation to /login after clearing role from localstorage manually),
        // this will still try to redirect. A more robust check might be needed if that's a concern.
        toast({ title: "Login Successful", description: "Redirecting...", duration: 3000 });
        router.push(user.role === 'farmer' ? '/dashboard' : '/');
      }
    }
  }, [isAuthenticated, user, router, toast, isSignupFlow]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.match(/^\d{10,15}$/)) {
      toast({ title: "Invalid Phone Number", description: "Please enter a valid phone number.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    if (isSignupFlow) {
      // For signup flow, always proceed to OTP screen to verify phone
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate OTP send
      setOtpSent(true);
      setIsLoading(false);
      toast({ title: "OTP Sent for Signup", description: "An OTP has been sent to your phone (mock: 123456)." });
    } else {
      // For login flow, check if user is registered and profile is complete
      let userExistsAndRegistered = false;
      try {
        const storedUserString = localStorage.getItem('farmConnectUser');
        if (storedUserString) {
          const storedUser = JSON.parse(storedUserString) as User;
          if (storedUser.phoneNumber === phoneNumber && storedUser.role) { // Must have a role
            userExistsAndRegistered = true;
          }
        }
      } catch (error) {
        console.error("Error checking user registration status:", error);
      }

      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate check

      if (userExistsAndRegistered) {
        setOtpSent(true);
        toast({ title: "OTP Sent", description: "An OTP has been sent to your phone (mock: 123456)." });
      } else {
        toast({
          title: "Login Failed",
          description: "This phone number is not registered or your profile is incomplete. Please sign up to continue.",
          variant: "destructive",
          duration: 5000,
        });
      }
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== '123456') { // Mock OTP
      toast({ title: "Invalid OTP", description: "The OTP you entered is incorrect.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    // login function in AuthContext will set isAuthenticated and user.
    // The useEffect above will then handle redirection based on user's role and flow (signup/login).
    await login({ phoneNumber }); 
    setIsLoading(false); 
  };
  
  const handlePhoneNumberChange = () => {
    setOtpSent(false);
    setIsLoading(false);
    setOtp('');
  }

  const cardTitle = isSignupFlow ? "Create Your Account" : "Welcome Back!";
  const cardDescription = isSignupFlow 
    ? "Verify your phone number to start signing up with FarmConnect."
    : "Login to FarmConnect using your phone number.";
  const submitButtonText = isSignupFlow ? "Send OTP to Sign Up" : "Send OTP to Login";


  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
        <CardContent className="mt-6">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="phone" type="tel" placeholder="Enter your phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="pl-10" disabled={isLoading} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                {isLoading ? 'Sending...' : submitButtonText}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-foreground">Enter OTP</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="otp" type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} className="pl-10 tracking-widest text-center" disabled={isLoading} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify OTP & Continue'}
              </Button>
              <Button variant="link" onClick={handlePhoneNumberChange} className="w-full text-sm" disabled={isLoading}>
                Change Phone Number
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm mt-4">
          {isSignupFlow ? (
             <p className="text-muted-foreground">
              Already have an account? <Link href="/login" className="text-primary hover:underline">Login Here</Link>
            </p>
          ) : (
            <p className="text-muted-foreground">
              New to FarmConnect? <Link href="/login?action=signup" className="text-primary hover:underline">Sign Up Here</Link>
            </p>
          )}
           <p className="text-muted-foreground mt-2">
            After OTP verification, you may need to complete your profile.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><p>Loading...</p></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
