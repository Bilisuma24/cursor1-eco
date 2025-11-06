import React from "react";

export default function About() {
  return (
    <div className="page-container text-center overflow-x-hidden">
      {/* RESPONSIVE: Reduced padding and text sizes on mobile */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl mb-3 sm:mb-4 px-3 sm:px-0">About EcoStore</h1>
      <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg px-3 sm:px-4 leading-relaxed">
        At EcoStore, our mission is simple — to promote sustainable living by
        offering eco-friendly alternatives for everyday needs. We partner with
        ethical suppliers and aim to reduce plastic waste one product at a time.
      </p>
    </div>
  );
}
