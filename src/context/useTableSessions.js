import { useContext } from 'react';
import { TableSessionContext } from './TableSessionContextDef';

export const useTableSessions = () => {
    const context = useContext(TableSessionContext);
    if (!context) {
        throw new Error('useTableSessions must be used within a TableSessionProvider');
    }
    return context;
};
