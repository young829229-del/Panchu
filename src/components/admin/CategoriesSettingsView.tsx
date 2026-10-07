import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Save,
  Tag,
  Maximize2,
  Sliders,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { CategoryItem, Product } from '../../types';
import {
  subscribeCategories,
  saveCategoriesToFirestore,
  getCanonicalCategoriesSync,
  subscribeSizes,
  saveSizesToFirestore,
  getCanonicalSizesSync,
  subscribeProductTypes,
  saveProductTypesToFirestore,
  getCanonicalProductTypesSync,
  DEFAULT_CATEGORIES,
  DEFAULT_SIZES,
  DEFAULT_PRODUCT_TYPES
} from '../../services/firebaseService';

interface CategoriesSettingsViewProps {
  products?: Product[];
}

export const CategoriesSettingsView: React.FC<CategoriesSettingsViewProps> = ({
  products = []
}) => {
  // Categories State
  const [categories, setCategories] = useState<CategoryItem[]>(() => getCanonicalCategoriesSync());
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isSavingCategories, setIsSavingCategories] = useState<boolean>(false);
  const [categorySuccessMsg, setCategorySuccessMsg] = useState<string>('');
  const [categoryErrorMsg, setCategoryErrorMsg] = useState<string>('');

  // Sizes State
  const [sizes, setSizes] = useState<string[]>(() => getCanonicalSizesSync());
  const [newSizeName, setNewSizeName] = useState<string>('');
  const [editingSizeIdx, setEditingSizeIdx] = useState<number | null>(null);
  const [editingSizeValue, setEditingSizeValue] = useState<string>('');
  const [isSavingSizes, setIsSavingSizes] = useState<boolean>(false);
  const [sizeSuccessMsg, setSizeSuccessMsg] = useState<string>('');
  const [sizeErrorMsg, setSizeErrorMsg] = useState<string>('');

  // Product Type Labels State
  const [productTypes, setProductTypes] = useState<string[]>(() => getCanonicalProductTypesSync());
  const [newTypeLabel, setNewTypeLabel] = useState<string>('');
  const [editingTypeIdx, setEditingTypeIdx] = useState<number | null>(null);
  const [editingTypeValue, setEditingTypeValue] = useState<string>('');
  const [isSavingTypes, setIsSavingTypes] = useState<boolean>(false);
  const [typeSuccessMsg, setTypeSuccessMsg] = useState<string>('');
  const [typeErrorMsg, setTypeErrorMsg] = useState<string>('');

  // Subscriptions to live Firestore
  useEffect(() => {
    const unsubCat = subscribeCategories((liveCats) => {
      if (liveCats && liveCats.length > 0) {
        setCategories(liveCats);
      }
    });

    const unsubSizes = subscribeSizes((liveSizes) => {
      if (liveSizes && liveSizes.length > 0) {
        setSizes(liveSizes);
      }
    });

    const unsubTypes = subscribeProductTypes((liveTypes) => {
      if (liveTypes && liveTypes.length > 0) {
        setProductTypes(liveTypes);
      }
    });

    return () => {
      unsubCat();
      unsubSizes();
      unsubTypes();
    };
  }, []);

  // --- Category Handlers ---
  const handleAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    const exists = categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setCategoryErrorMsg(`Category "${trimmed}" already exists.`);
      return;
    }

    const newSlug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      name: trimmed,
      slug: newSlug,
      order: categories.length,
      enabled: true
    };

    const updated = [...categories, newCat];
    setCategories(updated);
    setNewCategoryName('');
    setCategoryErrorMsg('');

    try {
      setIsSavingCategories(true);
      await saveCategoriesToFirestore(updated);
      setCategorySuccessMsg(`Category "${trimmed}" added and published to store!`);
      setTimeout(() => setCategorySuccessMsg(''), 4000);
    } catch (err: any) {
      setCategoryErrorMsg(err?.message || 'Failed to save new category.');
    } finally {
      setIsSavingCategories(false);
    }
  };

  const handleToggleEnableCategory = async (catId: string) => {
    const updated = categories.map(c => c.id === catId ? { ...c, enabled: !c.enabled } : c);
    setCategories(updated);
    try {
      setIsSavingCategories(true);
      await saveCategoriesToFirestore(updated);
      setCategorySuccessMsg('Category visibility updated!');
      setTimeout(() => setCategorySuccessMsg(''), 3000);
    } catch (err: any) {
      setCategoryErrorMsg(err?.message || 'Failed to update category.');
    } finally {
      setIsSavingCategories(false);
    }
  };

  const handleStartEditCategory = (cat: CategoryItem) => {
    setEditingCategoryId(cat.id);
    setEditingName(cat.name);
  };

  const handleSaveEditCategory = async (catId: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;

    const updated = categories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          name: trimmed,
          slug: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        };
      }
      return c;
    });

    setCategories(updated);
    setEditingCategoryId(null);
    setEditingName('');

    try {
      setIsSavingCategories(true);
      await saveCategoriesToFirestore(updated);
      setCategorySuccessMsg(`Category renamed to "${trimmed}"! Store updated.`);
      setTimeout(() => setCategorySuccessMsg(''), 4000);
    } catch (err: any) {
      setCategoryErrorMsg(err?.message || 'Failed to update category.');
    } finally {
      setIsSavingCategories(false);
    }
  };

  const handleDeleteCategory = async (cat: CategoryItem) => {
    if (categories.length <= 1) {
      setCategoryErrorMsg('You must have at least one category.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"? Products assigned to it will remain intact.`)) {
      return;
    }

    const updated = categories.filter(c => c.id !== cat.id).map((c, idx) => ({ ...c, order: idx }));
    setCategories(updated);

    try {
      setIsSavingCategories(true);
      await saveCategoriesToFirestore(updated);
      setCategorySuccessMsg(`Category "${cat.name}" deleted. Store updated.`);
      setTimeout(() => setCategorySuccessMsg(''), 4000);
    } catch (err: any) {
      setCategoryErrorMsg(err?.message || 'Failed to delete category.');
    } finally {
      setIsSavingCategories(false);
    }
  };

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    const reordered = [...categories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);

    const updated = reordered.map((c, idx) => ({ ...c, order: idx }));
    setCategories(updated);

    try {
      setIsSavingCategories(true);
      await saveCategoriesToFirestore(updated);
      setCategorySuccessMsg('Category order updated and applied to store!');
      setTimeout(() => setCategorySuccessMsg(''), 3000);
    } catch (err: any) {
      setCategoryErrorMsg(err?.message || 'Failed to update category order.');
    } finally {
      setIsSavingCategories(false);
    }
  };

  const handleResetCategoriesToDefault = async () => {
    if (!window.confirm('Reset categories to standard set (All, Best Selling, Summer, Winter, Shirts, Oversized)?')) {
      return;
    }
    setCategories(DEFAULT_CATEGORIES);
    try {
      setIsSavingCategories(true);
      await saveCategoriesToFirestore(DEFAULT_CATEGORIES);
      setCategorySuccessMsg('Categories reset to defaults.');
      setTimeout(() => setCategorySuccessMsg(''), 4000);
    } catch (err: any) {
      setCategoryErrorMsg(err?.message || 'Failed to reset categories.');
    } finally {
      setIsSavingCategories(false);
    }
  };

  // --- Size Handlers ---
  const handleAddSize = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSizeName.trim().toUpperCase();
    if (!trimmed) return;

    if (sizes.includes(trimmed)) {
      setSizeErrorMsg(`Size "${trimmed}" already exists.`);
      return;
    }

    const updated = [...sizes, trimmed];
    setSizes(updated);
    setNewSizeName('');
    setSizeErrorMsg('');

    try {
      setIsSavingSizes(true);
      await saveSizesToFirestore(updated);
      setSizeSuccessMsg(`Size "${trimmed}" added! Now available in product editor.`);
      setTimeout(() => setSizeSuccessMsg(''), 4000);
    } catch (err: any) {
      setSizeErrorMsg(err?.message || 'Failed to save new size.');
    } finally {
      setIsSavingSizes(false);
    }
  };

  const handleRemoveSize = async (sizeToRemove: string) => {
    if (sizes.length <= 1) {
      setSizeErrorMsg('Must have at least one apparel size.');
      return;
    }
    if (!window.confirm(`Remove size "${sizeToRemove}" from store size options? Existing product stock data will remain safe.`)) {
      return;
    }

    const updated = sizes.filter(s => s !== sizeToRemove);
    setSizes(updated);

    try {
      setIsSavingSizes(true);
      await saveSizesToFirestore(updated);
      setSizeSuccessMsg(`Size "${sizeToRemove}" removed.`);
      setTimeout(() => setSizeSuccessMsg(''), 4000);
    } catch (err: any) {
      setSizeErrorMsg(err?.message || 'Failed to delete size.');
    } finally {
      setIsSavingSizes(false);
    }
  };

  const handleStartEditSize = (idx: number, val: string) => {
    setEditingSizeIdx(idx);
    setEditingSizeValue(val);
  };

  const handleSaveEditSize = async (idx: number) => {
    const trimmed = editingSizeValue.trim().toUpperCase();
    if (!trimmed) return;

    const updated = [...sizes];
    updated[idx] = trimmed;
    setSizes(updated);
    setEditingSizeIdx(null);
    setEditingSizeValue('');

    try {
      setIsSavingSizes(true);
      await saveSizesToFirestore(updated);
      setSizeSuccessMsg(`Size renamed to "${trimmed}"!`);
      setTimeout(() => setSizeSuccessMsg(''), 4000);
    } catch (err: any) {
      setSizeErrorMsg(err?.message || 'Failed to save size.');
    } finally {
      setIsSavingSizes(false);
    }
  };

  const handleMoveSize = async (idx: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sizes.length) return;

    const reordered = [...sizes];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);
    setSizes(reordered);

    try {
      setIsSavingSizes(true);
      await saveSizesToFirestore(reordered);
    } catch (err: any) {
      setSizeErrorMsg(err?.message || 'Failed to update size order.');
    } finally {
      setIsSavingSizes(false);
    }
  };

  // --- Product Type Labels Handlers ---
  const handleAddTypeLabel = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTypeLabel.trim();
    if (!trimmed) return;

    if (productTypes.includes(trimmed)) {
      setTypeErrorMsg(`Label "${trimmed}" already exists.`);
      return;
    }

    const updated = [...productTypes, trimmed];
    setProductTypes(updated);
    setNewTypeLabel('');
    setTypeErrorMsg('');

    try {
      setIsSavingTypes(true);
      await saveProductTypesToFirestore(updated);
      setTypeSuccessMsg(`Product type "${trimmed}" added!`);
      setTimeout(() => setTypeSuccessMsg(''), 4000);
    } catch (err: any) {
      setTypeErrorMsg(err?.message || 'Failed to save product type.');
    } finally {
      setIsSavingTypes(false);
    }
  };

  const handleRemoveTypeLabel = async (labelToRemove: string) => {
    if (productTypes.length <= 1) {
      setTypeErrorMsg('Must have at least one product type label.');
      return;
    }
    const updated = productTypes.filter(t => t !== labelToRemove);
    setProductTypes(updated);

    try {
      setIsSavingTypes(true);
      await saveProductTypesToFirestore(updated);
      setTypeSuccessMsg(`Label "${labelToRemove}" removed.`);
      setTimeout(() => setTypeSuccessMsg(''), 4000);
    } catch (err: any) {
      setTypeErrorMsg(err?.message || 'Failed to delete type label.');
    } finally {
      setIsSavingTypes(false);
    }
  };

  const handleStartEditType = (idx: number, val: string) => {
    setEditingTypeIdx(idx);
    setEditingTypeValue(val);
  };

  const handleSaveEditType = async (idx: number) => {
    const trimmed = editingTypeValue.trim();
    if (!trimmed) return;

    const updated = [...productTypes];
    updated[idx] = trimmed;
    setProductTypes(updated);
    setEditingTypeIdx(null);
    setEditingTypeValue('');

    try {
      setIsSavingTypes(true);
      await saveProductTypesToFirestore(updated);
      setTypeSuccessMsg(`Label updated to "${trimmed}"!`);
      setTimeout(() => setTypeSuccessMsg(''), 4000);
    } catch (err: any) {
      setTypeErrorMsg(err?.message || 'Failed to update type label.');
    } finally {
      setIsSavingTypes(false);
    }
  };

  // Compute products count per category
  const getProductCountForCategory = (catName: string, catSlug: string) => {
    if (catName.toLowerCase() === 'all') return products.length;
    return products.filter(p => {
      if (Array.isArray(p.categories) && p.categories.some(c => c.toLowerCase() === catName.toLowerCase())) return true;
      if (p.category && p.category.toLowerCase() === catName.toLowerCase()) return true;
      if (catName.toLowerCase() === 'best selling' && (p.bestSelling || p.badge?.toLowerCase().includes('best'))) return true;
      if (catName.toLowerCase() === 'summer' && p.collection?.toLowerCase().includes('summer')) return true;
      if (catName.toLowerCase() === 'winter' && p.collection?.toLowerCase().includes('winter')) return true;
      return false;
    }).length;
  };

  return (
    <div className="space-y-8 pt-2 max-w-6xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-stone-900 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#ff4d4f]" />
            <span>Categories & Product Settings</span>
          </h1>
          <p className="text-xs text-stone-500 font-sans mt-1">
            Manage storefront category tabs & collections, available product sizes, and product type labels. Changes sync to live website in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetCategoriesToDefault}
            className="px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-semibold cursor-pointer transition-colors"
            title="Reset standard categories"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* SECTION 1: STORE CATEGORIES MANAGEMENT */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-stone-700" />
              <span>Store Categories ({categories.length})</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Add, rename, reorder, or toggle categories shown on customer website navigation and collection sections.
            </p>
          </div>

          {/* Quick Add Form */}
          <form onSubmit={handleAddCategory} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Shirts, Oversized..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/20 focus:border-[#ff4d4f] min-w-[200px]"
            />
            <button
              type="submit"
              disabled={isSavingCategories || !newCategoryName.trim()}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </form>
        </div>

        {/* Feedback messages */}
        {categorySuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{categorySuccessMsg}</span>
          </div>
        )}
        {categoryErrorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{categoryErrorMsg}</span>
          </div>
        )}

        {/* Categories Table / List */}
        <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
          {categories.map((cat, idx) => {
            const isEditing = editingCategoryId === cat.id;
            const productCount = getProductCountForCategory(cat.name, cat.slug);

            return (
              <div
                key={cat.id}
                className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  cat.enabled ? 'bg-white hover:bg-[#faf9f8]' : 'bg-stone-50/70 opacity-60'
                }`}
              >
                {/* Left: Reorder & Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Position Arrows */}
                  <div className="flex items-center flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0 || isSavingCategories}
                      onClick={() => handleMoveCategory(idx, 'up')}
                      className="p-1 text-stone-400 hover:text-stone-900 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === categories.length - 1 || isSavingCategories}
                      onClick={() => handleMoveCategory(idx, 'down')}
                      className="p-1 text-stone-400 hover:text-stone-900 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-[11px] font-mono text-stone-400 font-bold w-5 shrink-0">
                    #{idx + 1}
                  </span>

                  {/* Name / Inline Edit */}
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEditCategory(cat.id);
                          if (e.key === 'Escape') setEditingCategoryId(null);
                        }}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-stone-300 w-full focus:outline-none focus:border-[#ff4d4f]"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditCategory(cat.id)}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700"
                        title="Save Rename"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategoryId(null)}
                        className="p-1.5 rounded-lg bg-stone-200 text-stone-700 cursor-pointer hover:bg-stone-300"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-xs sm:text-sm font-bold font-sans text-stone-900 uppercase tracking-wide">
                        {cat.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-mono font-semibold">
                        {productCount} {productCount === 1 ? 'product' : 'products'}
                      </span>
                      {!cat.enabled && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Disabled
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto shrink-0">
                  {/* Enable / Disable Toggle Switch */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-stone-500 font-medium">
                      {cat.enabled ? 'Active on store' : 'Hidden'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleEnableCategory(cat.id)}
                      className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                        cat.enabled ? 'bg-emerald-600' : 'bg-stone-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                          cat.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Rename Button */}
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => handleStartEditCategory(cat)}
                      className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
                      title="Rename Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 cursor-pointer transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: APPAREL SIZE MANAGEMENT */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-stone-700" />
              <span>Available Product Sizes ({sizes.length})</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Control which sizes can be selected in products (e.g. XS, S, M, L, XL, XXL). Adding a size here makes it available across store editors immediately.
            </p>
          </div>

          {/* Quick Add Size */}
          <form onSubmit={handleAddSize} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. XL, XXL, 3XL..."
              value={newSizeName}
              onChange={(e) => setNewSizeName(e.target.value)}
              className="px-3.5 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/20 focus:border-[#ff4d4f] w-32"
            />
            <button
              type="submit"
              disabled={isSavingSizes || !newSizeName.trim()}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Size</span>
            </button>
          </form>
        </div>

        {/* Feedback messages */}
        {sizeSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sizeSuccessMsg}</span>
          </div>
        )}
        {sizeErrorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{sizeErrorMsg}</span>
          </div>
        )}

        {/* Sizes Cards / Pills Grid */}
        <div className="flex flex-wrap gap-3">
          {sizes.map((size, idx) => {
            const isEditing = editingSizeIdx === idx;

            return (
              <div
                key={`size-${size}-${idx}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 bg-[#faf9f8] hover:border-stone-400 transition-all"
              >
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editingSizeValue}
                      onChange={(e) => setEditingSizeValue(e.target.value)}
                      autoFocus
                      className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold uppercase rounded border border-stone-300 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEditSize(idx)}
                      className="p-1 rounded bg-emerald-600 text-white cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSizeIdx(null)}
                      className="p-1 rounded bg-stone-200 text-stone-700 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-xs font-bold font-mono text-stone-900 uppercase">
                      {size}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartEditSize(idx, size)}
                      className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                      title="Rename Size"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(size)}
                      className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                      title="Delete Size"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: PRODUCT TYPE / TAG LABEL MANAGEMENT */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-stone-700" />
              <span>Product Type / Tag Labels</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Default wording is <strong>"Unisex"</strong> (instead of hardcoded "Unisex Oversize"). You can configure labels like Unisex, Men's, Women's, Oversized, Regular Fit, or any custom apparel fit labels.
            </p>
          </div>

          {/* Quick Add Type Label */}
          <form onSubmit={handleAddTypeLabel} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Regular Fit, Boxy Tee..."
              value={newTypeLabel}
              onChange={(e) => setNewTypeLabel(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/20 focus:border-[#ff4d4f] min-w-[200px]"
            />
            <button
              type="submit"
              disabled={isSavingTypes || !newTypeLabel.trim()}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Label</span>
            </button>
          </form>
        </div>

        {/* Feedback messages */}
        {typeSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{typeSuccessMsg}</span>
          </div>
        )}
        {typeErrorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{typeErrorMsg}</span>
          </div>
        )}

        {/* Product Type Chips */}
        <div className="flex flex-wrap gap-2.5">
          {productTypes.map((label, idx) => {
            const isEditing = editingTypeIdx === idx;
            const isDefault = label.toLowerCase() === 'unisex';

            return (
              <div
                key={`type-${label}-${idx}`}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-sans transition-all ${
                  isDefault 
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 font-bold' 
                    : 'border-stone-200 bg-[#faf9f8] text-stone-800 font-semibold hover:border-stone-400'
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editingTypeValue}
                      onChange={(e) => setEditingTypeValue(e.target.value)}
                      autoFocus
                      className="w-28 px-1.5 py-0.5 text-xs font-sans rounded border border-stone-300 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEditType(idx)}
                      className="p-1 rounded bg-emerald-600 text-white cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTypeIdx(null)}
                      className="p-1 rounded bg-stone-200 text-stone-700 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span>{label}</span>
                    {isDefault && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9px] font-bold">
                        Default
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStartEditType(idx, label)}
                      className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                      title="Edit Label"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTypeLabel(label)}
                        className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                        title="Remove Label"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
