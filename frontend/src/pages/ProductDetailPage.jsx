/**
 * ProductDetailPage – full product view with quantity selector, add-to-cart, and details.
 */
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await productsAPI.getProduct(id);
        setProduct(res.data);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      setAdding(true);
      setError('');
      await addToCart(product.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.quantity?.[0] || 'Could not add to cart.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-md-5">
            <div className="placeholder-image-lg placeholder rounded-3"></div>
          </div>
          <div className="col-md-7">
            <div className="placeholder col-3 mb-2"></div>
            <div className="placeholder col-8 fs-3 mb-3"></div>
            <div className="placeholder col-4 mb-3"></div>
            <div className="placeholder col-12 mb-1"></div>
            <div className="placeholder col-12 mb-1"></div>
            <div className="placeholder col-9 mb-4"></div>
            <div className="placeholder col-6 placeholder-btn"></div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-bag-x fs-1 text-muted"></i>
        <h3 className="mt-3">Product Not Found</h3>
        <p className="text-muted">This product doesn't exist or is no longer available.</p>
        <Link to="/products" className="btn btn-primary">Browse Products</Link>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const maxQty = Math.min(product.stock, 10);

  return (
    <div className="product-detail-page py-4">
      <div className="container">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/products">Products</Link></li>
            {product.category_name && (
              <li className="breadcrumb-item">
                <Link to={`/products?category=${product.category}`}>{product.category_name}</Link>
              </li>
            )}
            <li className="breadcrumb-item active text-truncate" style={{ maxWidth: '200px' }}>
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="row g-4 align-items-start">
          {/* Product Image */}
          <div className="col-md-5">
            <div className="product-detail-image-wrap">
              {product.image ? (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL}${product.image}`}
                  alt={product.name}
                  className="img-fluid rounded-3 w-100"
                />
              ) : (
                <div className="product-detail-placeholder d-flex flex-column align-items-center justify-content-center rounded-3">
                  <i className="bi bi-bag-heart" style={{ fontSize: '6rem', color: '#6366f1' }}></i>
                  <p className="text-muted mt-2">{product.name}</p>
                </div>
              )}
              {product.discount_percentage > 0 && (
                <span className="discount-badge-lg">{product.discount_percentage}% OFF</span>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="col-md-7">
            <span className="badge bg-primary-subtle text-primary mb-2">{product.category_name}</span>
            <h1 className="product-detail-title">{product.name}</h1>

            {/* Price */}
            <div className="product-detail-pricing mb-3">
              <span className="detail-price">₹{Number(product.effective_price).toLocaleString('en-IN')}</span>
              {product.discount_price && (
                <>
                  <span className="detail-original ms-3">₹{Number(product.price).toLocaleString('en-IN')}</span>
                  <span className="ms-2 badge bg-success">{product.discount_percentage}% off</span>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-3">
              {isOutOfStock ? (
                <span className="badge bg-danger-subtle text-danger fs-6">
                  <i className="bi bi-x-circle me-1"></i>Out of Stock
                </span>
              ) : product.stock <= 5 ? (
                <span className="badge bg-warning-subtle text-warning fs-6">
                  <i className="bi bi-exclamation-triangle me-1"></i>Only {product.stock} left!
                </span>
              ) : (
                <span className="badge bg-success-subtle text-success fs-6">
                  <i className="bi bi-check-circle me-1"></i>In Stock ({product.stock} available)
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="product-description mb-4">
                <h6 className="fw-semibold mb-2">About this product</h6>
                <p className="text-muted">{product.description}</p>
              </div>
            )}

            {/* Quantity Selector + Add to Cart */}
            {!isOutOfStock && (
              <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
                <div className="quantity-control">
                  <label className="small text-muted mb-1 d-block">Quantity</label>
                  <div className="input-group quantity-input-group">
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <input
                      type="number"
                      className="form-control text-center"
                      value={quantity}
                      min={1}
                      max={maxQty}
                      onChange={(e) => setQuantity(Math.min(maxQty, Math.max(1, Number(e.target.value))))}
                      aria-label="Quantity"
                      id="quantity-input"
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                      disabled={quantity >= maxQty}
                      aria-label="Increase quantity"
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                </div>

                <div className="flex-grow-1">
                  <label className="small text-muted mb-1 d-block">&nbsp;</label>
                  <button
                    className={`btn w-100 btn-lg ${added ? 'btn-success' : 'btn-primary'}`}
                    onClick={handleAddToCart}
                    disabled={adding}
                    id="add-to-cart-detail-btn"
                  >
                    {adding ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : added ? (
                      <><i className="bi bi-check-circle me-2"></i>Added to Cart!</>
                    ) : (
                      <><i className="bi bi-cart-plus me-2"></i>Add to Cart</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger py-2 mb-3">
                <i className="bi bi-exclamation-triangle me-2"></i>{error}
              </div>
            )}

            {added && (
              <div className="alert alert-success py-2 mb-3 d-flex justify-content-between align-items-center">
                <span><i className="bi bi-check-circle me-2"></i>Added to cart successfully!</span>
                <Link to="/cart" className="btn btn-sm btn-success">View Cart</Link>
              </div>
            )}

            {/* Features */}
            <div className="product-features mt-4">
              <div className="row g-2">
                {[
                  { icon: 'bi-shield-check', text: 'Genuine Product' },
                  { icon: 'bi-truck', text: 'Fast Delivery' },
                  { icon: 'bi-arrow-repeat', text: 'Easy Returns' },
                  { icon: 'bi-lock', text: 'Secure Payment' },
                ].map((f) => (
                  <div key={f.text} className="col-6">
                    <div className="feature-pill d-flex align-items-center gap-2">
                      <i className={`bi ${f.icon} text-primary`}></i>
                      <span className="small">{f.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
