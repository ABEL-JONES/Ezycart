/**
 * ProductsPage – browsable, searchable, filterable product listing.
 */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [currentPage, setCurrentPage] = useState(1);

  // Read filter values from URL params
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const ordering = searchParams.get('ordering') || '-created_at';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage };
      if (search) params.search = search;
      if (category) params.category = category;
      if (ordering) params.ordering = ordering;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;

      const res = await productsAPI.getProducts(params);
      setProducts(res.data.results || []);
      setPagination({ count: res.data.count, next: res.data.next, previous: res.data.previous });
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, ordering, minPrice, maxPrice, currentPage]);

  useEffect(() => {
    productsAPI.getCategories().then((r) => setCategories(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, ordering, minPrice, maxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const totalPages = Math.ceil(pagination.count / 12);
  const hasFilters = search || category || minPrice || maxPrice || ordering !== '-created_at';

  return (
    <div className="products-page py-4">
      <div className="container">
        {/* Page Header */}
        <div className="page-header mb-4">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item active">Products</li>
            </ol>
          </nav>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h1 className="page-title mb-0">
              {category ? categories.find(c => c.slug === category)?.name || 'Products' : 'All Products'}
            </h1>
            <span className="badge bg-primary rounded-pill fs-6">
              {pagination.count} product{pagination.count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="row g-4">
          {/* Sidebar Filters */}
          <div className="col-lg-3">
            <div className="filter-card">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="filter-heading mb-0">
                  <i className="bi bi-funnel me-2"></i>Filters
                </h6>
                {hasFilters && (
                  <button className="btn btn-link btn-sm p-0 text-danger" onClick={clearFilters}>
                    Clear All
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="mb-4">
                <label className="filter-label">Search</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-search"></i></span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => updateParam('search', e.target.value)}
                    id="product-search-input"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="filter-label">Category</label>
                <div className="d-flex flex-column gap-1">
                  <button
                    className={`filter-btn ${!category ? 'active' : ''}`}
                    onClick={() => updateParam('category', '')}
                  >
                    <i className="bi bi-grid me-2"></i>All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      className={`filter-btn ${category === cat.slug ? 'active' : ''}`}
                      onClick={() => updateParam('category', cat.slug)}
                    >
                      <i className="bi bi-tag me-2"></i>{cat.name}
                      <span className="ms-auto badge bg-light text-dark">{cat.product_count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <label className="filter-label">Price Range (₹)</label>
                <div className="d-flex gap-2">
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Min"
                    value={minPrice}
                    min={0}
                    onChange={(e) => updateParam('min_price', e.target.value)}
                    id="min-price-input"
                  />
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Max"
                    value={maxPrice}
                    min={0}
                    onChange={(e) => updateParam('max_price', e.target.value)}
                    id="max-price-input"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="mb-3">
                <label className="filter-label">Sort By</label>
                <select
                  className="form-select form-select-sm"
                  value={ordering}
                  onChange={(e) => updateParam('ordering', e.target.value)}
                  id="sort-select"
                >
                  <option value="-created_at">Newest First</option>
                  <option value="created_at">Oldest First</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-price">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                  <option value="-name">Name: Z to A</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="col-lg-9">
            {loading ? (
              <div className="row g-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="col-lg-4 col-md-6">
                    <div className="placeholder-card">
                      <div className="placeholder-image placeholder"></div>
                      <div className="p-3">
                        <div className="placeholder col-4 placeholder-sm mb-2"></div>
                        <div className="placeholder col-8 mb-2"></div>
                        <div className="placeholder col-5 mb-3"></div>
                        <div className="placeholder col-12 placeholder-btn"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="row g-3">
                  {products.map((product) => (
                    <div key={product.id} className="col-lg-4 col-md-6">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav className="mt-4" aria-label="Product pagination">
                    <ul className="pagination justify-content-center">
                      <li className={`page-item ${!pagination.previous ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      {[...Array(totalPages)].map((_, i) => (
                        <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                            {i + 1}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${!pagination.next ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}
              </>
            ) : (
              <div className="empty-state text-center py-5">
                <i className="bi bi-search fs-1 text-muted"></i>
                <h5 className="mt-3">No products found</h5>
                <p className="text-muted">Try adjusting your search or filters.</p>
                {hasFilters && (
                  <button className="btn btn-outline-primary" onClick={clearFilters}>
                    <i className="bi bi-x-circle me-2"></i>Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
