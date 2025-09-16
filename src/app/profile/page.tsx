
"use client";
import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { UserCircle, LogOut, Edit3, MapPin, Phone, CalendarDays, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function UserProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      toast({ title: "Access Denied", description: "Please log in to view your profile.", variant: "destructive" });
      router.push('/login');
    }
  }, [isAuthenticated, user, router, toast]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };
  
  const getValidSrcForImage = (url?: string): string => {
    if (!url) return ""; // Return empty string if no URL, UserCircle will be used
  
    let processedUrl = url;
    const hintMarker = '" data-ai-hint="';
    const hintIndex = processedUrl.indexOf(hintMarker);
  
    if (processedUrl.startsWith('https://placehold.co') && hintIndex !== -1) {
      processedUrl = processedUrl.substring(0, hintIndex);
    }
    if (processedUrl.endsWith('"')) {
      processedUrl = processedUrl.slice(0, -1);
    }
  
    if (processedUrl.startsWith('data:image') || processedUrl.startsWith('http')) {
      try { 
        if (processedUrl.startsWith('http')) new URL(processedUrl); 
        return processedUrl; 
      } catch (e) { 
        console.warn(`Invalid image URL processed: ${processedUrl}, will attempt to use UserCircle.`);
        return ""; // Fallback to no image if URL is invalid
      }
    }
    return ""; // Fallback if not data URI or HTTP/S
  };
  

  if (!user) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><p>Loading profile...</p></div>;
  }
  
  if (user.role === 'farmer') {
    router.replace(`/farmers/${user.id}`);
    return null; 
  }

  const profileImageSrc = getValidSrcForImage(user.profilePictureUrl);
  const profileAiHint = user.role === 'farmer' ? 'farmer portrait' : 'user profile';
  const displayName = (user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : (user.firstName || user.lastName || "Valued Customer");

  return (
    <div className="max-w-lg mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-accent/10 p-8">
          {profileImageSrc ? (
            <Image
              src={profileImageSrc}
              alt={displayName}
              width={80}
              height={80}
              className="rounded-full mx-auto mb-4 object-cover border-2 border-card"
              data-ai-hint={profileAiHint}
            />
          ) : (
            <UserCircle size={80} className="mx-auto text-primary mb-4" />
          )}
          <CardTitle className="text-3xl font-bold text-primary">{displayName}</CardTitle>
          <CardDescription className="text-md text-muted-foreground">
            Your FarmConnect Profile ({user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Profile'})
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <h4 className="font-semibold text-foreground">Full Name:</h4>
            <p className="text-muted-foreground">{displayName}</p>
          </div>
           {user.gender && (
            <div>
              <h4 className="font-semibold text-foreground flex items-center"><Users size={16} className="mr-2 text-muted-foreground" />Gender:</h4>
              <p className="text-muted-foreground capitalize">{user.gender.replace("_", " ")}</p>
            </div>
          )}
          {user.dateOfBirth && (
            <div>
              <h4 className="font-semibold text-foreground flex items-center"><CalendarDays size={16} className="mr-2 text-muted-foreground" />Date of Birth:</h4>
              <p className="text-muted-foreground">{format(parseISO(user.dateOfBirth), "PPP")}</p>
            </div>
          )}
          <div>
            <h4 className="font-semibold text-foreground flex items-center"><Phone size={16} className="mr-2 text-muted-foreground" />Phone Number:</h4>
            <p className="text-muted-foreground">{user.phoneNumber}</p>
          </div>
          {user.alternatePhoneNumber && (
            <div>
              <h4 className="font-semibold text-foreground flex items-center"><Phone size={16} className="mr-2 text-muted-foreground" />Alternate Phone:</h4>
              <p className="text-muted-foreground">{user.alternatePhoneNumber}</p>
            </div>
          )}
           {(user.fullAddress || user.pincode || user.stateAndDistrict) && (
            <div>
              <h4 className="font-semibold text-foreground flex items-center"><MapPin size={16} className="mr-2 text-muted-foreground" />Address:</h4>
              {user.fullAddress && <p className="text-muted-foreground">{user.fullAddress}</p>}
              {(user.stateAndDistrict || user.pincode) && (
                <p className="text-muted-foreground">
                  {user.stateAndDistrict}{user.stateAndDistrict && user.pincode && ", "}{user.pincode}
                </p>
              )}
            </div>
          )}
          
          <div className="pt-4 space-y-3">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/signup"> 
                <Edit3 size={16} className="mr-2" /> Edit Profile
              </Link>
            </Button>
            <Button variant="destructive" className="w-full" onClick={handleLogout}>
              <LogOut size={16} className="mr-2" /> Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
