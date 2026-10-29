/**
 * CartPage – view, update, and remove cart items.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function CartItemRow({ item, onUpdate, onRemove }) {
  const [qty, setQty] = useState(item.quantity);
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleQtyChange = async (newQty) => {
    if (newQty < 1 || newQty > item.product_detail.stock) return;
    setQty(newQty);
    try {
      setUpdating(true);
      await onUpdate(item.id, newQty);
    } catch {
      setQty(item.quantity); // revert on error
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    try {
      setRemoving(true);
      await onRemove(item.id);
    } finally {
      setRemoving(false);
    }
  };

  const product = item.product_detail;
  const bgColors = ['#6366f122', '#8b5cf622', '#06b6d422', '#10b98122', '#f59e0b22'];
  const bg = bgColors[product.id % bgColors.length];

  return (
    <div className="cart-item-row">
      <div className="cart-item-image" style={{ background: bg }}>
        {product.image ? (
          <img src={`${import.meta.env.VITE_API_BASE_URL}${product.image}`} alt={product.name} />
        ) : (
          <i className="bi bi-bag-heart fs-2 text-primary"></i>
        )}
      </div>
      <div className="cart-item-info flex-grow-1">
        <Link to={`/products/${product.id}`} className="cart-item-name">{product.name}</Link>
        <div className="cart-item-category">{product.category_name}</div>
        <div className="cart-item-price">₹{Number(product.effective_price).toLocaleString('en-IN')}</div>
      </div>
      <div className="cart-item-controls">
        <div className="quantity-input-group input-group input-group-sm">
          <button
            className="btn btn-outline-secondary"
            onClick={() => handleQtyChange(qty - 1)}
            disabled={qty <= 1 || updating}
            aria-label="Decrease"
          ><i className="bi bi-dash"></i></button>
          <input
            type="number"
            className="form-control text-center"
            value={qty}
            min={1}
            max={product.stock}
            onChange={(e) => handleQtyChange(Number(e.target.value))}
            style={{ width: '55px' }}
          />
          <button
            className="btn btn-outline-secondary"
            onClick={() => handleQtyChange(qty + 1)}
            disabled={qty >= product.stock || updating}
            aria-label="Increase"
          ><i className="bi bi-plus"></i></button>
        </div>
      </div>
      <div className="cart-item-subtotal">
        {updating ? (
          <span className="spinner-border spinner-border-sm text-primary"></span>
        ) : (
          <span>₹{Number(item.subtotal).toLocaleString('en-IN')}</span>
        )}
      </div>
      <div className="cart-item-remove">
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={handleRemove}
          disabled={removing}
          aria-label="Remove item"
          id={`remove-item-${item.id}`}
        >
          {removing ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-trash3"></i>}
        </button>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { cart, loading, updateCartItem, removeCartItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-cart-x fs-1 text-muted"></i>
        <h3 className="mt-3">Please log in to view your cart</h3>
        <Link to="/login" className="btn btn-primary mt-2">Sign In</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading cart...</span>
        </div>
        <p className="mt-2 text-muted">Loading your cart...</p>
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-cart fs-1 text-muted" style={{ fontSize: '5rem' }}></i>
        <h3 className="mt-3">Your cart is empty</h3>
        <p className="text-muted">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn btn-primary btn-lg mt-2" id="continue-shopping-empty">
          <i className="bi bi-bag me-2"></i>Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page py-4">
      <div className="container">
        <div className="page-header mb-4">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item active">Cart</li>
            </ol>
          </nav>
          <h1 className="page-title">
            Shopping Cart
            <span className="badge bg-primary ms-2 fs-6">{cart.item_count} item{cart.item_count !== 1 ? 's' : ''}</span>
          </h1>
        </div>

        <div className="row g-4 align-items-start">
          {/* Cart Items */}
          <div className="col-lg-8">
            <div className="cart-items-card">
              <div className="cart-header d-none d-md-flex">
                <span className="flex-grow-1">Product</span>
                <span style={{ width: '120px' }} className="text-center">Quantity</span>
                <span style={{ width: '100px' }} className="text-end">Subtotal</span>
                <span style={{ width: '50px' }}></span>
              </div>
              {cart.items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdate={updateCartItem}
                  onRemove={removeCartItem}
                />
              ))}
            </div>

            <div className="d-flex justify-content-between mt-3">
              <Link to="/products" className="btn btn-outline-primary" id="continue-shopping-btn">
                <i className="bi bi-arrow-left me-2"></i>Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="col-lg-4">
            <div className="order-summary-card">
              <h5 className="summary-title">Order Summary</h5>

              <div className="summary-rows">
                <div className="summary-row">
                  <span>Subtotal ({cart.item_count} items)</span>
                  <span>₹{Number(cart.total).toLocaleString('en-IN')}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery</span>
                  <span className="text-success">FREE</span>
                </div>
              </div>
              <hr />
              <div className="summary-total">
                <span>Total</span>
                <span className="total-amount">₹{Number(cart.total).toLocaleString('en-IN')}</span>
              </div>

              <button
                className="btn btn-primary w-100 btn-lg mt-3"
                onClick={() => navigate('/checkout')}
                id="proceed-checkout-btn"
              >
                <i className="bi bi-credit-card me-2"></i>Proceed to Checkout
              </button>

              <div className="secure-badges mt-3 text-center">
                <i className="bi bi-shield-check text-success me-1"></i>
                <small className="text-muted">Secure checkout • Encrypted payment</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
