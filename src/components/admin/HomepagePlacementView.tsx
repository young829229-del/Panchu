import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Trash2,
  Plus,
  Check,
  RotateCcw,
  Search,
  X,
  Layers,
  Sparkles,
  PackageCheck
} from 'lucide-react';
import { Product, HomepageSectionPlacement } from '../../types';
import {
  getHomepageSectionsSync,
  subscribeHomepageSections,
  saveHomepageSectionsToFirestore,
  DEFAULT_HOMEPAGE_SECTIONS
} from '../../services/firebaseService';

interface HomepagePlacementViewProps {
  products: Product[];
}

export const HomepagePlacementView: React.FC<HomepagePlacementViewProps> = ({
  products = []
}) => {
  const [sections, setSections] = useState<HomepageSectionPlacement[]>(() =>
    getHomepageSectionsSync()
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Active section tab / filter
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');

  // Modal State for Changing / Adding Product
  const [pickerModal, setPickerModal] = useState<{
    isOpen: boolean;
    mode: 'change' | 'add';
    sectionId: string;
    positionIndex: number; // 0-indexed position within the section
  }>({
    isOpen: false,
    mode: 'change',
    sectionId: '',
    positionIndex: 0
  });

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Subscribe to realtime updates from Firestore
  useEffect(() => {
    const unsub = subscribeHomepageSections((liveSections) => {
      if (liveSections && liveSections.length > 0) {
        setSections(liveSections);
      }
    });
    return () => unsub();
  }, []);

  // Map product IDs to Product objects dynamically (Single source of truth)
  const productLookup = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => {
      map.set(p.id, p);
      if (p.productId) map.set(p.productId, p);
    });
    return map;
  }, [products]);

  // Helper to persist sections
  const persistSections = async (newSections: HomepageSectionPlacement[], successText?: string) => {
    setSections(newSections);
    setIsSaving(true);
    setErrorMessage('');
    try {
      await saveHomepageSectionsToFirestore(newSections);
      setSaveSuccessMsg(successText || 'Homepage placement saved and live on storefront!');
      setTimeout(() => setSaveSuccessMsg(''), 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save homepage product placement.');
    } finally {
      setIsSaving(false);
    }
  };

  // Move product up (↑) in section
  const handleMoveUp = (sectionId: string, index: number) => {
    if (index <= 0) return;
    const newSections = sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      const ids = [...sec.productIds];
      const temp = ids[index - 1];
      ids[index - 1] = ids[index];
      ids[index] = temp;
      return { ...sec, productIds: ids };
    });
    persistSections(newSections, 'Product moved up!');
  };

  // Move product down (↓) in section
  const handleMoveDown = (sectionId: string, index: number) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section || index >= section.productIds.length - 1) return;
    const newSections = sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      const ids = [...sec.productIds];
      const temp = ids[index + 1];
      ids[index + 1] = ids[index];
      ids[index] = temp;
      return { ...sec, productIds: ids };
    });
    persistSections(newSections, 'Product moved down!');
  };

  // Remove product from section
  const handleRemoveProduct = (sectionId: string, index: number) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const prodId = section.productIds[index];
    const prod = productLookup.get(prodId);
    const prodName = prod?.name || `Product #${index + 1}`;

    const newSections = sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      const ids = sec.productIds.filter((_, idx) => idx !== index);
      return { ...sec, productIds: ids };
    });

    persistSections(newSections, `Removed "${prodName}" from ${section.title}`);
  };

  // Open modal to Change Product at position
  const handleOpenChangeModal = (sectionId: string, index: number) => {
    setSearchQuery('');
    setPickerModal({
      isOpen: true,
      mode: 'change',
      sectionId,
      positionIndex: index
    });
  };

  // Open modal to Add Product to section
  const handleOpenAddModal = (sectionId: string) => {
    setSearchQuery('');
    const section = sections.find((s) => s.id === sectionId);
    const count = section ? section.productIds.length : 0;
    setPickerModal({
      isOpen: true,
      mode: 'add',
      sectionId,
      positionIndex: count
    });
  };

  // Close modal
  const handleCloseModal = () => {
    setPickerModal({
      isOpen: false,
      mode: 'change',
      sectionId: '',
      positionIndex: 0
    });
    setSearchQuery('');
  };

  // Confirm selection from modal
  const handleSelectProduct = (selectedProdId: string) => {
    const { mode, sectionId, positionIndex } = pickerModal;
    const currentSection = sections.find((s) => s.id === sectionId);
    if (!currentSection) return;

    let updatedIds: string[];
    if (mode === 'change') {
      updatedIds = [...currentSection.productIds];
      updatedIds[positionIndex] = selectedProdId;
    } else {
      updatedIds = [...currentSection.productIds, selectedProdId];
    }

    const newSections = sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return { ...sec, productIds: updatedIds };
    });

    const chosenProduct = productLookup.get(selectedProdId);
    const name = chosenProduct?.name || 'Selected product';

    handleCloseModal();
    persistSections(
      newSections,
      mode === 'change'
        ? `Position #${positionIndex + 1} changed to "${name}" in ${currentSection.title}`
        : `Added "${name}" to ${currentSection.title}`
    );
  };

  // Reset to default placements
  const handleResetDefaults = () => {
    if (
      window.confirm(
        'Are you sure you want to restore the default homepage section products and order?'
      )
    ) {
      persistSections(DEFAULT_HOMEPAGE_SECTIONS, 'Restored default homepage product placements.');
    }
  };

  // Filter products for the picker modal
  const filteredModalProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(q)) ||
        (p.badge && p.badge.toLowerCase().includes(q)) ||
        p.id.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery]);

  // Section currently focused in modal
  const activeModalSection = useMemo(() => {
    return sections.find((s) => s.id === pickerModal.sectionId);
  }, [sections, pickerModal.sectionId]);

  // Product currently in that position (when changing)
  const currentModalTargetProduct = useMemo(() => {
    if (pickerModal.mode !== 'change' || !activeModalSection) return null;
    const id = activeModalSection.productIds[pickerModal.positionIndex];
    return id ? productLookup.get(id) || null : null;
  }, [pickerModal, activeModalSection, productLookup]);

  const displayedSections = useMemo(() => {
    if (selectedSectionId === 'all') return sections;
    return sections.filter((s) => s.id === selectedSectionId);
  }, [sections, selectedSectionId]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-montserrat font-bold tracking-widest uppercase text-stone-400 mb-1">
            <span>Admin</span>
            <span>/</span>
            <span>Homepage</span>
            <span>/</span>
            <span className="text-[#ff4d4f]">Product Placement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-montserrat font-bold uppercase tracking-tight text-stone-900">
            Homepage Product Placement
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-inter mt-1">
            Choose which products appear in each homepage section and control their exact display order.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isSaving}
            className="px-3.5 py-2 text-xs font-montserrat font-bold uppercase tracking-wider text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Restore default placements"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => persistSections(sections, 'All changes synchronized to storefront!')}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-montserrat font-bold uppercase tracking-wider text-white bg-black hover:bg-stone-800 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Placement'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedSectionId('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-montserrat font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all ${
            selectedSectionId === 'all'
              ? 'bg-black text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          All Sections ({sections.length})
        </button>
        {sections.map((sec) => (
          <button
            key={`sec-pill-${sec.id}`}
            type="button"
            onClick={() => setSelectedSectionId(sec.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-montserrat font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all ${
              selectedSectionId === sec.id
                ? 'bg-black text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {sec.title} ({sec.productIds.length})
          </button>
        ))}
      </div>

      {/* Sections List */}
      <div className="space-y-6">
        {displayedSections.map((section) => {
          const sectionProducts = section.productIds.map((id, idx) => ({
            id,
            position: idx + 1,
            product: productLookup.get(id) || null
          }));

          return (
            <div
              key={`section-card-${section.id}`}
              className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden"
            >
              {/* Section Header */}
              <div className="px-5 sm:px-7 py-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 shadow-2xs">
                    <Layers className="w-4 h-4 text-[#ff4d4f]" />
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-montserrat font-bold uppercase tracking-wide text-stone-900 flex items-center gap-2">
                      <span>{section.title}</span>
                      <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                        {section.productIds.length} Products
                      </span>
                    </h2>
                    <p className="text-xs text-stone-500 font-inter">
                      Exact storefront order for the "{section.title}" section.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddModal(section.id)}
                  className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-900 text-xs font-montserrat font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#ff4d4f]" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Products Table / List */}
              <div className="divide-y divide-stone-100">
                {sectionProducts.length === 0 ? (
                  <div className="p-8 text-center text-stone-400 text-xs font-inter space-y-2">
                    <p>No products assigned to this section yet.</p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(section.id)}
                      className="px-4 py-2 rounded-xl bg-black text-white text-xs font-montserrat font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add First Product</span>
                    </button>
                  </div>
                ) : (
                  sectionProducts.map((item, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === sectionProducts.length - 1;
                    const prod = item.product;

                    return (
                      <div
                        key={`sec-${section.id}-pos-${idx}-${item.id}`}
                        className="p-4 sm:px-7 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-[#faf9f8] transition-colors"
                      >
                        {/* Left: Position # and Product Info */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Position Badge */}
                          <div className="w-7 h-7 shrink-0 rounded-full bg-stone-900 text-white font-montserrat font-bold text-xs flex items-center justify-center shadow-2xs">
                            #{item.position}
                          </div>

                          {/* Thumbnail */}
                          <div className="w-12 h-12 shrink-0 rounded-lg border border-stone-200 overflow-hidden bg-stone-100 relative">
                            {prod?.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                                No img
                              </div>
                            )}
                          </div>

                          {/* Name & Details */}
                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-montserrat font-bold uppercase tracking-tight text-stone-900 truncate">
                              {prod ? prod.name : `Product ID: ${item.id} (Unmatched)`}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500 font-inter">
                              {prod ? (
                                <>
                                  <span className="font-semibold text-[#ff4d4f]">
                                    Rs {prod.price.toLocaleString()}
                                  </span>
                                  <span>•</span>
                                  <span>{prod.typeLabel || prod.gender || 'Unisex'}</span>
                                  {prod.inStock ? (
                                    <span className="text-emerald-600 text-[10px] font-bold">
                                      IN STOCK
                                    </span>
                                  ) : (
                                    <span className="text-stone-400 text-[10px] font-bold">
                                      OUT OF STOCK
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-stone-400 italic">
                                  Reference ID: {item.id}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions (Change, Move Up, Move Down, Remove) */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          {/* Change/Replace Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenChangeModal(section.id, idx)}
                            className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-montserrat font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                            title="Change this product"
                          >
                            <RefreshCw className="w-3 h-3 text-[#ff4d4f]" />
                            <span>Change</span>
                          </button>

                          {/* Move Up */}
                          <button
                            type="button"
                            onClick={() => handleMoveUp(section.id, idx)}
                            disabled={isFirst}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isFirst
                                ? 'border-stone-100 text-stone-300 cursor-not-allowed bg-stone-50'
                                : 'border-stone-200 text-stone-700 hover:bg-stone-100 cursor-pointer bg-white'
                            }`}
                            title="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>

                          {/* Move Down */}
                          <button
                            type="button"
                            onClick={() => handleMoveDown(section.id, idx)}
                            disabled={isLast}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isLast
                                ? 'border-stone-100 text-stone-300 cursor-not-allowed bg-stone-50'
                                : 'border-stone-200 text-stone-700 hover:bg-stone-100 cursor-pointer bg-white'
                            }`}
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(section.id, idx)}
                            className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                            title="Remove from this section"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Add Product helper */}
              {sectionProducts.length > 0 && (
                <div className="px-5 sm:px-7 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 font-inter">
                    Products display in this exact 1 to {sectionProducts.length} sequence on the storefront.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(section.id)}
                    className="text-xs font-montserrat font-bold uppercase tracking-wider text-[#ff4d4f] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Another Product</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* PRODUCT PICKER MODAL */}
      {pickerModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <h3 className="text-base font-montserrat font-bold uppercase tracking-tight text-stone-900">
                  {pickerModal.mode === 'change'
                    ? `Replace Position #${pickerModal.positionIndex + 1}`
                    : `Add Product to ${activeModalSection?.title || 'Section'}`}
                </h3>
                <p className="text-xs text-stone-500 font-inter">
                  Select which existing product should occupy this position.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If changing, show current product */}
            {pickerModal.mode === 'change' && currentModalTargetProduct && (
              <div className="px-6 py-3 bg-stone-100/70 border-b border-stone-200 flex items-center gap-3">
                <span className="text-[10px] font-montserrat font-bold uppercase tracking-wider text-stone-500">
                  Currently at #{pickerModal.positionIndex + 1}:
                </span>
                <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                  <div className="w-6 h-6 rounded border border-stone-300 overflow-hidden">
                    <img
                      src={currentModalTargetProduct.image}
                      alt={currentModalTargetProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span>{currentModalTargetProduct.name}</span>
                  <span className="text-[#ff4d4f]">
                    (Rs {currentModalTargetProduct.price.toLocaleString()})
                  </span>
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="p-4 border-b border-stone-200 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products by name or badge..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  autoFocus
                />
              </div>
            </div>

            {/* Product List */}
            <div className="p-4 overflow-y-auto divide-y divide-stone-100 flex-1">
              {filteredModalProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400 font-inter">
                  No products matched "{searchQuery}".
                </div>
              ) : (
                filteredModalProducts.map((product) => {
                  const isCurrentPosition =
                    pickerModal.mode === 'change' &&
                    activeModalSection?.productIds[pickerModal.positionIndex] === product.id;

                  const alreadyInThisSection =
                    activeModalSection?.productIds.includes(product.id) && !isCurrentPosition;

                  return (
                    <div
                      key={`modal-prod-${product.id}`}
                      className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-stone-50 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg border border-stone-200 overflow-hidden bg-stone-100 shrink-0">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-montserrat font-bold uppercase tracking-tight text-stone-900 truncate">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-stone-500 font-inter mt-0.5">
                            <span className="font-semibold text-[#ff4d4f]">
                              Rs {product.price.toLocaleString()}
                            </span>
                            <span>•</span>
                            <span>{product.typeLabel || product.gender || 'Unisex'}</span>
                            {alreadyInThisSection && (
                              <span className="text-stone-400 text-[10px] italic">
                                (also in this section)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectProduct(product.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                          isCurrentPosition
                            ? 'bg-stone-200 text-stone-600 cursor-default'
                            : 'bg-black text-white hover:bg-stone-800 shadow-xs'
                        }`}
                      >
                        {isCurrentPosition ? 'Current' : 'Select'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <span className="text-xs text-stone-400 font-inter">
                {filteredModalProducts.length} products available
              </span>
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-xs font-montserrat font-bold uppercase tracking-wider text-stone-700 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
