import { SundryCreditorForm } from '../../components/sundry-creditor-form';
import { PermissionGuard } from '@/core/auth';

export const metadata = {
    title: 'Edit Sundry Creditor',
};

interface EditPageProps {
    params: {
        id: string;
    };
}

export default function EditSundryCreditorPage({ params }: EditPageProps) {
    const id = parseInt(params.id, 10);

    return (
        <PermissionGuard
            requiredPermission="sundryCreditor:update"
            unauthorizedTitle="Access Denied"
            unauthorizedDescription="You don't have permission to edit sundry creditors."
        >
            <div className="max-w-5xl mx-auto py-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight">Edit Sundry Creditor</h1>
                    <p className="text-muted-foreground">
                        Update existing sundry creditor details.
                    </p>
                </div>
                <SundryCreditorForm id={id} />
            </div>
        </PermissionGuard>
    );
}
