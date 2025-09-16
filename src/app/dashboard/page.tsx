
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, ListOrdered, DollarSign, Package, Eye, AlertTriangle, Inbox, Users, Phone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { mockProducts, mockOrders } from '@/lib/mockData'; 
import type { Product, Order } from '@/types';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Product[]>([]);
  const [receivedOrders, setReceivedOrders] = useState<Order[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.role !== 'farmer') {
      toast({ title: "Access Denied", description: "This page is for farmers only.", variant: "destructive" });
      router.push('/');
    } else {
      const farmerListings = mockProducts.filter(p => p.farmerId === user.id);
      setListings(farmerListings);
      const farmerOrders = mockOrders.filter(o => o.farmerId === user.id);
      setReceivedOrders(farmerOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
    }
  }, [isAuthenticated, user, router, toast]); 

  useEffect(() => {
    if (user?.role === 'farmer') {
        const farmerListings = mockProducts.filter(p => p.farmerId === user.id);
        setListings(farmerListings);
        const farmerOrders = mockOrders.filter(o => o.farmerId === user.id);
        setReceivedOrders(farmerOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
    }
  }, [mockProducts, mockOrders, user]);


  const getValidSrcForImage = (url: string | undefined, defaultSize: string = "50x50"): string => {
    if (!url) {
      return `https://placehold.co/${defaultSize}.png`;
    }
  
    let processedUrl = url;
    const hintMarker = '" data-ai-hint="';
    const hintIndex = processedUrl.indexOf(hintMarker);
  
    // If the URL is a placehold.co URL and contains the specific hint marker, clean it.
    if (processedUrl.startsWith('https://placehold.co') && hintIndex !== -1) {
      processedUrl = processedUrl.substring(0, hintIndex);
    }
    // Clean potential trailing quote if hint was not fully formed or from other sources
    if (processedUrl.endsWith('"')) {
      processedUrl = processedUrl.slice(0, -1);
    }
  
    if (processedUrl.startsWith('data:image') || processedUrl.startsWith('http')) { // Covers http, https
      try {
        if (processedUrl.startsWith('http')) {
          new URL(processedUrl); // Validate if it's an HTTP/HTTPS URL
        }
        return processedUrl; // Return Data URI or valid HTTP/HTTPS URL
      } catch (e) {
        // Invalid http URL, fall through to placeholder
        console.warn(`Invalid image URL processed: ${processedUrl}, falling back to placeholder.`);
      }
    }
    
    return `https://placehold.co/${defaultSize}.png`;
  };
  

  if (!user || user.role !== 'farmer') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground">You must be logged in as a farmer to view this page.</p>
        <Button onClick={() => router.push('/login')} className="mt-4">Login</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-3xl font-bold text-primary">Farmer Dashboard</CardTitle>
            <CardDescription>Manage your produce listings, view orders, and connect with buyers.</CardDescription>
          </div>
          <Link href="/dashboard/listings/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle size={18} className="mr-2" /> Add New Listing
            </Button>
          </Link>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ListOrdered size={20} className="mr-2 text-primary"/>Your Active Listings</CardTitle>
        </CardHeader>
        <CardContent>
          {listings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right"><DollarSign size={16} className="inline mr-1"/>Price</TableHead>
                    <TableHead className="text-right"><Package size={16} className="inline mr-1"/>Quantity</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((product) => {
                    const imageSrc = getValidSrcForImage(product.imageUrl, "50x50");
                    const aiHint = product.category?.toLowerCase().split(' ')[0] || "produce";
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Image 
                            src={imageSrc}
                            alt={product.name} 
                            width={50} 
                            height={50} 
                            className="rounded-md object-cover"
                            data-ai-hint={aiHint} 
                          />
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell><Badge variant="secondary">{product.category}</Badge></TableCell>
                        <TableCell className="text-right">₹{product.price.toFixed(2)} / {product.unit}</TableCell>
                        <TableCell className="text-right">{product.quantityAvailable}</TableCell>
                        <TableCell className="text-center space-x-2">
                          <Button variant="outline" size="icon" asChild title="View Product">
                            <Link href={`/products/${product.id}`}><Eye size={16} /></Link>
                          </Button>
                          <Button variant="outline" size="icon" asChild title="Edit Product">
                            <Link href={`/dashboard/listings/edit/${product.id}`}><Edit size={16} /></Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">You have no active listings. Add a new listing to get started!</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Inbox size={20} className="mr-2 text-primary"/>Received Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {receivedOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Product</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead><Phone size={14} className="inline mr-1" />Buyer Phone</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivedOrders.map((order) => {
                    const imageSrc = getValidSrcForImage(order.productImageUrl, "40x40");
                    const aiHint = order.productName?.toLowerCase().split(' ')[0] || "produce";
                    return(
                      <TableRow key={order.id}>
                        <TableCell className="flex items-center gap-2">
                           <Image 
                            src={imageSrc}
                            alt={order.productName} 
                            width={40} 
                            height={40} 
                            className="rounded-md object-cover"
                            data-ai-hint={aiHint}
                          />
                          <span className="font-medium truncate w-32" title={order.productName}>{order.productName}</span>
                        </TableCell>
                        <TableCell>{order.buyerName}</TableCell>
                        <TableCell>{order.buyerPhoneNumber}</TableCell>
                        <TableCell>{format(new Date(order.orderDate), "PPp")}</TableCell>
                        <TableCell><Badge variant={order.paymentMethod === "Cash on Delivery" ? "default" : "outline"}>{order.paymentMethod}</Badge></TableCell>
                        <TableCell className="text-right">₹{(order.productPrice * order.quantityOrdered).toFixed(2)}</TableCell>
                        <TableCell><Badge variant={order.status === "Confirmed" ? "secondary" : "default"}>{order.status}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">You have no new orders.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
