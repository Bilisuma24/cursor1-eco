import React from "react";

export default function Contact() {
  return (
    <div className="page-container text-center">
      <h1 className="text-4xl mb-4">Contact Us</h1>
      <p className="text-gray-600 max-w-xl mx-auto mb-8">
        Have questions, feedback, or partnership ideas? We’d love to hear from
        you!
      </p>
      <form className="bg-white p-8 rounded-2xl shadow-md max-w-md mx-auto space-y-4">
        <input
          type="text"
          placeholder="Your Name"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        />
        <input
          type="email"
          placeholder="Your Email"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        />
        <textarea
          placeholder="Your Message"
          rows="4"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        ></textarea>
        <button
          type="submit"
          className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 font-semibold"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}
