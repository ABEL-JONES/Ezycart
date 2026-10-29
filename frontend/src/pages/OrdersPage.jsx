/**
 * OrdersPage – list of all the user's orders.
 */
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ordersAPI } from '../services/api';

const STATUS_COLORS = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'primary',
  shipped: 'secondary',
  delivered: 'success',
  cancelled: 'danger',
};

const PAYMENT_COLORS = {
  unpaid: 'danger',
  paid: 'success',
  failed: 'danger',
  refunded: 'secondary',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    ordersAPI.getOrders()
      .then((r) => setOrders(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-page py-4">
      <div className="container">
        <div className="page-header mb-4">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item active">My Orders</li>
            </ol>
          </nav>
          <h1 className="page-title">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state text-center py-5">
            <i className="bi bi-bag fs-1 text-muted"></i>
            <h4 className="mt-3">No orders yet</h4>
            <p className="text-muted">You haven't placed any orders. Start shopping!</p>
            <Link to="/products" className="btn btn-primary">
              <i className="bi bi-bag me-2"></i>Shop Now
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <div className="order-id">Order #{order.id}</div>
                    <div className="order-date text-muted small">
                      <i className="bi bi-calendar me-1"></i>
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </div>
                  </div>
                  <div className="d-flex gap-2 align-items-center flex-wrap">
                    <span className={`badge bg-${STATUS_COLORS[order.status] || 'secondary'}-subtle text-${STATUS_COLORS[order.status] || 'secondary'} border border-${STATUS_COLORS[order.status] || 'secondary'}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <span className={`badge bg-${PAYMENT_COLORS[order.payment_status] || 'secondary'}`}>
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="order-card-body">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <span className="text-muted small">{order.item_count} item{order.item_count !== 1 ? 's' : ''}</span>
                      <span className="mx-2 text-muted">•</span>
                      <span className="text-muted small">{order.payment_method === 'razorpay' ? 'Razorpay' : 'Cash on Delivery'}</span>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <div className="order-total">₹{Number(order.total_amount).toLocaleString('en-IN')}</div>
                      <Link to={`/orders/${order.id}`} className="btn btn-outline-primary btn-sm" id={`view-order-${order.id}`}>
                        <i className="bi bi-eye me-1"></i>View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
