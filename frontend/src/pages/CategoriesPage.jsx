/**
 * CategoriesPage – displays all product categories as browsable cards.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../services/api';

const CATEGORY_ICONS = {
  electronics: { icon: 'bi-cpu', color: '#6366f1' },
  clothing: { icon: 'bi-shirt', color: '#ec4899' },
  'home-kitchen': { icon: 'bi-house-heart', color: '#f59e0b' },
  books: { icon: 'bi-book', color: '#10b981' },
  'sports-fitness': { icon: 'bi-bicycle', color: '#06b6d4' },
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsAPI.getCategories()
      .then((r) => setCategories(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="categories-page py-5">
      <div className="container">
        <div className="page-header mb-5 text-center">
          <span className="section-badge">Explore</span>
          <h1 className="page-title">All Categories</h1>
          <p className="text-muted">Discover products across all categories</p>
        </div>

        {loading ? (
          <div className="row g-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="col-lg-4 col-md-6">
                <div className="placeholder-card p-4 text-center">
                  <div className="placeholder rounded-circle mx-auto mb-3" style={{ width: 80, height: 80 }}></div>
                  <div className="placeholder col-6 mx-auto mb-2"></div>
                  <div className="placeholder col-4 mx-auto"></div>
                </div>
              </div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="row g-4">
            {categories.map((cat) => {
              const meta = CATEGORY_ICONS[cat.slug] || { icon: 'bi-tag', color: '#8b5cf6' };
              return (
                <div key={cat.id} className="col-lg-4 col-md-6">
                  <Link to={`/products?category=${cat.slug}`} className="text-decoration-none">
                    <div className="category-detail-card">
                      <div className="cat-icon-wrap" style={{ background: `${meta.color}20` }}>
                        <i className={`bi ${meta.icon}`} style={{ color: meta.color, fontSize: '2.5rem' }}></i>
                      </div>
                      <div className="cat-info">
                        <h4 className="cat-name">{cat.name}</h4>
                        <p className="cat-desc">{cat.description || 'Browse our collection'}</p>
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="badge" style={{ background: `${meta.color}20`, color: meta.color }}>
                            {cat.product_count} product{cat.product_count !== 1 ? 's' : ''}
                          </span>
                          <span className="cat-link" style={{ color: meta.color }}>
                            Shop Now <i className="bi bi-arrow-right ms-1"></i>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state text-center py-5">
            <i className="bi bi-grid fs-1 text-muted"></i>
            <h4 className="mt-3">No categories yet</h4>
            <p className="text-muted">Categories will appear here once products are added.</p>
          </div>
        )}
      </div>
    </div>
  );
}
