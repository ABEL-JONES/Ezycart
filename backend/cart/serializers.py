"""Serializers for the cart app."""
from rest_framework import serializers
from .models import Cart, CartItem
from products.serializers import ProductListSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product_detail = ProductListSerializer(source='product', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_detail', 'quantity', 'subtotal', 'added_at')
        read_only_fields = ('id', 'added_at', 'subtotal')

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError('Quantity must be at least 1.')
        return value


class AddCartItemSerializer(serializers.Serializer):
    """Used when adding a product to the cart."""
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate(self, attrs):
        from products.models import Product
        try:
            product = Product.objects.get(pk=attrs['product_id'], is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError({'product_id': 'Product not found or unavailable.'})

        if product.stock < attrs['quantity']:
            raise serializers.ValidationError(
                {'quantity': f'Only {product.stock} units available.'}
            )
        attrs['product'] = product
        return attrs


class UpdateCartItemSerializer(serializers.Serializer):
    """Used when updating quantity of a cart item."""
    quantity = serializers.IntegerField(min_value=1)

    def validate_quantity(self, value):
        # Stock check done in the view where we have the product instance
        return value


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ('id', 'items', 'total', 'item_count', 'updated_at')
