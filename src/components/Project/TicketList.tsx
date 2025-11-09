// import React, { useEffect, useState } from 'react';
// import { Calendar, Clock, User, AlertTriangle } from 'lucide-react';

// export default function TicketList() {
//   const [tickets, setTickets] = useState([
//     {
//       id: '1',
//       title: 'Lỗi đăng nhập không hoạt động',
//       priority: 'High',
//       submitBy: 'tuongtan@example.com',
//       createdAt: '2025-11-06T14:32:00Z',
//       resultAt: '2025-11-07T09:12:00Z',
//       status: 'Resolved',
//     },
//     {
//       id: '2',
//       title: 'Không nhận được email xác nhận',
//       priority: 'Medium',
//       submitBy: 'linh@example.com',
//       createdAt: '2025-11-06T17:00:00Z',
//       resultAt: null,
//       status: 'Pending',
//     },
//   ]);

//   return (
//     <div className="p-6">
//       <h2 className="text-xl font-semibold mb-4">Ticket List</h2>
//       <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
//         <thead className="bg-gray-100 text-gray-700 text-left">
//           <tr>
//             <th className="px-4 py-2">#</th>
//             <th className="px-4 py-2">Title</th>
//             <th className="px-4 py-2">Priority</th>
//             <th className="px-4 py-2">Submit By</th>
//             <th className="px-4 py-2">Created At</th>
//             <th className="px-4 py-2">Result At</th>
//             <th className="px-4 py-2">Status</th>
//           </tr>
//         </thead>
//         <tbody>
//           {tickets.map((t, index) => (
//             <tr key={t.id} className="border-t hover:bg-gray-50">
//               <td className="px-4 py-2">{index + 1}</td>
//               <td className="px-4 py-2">{t.title}</td>
//               <td className="px-4 py-2 font-medium">
//                 <span
//                   className={`px-2 py-1 rounded-full text-xs ${
//                     t.priority === 'High'
//                       ? 'bg-red-100 text-red-600'
//                       : t.priority === 'Medium'
//                       ? 'bg-yellow-100 text-yellow-600'
//                       : 'bg-green-100 text-green-600'
//                   }`}
//                 >
//                   {t.priority}
//                 </span>
//               </td>
//               <td className="px-4 py-2 flex items-center gap-2">
//                 <User size={14} />
//                 {t.submitBy}
//               </td>
//               <td className="px-4 py-2 flex items-center gap-2">
//                 <Calendar size={14} />
//                 {new Date(t.createdAt).toLocaleString()}
//               </td>
//               <td className="px-4 py-2 flex items-center gap-2">
//                 {t.resultAt ? (
//                   <>
//                     <Clock size={14} />
//                     {new Date(t.resultAt).toLocaleString()}
//                   </>
//                 ) : (
//                   <span className="text-gray-400 italic">—</span>
//                 )}
//               </td>
//               <td className="px-4 py-2">{t.status}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }
