import React from "react"
import AuthForm from "../components/AuthForm"

export default function Auth() {
  function handleSubmit(data) { console.log("Auth submit", data) }
  return (
    <div className="max-w-lg mx-auto">
      <AuthForm mode="login" onSubmit={handleSubmit} />
    </div>
  )
}
