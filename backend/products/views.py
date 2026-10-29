"""Views for the products app."""
from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Category, Product
from .serializers import CategorySerializer, ProductListSerializer, ProductDetailSerializer
from .filters import ProductFilter


class CategoryListView(generics.ListAPIView):
    """
    GET /api/categories/
    Returns all product categories. Public endpoint.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class ProductListView(generics.ListAPIView):
    """
    GET /api/products/
    Returns paginated list of active products.
    Supports search, filter by category/price, and ordering.
    Public endpoint.
    """
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        return Product.objects.filter(is_active=True).select_related('category')


class ProductDetailView(generics.RetrieveAPIView):
    """
    GET /api/products/<id>/
    Returns full product details. Public endpoint.
    Only shows active products.
    """
    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Product.objects.filter(is_active=True).select_related('category')

    def get_object(self):
        pk = self.kwargs.get('pk')
        queryset = self.get_queryset()
        # Allow lookup by either numeric ID or slug
        if str(pk).isdigit():
            return generics.get_object_or_404(queryset, pk=pk)
        return generics.get_object_or_404(queryset, slug=pk)
