import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  RotateCcw,
  PackageOpen,
  Info
} from 'lucide-react';
import { CategoryItem, Product } from '../../types';
import {
  subscribeCategories,
  saveCategoriesToFirestore,
  getCanonicalCategoriesSync,
  DEFAULT_CATEGORIES
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

  // Subscriptions to live Firestore
  useEffect(() => {
    const unsubCat = subscribeCategories((liveCats) => {
      if (liveCats && liveCats.length > 0) {
        setCategories(liveCats);
      }
    });

    return () => {
      unsubCat();
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
      setCategorySuccessMsg(`Category "${trimmed}" created! It is now available in the product editor.`);
      setTimeout(() => setCategorySuccessMsg(''), 4000);
    } catch (err: any) {
      setCategoryErrorMsg(err?.message || 'Failed to save new category.');
    } finally {
      setIsSavingCategories(false);
    }
  };

  const handleStartEditCategory = (cat: CategoryItem) => {
    setEditingCategoryId(cat.id);
    setEditingName(cat.name);
  };

  const handleSaveEditCategory = async (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;

    const updated = categories.map((c) => {
      if (c.id === id) {
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
      setCategorySuccessMsg(`Category renamed to "${trimmed}"! Store updated in real-time.`);
      setTimeout(() => setCategorySuccessMsg(''), 4000);
    } catch (err: any) {
      setCategoryErrorMsg(err?.message || 'Failed to rename category.');
    } finally {
      setIsSavingCategories(false);
    }
  };

  const handleToggleEnableCategory = async (id: string) => {
    const updated = categories.map((c) => {
      if (c.id === id) {
        return { ...c, enabled: !c.enabled };
      }
      return c;
    });

    setCategories(updated);

    try {
      setIsSavingCategories(true);
      await saveCategoriesToFirestore(updated);
      const toggled = updated.find(c => c.id === id);
      setCategorySuccessMsg(`Category "${toggled?.name}" is now ${toggled?.enabled ? 'Active' : 'Hidden'} on storefront.`);
      setTimeout(() => setCategorySuccessMsg(''), 3000);
    } catch (err: any) {
      setCategoryErrorMsg(err?.message || 'Failed to toggle category.');
    } finally {
      setIsSavingCategories(false);
    }
  };

  const handleDeleteCategory = async (cat: CategoryItem) => {
    if (categories.length <= 1) {
      setCategoryErrorMsg('You must keep at least one category.');
      return;
    }

    if (!window.confirm(`Delete category "${cat.name}" from storefront? Product data will remain intact.`)) {
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
      setCategorySuccessMsg('Category order updated!');
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
      setCategorySuccessMsg('Categories reset to standard defaults.');
      setTimeout(() => setCategorySuccessMsg(''), 4000);
    } catch (err: any) {
      setCategoryErrorMsg(err?.message || 'Failed to reset categories.');
    } finally {
      setIsSavingCategories(false);
    }
  };

  return (
    <div className="space-y-6 pt-2 max-w-4xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-stone-900 flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-[#ff4d4f]" />
            <span>Store Categories</span>
          </h1>
          <p className="text-xs text-stone-500 font-sans mt-1">
            Create, rename, reorder, and enable/disable storefront categories. Changes update live website navigation and collections automatically.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetCategoriesToDefault}
            className="px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
            title="Reset to default categories"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standard</span>
          </button>
        </div>
      </div>

      {/* Info Banner explaining the workflow */}
      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Product Category Assignment Workflow</p>
          <p className="text-amber-800">
            Products are assigned to categories directly inside the product edit form. Go to <strong>Products → Open Product → Edit</strong> and select your desired categories using checkboxes (e.g. Best Selling, Summer, Winter, Shirts, Oversized).
          </p>
        </div>
      </div>

      {/* STORE CATEGORIES MANAGEMENT */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-stone-700" />
              <span>Category List ({categories.length})</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Add new categories or reorder positions.
            </p>
          </div>

          {/* Quick Add Form */}
          <form onSubmit={handleAddCategory} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Summer, Winter, Shirts..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/20 focus:border-[#ff4d4f] min-w-[220px]"
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
                      {!cat.enabled && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Hidden
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
    </div>
  );
};
