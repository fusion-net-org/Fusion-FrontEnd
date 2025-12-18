// NoPermission.tsx
import React from "react";
import { Lock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export default function NoPermission() {
  const nav = useNavigate();
  const { companyId } = useParams();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <Lock className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-lg font-semibold">No permission</div>
           
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50"
            onClick={() => nav(-1)}
          >
            Go back
          </button>
          <button
            className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={() => nav(companyId ? `/company/${companyId}` : "/")}
          >
            Company home
          </button>
        </div>
      </div>
    </div>
  );
}
