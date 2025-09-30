'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  useGetAllStates,
  useSearchStates,
} from '@/core/api/generated/spring/endpoints/state-resource/state-resource.gen';
import {
  useGetAllDistricts,
  useSearchDistricts,
} from '@/core/api/generated/spring/endpoints/district-resource/district-resource.gen';
import {
  useGetAllCities,
  useSearchCities,
} from '@/core/api/generated/spring/endpoints/city-resource/city-resource.gen';
import {
  useGetAllAreas,
  useSearchAreas,
} from '@/core/api/generated/spring/endpoints/area-resource/area-resource.gen';
import type { StateDTO, DistrictDTO, CityDTO, AreaDTO } from '@/core/api/generated/spring/schemas';

interface LocationValue {
  state: number;
  district: number;
  city: number;
  area: number;
}

interface LocationOption {
  id: number;
  name: string;
  type: 'state' | 'district' | 'city' | 'area';
  parentId?: number;
  fullPath?: string;
}

interface IntelligentLocationFieldProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  onError?: (error: string) => void;
  placeholder?: string;
}

export function IntelligentLocationField({
  value,
  onChange,
  onError,
  placeholder = "Search for state, district, city, or area...",
}: IntelligentLocationFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<LocationOption[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // API hooks for fetching location data with proper typing
  const { data: statesResponse, isLoading: loadingStates } = useGetAllStates({
    page: 0,
    size: 100,
  }, {
    query: { queryKey: ['states-for-location'] }
  });

  const { data: districtsResponse, isLoading: loadingDistricts } = useGetAllDistricts({
    page: 0,
    size: 100,
    'state.id.equals': value.state || undefined,
  }, {
    query: { 
      queryKey: ['districts-for-location', value.state],
      enabled: !!value.state 
    }
  });

  const { data: citiesResponse, isLoading: loadingCities } = useGetAllCities({
    page: 0,
    size: 100,
    'district.id.equals': value.district || undefined,
  }, {
    query: { 
      queryKey: ['cities-for-location', value.district],
      enabled: !!value.district 
    }
  });

  const { data: areasResponse, isLoading: loadingAreas } = useGetAllAreas({
    page: 0,
    size: 100,
    'city.id.equals': value.city || undefined,
  }, {
    query: { 
      queryKey: ['areas-for-location', value.city],
      enabled: !!value.city 
    }
  });

  // Extract content arrays from paginated responses
  const states = statesResponse?.content || [];
  const districts = districtsResponse?.content || [];
  const cities = citiesResponse?.content || [];
  const areas = areasResponse?.content || [];

  // Search hooks for intelligent search with proper parameters
  const { data: stateSearchResponse, isLoading: searchingStates } = useSearchStates({
    query: searchQuery,
    page: 0,
    size: 50,
  }, {
    query: { 
      enabled: searchQuery.length > 1,
      queryKey: ['search-states', searchQuery] 
    }
  });

  const { data: districtSearchResponse, isLoading: searchingDistricts } = useSearchDistricts({
    query: searchQuery,
    page: 0,
    size: 50,
  }, {
    query: { 
      enabled: searchQuery.length > 1,
      queryKey: ['search-districts', searchQuery] 
    }
  });

  const { data: citySearchResponse, isLoading: searchingCities } = useSearchCities({
    query: searchQuery,
    page: 0,
    size: 50,
  }, {
    query: { 
      enabled: searchQuery.length > 1,
      queryKey: ['search-cities', searchQuery] 
    }
  });

  const { data: areaSearchResponse, isLoading: searchingAreas } = useSearchAreas({
    query: searchQuery,
    page: 0,
    size: 50,
  }, {
    query: { 
      enabled: searchQuery.length > 1,
      queryKey: ['search-areas', searchQuery] 
    }
  });

  // Extract search results from responses
  const stateResults = stateSearchResponse?.content || [];
  const districtResults = districtSearchResponse?.content || [];
  const cityResults = citySearchResponse?.content || [];
  const areaResults = areaSearchResponse?.content || [];

  // Build selected path based on current values
  useEffect(() => {
    const buildPath = async () => {
      const path: LocationOption[] = [];

      if (value.state && states) {
        const state = states.find(s => s.id === value.state);
        if (state) {
          path.push({
            id: state.id,
            name: state.name,
            type: 'state',
            fullPath: state.name
          });
        }
      }

      if (value.district && districts) {
        const district = districts.find(d => d.id === value.district);
        if (district) {
          const stateName = path.find(p => p.type === 'state')?.name || '';
          path.push({
            id: district.id,
            name: district.name,
            type: 'district',
            parentId: value.state,
            fullPath: `${stateName} > ${district.name}`
          });
        }
      }

      if (value.city && cities) {
        const city = cities.find(c => c.id === value.city);
        if (city) {
          const districtPath = path.find(p => p.type === 'district')?.fullPath || '';
          path.push({
            id: city.id,
            name: city.name,
            type: 'city',
            parentId: value.district,
            fullPath: `${districtPath} > ${city.name}`
          });
        }
      }

      if (value.area && areas) {
        const area = areas.find(a => a.id === value.area);
        if (area) {
          const cityPath = path.find(p => p.type === 'city')?.fullPath || '';
          path.push({
            id: area.id,
            name: area.name,
            type: 'area',
            parentId: value.city,
            fullPath: `${cityPath} > ${area.name}`
          });
        }
      }

      setSelectedPath(path);
    };

    buildPath();
  }, [value, states, districts, cities, areas]);

  // Get all search results with proper hierarchy
  const getSearchResults = (): LocationOption[] => {
    if (!searchQuery || searchQuery.length < 2) {
      return [];
    }

    const results: LocationOption[] = [];

    // Add state results with proper null checking
    stateResults?.forEach(state => {
      results.push({
        id: state.id!,
        name: state.name,
        type: 'state',
        fullPath: state.name
      });
    });

    // Add district results with proper relationship handling
    districtResults?.forEach(district => {
      const stateName = district.state?.name || 'Unknown State';
      results.push({
        id: district.id!,
        name: district.name,
        type: 'district',
        parentId: district.state?.id,
        fullPath: `${stateName} > ${district.name}`
      });
    });

    // Add city results with proper relationship handling  
    cityResults?.forEach(city => {
      const districtName = city.district?.name || 'Unknown District';
      const stateName = city.district?.state?.name || 'Unknown State';
      results.push({
        id: city.id!,
        name: city.name,
        type: 'city',
        parentId: city.district?.id,
        fullPath: `${stateName} > ${districtName} > ${city.name}`
      });
    });

    // Add area results with proper relationship handling
    areaResults?.forEach(area => {
      const cityName = area.city?.name || 'Unknown City';
      const districtName = area.city?.district?.name || 'Unknown District';
      const stateName = area.city?.district?.state?.name || 'Unknown State';
      results.push({
        id: area.id!,
        name: area.name,
        type: 'area',
        parentId: area.city?.id,
        fullPath: `${stateName} > ${districtName} > ${cityName} > ${area.name}`
      });
    });

    // Sort by type hierarchy and then by name
    return results.sort((a, b) => {
      const typeOrder = { state: 0, district: 1, city: 2, area: 3 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.name.localeCompare(b.name);
    });
  };

  const handleSelectOption = (option: LocationOption) => {
    const newValue: LocationValue = { ...value };

    switch (option.type) {
      case 'state':
        newValue.state = option.id;
        newValue.district = 0;
        newValue.city = 0;
        newValue.area = 0;
        break;
      case 'district':
        newValue.district = option.id;
        if (option.parentId) newValue.state = option.parentId;
        newValue.city = 0;
        newValue.area = 0;
        break;
      case 'city':
        newValue.city = option.id;
        if (option.parentId) newValue.district = option.parentId;
        newValue.area = 0;
        break;
      case 'area':
        newValue.area = option.id;
        if (option.parentId) newValue.city = option.parentId;
        break;
    }

    onChange(newValue);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleRemoveLevel = (type: 'state' | 'district' | 'city' | 'area') => {
    const newValue: LocationValue = { ...value };

    switch (type) {
      case 'state':
        newValue.state = 0;
        newValue.district = 0;
        newValue.city = 0;
        newValue.area = 0;
        break;
      case 'district':
        newValue.district = 0;
        newValue.city = 0;
        newValue.area = 0;
        break;
      case 'city':
        newValue.city = 0;
        newValue.area = 0;
        break;
      case 'area':
        newValue.area = 0;
        break;
    }

    onChange(newValue);
  };

  const isLoading = loadingStates || loadingDistricts || loadingCities || loadingAreas;
  const isSearching = searchingStates || searchingDistricts || searchingCities || searchingAreas;

  const displayText = selectedPath.length > 0 
    ? selectedPath[selectedPath.length - 1].fullPath 
    : '';

  return (
    <div className="space-y-2">
      {/* Selected Path Display */}
      {selectedPath.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedPath.map((item, index) => (
            <Badge
              key={`${item.type}-${item.id}`}
              variant="secondary"
              className="text-xs flex items-center gap-1"
            >
              <MapPin className="h-3 w-3" />
              {item.name}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => handleRemoveLevel(item.type)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between text-left font-normal"
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              {displayText || placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-3 border-b">
            <Input
              ref={inputRef}
              placeholder="Type to search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 p-0"
            />
          </div>
          
          <ScrollArea className="h-[300px]">
            {isLoading && (
              <div className="p-3 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            )}

            {isSearching && searchQuery.length > 1 && (
              <div className="p-3 text-sm text-muted-foreground text-center">
                Searching...
              </div>
            )}

            {!isLoading && !isSearching && searchQuery.length > 1 && (
              <div className="max-h-[300px]">
                {getSearchResults().map((option) => (
                  <Button
                    key={`${option.type}-${option.id}`}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3 rounded-none hover:bg-muted"
                    onClick={() => handleSelectOption(option)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {option.type}
                        </Badge>
                        <span className="font-medium">{option.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {option.fullPath}
                      </div>
                    </div>
                  </Button>
                ))}
                
                {getSearchResults().length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    No locations found matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}

            {!isLoading && searchQuery.length <= 1 && (
              <div className="p-3 text-sm text-muted-foreground text-center">
                Type at least 2 characters to search
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Validation Message */}
      {selectedPath.length === 0 && (
        <p className="text-sm text-red-500">Please select a complete location hierarchy</p>
      )}
      
      {selectedPath.length > 0 && selectedPath.length < 4 && (
        <p className="text-sm text-amber-600">
          Please complete your location selection ({4 - selectedPath.length} more level{4 - selectedPath.length !== 1 ? 's' : ''} required)
        </p>
      )}
    </div>
  );
}