import { toast } from 'sonner';

export const discountToast = {
    created: (entityName?: string) =>
        toast.success('✅ Success!', {
            description: `${entityName || 'Discount'} created successfully`,
            action: {
                label: 'View',
                onClick: () => (window.location.href = '/discounts'),
            },
        }),

    updated: (entityName?: string) =>
        toast.success('✅ Updated!', {
            description: `${entityName || 'Discount'} updated successfully`,
            action: {
                label: 'View All',
                onClick: () => (window.location.href = '/discounts'),
            },
        }),

    deleted: (entityName?: string) =>
        toast.success('🗑️ Deleted!', {
            description: `${entityName || 'Discount'} deleted successfully`,
        }),

    createError: (error?: string) =>
        toast.error('❌ Creation Failed', {
            description: error || `Failed to create discount. Please try again.`,
        }),

    updateError: (error?: string) =>
        toast.error('❌ Update Failed', {
            description: error || `Failed to update discount. Please try again.`,
        }),

    deleteError: (error?: string) =>
        toast.error('❌ Delete Failed', {
            description: error || `Failed to delete discount. Please try again.`,
        }),

    custom: {
        success: (title: string, description: string) => toast.success(title, { description }),
        error: (title: string, description: string) => toast.error(title, { description }),
    },
};
