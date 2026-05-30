import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/useAuth';

// Components
import InventoryFilters from '../features/inventory/components/InventoryFilters';
import { InventoryCard } from '../features/inventory/components/InventoryCard';
import AddEditProductModal from '../features/inventory/components/AddEditProductModal';
import DeleteConfirmationModal from '../features/inventory/components/DeleteConfirmationModal';
import BulkImportModal from '../features/inventory/components/BulkImportModal';
import BulkEditModal from '../features/inventory/components/BulkEditModal'; // [NEW]

// Hooks
import { useInventoryFilters } from '../features/inventory/hooks/useInventoryFilters';
import { useInventoryActions } from '../features/inventory/hooks/useInventoryActions';

const Inventory = () => {
    const { items, loading, updateItem } = useInventory();
    const { role } = useAuth(); // retained for any potential top-level role logic not in sub-components
    const [isBulkEditOpen, setIsBulkEditOpen] = useState(false); // [NEW]

    // --- Responsive Check ---
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Hooks ---
    const {
        viewMode, setViewMode,
        searchTerm, setSearchTerm,
        selectedCategory, setSelectedCategory,
        sortBy, setSortBy,
        showSortMenu, setShowSortMenu,
        categories,
        filteredItems
    } = useInventoryFilters(items);

    const masterCategories = useMemo(() => {
        const map = new Map();
        items.forEach(i => {
            const name = (i.masterCategory || i.category || 'General').trim();
            if (name) {
                map.set(name.toLowerCase(), name);
            }
        });
        return Array.from(map.values());
    }, [items]);

    // --- Helpers / Variants ---
    const containerVariants = useMemo(() => ({
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: isMobile ? 0 : 0.03
            }
        }
    }), [isMobile]);

    const itemVariants = useMemo(() => ({
        hidden: { opacity: 0, y: 10, scale: 0.95 },
        show: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: 'spring', stiffness: 300, damping: 30 }
        },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
    }), []);


    const {
        // Modal State
        isModalOpen, setIsModalOpen,
        modalMode, setModalMode,
        currentItem, setCurrentItem,
        suggestedEmoji,

        // Delete State
        deleteConfirmation, setDeleteConfirmation,

        // Import State
        isImportModalOpen, setIsImportModalOpen,

        // Image State
        selectedFile, setSelectedFile,
        fileInputRef,

        // Actions
        handleAddClick,
        handleEditClick,
        handleDeleteClick,
        confirmDelete,
        handleSaveItem,
        triggerImageUpload,
        handleFileChange,
        handleImageProcessed,
        handleQuickImageEdit,

        // Variants
        addVariant,
        removeVariant,
        updateVariant,
        updateVariantSplit,
        addSmartVariant
    } = useInventoryActions();

    const handleToggleAvailability = (item) => {
        const currentAvailability = item.isAvailable !== false; // defaults to true
        updateItem(item.id, { isAvailable: !currentAvailability });
    };

    return (
        <div className="no-scrollbar" style={{
            height: '100%',
            overflow: 'hidden', // [CHANGED] Main container doesn't scroll
            display: 'flex', // [NEW] Layout Split
            flexDirection: 'column',
            padding: isMobile ? '12px 16px' : '24px',
            paddingBottom: '0' // Remove bottom padding from parent to allow edge-to-edge
        }}>
            {/* Header & Filters - Fixed at Top */}
            <div style={{ flexShrink: 0, paddingBottom: '16px' }}>
                <InventoryFilters
                    isMobile={isMobile}
                    searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                    selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                    categories={categories}
                    // View Mode Removed
                    sortBy={sortBy} setSortBy={setSortBy}
                    showSortMenu={showSortMenu} setShowSortMenu={setShowSortMenu}
                    onAddClick={handleAddClick}
                    onImportClick={() => setIsImportModalOpen(true)}
                    onBulkEditClick={() => setIsBulkEditOpen(true)}
                />
            </div>

            {/* Content Area - Independent Scroll */}
            <div className="no-scrollbar" style={{
                flex: 1,
                overflowY: 'auto',
                minHeight: '0',
                paddingBottom: isMobile ? '100px' : '24px' // Add padding here for scrolling clearance
            }}>
                {loading ? (
                    <div
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            height: '50vh', color: '#888', gap: '16px'
                        }}
                    >
                        <div className="spinner" style={{
                            width: '40px', height: '40px',
                            border: '3px solid rgba(255,255,255,0.1)',
                            borderTop: '3px solid var(--color-primary)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <p>Loading your menu...</p>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : items.length === 0 ? (
                    <div
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            padding: '60px', color: '#ccc', textAlign: 'center'
                        }}
                    >
                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
                            <Package size={48} color="var(--color-primary)" />
                        </div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Your Menu is Empty</h3>
                        <p style={{ fontSize: '1rem', color: '#888', marginBottom: '24px', maxWidth: '300px' }}>
                            Start building your menu by adding your first item.
                        </p>
                        <button
                            onClick={() => handleAddClick()}
                            style={{
                                padding: '12px 24px', borderRadius: '12px', border: 'none',
                                background: 'var(--color-primary)', color: 'white',
                                fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                            }}
                        >
                            <Plus size={20} /> Add Your First Item
                        </button>
                    </div>
                ) : (
                    <div
                        className="grid-view"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                            gap: '12px',
                            marginTop: '16px'
                        }}
                    >
                        {filteredItems.length > 0 ? (
                            filteredItems.map(item => (
                                <InventoryCard
                                    key={item.id}
                                    item={item}
                                    isMobile={isMobile}
                                    viewMode={viewMode}
                                    onEdit={handleEditClick}
                                    onDelete={handleDeleteClick}
                                    onQuickImageEdit={handleQuickImageEdit}
                                    onToggleAvailability={() => handleToggleAvailability(item)}
                                />
                            ))
                        ) : (
                            <div
                                style={{
                                    gridColumn: '1 / -1',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    padding: '60px', color: '#ccc'
                                }}
                            >
                                <Package size={64} strokeWidth={1} style={{ marginBottom: '16px' }} />
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No items found</p>

                                {searchTerm && (
                                    <button
                                        onClick={() => handleAddClick(searchTerm)}
                                        style={{
                                            marginTop: '16px',
                                            padding: '10px 20px',
                                            background: 'rgba(34, 197, 94, 0.2)',
                                            color: '#4ade80',
                                            border: '1px solid #4ade80',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        <Plus size={18} /> Add "{searchTerm}" to menu?
                                    </button>
                                )}

                                {!searchTerm && <p style={{ fontSize: '0.9rem' }}>Try adjusting your filters</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AddEditProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode={modalMode}
                currentItem={currentItem}
                setCurrentItem={setCurrentItem}
                onSave={handleSaveItem}
                fileInputRef={fileInputRef}
                onFileChange={handleFileChange}
                triggerImageUpload={triggerImageUpload}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                handleImageProcessed={handleImageProcessed}
                suggestedEmoji={suggestedEmoji}
                // Variant Helpers
                addVariant={addVariant}
                removeVariant={removeVariant}
                updateVariant={updateVariant}
                updateVariantSplit={updateVariantSplit}
                addSmartVariant={addSmartVariant}
                categories={categories}
                masterCategories={masterCategories}
                onDelete={() => {
                    setIsModalOpen(false);
                    handleDeleteClick(currentItem);
                }}
            />

            <BulkImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
            />

            <BulkEditModal
                isOpen={isBulkEditOpen}
                onClose={() => setIsBulkEditOpen(false)}
            />

            <DeleteConfirmationModal
                isOpen={deleteConfirmation.show}
                itemName={deleteConfirmation.itemName}
                onCancel={() => setDeleteConfirmation({ show: false, itemId: null, itemName: '' })}
                onConfirm={confirmDelete}
            />
        </div>
    );
};

export default Inventory;
