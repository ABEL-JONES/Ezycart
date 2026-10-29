/**
 * CheckoutPage – collect delivery details and initiate Razorpay payment.
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ordersAPI, paymentsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-sdk')) { resolve(true); return; }
    const script = document.createElement('script');
    script.id = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { cart, clearLocalCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    notes: '',
    payment_method: 'razorpay',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=details, 2=payment

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required.';
    if (!form.phone.trim()) e.phone = 'Phone number is required.';
    if (!form.address_line1.trim()) e.address_line1 = 'Address is required.';
    if (!form.city.trim()) e.city = 'City is required.';
    if (!form.state.trim()) e.state = 'State is required.';
    if (!form.postal_code.trim()) e.postal_code = 'Postal code is required.';
    return e;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return; }

    try {
      setLoading(true);
      setErrors({});

      // Step 1: Create order on backend
      const checkoutRes = await ordersAPI.checkout(form);
      const order = checkoutRes.data.order;

      if (form.payment_method === 'cod') {
        clearLocalCart();
        navigate(`/orders/${order.id}`, { state: { success: true } });
        return;
      }

      // Step 2: Initiate Razorpay payment
      const payRes = await paymentsAPI.createOrder({ order_id: order.id });
      const payData = payRes.data;

      if (payData.dev_mode) {
        // DEV MODE: show modal instead of real Razorpay
        const confirmed = window.confirm(
          `[DEV MODE] Razorpay not configured.\n\nOrder #${order.id} created.\nAmount: ₹${Number(order.total_amount).toLocaleString('en-IN')}\n\nSimulate payment success? (Click OK to confirm, Cancel to skip)`
        );
        if (confirmed) {
          await paymentsAPI.verifyPayment({
            razorpay_order_id: payData.razorpay_order_id,
            razorpay_payment_id: 'pay_DEV_mock',
            razorpay_signature: 'sig_DEV_mock',
          });
          clearLocalCart();
          navigate(`/orders/${order.id}`, { state: { success: true } });
        } else {
          navigate(`/orders/${order.id}`);
        }
        return;
      }

      // Production Razorpay Checkout
      const options = {
        key: payData.key_id,
        amount: payData.amount,
        currency: payData.currency,
        name: 'EzyCart',
        description: `Order #${order.id}`,
        order_id: payData.razorpay_order_id,
        prefill: {
          name: form.full_name,
          contact: form.phone,
          email: user?.email || '',
        },
        theme: { color: '#6366f1' },
        handler: async (response) => {
          try {
            await paymentsAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            clearLocalCart();
            navigate(`/orders/${order.id}`, { state: { success: true } });
          } catch {
            navigate(`/orders/${order.id}`, { state: { paymentFailed: true } });
          }
        },
        modal: {
          ondismiss: () => {
            navigate(`/orders/${order.id}`);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      const data = err.response?.data || {};
      if (Array.isArray(data.errors)) {
        setErrors({ general: data.errors.join(' ') });
      } else {
        const fieldErrors = {};
        Object.entries(data).forEach(([k, v]) => {
          fieldErrors[k] = Array.isArray(v) ? v[0] : v;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!cart.items?.length) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-cart-x fs-1 text-muted"></i>
        <h3 className="mt-3">Your cart is empty</h3>
        <Link to="/products" className="btn btn-primary mt-2">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page py-4">
      <div className="container">
        <div className="page-header mb-4">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item"><Link to="/cart">Cart</Link></li>
              <li className="breadcrumb-item active">Checkout</li>
            </ol>
          </nav>
          <h1 className="page-title">Checkout</h1>
        </div>

        <form onSubmit={handlePlaceOrder} noValidate id="checkout-form">
          <div className="row g-4 align-items-start">
            {/* Delivery Details */}
            <div className="col-lg-7">
              <div className="checkout-card">
                <h5 className="card-section-title">
                  <i className="bi bi-geo-alt me-2 text-primary"></i>Delivery Details
                </h5>

                {errors.general && (
                  <div className="alert alert-danger mb-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>{errors.general}
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="chk-full-name">Full Name *</label>
                    <input id="chk-full-name" type="text" name="full_name" className={`form-control ${errors.full_name ? 'is-invalid' : ''}`} value={form.full_name} onChange={handleChange} placeholder="John Doe" />
                    {errors.full_name && <div className="invalid-feedback">{errors.full_name}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="chk-phone">Phone Number *</label>
                    <input id="chk-phone" type="tel" name="phone" className={`form-control ${errors.phone ? 'is-invalid' : ''}`} value={form.phone} onChange={handleChange} placeholder="9876543210" />
                    {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="chk-addr1">Address Line 1 *</label>
                    <input id="chk-addr1" type="text" name="address_line1" className={`form-control ${errors.address_line1 ? 'is-invalid' : ''}`} value={form.address_line1} onChange={handleChange} placeholder="Flat/House no, Street name" />
                    {errors.address_line1 && <div className="invalid-feedback">{errors.address_line1}</div>}
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="chk-addr2">Address Line 2 <span className="text-muted small">(Optional)</span></label>
                    <input id="chk-addr2" type="text" name="address_line2" className="form-control" value={form.address_line2} onChange={handleChange} placeholder="Landmark, locality" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="chk-city">City *</label>
                    <input id="chk-city" type="text" name="city" className={`form-control ${errors.city ? 'is-invalid' : ''}`} value={form.city} onChange={handleChange} placeholder="Mumbai" />
                    {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="chk-state">State *</label>
                    <input id="chk-state" type="text" name="state" className={`form-control ${errors.state ? 'is-invalid' : ''}`} value={form.state} onChange={handleChange} placeholder="Maharashtra" />
                    {errors.state && <div className="invalid-feedback">{errors.state}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="chk-postal">Postal Code *</label>
                    <input id="chk-postal" type="text" name="postal_code" className={`form-control ${errors.postal_code ? 'is-invalid' : ''}`} value={form.postal_code} onChange={handleChange} placeholder="400001" />
                    {errors.postal_code && <div className="invalid-feedback">{errors.postal_code}</div>}
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="chk-notes">Order Notes <span className="text-muted small">(Optional)</span></label>
                    <textarea id="chk-notes" name="notes" className="form-control" rows={2} value={form.notes} onChange={handleChange} placeholder="Special delivery instructions..."></textarea>
                  </div>
                </div>

                {/* Payment Method */}
                <hr className="my-4" />
                <h5 className="card-section-title">
                  <i className="bi bi-credit-card me-2 text-primary"></i>Payment Method
                </h5>
                <div className="payment-options d-flex gap-3 flex-wrap">
                  <label className={`payment-option ${form.payment_method === 'razorpay' ? 'active' : ''}`}>
                    <input type="radio" name="payment_method" value="razorpay" checked={form.payment_method === 'razorpay'} onChange={handleChange} className="visually-hidden" id="pay-razorpay" />
                    <i className="bi bi-phone fs-4 text-primary"></i>
                    <div>
                      <div className="fw-semibold">Razorpay</div>
                      <div className="small text-muted">UPI, Cards, Wallets</div>
                    </div>
                  </label>
                  <label className={`payment-option ${form.payment_method === 'cod' ? 'active' : ''}`}>
                    <input type="radio" name="payment_method" value="cod" checked={form.payment_method === 'cod'} onChange={handleChange} className="visually-hidden" id="pay-cod" />
                    <i className="bi bi-cash-stack fs-4 text-success"></i>
                    <div>
                      <div className="fw-semibold">Cash on Delivery</div>
                      <div className="small text-muted">Pay when it arrives</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="col-lg-5">
              <div className="order-summary-card">
                <h5 className="summary-title">Order Summary</h5>
                <div className="order-items-list mb-3">
                  {cart.items.map((item) => (
                    <div key={item.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <div>
                        <div className="fw-medium small">{item.product_detail.name}</div>
                        <div className="text-muted small">Qty: {item.quantity}</div>
                      </div>
                      <span className="fw-semibold">₹{Number(item.subtotal).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
                <div className="summary-rows">
                  <div className="summary-row">
                    <span>Subtotal</span>
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
                  type="submit"
                  className="btn btn-primary w-100 btn-lg mt-3"
                  disabled={loading}
                  id="place-order-btn"
                >
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                  ) : form.payment_method === 'razorpay' ? (
                    <><i className="bi bi-shield-check me-2"></i>Pay ₹{Number(cart.total).toLocaleString('en-IN')}</>
                  ) : (
                    <><i className="bi bi-bag-check me-2"></i>Place Order</>
                  )}
                </button>

                <div className="text-center mt-2">
                  <small className="text-muted">
                    <i className="bi bi-lock-fill me-1"></i>
                    SSL encrypted & secure
                  </small>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
