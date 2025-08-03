// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
import { UserDraftForm } from "../components/user-draft-form";
import { PermissionGuard } from "@/core/auth";

export const metadata = {
  title: "Create UserDraft",
};

export default function CreateUserDraftPage() {
  return (
    <PermissionGuard 
      requiredPermission="userDraft:create"
      unauthorizedTitle="Access Denied to Create User Draft"
      unauthorizedDescription="You don't have permission to create new user draft records."
    >
      <div className="space-y-6">
        {/* Professional Header with Dotted Background */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 shadow-lg relative overflow-hidden">
          {/* Dotted background pattern */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
          
          <div className="flex items-center gap-4 relative z-10">
            {/* Icon */}
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            
            <div className="text-white">
              <h1 className="text-2xl font-bold">Create User Draft</h1>
              <p className="text-blue-100">Enter the details below to create a new user draft</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <UserDraftForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
