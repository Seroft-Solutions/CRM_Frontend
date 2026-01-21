import { DiscountForm } from '../../components/discount-form';

export const metadata = {
    title: 'Edit Discount',
};

interface EditDiscountPageProps {
    params: {
        id: string;
    };
}

export default async function EditDiscountPage({ params }: EditDiscountPageProps) {
    const { id } = await params;
    return <DiscountForm id={parseInt(id)} />;
}
