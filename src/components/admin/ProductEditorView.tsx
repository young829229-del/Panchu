import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Upload,
  Trash2,
  Check,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Save,
  Plus,
  X,
  AlertCircle,
  Eye,
  Tag
} from 'lucide-react';
import { Product, CategoryItem } from '../../types';
import { PanchuLogo } from '../PanchuLogo';
import {
  getCanonicalCategoriesSync,
  getCanonicalSizesSync,
  getCanonicalProductTypesSync,
  subscribeCategories,
  subscribeSizes,
  saveCategoriesToFirestore
} from '../../services/firebaseService';

interface ProductEditorViewProps {
  product: Partial<Product>;
  isNew: boolean;
  onSave: (product: Partial<Product>, newImageFiles: File[]) => Promise<void>;
  onDelete?: (productId: string, name: string) => Promise<void>;
  onBack: () => void;
  isSaving: boolean;
  errorMessage?: string;
}

const COLLECTIONS = ['ESSENTIALS', 'SIGNATURE', 'MONOCHROME 2026', 'STREETWEAR DROP 01', 'LIMITED EDITION'];

export const ProductEditorView: React.FC<ProductEditorViewProps> = ({
  product: initialProduct,
  isNew,
  onSave,
  onDelete,
  onBack,
  isSaving,
  errorMessage: initialError
}) => {
  const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>(() => getCanonicalCategoriesSync());
  const [availableSizes, setAvailableSizes] = useState<string[]>(() => getCanonicalSizesSync());
  const [availableTypes, setAvailableTypes] = useState<string[]>(() => getCanonicalProductTypesSync());

  const [newCustomCatInput, setNewCustomCatInput] = useState('');
  const [showAddCatInput, setShowAddCatInput] = useState(false);
  const [newCustomSizeInput, setNewCustomSizeInput] = useState('');
  const [showAddSizeInput, setShowAddSizeInput] = useState(false);

  useEffect(() => {
    const unsubCat = subscribeCategories((cats) => {
      if (cats && cats.length > 0) setAvailableCategories(cats);
    });
    const unsubSize = subscribeSizes((szs) => {
      if (szs && szs.length > 0) setAvailableSizes(szs);
    });
    return () => {
      unsubCat();
      unsubSize();
    };
  }, []);

  const initialCategoriesList = Array.isArray(initialProduct.categories) && initialProduct.categories.length > 0
    ? initialProduct.categories
    : (initialProduct.category ? [initialProduct.category] : ['Best Selling']);

  const initialSizesList = Array.isArray(initialProduct.sizes) && initialProduct.sizes.length > 0
    ? initialProduct.sizes
    : ['S', 'M', 'L', 'XL'];

  const initialStock: Record<string, number> = {};
  initialSizesList.forEach((s) => {
    initialStock[s] = (initialProduct.stock && typeof initialProduct.stock[s] === 'number')
      ? initialProduct.stock[s]
      : 10;
  });

  const [formData, setFormData] = useState<Partial<Product>>({
    name: initialProduct.name || '',
    subtitle: initialProduct.subtitle || 'PANCHU SIGNATURE DROP 2026',
    price: initialProduct.price ?? 1500,
    MRP: initialProduct.MRP || initialProduct.originalPrice || 1800,
    originalPrice: initialProduct.originalPrice || initialProduct.MRP || 1800,
    description: initialProduct.description || '',
    category: initialProduct.category || initialCategoriesList[0] || 'Tees',
    categories: initialCategoriesList,
    typeLabel: initialProduct.typeLabel || 'Unisex',
    collection: initialProduct.collection || 'ESSENTIALS',
    gender: initialProduct.gender || 'unisex',
    image: initialProduct.image || '',
    images: initialProduct.images || (initialProduct.image ? [initialProduct.image] : []),
    sizes: initialSizesList,
    stock: initialProduct.stock || initialStock,
    active: initialProduct.active ?? true,
    inStock: initialProduct.inStock ?? true,
    id: initialProduct.id
  });

  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState<string>(initialError || '');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalStock = Object.values(formData.stock || {}).reduce<number>(
    (acc, val) => acc + Number(val || 0),
    0
  );

  const discountPercent =
    formData.MRP && formData.price && formData.MRP > formData.price
      ? Math.round(((formData.MRP - formData.price) / formData.MRP) * 100)
      : 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setNewImageFiles((prev) => [...prev, ...files]);
      const previews = files.map((file) => URL.createObjectURL(file as Blob));
      setImagePreviewUrls((prev) => [...prev, ...previews]);
    }
  };

  const handleRemoveExistingImage = (idxToRemove: number) => {
    const updatedImages = (formData.images || []).filter((_, idx) => idx !== idxToRemove);
    const updatedPrimary = updatedImages[0] || '';
    setFormData({
      ...formData,
      images: updatedImages,
      image: updatedPrimary
    });
  };

  const handleRemoveNewImage = (idxToRemove: number) => {
    setNewImageFiles((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    setImagePreviewUrls((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSetPrimaryExistingImage = (url: string) => {
    const existing = (formData.images || []).filter((img) => img !== url);
    setFormData({
      ...formData,
      image: url,
      images: [url, ...existing]
    });
  };

  const handleStockChange = (size: string, val: number) => {
    const currentStock = { ...(formData.stock || {}) };
    currentStock[size] = Math.max(0, val);
    setFormData({
      ...formData,
      stock: currentStock,
      inStock: Object.values(currentStock).some((n) => Number(n) > 0)
    });
  };

  const handleToggleCategory = (catName: string) => {
    const current = formData.categories || [];
    let updated: string[];
    if (current.includes(catName)) {
      updated = current.filter(c => c !== catName);
      if (updated.length === 0) updated = [catName]; // keep at least 1
    } else {
      updated = [...current, catName];
    }
    setFormData({
      ...formData,
      categories: updated,
      category: updated[0] || 'Tees'
    });
  };

  const handleAddNewCategoryOnTheFly = async () => {
    const trimmed = newCustomCatInput.trim();
    if (!trimmed) return;
    const exists = availableCategories.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
    let newCatsList = [...availableCategories];
    if (!exists) {
      const newCat: CategoryItem = {
        id: `cat-${Date.now()}`,
        name: trimmed,
        slug: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        order: availableCategories.length,
        enabled: true
      };
      newCatsList = [...availableCategories, newCat];
      setAvailableCategories(newCatsList);
      try {
        await saveCategoriesToFirestore(newCatsList);
      } catch (e) {
        console.warn('Error saving category on the fly:', e);
      }
    }

    const current = formData.categories || [];
    if (!current.includes(trimmed)) {
      const updated = [...current, trimmed];
      setFormData({
        ...formData,
        categories: updated,
        category: updated[0]
      });
    }
    setNewCustomCatInput('');
    setShowAddCatInput(false);
  };

  const handleAddSizeToProduct = (sizeToAdd: string) => {
    const currentSizes = formData.sizes || [];
    if (currentSizes.includes(sizeToAdd)) return;

    const updatedSizes = [...currentSizes, sizeToAdd];
    const updatedStock = { ...(formData.stock || {}) };
    if (typeof updatedStock[sizeToAdd] !== 'number') {
      updatedStock[sizeToAdd] = 10;
    }

    setFormData({
      ...formData,
      sizes: updatedSizes,
      stock: updatedStock,
      inStock: Object.values(updatedStock).some(q => Number(q) > 0)
    });
  };

  const handleRemoveSizeFromProduct = (sizeToRemove: string) => {
    const currentSizes = formData.sizes || [];
    if (currentSizes.length <= 1) {
      setError('Product must have at least one apparel size.');
      return;
    }

    const updatedSizes = currentSizes.filter(s => s !== sizeToRemove);
    const updatedStock = { ...(formData.stock || {}) };
    delete updatedStock[sizeToRemove];

    setFormData({
      ...formData,
      sizes: updatedSizes,
      stock: updatedStock,
      inStock: Object.values(updatedStock).some(q => Number(q) > 0)
    });
  };

  const handleCreateCustomSizeOnTheFly = () => {
    const trimmed = newCustomSizeInput.trim().toUpperCase();
    if (!trimmed) return;

    if (!availableSizes.includes(trimmed)) {
      setAvailableSizes(prev => [...prev, trimmed]);
    }
    handleAddSizeToProduct(trimmed);
    setNewCustomSizeInput('');
    setShowAddSizeInput(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Product title / name is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!formData.price || formData.price <= 0) {
      setError('Please provide a valid selling price greater than 0.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setError('');
    try {
      const dataToSave: Partial<Product> = {
        ...formData,
        category: formData.categories?.[0] || formData.category || 'Tees',
        categories: formData.categories && formData.categories.length > 0 ? formData.categories : ['Best Selling'],
        typeLabel: formData.typeLabel?.trim() || 'Unisex',
        sizes: formData.sizes && formData.sizes.length > 0 ? formData.sizes : ['S', 'M', 'L', 'XL'],
        stock: formData.stock || {}
      };
      await onSave(dataToSave, newImageFiles);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save product to Firebase');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f8f9fa] text-stone-900 font-sans antialiased flex flex-col">
      {/* Sticky Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Back button & Breadcrumb */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Return to Product Catalog"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-semibold hidden sm:inline">Product Catalog</span>
            </button>

            <span className="text-stone-300 hidden sm:inline">/</span>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#ff4d4f]/10 text-[#ff4d4f] uppercase tracking-wider shrink-0">
                {isNew ? 'New Product' : 'Edit Mode'}
              </span>
              <h1 className="text-sm sm:text-base font-bold text-stone-900 truncate">
                {formData.name || 'Untitled Product'}
              </h1>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {!isNew && onDelete && formData.id && (
              <button
                type="button"
                onClick={() => onDelete(formData.id!, formData.name || 'Product')}
                disabled={isSaving}
                className="p-2 sm:px-3 sm:py-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 text-xs font-medium transition-colors border border-transparent hover:border-red-100 flex items-center gap-1.5 cursor-pointer"
                title="Delete Product from Firebase"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">Delete</span>
              </button>
            )}

            <button
              type="button"
              onClick={onBack}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-4 sm:px-5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold font-sans shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving to Firebase...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isNew ? 'Publish Product' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Banner Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Product saved successfully to Firebase Firestore!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* LEFT COLUMN: Main Info, Pricing, Description, Sizes (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* CARD 1: Core Details */}
            <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                  General Information
                </h2>
                <span className="text-[11px] text-stone-400 font-mono">* Required fields</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. OVERSIZED STREETWEAR HEAVY TEE"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-sm font-sans text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all uppercase"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      Subtitle / Edition Label
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle || ''}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="e.g. PANCHU SIGNATURE DROP 2026"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-sans text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      Collection / Season
                    </label>
                    <select
                      value={formData.collection || 'ESSENTIALS'}
                      onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-sans text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all"
                    >
                      {COLLECTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Product Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the fabric weight (GSM), fit silhouette, wash details, and styling notes..."
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-xs font-sans text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* CARD 2: Pricing & Discount */}
            <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                  Pricing & Value
                </h2>
                {discountPercent > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold font-mono">
                    {discountPercent}% OFF customer savings
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Selling Price (NPR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 font-mono">
                      Rs.
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, price: Number(e.target.value) })
                      }
                      placeholder="1500"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-bold font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">Price charged to customer</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    MRP / Original Price (NPR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 font-mono">
                      Rs.
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formData.MRP || formData.originalPrice || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData({
                          ...formData,
                          MRP: val,
                          originalPrice: val
                        });
                      }}
                      placeholder="1800"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-mono text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">Strikethrough reference price</p>
                </div>
              </div>
            </div>

            {/* CARD 3: Size Inventory & Stock Levels */}
            <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                    Inventory & Size Stock
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Manage sizes available for this product and stock quantities.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono px-3 py-1 bg-stone-100 rounded-full text-stone-800">
                    Total: {totalStock} Units
                  </span>
                </div>
              </div>

              {/* Active Sizes on this Product */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-stone-700 block uppercase tracking-wider">
                  Active Sizes on Product ({(formData.sizes || []).length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {(formData.sizes || []).map((size) => {
                    const qty = formData.stock?.[size] ?? 0;
                    return (
                      <div
                        key={`size-stock-${size}`}
                        className="p-3.5 rounded-2xl border border-stone-200/80 bg-[#faf9f8] text-center space-y-2 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-stone-800 uppercase">
                            Size {size}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSizeFromProduct(size)}
                            className="p-1 text-stone-300 hover:text-red-600 rounded transition-colors cursor-pointer"
                            title={`Remove size ${size} from product`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) =>
                              handleStockChange(size, parseInt(e.target.value) || 0)
                            }
                            className="w-full text-center font-mono font-bold text-sm bg-white py-1.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-900"
                          />
                        </div>
                        <span
                          className={`text-[10px] font-mono block ${
                            qty > 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'
                          }`}
                        >
                          {qty > 0 ? `${qty} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Sizes to Product */}
              <div className="pt-3 border-t border-stone-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">
                    Add Size to Product
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddSizeInput(!showAddSizeInput)}
                    className="text-xs font-semibold text-[#ff4d4f] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Custom Size</span>
                  </button>
                </div>

                {/* Inline custom size input */}
                {showAddSizeInput && (
                  <div className="flex items-center gap-2 p-2 bg-stone-50 rounded-xl border border-stone-200">
                    <input
                      type="text"
                      placeholder="e.g. XL, 3XL, 28..."
                      value={newCustomSizeInput}
                      onChange={(e) => setNewCustomSizeInput(e.target.value)}
                      className="px-2.5 py-1 text-xs font-mono font-bold uppercase rounded-lg border border-stone-300 bg-white flex-1 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCustomSizeOnTheFly}
                      className="px-3 py-1 text-xs bg-stone-900 hover:bg-black text-white rounded-lg font-bold cursor-pointer"
                    >
                      Add Size
                    </button>
                  </div>
                )}

                {/* Unassigned Available Sizes Quick Click Chips */}
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((sz) => {
                    const isAlreadyOnProduct = (formData.sizes || []).includes(sz);
                    if (isAlreadyOnProduct) return null;

                    return (
                      <button
                        key={`add-sz-${sz}`}
                        type="button"
                        onClick={() => handleAddSizeToProduct(sz)}
                        className="px-2.5 py-1 rounded-lg border border-dashed border-stone-300 bg-white hover:border-emerald-600 hover:text-emerald-700 text-stone-600 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                        title={`Add ${sz} to this product`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>{sz}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Media & Images, Organization & Category (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* CARD 4: Image Management & Uploads */}
            <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                  Product Images
                </h2>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-[#ff4d4f] hover:bg-[#e04345] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Primary Image Preview Box */}
              <div className="relative aspect-[3/4] bg-stone-100 rounded-2xl overflow-hidden border border-stone-200">
                {formData.image || imagePreviewUrls[0] ? (
                  <img
                    src={formData.image || imagePreviewUrls[0]}
                    alt="Primary Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-stone-400 space-y-2">
                    <ImageIcon className="w-10 h-10 stroke-1" />
                    <p className="text-xs">No primary image selected</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-[#ff4d4f] underline cursor-pointer"
                    >
                      Click to upload photos
                    </button>
                  </div>
                )}
                {(formData.image || imagePreviewUrls[0]) && (
                  <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono font-bold">
                    Primary Display Image
                  </span>
                )}
              </div>

              {/* Image Thumbnails Gallery */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-stone-600 block">
                  Gallery ({(formData.images?.length || 0) + imagePreviewUrls.length} Photos)
                </span>

                <div className="grid grid-cols-3 gap-2">
                  {/* Existing Images */}
                  {(formData.images || []).map((imgUrl, idx) => {
                    const isPrimary = formData.image === imgUrl;
                    return (
                      <div
                        key={`existing-${idx}`}
                        className={`group relative aspect-square rounded-xl overflow-hidden border-2 bg-stone-50 ${
                          isPrimary ? 'border-[#ff4d4f]' : 'border-stone-200'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryExistingImage(imgUrl)}
                              className="p-1 rounded bg-white text-stone-900 text-[9px] font-bold cursor-pointer hover:bg-stone-100"
                              title="Set as Primary"
                            >
                              ★
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(idx)}
                            className="p-1 rounded bg-red-600 text-white cursor-pointer hover:bg-red-700"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Newly Uploaded Images (Pending Save) */}
                  {imagePreviewUrls.map((previewUrl, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="group relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-emerald-500 bg-emerald-50/20"
                    >
                      <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[8px] font-mono font-bold">
                        NEW
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(idx)}
                        className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white cursor-pointer hover:bg-red-600"
                        title="Discard"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add Image Tile */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border border-dashed border-stone-300 hover:border-stone-500 hover:bg-stone-50 transition-colors flex flex-col items-center justify-center text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[10px] font-medium mt-1">Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 5: Category Assignment & Product Type */}
            <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200 shadow-2xs space-y-5">
              <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                    Categories & Product Type
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Assign product to one or multiple categories and define display label.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* 1. Multi-Category Assignment */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-stone-800">
                      Product Categories * (Select All That Apply)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddCatInput(!showAddCatInput)}
                      className="text-[11px] font-bold text-[#ff4d4f] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Category</span>
                    </button>
                  </div>

                  {showAddCatInput && (
                    <div className="flex items-center gap-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200 mb-2.5">
                      <input
                        type="text"
                        placeholder="New category name..."
                        value={newCustomCatInput}
                        onChange={(e) => setNewCustomCatInput(e.target.value)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-stone-300 bg-white flex-1 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewCategoryOnTheFly}
                        className="px-2.5 py-1 text-xs bg-stone-900 text-white rounded-lg font-bold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  )}

                  {/* Multi-Select Category Badges */}
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.filter(c => c.enabled !== false).map((cat) => {
                      const isSelected = (formData.categories || []).includes(cat.name);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleToggleCategory(cat.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1.5">
                    This product will appear under all selected categories across the website.
                  </p>
                </div>

                {/* 2. Product Type / Tag Label (Unisex, Men's, Women's, Oversized, Custom) */}
                <div className="pt-3 border-t border-stone-100 space-y-2">
                  <label className="block text-xs font-bold text-stone-800">
                    Product Type / Tag Label
                  </label>
                  <p className="text-[11px] text-stone-500">
                    Display text shown on product pages and cards (default is "Unisex").
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {['Unisex', "Men's", "Women's", 'Oversized', 'Regular Fit'].map((preset) => {
                      const isPresetActive = (formData.typeLabel || 'Unisex') === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            let g: 'male' | 'female' | 'unisex' = 'unisex';
                            if (preset === "Men's") g = 'male';
                            if (preset === "Women's") g = 'female';
                            setFormData({
                              ...formData,
                              typeLabel: preset,
                              gender: g
                            });
                          }}
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium border cursor-pointer transition-all ${
                            isPresetActive
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {preset}
                        </button>
                      );
                    })}
                  </div>

                  {/* Editable Free Text Input for custom label */}
                  <input
                    type="text"
                    value={formData.typeLabel || ''}
                    onChange={(e) => setFormData({ ...formData, typeLabel: e.target.value })}
                    placeholder="e.g. Unisex, Men's, Custom label..."
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-sans text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all font-semibold"
                  />
                </div>

                {/* Live Catalog Status */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">Catalog Visibility</span>
                    <span className="text-[11px] text-stone-500">Show in live store search & listings</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      formData.active ? 'bg-emerald-600' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                        formData.active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Submit in Mobile */}
            <div className="lg:hidden pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3.5 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Product to Firebase...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isNew ? 'Publish Product' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </form>
      </main>
    </div>
  );
};
