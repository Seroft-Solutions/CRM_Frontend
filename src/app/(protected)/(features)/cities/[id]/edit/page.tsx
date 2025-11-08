import { CityForm } from '../../components/city-form';
import { PermissionGuard } from '@/core/auth';

interface EditCityPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Edit City',
};

export default async function EditCityPage({ params }: EditCityPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="city:update"
      unauthorizedTitle="Access Denied to Edit City"
      unauthorizedDescription="You don't have permission to edit city records."
    >
      <div className="space-y-6">
        {/* Professional Header with Dotted Background */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 shadow-lg relative overflow-hidden">
          {/* Dotted background pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          ></div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>

              <div className="text-white">
                <h1 className="text-2xl font-bold">Edit City</h1>
                <p className="text-blue-100">Update the information for this city</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <CityForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
