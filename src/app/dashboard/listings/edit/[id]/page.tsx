"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { mockProducts } from '@/lib/mockData';
import type { Product } from '@/types';
import { ArrowLeft, Construction } from 'lucide-react';

// This is a placeholder page for editing a listing.
// A full implementation would be similar to NewListingPage but pre-filled with product data.

export default function EditListingPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    } else if (user?.role !== 'farmer') {
      toast({ title: "Access Denied", description: "Only farmers can edit listings.", variant: "destructive" });
      router.push('/');
      return;
    }

    if (productId) {
      const foundProduct = mockProducts.find(p => p.id === productId && p.farmerId === user.id);
      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        toast({ title: "Listing Not Found", description: "Could not find the listing or you don't have permission to edit it.", variant: "destructive" });
        router.push('/dashboard');
      }
    }
    setIsLoading(false);
  }, [isAuthenticated, user, router, toast, productId]);

  if (isLoading || !product) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><p>Loading listing for editing...</p></div>;
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Edit Listing: {product.name}</CardTitle>
          <CardDescription>
            This feature is currently under construction. Please check back later.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Construction size={64} className="mx-auto text-accent mb-4" />
          <p className="text-lg text-muted-foreground">
            Editing functionality for listings will be available soon.
          </p>
          {/* Placeholder for form similar to NewListingPage */}
        </CardContent>
      </Card>
    </div>
  );
}
