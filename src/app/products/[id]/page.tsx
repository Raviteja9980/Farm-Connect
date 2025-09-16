
"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockProducts, mockFarmers, mockOrders } from '@/lib/mockData';
import type { Product, Farmer, User, Order, PaymentMethod } from '@/types';
import {
  ArrowLeft,
  CalendarDays,
  Info,
  MapPin,
  Package,
  Phone,
  MessageSquare,
  UserCircle,
  ShoppingCart,
  DollarSign,
  CreditCard,
  Landmark
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import ChatModal from '@/components/ChatModal';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      const productId = Array.isArray(params.id) ? params.id[0] : params.id;
      const foundProduct = mockProducts.find(p => p.id === productId);
      
      if (foundProduct) {
        setProduct(foundProduct);
        const foundFarmer = mockFarmers.find(f => f.id === foundProduct.farmerId);
        setFarmer(foundFarmer || null);
      } else {
        toast({ title: "Product Not Found", description: "This product does not exist or has been removed.", variant: "destructive" });
      }
    }
    setIsLoading(false);
  }, [params.id, router, toast]);

  const getValidSrcForImage = (url: string | undefined, defaultSize: string = "800x600"): string => {
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
    if (!farmer) {
       toast({ title: "Farmer Not Available", description: "Cannot initiate chat, farmer details are missing.", variant: "destructive" });
      return;
    }
    setIsChatModalOpen(true);
  };

  const handleInitiatePurchase = () => {
    if (!isAuthenticated || !currentUser) {
      toast({ title: "Login Required", description: "Please log in to purchase products.", variant: "default" });
      router.push('/login');
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSelection = (method: PaymentMethod) => {
    if (!currentUser || !product || !farmer) {
      toast({ title: "Error", description: "User or product details missing. Cannot place order.", variant: "destructive" });
      setIsPaymentModalOpen(false);
      return;
    }

    let toastTitle = "Payment Method Selected (Mock)";
    let toastDescription = `Proceeding with ${method}. This is a mock action.`;

    if (method === 'Cash on Delivery') {
      const buyerName = (currentUser.firstName && currentUser.lastName) 
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : currentUser.firstName || currentUser.lastName || "Valued Customer";

      const newOrder: Order = {
        id: `order_${Date.now()}`,
        productId: product.id,
        productName: product.name,
        productImageUrl: product.imageUrl,
        productPrice: product.price,
        productUnit: product.unit,
        buyerId: currentUser.id,
        buyerName: buyerName,
        buyerPhoneNumber: currentUser.phoneNumber,
        farmerId: product.farmerId,
        orderDate: new Date().toISOString(),
        paymentMethod: method,
        status: 'Confirmed',
        quantityOrdered: 1, 
      };
      mockOrders.push(newOrder);
      console.log("New Order Created (COD):", newOrder);
      
      toastTitle = "Order Confirmed!";
      toastDescription = `Your Cash on Delivery order for ${product.name} has been placed. The farmer will be notified.`;
    }

    toast({
      title: toastTitle,
      description: toastDescription,
      duration: 7000,
    });
    setIsPaymentModalOpen(false);
  };


  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><p>Loading product details...</p></div>;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
         <Package size={48} className="text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Product Not Found</h1>
        <p className="text-muted-foreground mb-4">The product you are looking for might have been removed or is unavailable.</p>
        <Button onClick={() => router.push('/')}><ArrowLeft size={16} className="mr-2"/>Back to Products</Button>
      </div>
    );
  }
  
  const imageSrc = getValidSrcForImage(product.imageUrl, "800x600");
  const aiHint = product.category?.toLowerCase().split(' ')[0] || "produce";

  return (
    <>
      <div className="space-y-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-2 sm:mb-0">
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>
        <Card className="overflow-hidden shadow-xl">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="md:border-r">
              <Image
                src={imageSrc}
                alt={product.name}
                width={800}
                height={600}
                className="object-cover w-full h-auto md:h-full max-h-[500px]"
                data-ai-hint={aiHint}
                priority
              />
            </div>
            <div className="p-6 md:p-8 flex flex-col">
              <CardHeader className="p-0 mb-4">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{product.name}</CardTitle>
                  <Badge variant="secondary" className="text-sm px-3 py-1">{product.category}</Badge>
                </div>
                <CardDescription className="text-md text-muted-foreground flex items-center">
                  <CalendarDays size={16} className="mr-2" /> Listed on: {new Date(product.dateListed).toLocaleDateString()}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 space-y-4 flex-grow">
                <p className="text-2xl font-bold text-accent flex items-center">
                  <span className="mr-1">₹</span>{product.price.toFixed(2)} / {product.unit}
                </p>
                <div className="text-md text-foreground flex items-center">
                  <Package size={18} className="mr-2 text-muted-foreground" /> Available: {product.quantityAvailable} {product.unit}s
                </div>
                <div className="text-md text-foreground leading-relaxed">
                  <h3 className="font-semibold text-lg mb-1 flex items-center"><Info size={20} className="mr-2 text-muted-foreground" />Description</h3>
                  {product.description}
                </div>

                {farmer && (
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="font-semibold text-lg mb-2 flex items-center"><UserCircle size={20} className="mr-2 text-muted-foreground" />Farmer Information</h3>
                    <Link href={`/farmers/${farmer.id}`} className="text-primary hover:underline font-medium text-lg block mb-1">{farmer.name}</Link>
                    <p className="text-muted-foreground flex items-center"><MapPin size={16} className="mr-2" />{farmer.location}</p>
                  </div>
                )}
                
                <div className="mt-6 pt-6 border-t">
                  <Button 
                    onClick={handleInitiatePurchase} 
                    className="w-full text-lg py-6 bg-green-600 hover:bg-green-700 text-white"
                    disabled={currentUser?.role === 'farmer' && currentUser.id === product.farmerId} 
                    title={currentUser?.role === 'farmer' && currentUser.id === product.farmerId ? "You cannot buy your own product" : "Buy Now"}
                  >
                    <ShoppingCart size={20} className="mr-2" /> Buy Now
                  </Button>
                </div>
              </CardContent>

              <CardFooter className="p-0 mt-auto pt-6" id="contact">
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button asChild variant="outline" className="w-full text-lg py-6">
                    <a href={`tel:${farmer?.phoneNumber || 'N/A'}`}>
                      <Phone size={20} className="mr-2" /> Call Farmer
                    </a>
                  </Button>
                  <Button 
                    className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground" 
                    onClick={handleChatClick}
                    disabled={currentUser?.id === product.farmerId} 
                    title={currentUser?.id === product.farmerId ? "You cannot chat about your own product" : "Chat with Farmer"}
                  >
                    <MessageSquare size={20} className="mr-2" /> Chat with Farmer
                  </Button>
                </div>
              </CardFooter>
            </div>
          </div>
        </Card>
      </div>
      {farmer && currentUser && (
        <ChatModal 
          isOpen={isChatModalOpen} 
          onClose={() => setIsChatModalOpen(false)} 
          farmer={farmer} 
          currentUser={currentUser} 
        />
      )}

      <AlertDialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Select Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Choose how you&apos;d like to pay for {product?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <Button variant="outline" className="justify-start text-left h-auto py-3" onClick={() => handlePaymentSelection('Cash on Delivery')}>
              <DollarSign className="mr-3 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Cash on Delivery</p>
                <p className="text-xs text-muted-foreground">Pay upon receiving your order.</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start text-left h-auto py-3" onClick={() => handlePaymentSelection('UPI')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-5 w-5 flex-shrink-0"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              <div>
                <p className="font-semibold">UPI</p>
                <p className="text-xs text-muted-foreground">Pay with your UPI ID.</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start text-left h-auto py-3" onClick={() => handlePaymentSelection('Card')}>
              <CreditCard className="mr-3 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Card</p>
                <p className="text-xs text-muted-foreground">Debit/Credit Card.</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start text-left h-auto py-3" onClick={() => handlePaymentSelection('Internet Banking')}>
              <Landmark className="mr-3 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Internet Banking</p>
                <p className="text-xs text-muted-foreground">Pay via your bank&apos;s net banking.</p>
              </div>
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsPaymentModalOpen(false)}>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
