import React, { createContext, useContext, useState } from "react"

const CartContext = createContext()

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  function add(item) {
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id)
      if (found) return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + 1 } : p))
      return [...prev, { ...item, qty: 1 }]
    })
  }

  function remove(id) {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }

  function clear() {
    setItems([])
  }

  const count = items.reduce((s, i) => s + (i.qty || 0), 0)

  return <CartContext.Provider value={{ items, add, remove, clear, count }}>{children}</CartContext.Provider>
}

export function useCart() { return useContext(CartContext) }