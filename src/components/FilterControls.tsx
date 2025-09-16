
"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Filter } from 'lucide-react';

interface FilterControlsProps {
  categories: string[];
  onFilterChange: (filters: { category: string; location: string; searchTerm: string }) => void;
}

const ALL_CATEGORIES_VALUE = "_all_";

const FilterControls: React.FC<FilterControlsProps> = ({ categories, onFilterChange }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES_VALUE);
  const [location, setLocation] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleApplyFilters = () => {
    onFilterChange({ 
      category: selectedCategory === ALL_CATEGORIES_VALUE ? '' : selectedCategory, 
      location, 
      searchTerm 
    });
  };

  return (
    <div className="mb-8 p-6 bg-card rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label htmlFor="searchTerm" className="block text-sm font-medium text-foreground mb-1">Search Produce</label>
          <div className="relative">
            <Input
              id="searchTerm"
              type="text"
              placeholder="e.g., Tomatoes, Apples"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">Category</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES_VALUE}>All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">Location</label>
           <div className="relative">
            <Input
              id="location"
              type="text"
              placeholder="e.g., Willow Creek, CA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10"
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <Button onClick={handleApplyFilters} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Filter size={18} className="mr-2" /> Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default FilterControls;
