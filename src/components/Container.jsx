import React from "react"

export default function Container({ children, className = "", as = "div" }) {
  const Component = as
  return (
    <Component className={`container mx-auto px-4 max-w-6xl ${className}`}>
      {children}
    </Component>
  )
}