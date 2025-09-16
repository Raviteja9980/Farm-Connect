
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { mockProducts } from '@/lib/mockData';
import type { Product } from '@/types';
import { PackagePlus, ArrowLeft, ImageUp, DollarSign, Tag, Info, CheckSquare } from 'lucide-react';
import { storage, firebaseInitializedCorrectly } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const categories = Array.from(new Set(mockProducts.map(p => p.category).filter(Boolean)));
const units = Array.from(new Set(mockProducts.map(p => p.unit).filter(Boolean)));


export default function NewListingPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [quantityAvailable, setQuantityAvailable] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.role !== 'farmer') {
      toast({ title: "Access Denied", description: "Only farmers can add listings.", variant: "destructive" });
      router.push('/');
    }
  }, [isAuthenticated, user, router, toast]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "Image Too Large", description: "Please select an image smaller than 5MB.", variant: "destructive" });
        e.target.value = ""; // Reset file input
        setSelectedFile(null);
        if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
        return;
      }
      setSelectedFile(file);
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl); // Clean up old blob URL
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'farmer') return;

    if (!name || !description || !price || !unit || !quantityAvailable || !category ) {
        toast({ title: "Missing Fields", description: "Please fill out all required fields.", variant: "destructive"});
        return;
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        toast({ title: "Invalid Price", description: "Price must be a positive number.", variant: "destructive"});
        return;
    }
     if (isNaN(parseInt(quantityAvailable)) || parseInt(quantityAvailable) <= 0) {
        toast({ title: "Invalid Quantity", description: "Quantity must be a positive whole number.", variant: "destructive"});
        return;
    }

    setIsLoading(true);
    try {
      let finalImageUrl = `https://placehold.co/600x400.png`; // Default placeholder
      let aiHintValue = category.toLowerCase().split(' ')[0] || 'produce';

      if (selectedFile && firebaseInitializedCorrectly) {
        try {
          // Ensure storage is usable. firebaseInitializedCorrectly implies storage should be too.
          if (!storage || typeof storage.ref !== 'function') {
             throw new Error("Firebase Storage is not configured or available. Please check your Firebase setup.");
          }
          const imageName = `${Date.now()}-${selectedFile.name}`;
          const storageRef = ref(storage, `product_images/${user.id}/${imageName}`);
          const uploadTask = await uploadBytes(storageRef, selectedFile);
          finalImageUrl = await getDownloadURL(uploadTask.ref);
          // For Firebase URLs, aiHint is derived from category, not embedded in URL.
        } catch (error) {
          console.error("Error uploading image to Firebase Storage:", error);
          toast({ title: "Image Upload Error", description: `Could not upload image: ${error instanceof Error ? error.message : "Unknown error"}. Using placeholder.`, variant: "destructive"});
          // finalImageUrl remains the default placeholder, aiHint from category
        }
      } else if (selectedFile && !firebaseInitializedCorrectly) {
         toast({ title: "Image Upload Skipped", description: "Firebase Storage is not configured correctly. Using placeholder image.", variant: "destructive"});
      }


      const productId = `prod_${Date.now()}`;
      const newProduct: Product = {
        id: productId,
        name,
        description,
        price: parseFloat(price),
        unit,
        quantityAvailable: parseInt(quantityAvailable),
        category,
        imageUrl: finalImageUrl,
        farmerId: user.id,
        dateListed: new Date().toISOString(),
      };

      mockProducts.push(newProduct);
      console.log("New Product Submitted and added to mockData:", newProduct);

      toast({ title: "Listing Added!", description: `${name} has been successfully added to your listings.` });

      // Reset form fields
      setName('');
      setDescription('');
      setPrice('');
      setUnit('');
      setQuantityAvailable('');
      setCategory('');
      setSelectedFile(null);
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      const fileInput = document.getElementById('imageFile') as HTMLInputElement;
      if (fileInput) fileInput.value = ""; // Reset file input field

      router.push('/dashboard');
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast({ title: "Submission Error", description: "An unexpected error occurred while adding the listing.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'farmer') {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><p>Loading or Access Denied...</p></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center">
            <PackagePlus size={28} className="mr-3" /> Add New Produce Listing
          </CardTitle>
          <CardDescription>
            Fill in the details below to list your farm-fresh produce.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center"><Tag size={14} className="mr-2 text-muted-foreground" />Product Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Organic Tomatoes" required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center"><CheckSquare size={14} className="mr-2 text-muted-foreground" />Category</Label>
                <Select value={category} onValueChange={setCategory} required disabled={isLoading}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                     <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center"><Info size={14} className="mr-2 text-muted-foreground" />Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description of your product..." required disabled={isLoading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center"><DollarSign size={14} className="mr-2 text-muted-foreground" />Price</Label>
                <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 3.50" step="0.01" required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit" className="flex items-center"><Tag size={14} className="mr-2 text-muted-foreground" />Unit</Label>
                 <Select value={unit} onValueChange={setUnit} required disabled={isLoading}>
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    <SelectItem value="piece">piece</SelectItem>
                    <SelectItem value="bunch">bunch</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lb">lb</SelectItem>
                    <SelectItem value="dozen">dozen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity" className="flex items-center"><PackagePlus size={14} className="mr-2 text-muted-foreground" />Quantity Available</Label>
                <Input id="quantity" type="number" value={quantityAvailable} onChange={(e) => setQuantityAvailable(e.target.value)} placeholder="e.g., 50" step="1" required disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageFile" className="flex items-center"><ImageUp size={14} className="mr-2 text-muted-foreground" />Product Image</Label>
              <Input
                id="imageFile"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 focus-visible:ring-primary"
                disabled={isLoading || !firebaseInitializedCorrectly}
              />
              {!firebaseInitializedCorrectly && (
                 <p className="text-xs text-destructive">Firebase Storage not configured. Image uploads disabled.</p>
              )}
              {imagePreviewUrl && (
                <div className="mt-2 border rounded-md p-2 inline-block">
                  <Image src={imagePreviewUrl} alt="Image preview" width={150} height={150} className="rounded-md object-cover" data-ai-hint={category.toLowerCase().split(' ')[0] || 'produce'} />
                </div>
              )}
              {!selectedFile && <p className="text-xs text-muted-foreground">If no image is uploaded, a default placeholder will be used.</p>}
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading ? 'Adding Listing...' : 'Add Listing'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
