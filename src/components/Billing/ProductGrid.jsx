import React, { useState, useMemo } from 'react';
import { UtensilsCrossed, Plus, Minus, X } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { getSmartEmoji } from '../../utils/smartHelpers';
import VariantSelectionModal from './VariantSelectionModal';

// ITEM CARD COMPONENT (Memoized & Optimized for POS Performance)
const MemoizedItemCard = React.memo(({ item, cartItem, handleItemClick, updateQty, isMobile }) => {
    const qty = cartItem ? cartItem.qty : 0;
    const isUnavailable = item.isAvailable === false;

    if (!isMobile) {
        // Original Desktop Card View
        const minPrice = item.variants && item.variants.length > 0
            ? Math.min(...item.variants.map(v => v.price))
            : item.price;
        const maxPrice = item.variants && item.variants.length > 0
            ? Math.max(...item.variants.map(v => v.price))
            : item.price;

        return (
            <button
                key={item.id}
                onClick={(e) => handleItemClick(item, e)}
                className="item-card"
                disabled={isUnavailable}
                style={{
                    background: 'var(--color-bg-glass-input)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    padding: '0',
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start',
                    cursor: isUnavailable ? 'not-allowed' : 'pointer',
                    height: 'auto',
                    minHeight: '155px',
                    position: 'relative',
                    textAlign: 'left',
                    width: '100%',
                    opacity: isUnavailable ? 0.5 : 1,
                    filter: isUnavailable ? 'grayscale(1)' : 'none',
                    outline: 'none',
                    overflow: 'hidden'
                }}
            >
                <div style={{
                    height: '100px', 
                    width: '100%',
                    background: 'var(--color-bg-secondary)',
                    overflow: 'hidden',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: `${item.imagePadding || 0}px`
                }}>
                    {item.image && item.image.length > 5 ? (
                        <img
                             src={item.image}
                             alt={item.name}
                             style={{
                                 width: '100%', 
                                 height: '100%',
                                 objectFit: item.imageFit || 'cover',
                                 transform: `scale(${item.imageZoom || 1})`
                             }}
                        />
                    ) : (
                        <span style={{ fontSize: '2rem', transform: `scale(${item.imageZoom || 1})` }}>
                            {item.image ? item.image : <UtensilsCrossed size={32} color="var(--color-border)" />}
                        </span>
                    )}
                </div>
                <div style={{ padding: '8px 12px 12px 12px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                    <div style={{ 
                        fontWeight: 600, 
                        fontSize: '0.9rem', 
                        lineHeight: '1.2', 
                        color: 'var(--color-text-primary)', 
                        marginBottom: '4px' 
                    }}>{item.name}</div>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <div style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                            {item.variants && item.variants.length > 0
                                ? `₹${minPrice} - ₹${maxPrice}`
                                : `₹${item.price}`}
                        </div>
                        {(item.variants && item.variants.length > 0 || item.trackStock !== false) && (
                            <div style={{
                                fontSize: '0.7rem',
                                color: 'var(--color-text-muted)',
                                background: 'var(--color-bg-secondary)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 400
                            }}>
                                {item.variants && item.variants.length > 0
                                    ? `${item.variants.length} opts`
                                    : `${item.stock} left`}
                            </div>
                        )}
                    </div>
                </div>
                {qty > 0 && (
                    <div style={{ 
                        position: 'absolute', 
                        top: '8px', 
                        right: '8px', 
                        background: 'var(--color-primary)', 
                        color: 'white', 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold', 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        zIndex: 2
                    }}>
                        {qty}
                    </div>
                )}
            </button>
        );
    }

    const minPrice = item.variants && item.variants.length > 0
        ? Math.min(...item.variants.map(v => v.price))
        : item.price;
    const priceText = item.variants && item.variants.length > 0 ? `₹${minPrice}+` : `₹${item.price}`;

    return (
        <div
            className="item-card"
            onClick={(e) => handleItemClick(item, e)}
            style={{
                contain: 'layout paint',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '0',
                display: 'flex', 
                flexDirection: 'column', 
                cursor: isUnavailable ? 'not-allowed' : 'pointer',
                position: 'relative',
                opacity: isUnavailable ? 0.5 : 1,
                filter: isUnavailable ? 'grayscale(1)' : 'none',
                userSelect: 'none',
                height: 'auto',
                minHeight: '155px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease',
                overflow: 'hidden'
            }}
        >
            {/* Emoji / Image Container (End-to-End) */}
            <div style={{
                width: '100%', 
                height: '95px',
                background: 'var(--color-bg-secondary)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                padding: `${item.imagePadding || 0}px`
            }}>
                {item.image && item.image.length > 5 ? (
                    <img
                        src={item.image}
                        alt=""
                        loading="lazy"
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: item.imageFit || 'cover',
                            transform: `scale(${item.imageZoom || 1})`
                        }}
                    />
                ) : (
                    <span style={{ fontSize: '1.8rem', transform: `scale(${item.imageZoom || 1})` }}>
                        {item.image ? item.image : <UtensilsCrossed size={24} color="var(--color-border)" />}
                    </span>
                )}

                {/* Floating Plus/Qty Badge */}
                {!isUnavailable && (
                    <div 
                        onClick={(e) => {
                            if (item.variants && item.variants.length > 0) {
                                handleItemClick(item, e);
                            } else {
                                e.stopPropagation();
                                triggerHaptic('light');
                                updateQty(item.id, 1);
                            }
                        }}
                        style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: qty > 0 ? 'var(--color-primary)' : 'white',
                            color: qty > 0 ? 'white' : 'var(--color-primary)',
                            borderRadius: '6px',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            border: qty > 0 ? 'none' : '1px solid var(--color-border)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            zIndex: 10,
                            cursor: 'pointer'
                        }}
                    >
                        {qty > 0 ? qty : '+'}
                    </div>
                )}
            </div>

            {/* Details Container */}
            <div style={{
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                width: '100%',
                alignItems: 'flex-start',
                textAlign: 'left'
            }}>
                {/* Product Name */}
                <div style={{ 
                    fontWeight: 700, 
                    fontSize: '0.78rem', 
                    lineHeight: '1.2', 
                    color: 'var(--color-text-primary)',
                    width: '100%',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '2.4em',
                    marginBottom: '4px'
                }}>
                    {item.name}
                </div>

                {/* Price & Stock */}
                <div style={{ 
                    marginTop: 'auto',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '4px',
                    width: '100%'
                }}>
                    <span style={{ 
                        color: 'var(--color-success)', 
                        fontWeight: 800, 
                        fontSize: '0.85rem'
                    }}>
                        {priceText}
                    </span>
                    {item.trackStock !== false && item.stock <= 5 && (
                        <span style={{ 
                            fontSize: '0.62rem', 
                            color: 'var(--color-danger)',
                            marginLeft: 'auto',
                            fontWeight: 600
                        }}>
                            {item.stock} left
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.item === nextProps.item &&
        prevProps.cartItem?.qty === nextProps.cartItem?.qty &&
        prevProps.isMobile === nextProps.isMobile
    );
});

