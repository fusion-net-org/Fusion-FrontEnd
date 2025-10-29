import React, { useEffect, useRef } from "react";
import { Globe, Download, ShoppingCart, TrendingUp, Users2, Undo2 } from "lucide-react";
import Chart from "chart.js/auto";

/* ---------- Small KPI card ---------- */
function KPI({
  icon: Icon,
  value,
  label,
}: {
  icon: any;
  value: string;
  label: string;
}) {
  return (
    <div className="kpi">
      <div className="ico">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xl font-semibold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

/* ---------- Helper to make gradient fill ---------- */
function makeVioletGradient(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  g.addColorStop(0, "rgba(124, 58, 237, 0.45)"); // #7c3aed
  g.addColorStop(1, "rgba(255, 255, 255, 1)");
  return g;
}

export default function AdminDashboardPage() {
  // Refs cho 3 chart
  const conversionRef = useRef<HTMLCanvasElement | null>(null);
  const ordersRef = useRef<HTMLCanvasElement | null>(null);
  const bigRef = useRef<HTMLCanvasElement | null>(null);

  // Instances để destroy an toàn
  const chartsRef = useRef<{ conversion?: Chart; orders?: Chart; big?: Chart }>({});

  useEffect(() => {
    // ===== Conversion (Line + area fill) =====
    if (conversionRef.current) {
      const ctx = conversionRef.current.getContext("2d")!;
      const gradient = makeVioletGradient(ctx);

      chartsRef.current.conversion = new Chart(ctx, {
        type: "line",
        data: {
          labels: ["2016", "2017", "2018"],
          datasets: [
            {
              label: "Conversion",
              data: [41.2, 46.8, 53.94],
              fill: true,
              backgroundColor: gradient,
              borderColor: "#7c3aed",
              borderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 4,
              tension: 0.35,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label(ctx) {
                  const v = ctx.parsed.y;
                  return ` ${v?.toFixed(2)}%`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: "#6b7280" },
            },
            y: {
              grid: { color: "rgba(124,58,237,0.08)" },
              ticks: {
                color: "#6b7280",
                callback: (v) => `${v}%`,
              },
              beginAtZero: true,
              suggestedMax: 60,
            },
          },
          elements: { line: { borderJoinStyle: "round" } },
        },
      });
    }

    // ===== Orders (Spark bars) =====
    if (ordersRef.current) {
      const ctx = ordersRef.current.getContext("2d")!;
      // 28 bars (giữ logic biến thiên nhẹ như bản cũ)
      const bars = Array.from({ length: 28 }).map((_, i) => 22 + ((i * 7) % 60));
      chartsRef.current.orders = new Chart(ctx, {
        type: "bar",
        data: {
          labels: bars.map((_, i) => `D${i + 1}`),
          datasets: [
            {
              label: "Orders",
              data: bars,
              backgroundColor: "rgba(124, 58, 237, 0.8)",
              borderRadius: 6,
              barPercentage: 0.55,
              categoryPercentage: 0.9,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: true } },
          scales: {
            x: { display: false, grid: { display: false } },
            y: { display: false, grid: { display: false }, beginAtZero: true },
          },
        },
      });
    }

    // ===== Big Chart (Combo: Bars + Line) =====
    if (bigRef.current) {
      const ctx = bigRef.current.getContext("2d")!;
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const barData = [24, 28, 32, 36, 30, 26, 62, 38, 34, 29, 33, 28]; // giữ “đột biến” tại Jul như UI cũ
      const lineData = [20, 24, 29, 33, 28, 25, 40, 35, 30, 27, 31, 26];

      chartsRef.current.big = new Chart(ctx, {
        data: {
          labels: months,
          datasets: [
            {
              type: "bar",
              label: "Monthly Sales (Bar)",
              data: barData,
              backgroundColor: "rgba(124, 58, 237, 0.80)",
              borderRadius: 10,
              barPercentage: 0.55,
              categoryPercentage: 0.8,
            },
            {
              type: "line",
              label: "Trend (Line)",
              data: lineData,
              borderColor: "#7c3aed",
              borderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 4,
              tension: 0.35,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: "index",
              intersect: false,
              callbacks: {
                label(ctx) {
                  const v = ctx.parsed.y;
                  return ` ${ctx.dataset.type === "bar" ? "Sales" : "Trend"}: $${(v * 1000).toFixed(0)}`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: "#6b7280" },
            },
            y: {
              grid: { color: "rgba(124,58,237,0.08)" },
              ticks: {
                color: "#6b7280",
                callback: (v) => `$${Number(v) * 1000}`,
              },
              beginAtZero: true,
              suggestedMax: 70,
            },
          },
        },
      });
    }

    // Cleanup
    return () => {
      chartsRef.current.conversion?.destroy();
      chartsRef.current.orders?.destroy();
      chartsRef.current.big?.destroy();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* KPIs: sm=2, lg=3, xl=6 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPI icon={Users2} value="1000" label="Customers" />
        <KPI icon={Globe} value="1252" label="Revenue" />
        <KPI icon={TrendingUp} value="600" label="Growth" />
        <KPI icon={Undo2} value="3550" label="Returns" />
        <KPI icon={Download} value="3550" label="Downloads" />
        <KPI icon={ShoppingCart} value="100%" label="Order" />
      </div>

      {/* Conversion + Orders + Big Chart */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.4fr]">
        {/* Conversion */}
        <div className="admin-card p-4">
          <div className="text-violet-600 text-2xl font-semibold">53.94%</div>
          <div className="text-slate-600 text-sm">Conversion Rate</div>
          <p className="mt-1 text-slate-500 text-sm">
            Number of conversions divided by the total visitors.
          </p>
          <div
            className="mt-4 h-28 rounded-xl relative overflow-hidden"
            style={{ background: "linear-gradient(180deg,var(--violet-100),#fff)" }}
          >
            <canvas ref={conversionRef} className="absolute inset-0" />
          </div>
          <div className="mt-2 flex justify-between text-xs text-violet-700">
            <span>2016</span>
            <span>2017</span>
            <span>2018</span>
          </div>
        </div>

        {/* Orders */}
        <div className="admin-card p-4">
          <div className="text-2xl font-semibold">1432</div>
          <div className="text-violet-600 text-sm">Order Delivered</div>
          <p className="mt-1 text-slate-500 text-sm">
            Number of conversions divided by the total visitors.
          </p>
          <div className="mt-4 h-28 relative">
            <canvas ref={ordersRef} className="absolute inset-0" />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>May</span>
            <span>June</span>
            <span>July</span>
          </div>
        </div>

        {/* Big Chart */}
        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-900 font-medium">
                Department wise monthly sales report
              </div>
              <div className="mt-2 text-2xl font-semibold">$21,356.46</div>
              <div className="text-slate-500 text-sm">
                Total Sales · <span className="font-medium">$1935.6</span> Average
              </div>
            </div>
            <div className="text-slate-400 text-sm hidden md:block">Jan → Dec</div>
          </div>
          <div
            className="mt-4 h-48 relative rounded-xl overflow-hidden"
            style={{ background: "linear-gradient(180deg,var(--violet-50),#fff)" }}
          >
            <canvas ref={bigRef} className="absolute inset-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
