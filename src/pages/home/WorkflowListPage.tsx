import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import NotFound from "../notfound/NotFound.js";
import { getWorkflows, deleteWorkflow } from "../../services/workflowService.js";

/** Nếu service trả { id, name } */
type WorkflowVm = { id: string; name: string };

export default function WorkflowListPage() {
  const { companyId: companyIdRaw } = useParams();
  const companyId = (companyIdRaw || "").trim();
  const navigate = useNavigate();
  const [items, setItems] = useState<WorkflowVm[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  if (!companyId) return <NotFound />;

  const load = async () => {
    setLoading(true);
    try {
      const data = await getWorkflows(companyId);
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this workflow?")) return;
    await deleteWorkflow(companyId, id);
    await load();
  };

  const filtered = keyword
    ? items.filter(x => x.name.toLowerCase().includes(keyword.toLowerCase()))
    : items;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Workflows</div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
          >
            Refresh
          </button>
          <Link
            to={`/companies/${companyId}/workflows/new`}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Create new
          </Link>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          className="border rounded-lg px-3 py-2 w-[320px]"
          placeholder="Search workflow..."
          value={keyword}
          onChange={(e)=>setKeyword(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500">No workflows.</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">ID</th>
                <th className="px-3 py-2 w-48">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => (
                <tr key={w.id} className="border-t">
                  <td className="px-3 py-2">{w.name}</td>
                  <td className="px-3 py-2 text-gray-500">{w.id}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2 justify-end">
                      <Link
                        to={`/companies/${companyId}/workflows/${w.id}`}
                        className="px-2 py-1 rounded border hover:bg-gray-50"
                        title="Open designer"
                      >
                        Open
                      </Link>
                      <button
                        className="px-2 py-1 rounded border text-red-600 hover:bg-red-50"
                        onClick={()=>handleDelete(w.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
