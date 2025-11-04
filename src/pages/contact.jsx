import React from "react";

export default function Contact() {
  return (
    <div className="min-h-screen page-container text-center overflow-x-hidden py-6 sm:py-8 lg:py-12 mobile-container">
      {/* MOBILE-FIRST: Enhanced contact form */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl mb-3 sm:mb-4 px-3 sm:px-0 font-bold text-gray-900 dark:text-white">Contact Us</h1>
      <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-6 sm:mb-8 text-sm sm:text-base px-3 sm:px-4">
        Have questions, feedback, or partnership ideas? We'd love to hear from
        you!
      </p>
      {/* MOBILE-FIRST: Enhanced form with proper mobile inputs */}
      <form className="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-2xl shadow-md max-w-md mx-3 sm:mx-auto space-y-4 sm:space-y-5">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">Your Name</label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            placeholder="Enter your name"
            className="w-full min-h-[44px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">Your Email</label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            className="w-full min-h-[44px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">Your Message</label>
          <textarea
            id="contact-message"
            placeholder="Enter your message"
            rows="5"
            className="w-full min-h-[120px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base resize-y dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full min-h-[48px] bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 font-semibold text-base transition-colors duration-200 touch-manipulation active:scale-95 shadow-lg"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}
