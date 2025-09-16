
import Image from 'next/image';
import Link from 'next/link';
import type { Product, Farmer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShoppingCart, Phone, MessageSquare, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
  farmer?: Farmer; 
}

const ProductCard = ({ product, farmer }: ProductCardProps) => {
  const farmerName = farmer ? farmer.name : "A Local Farmer";

  const getValidSrcForImage = (url: string | undefined, defaultSize: string = "600x400"): string => {
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
  
  const aiHintText = product.category?.toLowerCase().split(' ')[0] || "produce";
  const imageSrc = getValidSrcForImage(product.imageUrl, "600x400");

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="p-0">
        <Link href={`/products/${product.id}`} className="block group">
          <div className="aspect-w-16 aspect-h-9 overflow-hidden">
            <Image
              src={imageSrc}
              alt={product.name}
              width={600}
              height={400}
              className="object-cover w-full h-48 transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={aiHintText}
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-xl font-semibold">
            <Link href={`/products/${product.id}`} className="hover:text-primary transition-colors">
              {product.name}
            </Link>
          </CardTitle>
          <Badge variant="secondary">{product.category}</Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground mb-1 line-clamp-2">{product.description}</CardDescription>
        <p className="text-lg font-bold text-primary my-2">
          ₹{product.price.toFixed(2)} / {product.unit}
        </p>
        <p className="text-sm text-muted-foreground">
          Available: {product.quantityAvailable} {product.unit}s
        </p>
        <Link href={`/farmers/${product.farmerId}`} className="text-sm text-accent hover:underline flex items-center mt-2">
           <MapPin size={14} className="mr-1" /> {farmerName}
        </Link>
      </CardContent>
      <CardFooter className="p-4 border-t flex flex-col sm:flex-row gap-2">
        <Button asChild variant="outline" className="w-full sm:w-auto flex-1">
          <Link href={`tel:${farmer?.phoneNumber || 'N/A'}`}>
            <Phone size={16} className="mr-2" /> Call
          </Link>
        </Button>
        <Button asChild className="w-full sm:w-auto flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href={`/products/${product.id}#contact`}> 
            <MessageSquare size={16} className="mr-2" /> Contact
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
