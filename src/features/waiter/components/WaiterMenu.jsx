import React, { useState, useMemo } from 'react';
import { Search, UtensilsCrossed, Plus, Minus } from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptics';
import { getSmartEmoji } from '../../../utils/smartHelpers';

const MemoizedWaiterItemCard = React.memo(({ item, cartItem, handleItemClick, updateQty, isMobile }) => {
    const qty = cartItem ? cartItem.qty : 0;
    const isUnavailable = item.isAvailable === false;

    if (!isMobile) {
        // Original Desktop Waiter Card View
        const minPrice = item.variants && item.variants.length > 0
            ? Math.min(...item.variants.map(v => v.price))
            : item.price;
        const maxPrice = item.variants && item.variants.length > 0
            ? Math.max(...item.variants.map(v => v.price))
            : item.price;

        return (
            <div
                className="item-card"
                onClick={(e) => {
                    if (isUnavailable) return;
                    handleItemClick(item, e);
                }}
                style={{
                    contain: 'layout paint',
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    padding: '0',
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start',
                    cursor: isUnavailable ? 'not-allowed' : 'pointer',
                    height: 'auto',
                    minHeight: '150px',
                    position: 'relative',
                    textAlign: 'left',
                    opacity: isUnavailable ? 0.5 : 1,
                    filter: isUnavailable ? 'grayscale(1)' : 'none',
                    userSelect: 'none',
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
                    fontSize: '2rem',
                    position: 'relative',
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
                        <span style={{ transform: `scale(${item.imageZoom || 1})` }}>
                            {item.image ? item.image : <UtensilsCrossed size={36} color="var(--color-border)" />}
                        </span>
                    )}
                    {item.trackStock !== false && item.stock <= 5 && (
                        <div style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: item.stock === 0 ? 'var(--color-danger)' : 'var(--color-warning)',
                            color: 'white',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            {item.stock === 0 ? 'OUT OF STOCK' : `${item.stock} LEFT`}
                        </div>
                    )}
                </div>
                
                <div style={{ padding: '8px 10px 10px 10px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                    <div style={{ 
                        fontWeight: 600, 
                        fontSize: '0.85rem', 
                        lineHeight: '1.2', 
                        color: 'var(--color-text-primary)', 
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        width: '100%',
                        wordBreak: 'break-word'
                    }}>{item.name}</div>
                    
                    <div style={{ color: 'var(--color-success)', fontWeight: 800, fontSize: '0.9rem', marginTop: 'auto' }}>
                        {item.variants && item.variants.length > 0
                            ? `₹${minPrice} - ₹${maxPrice}`
                            : `₹${item.price}`}
                    </div>
                </div>
                {qty > 0 && (
                    <div style={{ 
                        position: 'absolute', 
                        bottom: '8px', 
                        right: '8px', 
                        background: 'var(--color-primary)', 
                        color: 'white', 
                        fontSize: '0.8rem', 
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
            </div>
        );
    }

    const minPrice = item.variants && item.variants.length > 0
        ? Math.min(...item.variants.map(v => v.price))
        : item.price;
    const priceText = item.variants && item.variants.length > 0 ? `₹${minPrice}+` : `₹${item.price}`;

    return (
        <div
            className="item-card"
            onClick={(e) => {
                if (isUnavailable) return;
                handleItemClick(item, e);
            }}
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
                        style={{ width: '100%', height: '100%', objectFit: item.imageFit || 'cover', transform: `scale(${item.imageZoom || 1})` }}
                    />
                ) : (
                    <span style={{ fontSize: '1.8rem', transform: `scale(${item.imageZoom || 1})` }}>
                        {item.image ? item.image : getSmartEmoji(item.name)}
                    </span>
                )}

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

            <div style={{
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                width: '100%',
                alignItems: 'flex-start',
                textAlign: 'left'
            }}>
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

import { useSettings } from '../../../context/SettingsContext';

export default function WaiterMenu({ items, cart, onAddToCart, onUpdateQty, disabled }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [collapsedMasters, setCollapsedMasters] = useState([]);
    const { masterCategoryOrder, isMobile } = useSettings();

    // Extract categories
    const categories = useMemo(() => {
        return ['All', 'General', ...new Set(items.map(i => i.category).filter(c => c && c.toLowerCase() !== 'all' && c.toLowerCase() !== 'general'))];
    }, [items]);

    // Group items by Master Category then Category for Sidebar
    const groupedItems = useMemo(() => {
        const groups = {};
        
        items.forEach(item => {
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
    }, [items, categories, masterCategoryOrder]);

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

    const activeCategoryItems = useMemo(() => {
        if (searchTerm) {
            return items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return items.filter(item => item.category === activeCategory);
    }, [items, activeCategory, searchTerm]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto', overflow: 'hidden' }}>
            
            {/* Search Bar at Top */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-base)', zIndex: 10 }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder="Search menu..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 10px 10px 40px',
                            background: 'var(--color-bg-secondary)', border: 'none',
                            borderRadius: '8px', color: 'var(--color-text-primary)'
                        }}
                    />
                </div>
            </div>

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
                {/* ACCORDION SIDEBAR */}
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
                                                    onClick={() => { triggerHaptic('light'); setFilterCategory(group.category); }}
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

                {/* PRODUCT GRID */}
                <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '8px 6px' : '16px', background: 'var(--color-bg-base)' }}>
                    {!searchTerm && activeCategoryItems.length > 0 && (
                        <div style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
                                {activeCategory}
                            </h2>
                        </div>
                    )}

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))', 
                        gap: isMobile ? '8px' : '12px', 
                        alignContent: 'start' 
                    }}>
                        {activeCategoryItems.map(item => {
                            const itemQty = cart?.filter(c => c.id === item.id || c.id.startsWith(item.id + '-')).reduce((sum, c) => sum + c.qty, 0) || 0;
                            const cartItem = itemQty > 0 ? { qty: itemQty } : null;
                            return (
                                <MemoizedWaiterItemCard 
                                    key={item.id} 
                                    item={item} 
                                    cartItem={cartItem} 
                                    handleItemClick={onAddToCart} 
                                    updateQty={onUpdateQty} 
                                    isMobile={isMobile}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
