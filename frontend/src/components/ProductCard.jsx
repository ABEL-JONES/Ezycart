/**
 * ProductCard – displays a single product in the grid.
 */
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PLACEHOLDER_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'
];

function getColor(id) {
  return PLACEHOLDER_COLORS[id % PLACEHOLDER_COLORS.length];
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      setAdding(true);
      setError('');
      await addToCart(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.quantity?.[0] || 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  const isOutOfStock = product.stock === 0;
  const bgColor = getColor(product.id);

  return (
    <div className="product-card h-100">
      <Link to={`/products/${product.id}`} className="text-decoration-none">
        <div className="product-image-container" style={{ background: `${bgColor}22` }}>
          {product.image ? (
            <img
              src={`${import.meta.env.VITE_API_BASE_URL}${product.image}`}
              alt={product.name}
              className="product-image"
              loading="lazy"
            />
          ) : (
            <div className="product-placeholder d-flex flex-column align-items-center justify-content-center" style={{ color: bgColor }}>
              <i className="bi bi-bag-heart fs-1 mb-1"></i>
              <small className="text-center px-2 opacity-75">{product.name.split(' ').slice(0, 3).join(' ')}</small>
            </div>
          )}
          {product.discount_percentage > 0 && (
            <span className="discount-badge">-{product.discount_percentage}%</span>
          )}
          {isOutOfStock && (
            <div className="out-of-stock-overlay">Out of Stock</div>
          )}
        </div>
      </Link>

      <div className="product-card-body">
        <div className="product-category">{product.category_name}</div>
        <Link to={`/products/${product.id}`} className="text-decoration-none">
          <h6 className="product-name">{product.name}</h6>
        </Link>
        <div className="product-pricing">
          <span className="product-price">₹{Number(product.effective_price).toLocaleString('en-IN')}</span>
          {product.discount_price && (
            <span className="product-original-price ms-2">₹{Number(product.price).toLocaleString('en-IN')}</span>
          )}
        </div>

        {error && <div className="alert alert-danger py-1 px-2 mt-2 small">{error}</div>}

        <button
          className={`btn w-100 mt-2 btn-add-cart ${added ? 'btn-success' : 'btn-primary'}`}
          onClick={handleAddToCart}
          disabled={isOutOfStock || adding}
          id={`add-to-cart-${product.id}`}
        >
          {adding ? (
            <span className="spinner-border spinner-border-sm me-1" role="status"></span>
          ) : added ? (
            <><i className="bi bi-check-circle me-1"></i>Added!</>
          ) : isOutOfStock ? (
            <>Out of Stock</>
          ) : (
            <><i className="bi bi-cart-plus me-1"></i>Add to Cart</>
          )}
        </button>
      </div>
    </div>
  );
}
