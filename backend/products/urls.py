"""URL patterns for the products app."""
from django.urls import path
from .views import CategoryListView, ProductListView, ProductDetailView

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('products/', ProductListView.as_view(), name='product_list'),
    path('products/<pk>/', ProductDetailView.as_view(), name='product_detail'),
]
