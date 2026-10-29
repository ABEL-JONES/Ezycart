/**
 * OrderDetailPage – shows full order details, items, and payment status.
 */
import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { ordersAPI } from '../services/api';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_COLORS = {
  pending: 'warning', confirmed: 'info', processing: 'primary',
  shipped: 'secondary', delivered: 'success', cancelled: 'danger',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const paymentSuccess = location.state?.success;
  const paymentFailed = location.state?.paymentFailed;

  useEffect(() => {
    ordersAPI.getOrder(id)
      .then((r) => setOrder(r.data))
      .catch((err) => { if (err.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary"></div>
        <p className="mt-2 text-muted">Loading order details...</p>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-bag-x fs-1 text-muted"></i>
        <h3 className="mt-3">Order Not Found</h3>
        <Link to="/orders" className="btn btn-primary mt-2">My Orders</Link>
      </div>
    );
  }

  const statusIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="order-detail-page py-4">
      <div className="container">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/orders">My Orders</Link></li>
            <li className="breadcrumb-item active">Order #{order.id}</li>
          </ol>
        </nav>

        {/* Success/Fail alerts */}
        {paymentSuccess && (
          <div className="alert alert-success d-flex align-items-center gap-2 mb-4">
            <i className="bi bi-check-circle-fill fs-4"></i>
            <div>
              <strong>Payment Successful!</strong> Your order has been confirmed.
            </div>
          </div>
        )}
        {paymentFailed && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
            <i className="bi bi-exclamation-triangle-fill fs-4"></i>
            <div>
              <strong>Payment failed or was not verified.</strong> Please contact support if money was deducted.
            </div>
          </div>
        )}

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
          <div>
            <h1 className="page-title mb-1">Order #{order.id}</h1>
            <p className="text-muted mb-0">
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="d-flex gap-2">
            <span className={`badge bg-${STATUS_COLORS[order.status] || 'secondary'} fs-6`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            <span className={`badge ${order.payment_status === 'paid' ? 'bg-success' : 'bg-danger'} fs-6`}>
              {order.payment_status === 'paid' ? 'Paid' : order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
            </span>
          </div>
        </div>

        {/* Progress Tracker */}
        {!isCancelled && (
          <div className="order-progress mb-4">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className={`progress-step ${i <= statusIndex ? 'done' : ''} ${i === statusIndex ? 'current' : ''}`}>
                <div className="progress-dot">
                  {i <= statusIndex ? <i className="bi bi-check"></i> : <span>{i + 1}</span>}
                </div>
                <div className="progress-label">{step.charAt(0).toUpperCase() + step.slice(1)}</div>
                {i < STATUS_STEPS.length - 1 && <div className={`progress-line ${i < statusIndex ? 'done' : ''}`}></div>}
              </div>
            ))}
          </div>
        )}

        <div className="row g-4">
          {/* Order Items */}
          <div className="col-lg-8">
            <div className="checkout-card mb-4">
              <h5 className="card-section-title">
                <i className="bi bi-box me-2 text-primary"></i>Order Items
              </h5>
              {order.items.map((item) => (
                <div key={item.id} className="d-flex align-items-center gap-3 py-3 border-bottom">
                  <div className="order-item-icon">
                    <i className="bi bi-bag-heart text-primary fs-4"></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{item.product_name}</div>
                    <div className="text-muted small">₹{Number(item.unit_price).toLocaleString('en-IN')} × {item.quantity}</div>
                  </div>
                  <div className="fw-semibold">₹{Number(item.subtotal).toLocaleString('en-IN')}</div>
                </div>
              ))}
              <div className="d-flex justify-content-between pt-3 fw-bold fs-5">
                <span>Total</span>
                <span className="text-primary">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="checkout-card">
              <h5 className="card-section-title">
                <i className="bi bi-geo-alt me-2 text-primary"></i>Delivery Address
              </h5>
              <div className="address-block">
                <div className="fw-semibold">{order.full_name}</div>
                <div className="text-muted">{order.phone}</div>
                <div className="text-muted mt-1">
                  {order.address_line1}
                  {order.address_line2 && `, ${order.address_line2}`}
                </div>
                <div className="text-muted">{order.city}, {order.state} – {order.postal_code}</div>
                {order.notes && <div className="mt-2 text-muted fst-italic">Note: {order.notes}</div>}
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="col-lg-4">
            <div className="order-summary-card">
              <h5 className="summary-title">Payment Info</h5>
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Method</span>
                  <span>{order.payment_method === 'razorpay' ? 'Razorpay' : 'Cash on Delivery'}</span>
                </div>
                <div className="summary-row">
                  <span>Status</span>
                  <span className={`badge ${order.payment_status === 'paid' ? 'bg-success' : 'bg-danger'}`}>
                    {order.payment_status}
                  </span>
                </div>
                {order.razorpay_order_id && (
                  <div className="summary-row">
                    <span className="text-muted small">Razorpay ID</span>
                    <span className="text-muted small font-monospace">{order.razorpay_order_id.slice(0, 20)}...</span>
                  </div>
                )}
              </div>
              <hr />
              <div className="summary-total">
                <span>Total Paid</span>
                <span className="total-amount">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
              </div>
              <Link to="/orders" className="btn btn-outline-primary w-100 mt-3">
                <i className="bi bi-arrow-left me-2"></i>All Orders
              </Link>
              <Link to="/products" className="btn btn-primary w-100 mt-2">
                <i className="bi bi-bag me-2"></i>Shop Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