import { useSettings } from '../../context/SettingsContext';

const ProductGrid = ({
    searchTerm, setSearchTerm,
    categories, filterCategory, setFilterCategory,
    filteredItems, cart, addToCart, updateQty,
    isMobile, setShowMobileSearch,
    // Quick Add Props
    quickAddName, setQuickAddName, quickAddPrice, setQuickAddPrice,
    quickAddCategory, setQuickAddCategory, quickAddStock, setQuickAddStock,
    quickAddTrackStock, setQuickAddTrackStock, quickAddImage, setQuickAddImage,
    suggestedEmoji, handleQuickAddSubmit
}) => {
    const [selectedVariantItem, setSelectedVariantItem] = useState(null);
    const [anchorRect, setAnchorRect] = useState(null);
    const [collapsedMasters, setCollapsedMasters] = useState([]);
    const { masterCategoryOrder } = useSettings();

    // Group items by Master Category then Category for Sidebar
    const groupedItems = useMemo(() => {
        const groups = {};
        
        filteredItems.forEach(item => {
            const mCat = item.masterCategory || item.category || 'General';
            const cat = item.category || 'General';
            if (!groups[mCat]) groups[mCat] = {};
            if (!groups[mCat][cat]) groups[mCat][cat] = [];
            groups[mCat][cat].push(item);
        });

        const sortedGroups = [];
        
        // Sort keys by masterCategoryOrder, then alphabetically
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            const indexA = masterCategoryOrder.indexOf(a);
            const indexB = masterCategoryOrder.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });

        sortedKeys.forEach(mCat => {
             const mCatObj = { masterCategory: mCat, categories: [] };
             categories.filter(c => c !== 'All').forEach(c => {
                 if (groups[mCat][c]) {
                     mCatObj.categories.push({ category: c, items: groups[mCat][c] });
                 }
             });
             Object.keys(groups[mCat]).forEach(c => {
                 if (!mCatObj.categories.find(sg => sg.category === c)) {
                     mCatObj.categories.push({ category: c, items: groups[mCat][c] });
                 }
             });
             if (mCatObj.categories.length > 0) {
                 sortedGroups.push(mCatObj);
             }
        });
        
        return sortedGroups;
    }, [filteredItems, categories, masterCategoryOrder]);

    const categoryIcon = useMemo(() => {
        const mapping = {};
        groupedItems.forEach(g => {
            g.categories.forEach(c => {
                const firstItem = c.items[0];
                let icon = '🍰';
                if (firstItem) {
                    icon = firstItem.image && firstItem.image.length > 5 
                        ? firstItem.image 
                        : (firstItem.image || getSmartEmoji(firstItem.name, c.category));
                }
                mapping[c.category] = icon;
            });
        });
        return mapping;
    }, [groupedItems]);

    // Active Category Determination (Default to first if 'All')
    const activeCategory = useMemo(() => {
        if (filterCategory && filterCategory !== 'All') return filterCategory;
        if (groupedItems.length > 0 && groupedItems[0].categories.length > 0) {
            return groupedItems[0].categories[0].category;
        }
        return 'General';
    }, [filterCategory, groupedItems]);

    const currentMasterCategory = useMemo(() => {
        const mGroup = groupedItems.find(g => g.categories.some(c => c.category === activeCategory));
        return mGroup ? mGroup.masterCategory : (groupedItems.length > 0 ? groupedItems[0].masterCategory : null);
    }, [activeCategory, groupedItems]);

    const currentActiveMaster = currentMasterCategory || (groupedItems.length > 0 ? groupedItems[0].masterCategory : 'General');
    const activeMasterGroup = groupedItems.find(g => g.masterCategory === currentActiveMaster);
    const visibleCategories = activeMasterGroup ? activeMasterGroup.categories.map(c => c.category) : [];

    // Fast Filtering for Center Grid
    const activeCategoryItems = useMemo(() => {
        if (searchTerm) return filteredItems;
        return filteredItems.filter(item => item.category === activeCategory);
    }, [filteredItems, activeCategory, searchTerm]);

    const handleItemClick = (item, e) => {
        if (item.isAvailable === false) {
            triggerHaptic('error');
            return;
        }
        triggerHaptic('light');
        if (item.variants && item.variants.length > 0) {
            if (e && e.currentTarget) {
                setAnchorRect(e.currentTarget.getBoundingClientRect());
            }
            setSelectedVariantItem(item);
        } else {
            addToCart(item);
        }
    };

    const handleVariantSelect = (variant) => {
        if (!selectedVariantItem) return;
        const variantCartItem = {
            id: `${selectedVariantItem.id}-${variant.name.replace(/\s+/g, '-')}`,
            productId: selectedVariantItem.id,
            name: `${selectedVariantItem.name} (${variant.name})`,
            price: Number(variant.price),
            stock: Number(variant.stock),
            category: selectedVariantItem.category,
            image: selectedVariantItem.image,
            isVariant: true,
            variantId: variant.id,
            emoji: selectedVariantItem.emoji || selectedVariantItem.imageEmoji || getSmartEmoji(selectedVariantItem.name)
        };
        addToCart(variantCartItem);
        setSelectedVariantItem(null);
    };

    return (
        <div className="menu-pane" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            
            {/* MOBILE MASTER CATEGORY TABS */}
            {isMobile && !searchTerm && groupedItems.length > 0 && (
                <div className="no-scrollbar" style={{
                    display: 'flex', gap: '8px', padding: '8px 16px 2px 16px', overflowX: 'auto',
                    background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)',
                    flexShrink: 0
                }}>
                    {groupedItems.map(g => {
                        const isSelected = currentActiveMaster === g.masterCategory;
                        return (
                            <button
                                key={g.masterCategory}
                                onClick={() => {
                                    triggerHaptic('light');
                                    if (g.categories.length > 0) {
                                        setFilterCategory(g.categories[0].category);
                                    }
                                }}
                                style={{
                                    padding: '6px 14px', borderRadius: '12px',
                                    background: isSelected ? 'var(--color-bg-glass-input)' : 'transparent',
                                    color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    border: '1px solid', borderColor: isSelected ? 'var(--color-border)' : 'transparent',
                                    cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.9rem', fontWeight: isSelected ? 800 : 600,
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {g.masterCategory}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* MOBILE CATEGORY PILLS (Horizontal) - REMOVED / HIDDEN to use vertical sidebar instead */}

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* DESKTOP STATIC SIDEBAR (High-Speed POS Design) */}
                {!isMobile && (
                    <div className="no-scrollbar" style={{ width: '220px', flexShrink: 0, borderRight: '1px solid var(--color-border)', background: 'transparent', overflowY: 'auto', padding: '16px 12px' }}>
                        {groupedItems.map(mGroup => {
                            const isExpanded = currentMasterCategory === mGroup.masterCategory && !collapsedMasters.includes(mGroup.masterCategory);
                            return (
                                <div key={mGroup.masterCategory} style={{ marginBottom: '8px' }}>
                                    <button
                                        onClick={() => {
                                            if (currentMasterCategory === mGroup.masterCategory) {
                                                if (collapsedMasters.includes(mGroup.masterCategory)) {
                                                    setCollapsedMasters(prev => prev.filter(m => m !== mGroup.masterCategory));
                                                } else {
                                                    setCollapsedMasters(prev => [...prev, mGroup.masterCategory]);
                                                }
                                            } else {
                                                setFilterCategory(mGroup.categories[0].category);
                                                setCollapsedMasters(prev => prev.filter(m => m !== mGroup.masterCategory));
                                            }
                                        }}
                                        style={{
                                            width: '100%', padding: '12px 16px', borderRadius: '12px',
                                            background: isExpanded ? 'var(--color-bg-glass-input)' : 'transparent',
                                            color: isExpanded ? 'var(--color-primary)' : 'var(--color-text-main)',
                                            border: isExpanded ? '1px solid var(--color-border)' : '1px solid transparent',
                                            textAlign: 'left', cursor: 'pointer',
                                            fontSize: '1rem', fontWeight: isExpanded ? 800 : 600,
                                            transition: 'background-color 0.1s, color 0.1s',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            boxShadow: isExpanded ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {mGroup.masterCategory}
                                        </div>
                                        <span style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.1s', fontSize: '0.8rem', opacity: isExpanded ? 1 : 0.4 }}>▶</span>
                                    </button>

                                    {/* Accordion Content (Instant Conditional Rendering) */}
                                    {isExpanded && (
                                        <div style={{ paddingLeft: '16px', marginTop: '4px' }}>
                                            {mGroup.categories.map(group => (
                                                <button
                                                    key={group.category}
                                                    onClick={() => setFilterCategory(group.category)}
                                                    style={{
                                                        width: '100%', padding: '10px 12px', marginBottom: '4px', borderRadius: '8px',
                                                        background: activeCategory === group.category ? 'var(--color-primary)' : 'transparent',
                                                        color: activeCategory === group.category ? 'white' : 'var(--color-text-muted)',
                                                        border: 'none', textAlign: 'left', cursor: 'pointer',
                                                        fontSize: '0.9rem', fontWeight: activeCategory === group.category ? 700 : 500,
                                                        transition: 'background-color 0.1s, color 0.1s',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                                    }}
                                                >
                                                    {group.category}
                                                    {activeCategory === group.category && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* MOBILE VERTICAL CATEGORY SIDEBAR */}
                {isMobile && !searchTerm && visibleCategories.length > 0 && (
                    <div className="no-scrollbar" style={{
                        width: '78px',
                        flexShrink: 0,
                        borderRight: '1px solid var(--color-border)',
                        background: 'var(--color-bg-base)',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        padding: '10px 2px 100px 2px'
                    }}>
                        {visibleCategories.map(cat => {
                            const isActive = activeCategory === cat;
                            const icon = categoryIcon[cat] || '🍰';
                            return (
                                <button
                                    key={cat}
                                    onClick={() => { triggerHaptic('light'); setFilterCategory(cat); }}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        width: '100%',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px 0px',
                                        gap: '4px',
                                        position: 'relative',
                                        outline: 'none'
                                    }}
                                >
                                    {isActive && (
                                        <div style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: '15%',
                                            bottom: '15%',
                                            width: '3.5px',
                                            borderRadius: '0 4px 4px 0',
                                            background: 'var(--color-primary)'
                                        }} />
                                    )}
                                    <div style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '50%',
                                        background: isActive ? 'var(--color-primary-light-transparent)' : 'var(--color-bg-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s ease'
                                    }}>
                                        {icon.length > 5 ? (
                                            <img src={icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                                        )}
                                    </div>
                                    <span style={{
                                        fontSize: '0.62rem',
                                        fontWeight: isActive ? 800 : 500,
                                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        textAlign: 'center',
                                        wordBreak: 'break-word',
                                        lineHeight: '1.15',
                                        padding: '0 1px',
                                        width: '100%'
                                    }}>
                                        {cat}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* FAST CENTER GRID */}
                <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '8px 6px' : '16px', background: 'var(--color-bg-base)' }}>
                    
                    {!searchTerm && activeCategoryItems.length > 0 && (
                        <div style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
                                {activeCategory}
                            </h2>
                        </div>
                    )}

                    {activeCategoryItems.length > 0 ? (
                        <div className="product-grid" style={{ 
                            display: 'grid', 
                            gridTemplateColumns: isMobile 
                                ? 'repeat(2, 1fr)' 
                                : 'repeat(auto-fill, minmax(140px, 1fr))', 
                            gap: isMobile ? '8px' : '16px' 
                        }}>
                            {activeCategoryItems.map(item => {
                                const itemQty = cart.filter(c => c.id === item.id || c.id.startsWith(item.id + '-')).reduce((sum, c) => sum + c.qty, 0);
                                const cartItem = itemQty > 0 ? { qty: itemQty } : null;
                                return (
                                    <MemoizedItemCard 
                                        key={item.id} 
                                        item={item} 
                                        cartItem={cartItem} 
                                        handleItemClick={handleItemClick} 
                                        updateQty={updateQty} 
                                        isMobile={isMobile}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        /* EMPTY STATE */
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '40px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔍</div>
                            <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>No items found</div>
                            {searchTerm && <div style={{ fontSize: '0.9rem', marginBottom: '16px' }}>Add "{searchTerm}" to Inventory?</div>}
                            
                            {searchTerm && (
                                <div style={{
                                    background: 'var(--color-bg-glass-input)',
                                    backdropFilter: 'blur(12px)',
                                    padding: '16px', borderRadius: '12px',
                                    display: 'flex', flexDirection: 'column', gap: '10px',
                                    width: '100%', maxWidth: '300px',
                                    border: '1px solid var(--color-border)',
                                    textAlign: 'left',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                                    color: 'var(--color-text-primary)',
                                    margin: '0 auto'
                                }}>
                                    <button
                                        onClick={() => setShowMobileSearch(false)}
                                        style={{
                                            position: 'absolute', top: '12px', right: '12px',
                                            background: 'transparent', border: 'none',
                                            color: 'var(--color-text-muted)', cursor: 'pointer',
                                            padding: '4px'
                                        }}
                                    >
                                        <X size={20} />
                                    </button>

                                    {/* Name & Emoji */}
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Name</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                value={quickAddName}
                                                onChange={e => setQuickAddName(e.target.value)}
                                                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
                                            />
                                            {quickAddImage ? (
                                                <button
                                                    onClick={() => setQuickAddImage('')}
                                                    style={{
                                                        width: '36px', height: '36px', borderRadius: '6px',
                                                        border: '1px solid var(--color-primary)', background: 'var(--color-bg-surface)',
                                                        fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                >
                                                    {quickAddImage}
                                                </button>
                                            ) : (
                                                suggestedEmoji && (
                                                    <button
                                                        onClick={() => setQuickAddImage(suggestedEmoji)}
                                                        style={{
                                                            padding: '0 12px', borderRadius: '6px',
                                                            border: '1px dashed var(--color-primary)', background: 'transparent',
                                                            color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Use {suggestedEmoji}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* Price & Stock */}
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Price (₹)</label>
                                            <input
                                                type="number"
                                                value={quickAddPrice}
                                                onChange={e => setQuickAddPrice(e.target.value)}
                                                placeholder="0"
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>Stock</label>
                                                <div
                                                    onClick={() => setQuickAddTrackStock(!quickAddTrackStock)}
                                                    style={{ cursor: 'pointer', scale: '0.8', transformOrigin: 'right center', opacity: quickAddTrackStock ? 1 : 0.6 }}
                                                >
                                                    <div style={{
                                                        width: '28px', height: '14px', background: quickAddTrackStock ? 'var(--color-primary)' : '#ccc',
                                                        borderRadius: '10px', position: 'relative'
                                                    }}>
                                                        <div style={{
                                                            width: '10px', height: '10px', background: 'white', borderRadius: '50%',
                                                            position: 'absolute', top: '2px', left: quickAddTrackStock ? '16px' : '2px'
                                                        }} />
                                                    </div>
                                                </div>
                                            </div>
                                            <input
                                                type="number"
                                                value={quickAddStock}
                                                disabled={!quickAddTrackStock}
                                                onChange={e => setQuickAddStock(e.target.value)}
                                                placeholder={quickAddTrackStock ? "0" : "∞"}
                                                style={{
                                                    width: '100%', padding: '8px', borderRadius: '6px',
                                                    border: '1px solid var(--color-border)',
                                                    background: quickAddTrackStock ? 'var(--color-bg-surface)' : 'rgba(0,0,0,0.05)',
                                                    color: quickAddTrackStock ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                                    opacity: quickAddTrackStock ? 1 : 0.7
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Category</label>
                                        <select
                                            value={quickAddCategory}
                                            onChange={e => setQuickAddCategory(e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
                                        >
                                            {categories && categories.length > 0 ? (
                                                categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)
                                            ) : (
                                                <option value="General">General</option>
                                            )}
                                        </select>
                                    </div>

                                    <button
                                        onClick={handleQuickAddSubmit}
                                        style={{
                                            marginTop: '8px',
                                            padding: '10px', borderRadius: '8px',
                                            background: 'var(--color-primary)', color: 'white',
                                            border: 'none', fontWeight: 700, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                        }}
                                    >
                                        <Plus size={18} /> Add & to Cart
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Add padding at the bottom so last items don't hide behind mobile cart */}
                    {isMobile && <div style={{ height: '80px' }} />}
                </div>
            </div>

            {selectedVariantItem && (
                <VariantSelectionModal
                    item={selectedVariantItem}
                    onClose={() => setSelectedVariantItem(null)}
                    onSelectVariant={handleVariantSelect}
                    anchorRect={anchorRect}
                />
            )}
        </div>
    );
};

export default ProductGrid;
