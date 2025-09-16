
"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import ProductCard from '@/components/ProductCard';
import { mockFarmers, mockProducts } from '@/lib/mockData';
import type { Farmer, Product, User } from '@/types';
import { ArrowLeft, MapPin, Phone, UserCircle, ShoppingBasket, Edit3, Leaf, CalendarDays, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; 
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import ChatModal from '@/components/ChatModal';

type DisplayFarmer = Partial<Omit<User, 'id' | 'role'>> & Pick<Farmer, 'id'> & { bio?: string; products?: Product[]; farmName?: string; location?: string };


export default function FarmerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth(); 
  const { toast } = useToast();
  const [farmerDisplayData, setFarmerDisplayData] = useState<DisplayFarmer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  const farmerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const isOwnProfile = currentUser?.role === 'farmer' && currentUser?.id === farmerId;
  

  useEffect(() => {
    setIsLoading(true);
    if (farmerId) {
      let displayData: DisplayFarmer | null = null;
      const farmerProducts = mockProducts.filter(p => p.farmerId === farmerId);
      setProducts(farmerProducts);

      if (isOwnProfile && currentUser) {
        const resolvedFarmName = currentUser.farmName || 
                         ((currentUser.firstName && currentUser.lastName) ? `${currentUser.firstName} ${currentUser.lastName}'s Farm` : "My Farm");
        const locationString = [currentUser.fullAddress, currentUser.stateAndDistrict, currentUser.pincode].filter(Boolean).join(', ').replace(/, ,|, $/g, '') || "Location not set";
        // Bio is not part of the signup form, so we'll still try to get it from mockFarmers if viewing own profile
        const farmerBioFromMock = mockFarmers.find(f => f.id === currentUser.id)?.bio || "Farmer bio not set.";


        displayData = {
          id: currentUser.id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          farmName: resolvedFarmName,
          location: locationString,
          phoneNumber: currentUser.phoneNumber,
          alternatePhoneNumber: currentUser.alternatePhoneNumber,
          profilePictureUrl: currentUser.profilePictureUrl,
          bio: farmerBioFromMock, // Use bio from mock data
          gender: currentUser.gender,
          dateOfBirth: currentUser.dateOfBirth,
        };
      } else {
        const foundFarmerFromMock = mockFarmers.find(f => f.id === farmerId);
        if (foundFarmerFromMock) {
           // For other farmers, we use the old mock `location` string and other mock data
           // If we were to display detailed address for other farmers, we'd need to add those fields to mockFarmers
          displayData = {
            id: foundFarmerFromMock.id,
            farmName: foundFarmerFromMock.name, 
            location: foundFarmerFromMock.location || "Location not set",
            phoneNumber: foundFarmerFromMock.phoneNumber,
            profilePictureUrl: foundFarmerFromMock.profilePictureUrl,
            bio: foundFarmerFromMock.bio,
            // Gender, DOB, detailed address fields are not in mockFarmers, so they'd be undefined here
          };
        }
      }

      if (displayData) {
        setFarmerDisplayData(displayData);
      } else {
         toast({ title: "Farmer Not Found", description: "This farmer profile does not exist.", variant: "destructive" });
      }
    }
    setIsLoading(false);
  }, [farmerId, toast, currentUser, isOwnProfile]);

  const getValidSrcForImage = (url?: string, defaultSize: string = "150x150"): string => {
    if (!url) {
      return `https://placehold.co/${defaultSize}.png`;
    }
  
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
        console.warn(`Invalid image URL processed: ${processedUrl}, falling back to placeholder.`);
      }
    }
    return `https://placehold.co/${defaultSize}.png`;
  };
  
  const handleChatClick = () => {
    if (!isAuthenticated || !currentUser) {
      toast({ title: "Login Required", description: "Please log in to chat with the farmer.", variant: "default" });
      router.push('/login');
      return;
    }
    if (!farmerDisplayData) { 
       toast({ title: "Farmer Not Available", description: "Cannot initiate chat, farmer details are missing.", variant: "destructive" });
      return;
    }
    setIsChatModalOpen(true);
  };


  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><p>Loading farmer profile...</p></div>;
  }

  if (!farmerDisplayData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <UserCircle size={48} className="text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Farmer Not Found</h1>
        <p className="text-muted-foreground mb-4">The farmer profile you are looking for is unavailable.</p>
        <Button onClick={() => router.push('/')}><ArrowLeft size={16} className="mr-2"/>Back to Products</Button>
      </div>
    );
  }
  
  const profileImageSrc = getValidSrcForImage(farmerDisplayData.profilePictureUrl, "150x150");
  const profileAiHint = "farmer portrait"; 
  const pageTitle = farmerDisplayData.farmName || ((farmerDisplayData.firstName && farmerDisplayData.lastName) ? `${farmerDisplayData.firstName} ${farmerDisplayData.lastName}` : "Farmer Profile");
  const farmerPersonalName = (farmerDisplayData.firstName && farmerDisplayData.lastName) ? `${farmerDisplayData.firstName} ${farmerDisplayData.lastName}` : null;

  const farmerForChat: Farmer | null = farmerDisplayData ? {
    id: farmerDisplayData.id,
    name: farmerDisplayData.farmName || farmerPersonalName || "Farmer", 
    location: farmerDisplayData.location || "Unknown Location", // Use the displayed location
    phoneNumber: farmerDisplayData.phoneNumber || "N/A",
    profilePictureUrl: farmerDisplayData.profilePictureUrl,
    bio: farmerDisplayData.bio,
  } : null;

  return (
    <>
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-2 sm:mb-0">
        <ArrowLeft size={16} className="mr-2" /> Back
      </Button>

      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Image
              src={profileImageSrc}
              alt={pageTitle}
              width={150}
              height={150}
              className="rounded-full border-4 border-card object-cover shadow-md"
              data-ai-hint={profileAiHint}
            />
            <div className="text-center md:text-left">
              <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{pageTitle}</CardTitle>
              {farmerPersonalName && pageTitle !== farmerPersonalName && (
                 <p className="text-lg text-muted-foreground -mt-1">{farmerPersonalName}</p>
              )}
              <CardDescription className="text-md text-muted-foreground mt-1 flex items-center justify-center md:justify-start">
                <MapPin size={16} className="mr-2" /> {farmerDisplayData.location || "Location not set"}
              </CardDescription>
              <p className="text-muted-foreground mt-1 flex items-center justify-center md:justify-start">
                <Phone size={16} className="mr-2" /> {farmerDisplayData.phoneNumber || "Phone not set"}
              </p>
              {farmerDisplayData.alternatePhoneNumber && (
                 <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center md:justify-start">
                  <Phone size={14} className="mr-2 opacity-70" /> Alt: {farmerDisplayData.alternatePhoneNumber}
                </p>
              )}
              {isOwnProfile ? (
                 <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/signup"> 
                      <Edit3 size={14} className="mr-2" /> Edit Profile
                    </Link>
                  </Button>
              ) : isAuthenticated && farmerForChat && currentUser?.id !== farmerForChat.id && (
                 <Button variant="default" size="sm" className="mt-3 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleChatClick}> 
                    <MessageSquare size={14} className="mr-2" /> Chat with Farmer
                  </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          {(farmerDisplayData.gender || farmerDisplayData.dateOfBirth || (isOwnProfile && farmerPersonalName)) && (
            <div className="mb-6 pb-6 border-b">
              <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center"><UserCircle size={20} className="mr-2 text-primary"/>Personal Details</h3>
              <div className="space-y-1">
                {farmerPersonalName && (
                     <p className="text-foreground/80"><span className="font-medium">Name:</span> {farmerPersonalName}</p>
                )}
                {farmerDisplayData.gender && (
                  <p className="text-foreground/80"><span className="font-medium">Gender:</span> <span className="capitalize">{farmerDisplayData.gender.replace("_", " ")}</span></p>
                )}
                {farmerDisplayData.dateOfBirth && (
                  <p className="text-foreground/80"><span className="font-medium">Born:</span> {format(parseISO(farmerDisplayData.dateOfBirth), "PPP")}</p>
                )}
              </div>
            </div>
          )}

          {farmerDisplayData.bio && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center"><Leaf size={20} className="mr-2 text-primary"/>About {farmerDisplayData.farmName || farmerPersonalName || "the Farm"}</h3>
              <p className="text-foreground/80 leading-relaxed">{farmerDisplayData.bio}</p>
            </div>
          )}
          
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
              <ShoppingBasket size={20} className="mr-2 text-primary" />Products from {farmerDisplayData.farmName || farmerPersonalName || "this Farmer"}
            </h3>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} farmer={mockFarmers.find(f => f.id === product.farmerId)} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">This farmer has no products listed currently.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    {farmerForChat && currentUser && (
      <ChatModal 
        isOpen={isChatModalOpen} 
        onClose={() => setIsChatModalOpen(false)} 
        farmer={farmerForChat} 
        currentUser={currentUser} 
      />
    )}
    </>
  );
}
