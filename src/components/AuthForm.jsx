import React from "react"

export default function AuthForm({ mode = "login", onSubmit }) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [name, setName] = React.useState("")

  return (
    <div className="max-w-md mx-auto">
      <div className="rounded-2xl overflow-hidden shadow-lg">
        <div className="p-8 bg-gradient-to-r from-primary to-accent">
          <h2 className="text-2xl font-semibold text-white">
            {mode === "login" ? "Sign in" : "Create account"}
          </h2>
          <p className="text-white/90 mt-2 text-sm">Quick and secure</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit?.({ name, email, password })
          }}
          className="bg-white p-6 space-y-4"
        >
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-full border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-accent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="mt-1 block w-full rounded-full border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-1 block w-full rounded-full border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-accent"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full py-2 bg-primary text-white font-semibold hover:brightness-110 transition"
          >
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  )
}
