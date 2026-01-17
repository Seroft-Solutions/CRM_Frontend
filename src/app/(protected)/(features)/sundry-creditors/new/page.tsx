import { SundryCreditorForm } from '../components/sundry-creditor-form';
import { PermissionGuard } from '@/core/auth';

export const metadata = {
    title: 'New Sundry Creditor',
};

export default function NewSundryCreditorPage() {
    return (
        <PermissionGuard
            requiredPermission="sundryCreditor:create"
            unauthorizedTitle="Access Denied"
            unauthorizedDescription="You don't have permission to create sundry creditors."
        >
            <div className="max-w-5xl mx-auto py-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight">Create Sundry Creditor</h1>
                    <p className="text-muted-foreground">
                        Add a new sundry creditor to your system.
                    </p>
                </div>
                <SundryCreditorForm />
            </div>
        </PermissionGuard>
    );
}
