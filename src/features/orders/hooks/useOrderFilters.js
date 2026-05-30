import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { useDebounce } from '../../../hooks/useDebounce';

export const useOrderFilters = (transactions) => {
    // --- State ---
    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem('ordersViewMode') || 'table';
    });

    const [statusFilter, setStatusFilter] = useState('pending'); // 'pending', 'ready', 'completed', 'all'
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState(() => localStorage.getItem('ordersSort') || 'default');

    // --- Persistence Effects ---
    useEffect(() => {
        localStorage.setItem('ordersViewMode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem('ordersSort', sortBy);
    }, [sortBy]);

    // --- Filtering & Sorting Logic ---
    const filteredOrders = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        const idTerm = term.replace(/^#/, '');

        const filtered = transactions
            .filter(t => t.type === 'order' || t.type === 'sale' || t.type === 'dine_in')
            // Status Filter
            .filter(t => {
                if (statusFilter === 'all') return true;
                if (statusFilter === 'pending') return (t.status === 'pending' || t.status === 'ready');
                return t.status === statusFilter;
            })
            // Search Filter
            .filter(t => {
                if (!term) return true;

                // 1. ID Match (Total or Partial)
                const idMatch = t.id.toLowerCase().includes(idTerm);

                // 2. Customer Match
                const customerMatch = (t.customer?.name || '').toLowerCase().includes(term) ||
                    (t.customer?.phone || '').includes(term);

                // 3. Date Matching (Flexible Formats)
                const orderDate = new Date(t.date);
                const dateFormats = [
                    format(orderDate, 'dd MMM yyyy').toLowerCase(),
                    format(orderDate, 'dd/MM/yyyy'),
                    format(orderDate, 'dd-MM-yyyy'),
                    format(orderDate, 'yyyy-MM-dd'),
                    format(orderDate, 'do MMM'),
                    t.date.toLowerCase()
                ];
                const dateMatch = dateFormats.some(d => d.includes(term));

                // 4. Items/Note Match
                const itemsMatch = t.items.some(i => (i.name || '').toLowerCase().includes(term));
                const noteMatch = (t.note || '').toLowerCase().includes(term);

                return idMatch || customerMatch || dateMatch || itemsMatch || noteMatch;
            });

        // Sorting
        return [...filtered].sort((a, b) => {
            // Priority 0: Relevance (Only if searching)
            if (term) {
                const idA = a.id.toLowerCase();
                const idB = b.id.toLowerCase();
                const nameA = (a.customer?.name || '').toLowerCase();
                const nameB = (b.customer?.name || '').toLowerCase();

                // Exact ID/Name starts with
                const idMatchA = idA.endsWith(idTerm); // Partial IDs are usually endsWith in this app
                const idMatchB = idB.endsWith(idTerm);
                if (idMatchA && !idMatchB) return -1;
                if (!idMatchA && idMatchB) return 1;

                const nameStartsA = nameA.startsWith(term);
                const nameStartsB = nameB.startsWith(term);
                if (nameStartsA && !nameStartsB) return -1;
                if (!nameStartsA && nameStartsB) return 1;
            }

            // Priority 1: Delivery Priority
            if (sortBy === 'priority-asc') {
                if (!a.delivery?.date) return 1;
                if (!b.delivery?.date) return -1;
                const dateA = new Date(`${a.delivery.date}T${a.delivery.time || '23:59'}`);
                const dateB = new Date(`${b.delivery.date}T${b.delivery.time || '23:59'}`);
                return dateA - dateB;
            }
            if (sortBy === 'priority-desc') {
                if (!a.delivery?.date) return -1;
                if (!b.delivery?.date) return 1;
                const dateA = new Date(`${a.delivery.date}T${a.delivery.time || '23:59'}`);
                const dateB = new Date(`${b.delivery.date}T${b.delivery.time || '23:59'}`);
                return dateB - dateA;
            }

            // Priority 2: Manual Sorts
            switch (sortBy) {
                case 'amount-desc': return (b.totalValue || 0) - (a.totalValue || 0);
                case 'amount-asc': return (a.totalValue || 0) - (b.totalValue || 0);
                case 'date-desc': return new Date(b.date) - new Date(a.date);
                case 'date-asc': return new Date(a.date) - new Date(b.date);
                default:
                    // Both Completed -> Newest First
                    return new Date(b.date) - new Date(a.date);
            }
        });
    }, [transactions, statusFilter, searchTerm, sortBy]);

    return {
        viewMode, setViewMode,
        statusFilter, setStatusFilter,
        searchTerm, setSearchTerm,
        sortBy, setSortBy,
        filteredOrders
    };
};
