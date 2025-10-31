import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

const PostLoginHandler = () => {
  const { user, loading } = useAuth();
  const { addToCart, addToWishlist } = useCart();
  const navigate = useNavigate();
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    // Only process if user is loaded and we haven't processed yet
    if (user && !loading && !hasProcessed) {
      setHasProcessed(true);
      
      // User just logged in, check for pending actions
      const authAction = sessionStorage.getItem('authAction');
      const authRedirect = sessionStorage.getItem('authRedirect');
      
      console.log('PostLoginHandler: User logged in, checking pending actions:', { authAction, authRedirect });
      
      // Process pending actions with a delay to ensure cart context is ready
      setTimeout(() => {
        if (authAction === 'add_to_cart') {
          const pendingCartItem = sessionStorage.getItem('pendingCartItem');
          if (pendingCartItem) {
            try {
              const { product, quantity, selectedColor, selectedSize } = JSON.parse(pendingCartItem);
              console.log('PostLoginHandler: Processing pending cart item:', product.name);
              addToCart(product, quantity, selectedColor, selectedSize);
              sessionStorage.removeItem('pendingCartItem');
            } catch (error) {
              console.error('Error processing pending cart item:', error);
            }
          }
        } else if (authAction === 'add_to_wishlist') {
          const pendingWishlistItem = sessionStorage.getItem('pendingWishlistItem');
          if (pendingWishlistItem) {
            try {
              const { product } = JSON.parse(pendingWishlistItem);
              console.log('PostLoginHandler: Processing pending wishlist item:', product.name);
              addToWishlist(product);
              sessionStorage.removeItem('pendingWishlistItem');
            } catch (error) {
              console.error('Error processing pending wishlist item:', error);
            }
          }
        }
        
        // Clear auth action and redirect if needed
        if (authAction) {
          sessionStorage.removeItem('authAction');
          if (authRedirect && authRedirect !== window.location.pathname) {
            console.log('PostLoginHandler: Redirecting to:', authRedirect);
            navigate(authRedirect);
          }
          sessionStorage.removeItem('authRedirect');
        }
      }, 1000); // Wait 1 second for cart context to be ready
    }
  }, [user, loading, hasProcessed, addToCart, addToWishlist, navigate]);

  return null; // This component doesn't render anything
};

export default PostLoginHandler;
