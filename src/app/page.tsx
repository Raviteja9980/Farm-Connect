"use client";
import React, { useState, useEffect, useMemo } from 'react';
import ProductCard from '@/components/ProductCard';
import FilterControls from '@/components/FilterControls';
import { mockProducts, mockFarmers } from '@/lib/mockData';
import type { Product, Farmer } from '@/types';
import { AlertCircle, Inbox } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function HomePage() {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(mockProducts);
  const [farmers, setFarmers] = useState<Farmer[]>(mockFarmers); // Assuming farmers data is also available

  const categories = useMemo(() => {
    const allCategories = mockProducts.map(p => p.category);
    return Array.from(new Set(allCategories));
  }, []);

  const handleFilterChange = (filters: { category: string; location: string; searchTerm: string }) => {
    let products = mockProducts;

    if (filters.category) {
      products = products.filter(p => p.category === filters.category);
    }

    if (filters.location) {
      // Simple location filter: checks if farmer's location string includes the search term
      const farmerIdsInLocation = farmers
        .filter(f => f.location.toLowerCase().includes(filters.location.toLowerCase()))
        .map(f => f.id);
      products = products.filter(p => farmerIdsInLocation.includes(p.farmerId));
    }
    
    if (filters.searchTerm) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(products);
  };
  
  // Function to get farmer by ID
  const getFarmerById = (farmerId: string) => farmers.find(f => f.id === farmerId);

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
        <h1 className="text-4xl font-bold text-primary mb-2">Freshness Delivered, Farmer Direct</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover and buy fresh produce directly from local farmers. Support your community and enjoy the best quality.
        </p>
      </section>

      <FilterControls categories={categories} onFilterChange={handleFilterChange} />

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} farmer={getFarmerById(product.farmerId)} />
          ))}
        </div>
      ) : (
        <Alert variant="default" className="bg-card">
          <Inbox className="h-5 w-5" />
          <AlertTitle>No Products Found</AlertTitle>
          <AlertDescription>
            We couldn't find any products matching your current filters. Try adjusting your search criteria.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
