import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useTheme } from '../../context/useTheme';
import { ArrowUp, ArrowDown, X, Plus, ListOrdered, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MasterCategoryOrderManager = ({ masterCategoryOrder, setMasterCategoryOrder }) => {
    const { items } = useInventory();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [newCategory, setNewCategory] = useState('');

    // Extract all unique master categories present in current inventory items
    const uniqueMasterCategoriesInInventory = useMemo(() => {
        if (!items || items.length === 0) return [];
        const set = new Set();
        items.forEach(item => {
            const mCat = item.masterCategory || item.category || 'General';
            set.add(mCat.trim());
        });
        return Array.from(set).filter(Boolean);
    }, [items]);

    // Categories in the inventory that are not explicitly ordered yet
    const unlistedCategories = useMemo(() => {
        return uniqueMasterCategoriesInInventory.filter(
            cat => !masterCategoryOrder.includes(cat)
        );
    }, [uniqueMasterCategoriesInInventory, masterCategoryOrder]);

    const handleMoveUp = (index) => {
        if (index === 0) return;
        const newList = [...masterCategoryOrder];
        const temp = newList[index];
        newList[index] = newList[index - 1];
        newList[index - 1] = temp;
        setMasterCategoryOrder(newList);
    };

    const handleMoveDown = (index) => {
        if (index === masterCategoryOrder.length - 1) return;
        const newList = [...masterCategoryOrder];
        const temp = newList[index];
        newList[index] = newList[index + 1];
        newList[index + 1] = temp;
        setMasterCategoryOrder(newList);
    };

    const handleRemove = (cat) => {
        setMasterCategoryOrder(masterCategoryOrder.filter(c => c !== cat));
    };

    const handleAdd = (cat) => {
        const trimmed = cat.trim();
        if (!trimmed || masterCategoryOrder.includes(trimmed)) return;
        setMasterCategoryOrder([...masterCategoryOrder, trimmed]);
        setNewCategory('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAdd(newCategory);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header / Instructions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListOrdered size={18} color="var(--color-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    Drag-free Touch Reordering
                </span>
            </div>

            {/* Sorted Categories List */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                minHeight: '60px'
            }}>
                {masterCategoryOrder.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                        No categories sorted. Add below to customize the order.
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {masterCategoryOrder.map((cat, idx) => (
                            <motion.div
                                key={cat}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: 'var(--color-bg-surface)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '10px',
                                    padding: '8px 12px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                        {idx + 1}.
                                    </span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                        {cat}
                                    </span>
                                    {uniqueMasterCategoriesInInventory.includes(cat) && (
                                        <span style={{
                                            fontSize: '0.65rem',
                                            padding: '2px 6px',
                                            background: 'rgba(34, 197, 94, 0.1)',
                                            color: 'var(--color-success)',
                                            borderRadius: '4px',
                                            fontWeight: 600
                                        }}>
                                            Active
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {/* Move Up */}
                                    <button
                                        type="button"
                                        onClick={() => handleMoveUp(idx)}
                                        disabled={idx === 0}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            padding: '4px',
                                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                            color: idx === 0 ? 'var(--color-text-muted)' : 'var(--color-primary)',
                                            opacity: idx === 0 ? 0.3 : 1,
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <ArrowUp size={16} />
                                    </button>

                                    {/* Move Down */}
                                    <button
                                        type="button"
                                        onClick={() => handleMoveDown(idx)}
                                        disabled={idx === masterCategoryOrder.length - 1}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            padding: '4px',
                                            cursor: idx === masterCategoryOrder.length - 1 ? 'not-allowed' : 'pointer',
                                            color: idx === masterCategoryOrder.length - 1 ? 'var(--color-text-muted)' : 'var(--color-primary)',
                                            opacity: idx === masterCategoryOrder.length - 1 ? 0.3 : 1,
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <ArrowDown size={16} />
                                    </button>

                                    {/* Remove */}
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(cat)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            padding: '4px',
                                            cursor: 'pointer',
                                            color: 'var(--color-danger)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            marginLeft: '4px'
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Unlisted / Quick Add Section */}
            {unlistedCategories.length > 0 && (
                <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '8px' }}>
                        AVAILABLE IN INVENTORY (CLICK TO ADD TO SORT LIST)
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {unlistedCategories.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => handleAdd(cat)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '16px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-surface)',
                                    color: 'var(--color-text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.15s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                                    e.currentTarget.style.color = 'var(--color-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                    e.currentTarget.style.color = 'var(--color-text-primary)';
                                }}
                            >
                                <Plus size={12} />
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Custom Input */}
            <div style={{ display: 'flex', gap: '8px' }}>
                <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add custom category..."
                    style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-base)',
                        color: 'var(--color-text-main)',
                        fontSize: '0.85rem'
                    }}
                />
                <button
                    type="button"
                    onClick={() => handleAdd(newCategory)}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        background: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                >
                    <Plus size={16} /> Add
                </button>
            </div>
        </div>
    );
};

export default MasterCategoryOrderManager;
