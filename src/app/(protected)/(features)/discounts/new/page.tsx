import { DiscountForm } from '../components/discount-form';
import { Tag } from 'lucide-react';

export const metadata = {
    title: 'New Discount',
};

export default function NewDiscountPage() {
    return (
        <div className="space-y-6">
            <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
                <div className="flex items-center justify-center">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                            <Tag className="w-4 h-4 text-sidebar-accent-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-sidebar-foreground">Create Discount</h1>
                            <p className="text-sm text-sidebar-foreground/80">Add a new discount code</p>
                        </div>
                    </div>

                    <div className="flex-1"></div>

                    <div className="flex-1"></div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <DiscountForm />
            </div>
        </div>
    );
}
