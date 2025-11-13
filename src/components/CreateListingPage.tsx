import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X, Camera, CheckCircle, Check } from "lucide-react";

interface CreateListingPageProps {
  onBack: () => void;
  onSubmit: (listingData: any) => void;
  editingListing?: {
    id: string;
    title: string;
    description: string;
    category: string;
    condition: string;
    type: string;
    price: number | null;
    deposit: number | null;
    location: string;
    rentPeriod?: string;
    availableFrom?: string;
    availableTo?: string;
    images: string[];
  };
}

export const CreateListingPage = ({ onBack, onSubmit, editingListing }: CreateListingPageProps) => {
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState<string[]>(editingListing?.images || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"details" | "success">("details");
  const [formData, setFormData] = useState({
    title: editingListing?.title || "",
    description: editingListing?.description || "",
    category: editingListing?.category || "",
    condition: editingListing?.condition || "",
    type: editingListing?.type || "sell",
    price: editingListing?.price?.toString() || "",
    deposit: editingListing?.deposit?.toString() || "",
    location: editingListing?.location || "",
    rentPeriod: editingListing?.rentPeriod || "day",
    availableFrom: editingListing?.availableFrom || "",
    availableTo: editingListing?.availableTo || ""
  });

  const categories = [
    "Electronics", "Books & Study Material", "Furniture", 
    "Sports & Fitness", "Clothing", "Kitchen & Dining",
    "Transportation", "Home Decor", "Others"
  ];

  const conditions = [
    { value: "new", label: "New" },
    { value: "good", label: "Good" },
    { value: "used", label: "Used" }
  ];
  const types = [
    { value: "sell", label: "Sell" },
    { value: "rent", label: "Rent" },
    { value: "donate", label: "Donate" }
  ];

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = () => {
    setStep("details");
    onSubmit({ 
      ...formData, 
      images: selectedImages,
      id: editingListing?.id 
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if (files.length + selectedImages.length > 5) {
        toast({
          title: "Too many images",
          description: "You can only upload up to 5 images.",
          variant: "destructive"
        });
        return;
      }

      // Convert files to base64 data URLs for preview
      const newImages: string[] = [];
      const fileArray = Array.from(files);
      
      fileArray.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newImages.push(event.target.result as string);
            
            // Update state when all files are processed
            if (newImages.length === fileArray.length) {
              setSelectedImages(prev => [...prev, ...newImages].slice(0, 5));
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.title.trim()) return "Title is required";
    if (!formData.description.trim()) return "Description is required";
    if (!formData.category) return "Category is required";  
    if (!formData.condition) return "Condition is required";
    if (!formData.type) return "Listing type is required";
    if (formData.type !== "donate" && (!formData.price || parseFloat(formData.price) <= 0)) {
      return "Valid price is required";
    }
    if (!formData.location.trim()) return "Location is required";
    if (selectedImages.length === 0) return "At least one image is required";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: editingListing ? "Listing Updated!" : "Listing Created!",
        description: editingListing ? "Your item has been updated successfully." : "Your item has been listed successfully.",
        variant: "default"
      });
      
      onSubmit({ 
        ...formData, 
        images: selectedImages,
        id: editingListing?.id 
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 shadow-community bg-card-gradient">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-community-gradient rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Listing Created!</h2>
            <p className="text-muted-foreground">
              Your {formData.title} is now live and visible to your community members.
            </p>
            
            <div className="space-y-3">
              <Badge variant="outline" className="text-sm">
                {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} • {formData.category}
              </Badge>
              
              <Button 
                className="w-full"
                variant="community"
                onClick={handleComplete}
              >
                View Your Listing
              </Button>
              
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => setStep("details")}
              >
                Create Another
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <div className="p-2 md:p-4">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-3 md:mb-6">
            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg md:text-2xl font-bold">{editingListing ? "Edit Listing" : "List an Item"}</h1>
          </div>

          <Card className="p-3 md:p-6 shadow-card bg-card-gradient">
            <Tabs value={formData.type} onValueChange={(value) => updateFormData("type", value)}>
              <TabsList className="grid w-full grid-cols-3 mb-3 md:mb-6 h-8 md:h-10">
                <TabsTrigger value="sell" className="text-xs md:text-sm">Sell</TabsTrigger>
                <TabsTrigger value="rent" className="text-xs md:text-sm">Rent</TabsTrigger>
                <TabsTrigger value="donate" className="text-xs md:text-sm">Donate</TabsTrigger>
              </TabsList>

              <div className="space-y-3 md:space-y-6">
                {/* Images */}
                <div className="space-y-1 md:space-y-2">
                  <Label className="text-xs md:text-sm">Photos</Label>
                  <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative aspect-square">
                        <img 
                          src={image} 
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover rounded-md"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-1 -right-1 md:-top-2 md:-right-2 h-5 w-5 md:h-6 md:w-6"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        </Button>
                      </div>
                    ))}
                    {selectedImages.length < 5 && (
                      <div className="relative aspect-square">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-0.5 md:space-y-1 w-full h-full border-2 border-dashed border-muted-foreground/25 rounded-md hover:border-muted-foreground/50 transition-colors">
                          <Camera className="h-4 w-4 md:h-6 md:w-6" />
                          <span className="text-[10px] md:text-xs">Add Photo</span>
                        </label>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    Add up to 5 photos. First photo will be the main image.
                  </p>
                </div>

                {/* Basic Details */}
                <div className="space-y-2 md:space-y-4">
                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="title" className="text-xs md:text-sm">Title *</Label>
                    <Input 
                      id="title"
                      placeholder="What are you listing?"
                      value={formData.title}
                      onChange={(e) => updateFormData("title", e.target.value)}
                      className="h-8 md:h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="description" className="text-xs md:text-sm">Description *</Label>
                    <Textarea 
                      id="description"
                      placeholder="Describe your item in detail..."
                      rows={3}
                      value={formData.description}
                      onChange={(e) => updateFormData("description", e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:gap-4">
                    <div className="space-y-1 md:space-y-2">
                      <Label className="text-xs md:text-sm">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => updateFormData("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1 md:space-y-2">
                      <Label className="text-xs md:text-sm">Condition *</Label>
                      <Select value={formData.condition} onValueChange={(value) => updateFormData("condition", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          {conditions.map((condition) => (
                            <SelectItem key={condition.value} value={condition.value}>
                              {condition.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <TabsContent value="sell" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="sellPrice">Selling Price (₹) *</Label>
                    <Input 
                      id="sellPrice"
                      type="number"
                      placeholder="Enter price in rupees"
                      value={formData.price}
                      onChange={(e) => updateFormData("price", e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="rent" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rentPrice">Rent (₹) *</Label>
                      <Input 
                        id="rentPrice"
                        type="number"
                        placeholder="Amount"
                        value={formData.price}
                        onChange={(e) => updateFormData("price", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Per</Label>
                      <Select value={formData.rentPeriod} onValueChange={(value) => updateFormData("rentPeriod", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Day</SelectItem>
                          <SelectItem value="week">Week</SelectItem>
                          <SelectItem value="month">Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deposit">Security Deposit (₹)</Label>
                    <Input 
                      id="deposit"
                      type="number"
                      placeholder="Optional deposit amount"
                      value={formData.deposit}
                      onChange={(e) => updateFormData("deposit", e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="donate" className="mt-0">
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      You're donating this item for free. That's awesome! 🎉
                    </p>
                  </div>
                </TabsContent>

                {/* Location & Availability */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location within hostel *</Label>
                    <Input 
                      id="location"
                      placeholder="e.g., Room 204, Block A"
                      value={formData.location}
                      onChange={(e) => updateFormData("location", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="availableFrom">Available From</Label>
                      <Input 
                        id="availableFrom"
                        type="date"
                        value={formData.availableFrom}
                        onChange={(e) => updateFormData("availableFrom", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="availableTo">Available Until</Label>
                      <Input 
                        id="availableTo"
                        type="date"
                        value={formData.availableTo}
                        onChange={(e) => updateFormData("availableTo", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  className="w-full h-9 md:h-10 text-sm"
                  variant="community"
                  onClick={handleSubmit}
                  disabled={!formData.title || !formData.description || !formData.category || !formData.condition}
                >
                  {editingListing ? "Update Listing" : 
                   formData.type === "donate" ? "Donate Item" : 
                   formData.type === "rent" ? "List for Rent" : "List for Sale"}
                </Button>
              </div>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};