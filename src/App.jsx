function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">Neweco</h1>
        <nav className="space-x-4">
          <a href="#" className="text-gray-600 hover:text-blue-600">Home</a>
          <a href="#" className="text-gray-600 hover:text-blue-600">Products</a>
          <a href="#" className="text-gray-600 hover:text-blue-600">Contact</a>
        </nav>
      </header>

      <main className="p-10 text-center">
        <h2 className="text-4xl font-semibold mb-4">Welcome to Neweco 🌍</h2>
        <p className="text-gray-600">Your eco-friendly online marketplace built with modern web tech.</p>
      </main>
    </div>
  )
}

export default App
