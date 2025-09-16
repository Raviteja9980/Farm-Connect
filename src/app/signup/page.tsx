
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/context/AuthContext';
import type { UserRole, Gender, User } from '@/types';
import { User as UserIcon, Briefcase, MapPinIcon, ImageUp, Mail, Lock, Phone, CalendarIcon, Image as ImageIcon, Landmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { storage, firebaseInitializedCorrectly } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function SignupPage() {
  const { user, updateUser, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [gender, setGender] = useState<Gender>('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [alternatePhoneNumber, setAlternatePhoneNumber] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [stateAndDistrict, setStateAndDistrict] = useState('');

  const [role, setRole] = useState<UserRole>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      toast({ title: "Authentication Required", description: "Please log in first to complete or update your profile.", variant: "default" });
      router.push('/login');
      return;
    }

    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setFarmName(user.farmName || '');
    setRole(user.role || null);
    setGender(user.gender || '');
    
    if (user.dateOfBirth) {
        const parsedDate = parseISO(user.dateOfBirth);
        if (isValid(parsedDate)) {
            setDateOfBirth(parsedDate);
        } else {
            setDateOfBirth(undefined);
        }
    } else {
        setDateOfBirth(undefined);
    }

    setAlternatePhoneNumber(user.alternatePhoneNumber || '');
    setFullAddress(user.fullAddress || '');
    setPincode(user.pincode || '');
    setStateAndDistrict(user.stateAndDistrict || '');

    if (user.profilePictureUrl) {
         if (user.profilePictureUrl.startsWith('data:image') || user.profilePictureUrl.startsWith('http')) {
            setImagePreviewUrl(user.profilePictureUrl);
         } else {
            // Could be a placeholder or an old invalid URL; reset or use a default.
            setImagePreviewUrl(null); 
         }
    } else {
        setImagePreviewUrl(null);
    }

  }, [isAuthenticated, user, router, toast]);

  useEffect(() => {
    // Cleanup blob URL on component unmount or when imagePreviewUrl changes
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for profile pics
        toast({ title: "Image Too Large", description: "Please select an image smaller than 2MB.", variant: "destructive" });
        e.target.value = ""; // Reset file input
        setSelectedFile(null);
        // Revert preview to original if it exists, otherwise null
        if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(user?.profilePictureUrl && (user.profilePictureUrl.startsWith('data:image') || user.profilePictureUrl.startsWith('http')) ? user.profilePictureUrl : null);
        return;
      }
      setSelectedFile(file);
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl); // Clean up old blob URL
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl);
      // Revert preview to original if it exists, otherwise null
      setImagePreviewUrl(user?.profilePictureUrl && (user.profilePictureUrl.startsWith('data:image') || user.profilePictureUrl.startsWith('http')) ? user.profilePictureUrl : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast({ title: "Error", description: "User session not found.", variant: "destructive" });
        router.push('/login');
        return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast({ title: "Name Required", description: "Please enter both first and last names.", variant: "destructive" });
      return;
    }
    if (!role) {
      toast({ title: "Role Required", description: "Please select if you are a farmer or a buyer.", variant: "destructive" });
      return;
    }
    if (role === 'farmer' && !farmName.trim()) {
      toast({ title: "Farm Name Required", description: "Please enter your farm name.", variant: "destructive" });
      return;
    }
     if (role === 'farmer' && (!fullAddress.trim() || !pincode.trim() || !stateAndDistrict.trim())) {
      toast({ title: "Address Required for Farmers", description: "Please complete your address details.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const updatedProfileData: Partial<Omit<User, 'id' | 'phoneNumber'>> = {
        firstName,
        lastName,
        role,
        farmName: role === 'farmer' ? farmName : undefined,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : undefined, // Store as yyyy-MM-dd
        alternatePhoneNumber: alternatePhoneNumber || undefined,
        fullAddress: fullAddress || undefined,
        pincode: pincode || undefined,
        stateAndDistrict: stateAndDistrict || undefined,
      };

      if (selectedFile && firebaseInitializedCorrectly) {
        try {
          if (!storage || typeof storage.ref !== 'function') {
            throw new Error("Firebase Storage is not configured or available. Please check your Firebase setup.");
          }
          const imageName = `${Date.now()}-${selectedFile.name}`;
          const storageRef = ref(storage, `profile_pictures/${user.id}/${imageName}`);
          const uploadTask = await uploadBytes(storageRef, selectedFile);
          updatedProfileData.profilePictureUrl = await getDownloadURL(uploadTask.ref);
        } catch (error) {
          console.error("Error uploading profile picture to Firebase Storage:", error);
          toast({ title: "Image Upload Error", description: `Could not upload image: ${error instanceof Error ? error.message : "Unknown error"}. Previous image retained if any.`, variant: "destructive"});
          updatedProfileData.profilePictureUrl = user.profilePictureUrl; // Retain old if upload fails
        }
      } else if (selectedFile && !firebaseInitializedCorrectly) {
        toast({ title: "Image Upload Skipped", description: "Firebase Storage is not configured correctly. Profile picture not updated.", variant: "destructive"});
        updatedProfileData.profilePictureUrl = user.profilePictureUrl; // Retain old
      } else if (imagePreviewUrl === null && user.profilePictureUrl && !selectedFile){ 
          // This case means user might have cleared a preview of an existing Firebase URL without selecting a new file
          // If you want to allow "removing" profile pic, you might set profilePictureUrl to undefined or an empty string here.
          // For now, let's assume if preview is null AND no new file, we retain the original image.
          updatedProfileData.profilePictureUrl = user.profilePictureUrl;
      } else if (user.profilePictureUrl && !selectedFile) {
          // No new file selected, retain existing Firebase URL if present
          updatedProfileData.profilePictureUrl = user.profilePictureUrl;
      }


      await updateUser(updatedProfileData);
      toast({ title: "Profile Updated!", description: `Your FarmConnect profile has been updated, ${firstName}!` });
      router.push(role === 'farmer' ? '/dashboard' : '/profile');
    } catch (error) {
      console.error("Error in handleSubmit (signup):", error);
      toast({ title: "Profile Update Error", description: "An unexpected error occurred while updating your profile.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user && !isLoading) { // Changed from user?.role to just user to allow profile completion
     return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><p>Loading user data...</p></div>;
  }

  const profilePictureAiHint = role === 'farmer' ? "farmer portrait" : "user profile";

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            {user?.role ? "Update Your Profile" : "Set Up Your Profile"}
          </CardTitle>
          <CardDescription>
            Your verified phone: {user?.phoneNumber || "N/A"}. Complete the details below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">

          <div className="space-y-2 text-center">
            <Label htmlFor="profilePicture" className="flex items-center justify-center text-lg font-semibold mb-2"><ImageUp size={20} className="mr-2 text-primary" />Profile Picture</Label>
            <Input id="profilePicture" type="file" accept="image/*" onChange={handleImageChange} 
              className="max-w-md mx-auto file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 focus-visible:ring-primary" 
              disabled={isLoading || !firebaseInitializedCorrectly} />
            {!firebaseInitializedCorrectly && (
                 <p className="text-xs text-destructive">Firebase Storage not configured. Profile picture uploads disabled.</p>
            )}
            {imagePreviewUrl && (
              <div className="mt-4 border rounded-md p-2 inline-block shadow">
                <Image src={imagePreviewUrl} alt="Profile preview" width={120} height={120} className="rounded-md object-cover" data-ai-hint={profilePictureAiHint}/>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-primary mb-4 border-b pb-2">1. Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Your First Name" required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Your Last Name" required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={gender} onValueChange={(value) => setGender(value as Gender)} disabled={isLoading}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !dateOfBirth && "text-muted-foreground")}
                        disabled={isLoading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateOfBirth ? format(dateOfBirth, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dateOfBirth} onSelect={setDateOfBirth} initialFocus disabled={(date) => date > new Date() || date < new Date("1900-01-01")}/>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </section>

            <section>
                <h2 className="text-xl font-semibold text-primary mb-4 border-b pb-2">2. Your Role</h2>
                <div className="space-y-2">
                  <Label className="text-foreground">I am a...</Label>
                  <RadioGroup value={role || undefined} onValueChange={(value) => setRole(value as UserRole)} className="flex space-x-4 pt-2" disabled={isLoading}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="farmer" id="role-farmer" />
                      <Label htmlFor="role-farmer">Farmer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="buyer" id="role-buyer" />
                      <Label htmlFor="role-buyer">Buyer</Label>
                    </div>
                  </RadioGroup>
                </div>
                 {role === 'farmer' && (
                  <div className="space-y-2 mt-6">
                    <Label htmlFor="farmName">Farm Name</Label>
                    <div className="relative">
                      <Landmark className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input id="farmName" value={farmName} onChange={(e) => setFarmName(e.target.value)} placeholder="Your Farm's Name" required={role === 'farmer'} className="pl-10" disabled={isLoading} />
                    </div>
                  </div>
                )}
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-4 border-b pb-2">3. Contact Details & Location</h2>
              <div className="space-y-2 mb-4">
                <Label htmlFor="phoneNumber">Phone Number (Verified)</Label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="phoneNumber" value={user?.phoneNumber || ''} readOnly disabled className="bg-muted/50 pl-10" />
                </div>
              </div>
              <div className="space-y-2 mb-6">
                <Label htmlFor="alternatePhoneNumber">Alternate Phone Number</Label>
                <Input id="alternatePhoneNumber" value={alternatePhoneNumber} onChange={(e) => setAlternatePhoneNumber(e.target.value)} placeholder="Optional" disabled={isLoading} />
              </div>
              <div className="space-y-2 mb-6">
                <Label htmlFor="fullAddress">Full Address</Label>
                <Input id="fullAddress" value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} placeholder="Your Full Address" required={role === 'farmer'} disabled={isLoading} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Your Pincode" required={role === 'farmer'} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stateAndDistrict">State & District</Label>
                  <Input id="stateAndDistrict" value={stateAndDistrict} onChange={(e) => setStateAndDistrict(e.target.value)} placeholder="e.g., California, Alameda County" required={role === 'farmer'} disabled={isLoading} />
                </div>
              </div>
            </section>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-lg mt-8" disabled={isLoading}>
              {isLoading ? 'Saving Profile...' : (user?.role ? 'Update Profile' : 'Complete Signup')}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            By signing up or updating, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
