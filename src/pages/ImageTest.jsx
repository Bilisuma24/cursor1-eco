import React from 'react';
import { useParams } from 'react-router-dom';
import ProductDetail from './ProductDetail';

export default function ImageTest() {
  const { id } = useParams();
  
  // If no ID provided, redirect to first product with multiple images
  if (!id) {
    window.location.href = '/image-test/1';
    return null;
  }
  
  return <ProductDetail />;
}