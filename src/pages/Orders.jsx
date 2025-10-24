import React from "react"

export default function Orders() {
  const [orders] = React.useState([
    { id: "ord_1", total: 4598, status: "Delivered", created_at: "2025-09-30" },
    { id: "ord_2", total: 1999, status: "Processing", created_at: "2025-10-03" },
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-4">Orders</h1>
      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-lg transition">
            <div>
              <div className="font-semibold text-siteText">Order #{o.id}</div>
              <div className="text-sm text-gray-600">Placed {o.created_at}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-primary">${(o.total/100).toFixed(2)}</div>
              <div className="text-sm text-gray-600">{o.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}